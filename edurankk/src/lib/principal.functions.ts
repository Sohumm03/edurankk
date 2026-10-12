import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

type PrincipalSession = { principal?: boolean };

function getSessionSecret(): string {
  return process.env["SESSION_SECRET"] || "edurank-session-key-x7k9m2p4q8w3n6j1-32chars";
}

function sessionConfig() {
  return {
    password: getSessionSecret(),
    name: "edurank-principal",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function getExpectedPassword(): string {
  const envPass = process.env["PRINCIPAL_PASSWORD"] || process.env["VITE_PRINCIPAL_PASSWORD"];
  if (envPass && envPass.trim()) return envPass.trim();

  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile();
    }
  } catch {}

  return (process.env["PRINCIPAL_PASSWORD"] || "admin123").trim();
}

async function passwordMatches(input: string, expected: string) {
  const cleanInput = input.trim();
  const cleanExpected = expected.trim();
  if (cleanInput === cleanExpected) return true;

  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(cleanInput)),
    crypto.subtle.digest("SHA-256", enc.encode(cleanExpected)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i]! ^ y[i]!;
  return diff === 0;
}

export const principalLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const expected = getExpectedPassword();
    const isMatch = await passwordMatches(data.password, expected);
    if (!isMatch) {
      console.warn("[Principal Login] Invalid password attempt.");
      return { ok: false as const };
    }
    const session = await useSession<PrincipalSession>(sessionConfig());
    await session.update({ principal: true });
    return { ok: true as const };
  });

export const principalLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<PrincipalSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export type FacultyResult = {
  faculty_name: string;
  subject: string;
  department: string;
  semester: string;
  division: string;
  responses: number;
  averages: Record<"teaching" | "knowledge" | "punctuality" | "interaction" | "guidance" | "fairness", number>;
  overall: number;
  comments: string[];
};

export type AnalyticsSummary = {
  totalResponses: number;
  totalFaculty: number;
  averageOverall: number;
  warningCount: number;
  appreciationCount: number;
  departmentBreakdown: { department: string; responses: number; average: number }[];
  criteriaAverages: Record<"teaching" | "knowledge" | "punctuality" | "interaction" | "guidance" | "fairness", number>;
  recentSubmissions: number; // last 7 days
};

const CRITERIA_KEYS = ["teaching", "knowledge", "punctuality", "interaction", "guidance", "fairness"] as const;

export const getPrincipalResults = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<PrincipalSession>(sessionConfig());
  if (!session.data.principal) return { authorized: false as const };

  try {
    try {
      const res = await fetch("http://localhost:8090/api/principal/results");
      const json = await res.json();
      if (json && json.results && json.analytics) {
        const a = json.analytics;
        const analytics: AnalyticsSummary = {
          totalResponses: a.totalResponses ?? 0,
          totalFaculty: a.totalFaculty ?? 0,
          averageOverall: a.averageOverall ?? 0,
          warningCount: a.warningCount ?? 0,
          appreciationCount: a.appreciationCount ?? 0,
          departmentBreakdown: Array.isArray(a.departmentBreakdown) ? a.departmentBreakdown : [],
          criteriaAverages: a.criteriaAverages ?? {
            teaching: 0,
            knowledge: 0,
            punctuality: 0,
            interaction: 0,
            guidance: 0,
            fairness: 0,
          },
          recentSubmissions: a.recentSubmissions ?? 0,
        };
        return { authorized: true as const, results: json.results as FacultyResult[], analytics };
      }
    } catch (e) {
      console.warn("Spring Boot getPrincipalResults fallback:", e);
    }

    const { getAllEvaluations } = await import("@/lib/evaluations.server");
    const data = getAllEvaluations();

    // Group by faculty + subject + department + semester + division
    // This ensures division-wise separation: same faculty in Div A vs Div B = separate entries
    const groups = new Map<string, typeof data>();
    for (const row of data) {
      const k = `${row.faculty_name}|${row.subject}|${row.department}|${row.semester}|${row.division}`;
      groups.set(k, [...(groups.get(k) ?? []), row]);
    }

    const results: FacultyResult[] = [...groups.values()].map((rows) => {
      const averages = Object.fromEntries(
        CRITERIA_KEYS.map((key) => [key, rows.reduce((s, r) => s + r[key], 0) / rows.length]),
      ) as FacultyResult["averages"];
      const overall = CRITERIA_KEYS.reduce((s, k) => s + averages[k], 0) / CRITERIA_KEYS.length;

      // Count unique submission_ids = unique students who rated this faculty
      // (If a student rates 8 faculty, each faculty gets 1 response from that student)
      const uniqueStudents = new Set(rows.map((r) => r.submission_id ?? r.id)).size;

      return {
        faculty_name: rows[0]!.faculty_name,
        subject: rows[0]!.subject,
        department: rows[0]!.department,
        semester: rows[0]!.semester,
        division: rows[0]!.division,
        responses: uniqueStudents,
        averages,
        overall,
        comments: rows.map((r) => r.comment).filter(Boolean),
      };
    });
    results.sort((a, b) => b.overall - a.overall);

    // Analytics summary
    // Total student submissions = unique submission_ids across all data
    const allSubmissionIds = new Set(data.map((r) => r.submission_id ?? r.id));
    const totalResponses = allSubmissionIds.size;
    const totalFaculty = new Set(data.map((r) => r.faculty_name)).size;
    const averageOverall = results.length > 0 ? results.reduce((s, r) => s + r.overall, 0) / results.length : 0;
    const warningCount = results.filter((r) => r.overall < 2.5).length;
    const appreciationCount = results.filter((r) => r.overall >= 4.5).length;

    // Department breakdown — count unique students per department
    const deptMap = new Map<string, { studentIds: Set<string>; sum: number; count: number }>();
    for (const r of results) {
      const curr = deptMap.get(r.department) ?? { studentIds: new Set<string>(), sum: 0, count: 0 };
      // Get unique student ids for this result's department
      const deptRows = data.filter((row) => row.department === r.department);
      for (const row of deptRows) curr.studentIds.add(row.submission_id ?? row.id);
      curr.sum += r.overall * r.responses;
      curr.count += r.responses;
      deptMap.set(r.department, curr);
    }
    const departmentBreakdown = [...deptMap.entries()].map(([department, { studentIds, sum, count }]) => ({
      department,
      responses: studentIds.size,
      average: count > 0 ? sum / count : 0,
    }));

    // Overall criteria averages across all evaluation rows
    const criteriaAverages = Object.fromEntries(
      CRITERIA_KEYS.map((key) => [
        key,
        data.length > 0 ? data.reduce((s, r) => s + r[key], 0) / data.length : 0,
      ]),
    ) as FacultyResult["averages"];

    // Recent unique student submissions (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentSubmissions = new Set(
      data.filter((r) => r.submitted_at >= sevenDaysAgo).map((r) => r.submission_id ?? r.id),
    ).size;

    const analytics: AnalyticsSummary = {
      totalResponses,
      totalFaculty,
      averageOverall,
      warningCount,
      appreciationCount,
      departmentBreakdown,
      criteriaAverages,
      recentSubmissions,
    };

    return { authorized: true as const, results, analytics };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[Principal Results] Failed:", msg);
    return {
      authorized: true as const,
      results: [] as FacultyResult[],
      analytics: {
        totalResponses: 0,
        totalFaculty: 0,
        averageOverall: 0,
        warningCount: 0,
        appreciationCount: 0,
        departmentBreakdown: [],
        criteriaAverages: { teaching: 0, knowledge: 0, punctuality: 0, interaction: 0, guidance: 0, fairness: 0 },
        recentSubmissions: 0,
      } as AnalyticsSummary,
      error: "Could not load evaluations data.",
    };
  }
});
