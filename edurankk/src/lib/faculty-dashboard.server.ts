import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  getPlansForFaculty,
  addPlanForFaculty,
  updatePlanForFaculty,
  deletePlanForFaculty,
} from "@/lib/improvement.server";
import {
  CRITERIA_KEYS,
  CRITERIA_METADATA,
  type CriteriaKey,
  type ImprovementPlan,
  type FacultyAssignmentRow,
  type EvaluationRow,
  type FacultyProfile,
  type ClassBreakdown,
  type FacultyDashboardData,
} from "@/lib/faculty-dashboard.types";

export type { ImprovementPlan };

const ASSIGNMENTS_FILE = join(process.cwd(), "data", "faculty-assignments.json");
const EVALUATIONS_FILE = join(process.cwd(), "data", "evaluations.json");

export function readAllAssignments(): FacultyAssignmentRow[] {
  if (!existsSync(ASSIGNMENTS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(ASSIGNMENTS_FILE, "utf-8")) as FacultyAssignmentRow[];
  } catch {
    return [];
  }
}

export function readAllEvaluations(): EvaluationRow[] {
  if (!existsSync(EVALUATIONS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(EVALUATIONS_FILE, "utf-8")) as EvaluationRow[];
  } catch {
    return [];
  }
}

export function getRegisteredFacultyListServer() {
  const assignments = readAllAssignments();
  const map = new Map<string, { facultyName: string; department: string; initials: string; id: string }>();

  for (const a of assignments) {
    if (!map.has(a.faculty_name)) {
      map.set(a.faculty_name, {
        facultyName: a.faculty_name,
        department: a.department,
        initials: a.initials,
        id: a.id,
      });
    }
  }

  const list = [...map.values()].sort((a, b) => a.facultyName.localeCompare(b.facultyName));
  return list;
}

export function getExpectedFacultyPassword(): string {
  const envPass = process.env["FACULTY_PASSWORD"] || process.env["VITE_FACULTY_PASSWORD"];
  if (envPass && envPass.trim()) return envPass.trim();

  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile();
    }
  } catch {}

  return (process.env["FACULTY_PASSWORD"] || "faculty123").trim();
}

export async function verifyFacultyPassword(input: string): Promise<boolean> {
  const cleanInput = input.trim();
  const expected = getExpectedFacultyPassword();
  const cleanExpected = expected.trim();

  if (cleanInput === cleanExpected) return true;
  // Also accept admin123 as administrative master password for testing/demo
  if (cleanInput === "admin123") return true;

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

export function buildFacultyDashboardData(facultyName: string, fallbackDepartment?: string): FacultyDashboardData {
  const assignments = readAllAssignments().filter(
    (a) => a.faculty_name.trim().toLowerCase() === facultyName.trim().toLowerCase(),
  );

  const allEvaluations = readAllEvaluations();
  const facultyEvaluations = allEvaluations.filter(
    (e) => e.faculty_name.trim().toLowerCase() === facultyName.trim().toLowerCase(),
  );

  // Profile
  const primaryAssignment = assignments[0];
  const department = primaryAssignment?.department || fallbackDepartment || "Engineering";
  const initials = primaryAssignment?.initials || facultyName.slice(0, 3).toUpperCase();
  const shortId = `FAC-${initials}-${(primaryAssignment?.id || "001").slice(0, 4).toUpperCase()}`;

  // Clean email generation
  const cleanNameSlug = facultyName
    .toLowerCase()
    .replace(/^(prof|dr)\.?\s+/i, "")
    .replace(/\s+/g, ".");
  const email = `${cleanNameSlug}@apsit.edu.in`;

  const profile: FacultyProfile = {
    facultyName,
    facultyId: shortId,
    department,
    email,
    initials,
    assignedClasses: assignments.map((a) => ({
      subject: a.subject,
      department: a.department,
      semester: a.semester,
      division: a.division,
    })),
  };

  const hasEvaluations = facultyEvaluations.length > 0;
  const uniqueStudents = new Set(facultyEvaluations.map((r) => r.submission_id ?? r.id));
  const totalResponses = uniqueStudents.size;

  // Criteria averages
  const criteriaAverages: Record<CriteriaKey, number> = {
    teaching: 0,
    knowledge: 0,
    punctuality: 0,
    interaction: 0,
    guidance: 0,
    fairness: 0,
  };

  let overallRating = 0;
  if (hasEvaluations) {
    for (const key of CRITERIA_KEYS) {
      criteriaAverages[key] =
        facultyEvaluations.reduce((sum, row) => sum + row[key], 0) / facultyEvaluations.length;
    }
    overallRating = CRITERIA_KEYS.reduce((sum, key) => sum + criteriaAverages[key], 0) / CRITERIA_KEYS.length;
  }

  // Class breakdown
  const classMap = new Map<string, EvaluationRow[]>();
  for (const row of facultyEvaluations) {
    const key = `${row.subject}|${row.department}|${row.semester}|${row.division}`;
    classMap.set(key, [...(classMap.get(key) ?? []), row]);
  }

  const classBreakdowns: ClassBreakdown[] = [...classMap.entries()].map(([k, rows]) => {
    const [subject = "", dept = "", semester = "", division = ""] = k.split("|");
    const avgs: Record<CriteriaKey, number> = {
      teaching: 0,
      knowledge: 0,
      punctuality: 0,
      interaction: 0,
      guidance: 0,
      fairness: 0,
    };
    for (const key of CRITERIA_KEYS) {
      avgs[key] = rows.reduce((s, r) => s + r[key], 0) / rows.length;
    }
    const clsOverall = CRITERIA_KEYS.reduce((s, key) => s + avgs[key], 0) / CRITERIA_KEYS.length;
    const clsUnique = new Set(rows.map((r) => r.submission_id ?? r.id)).size;

    return {
      subject,
      department: dept,
      semester,
      division,
      responses: clsUnique,
      overall: clsOverall,
      averages: avgs,
    };
  });

  // Anonymous feedback comments — strictly without student identity
  const anonymousComments = facultyEvaluations
    .map((r) => r.comment?.trim())
    .filter((c): c is string => Boolean(c));

  // Appreciation threshold (EduRank standard: >= 4.5)
  const isAppreciation = hasEvaluations && overallRating >= 4.5;
  const strengths = CRITERIA_KEYS.filter((k) => criteriaAverages[k] >= 4.5).map(
    (k) => CRITERIA_METADATA[k].label,
  );

  const appreciation = {
    isEligible: isAppreciation,
    count: isAppreciation ? 1 : 0,
    title: isAppreciation ? "Letter of Appreciation for Academic Excellence" : "Appreciation Recognition",
    strengths: strengths.length > 0 ? strengths : ["High Overall Student Engagement"],
    date: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    message: isAppreciation
      ? "Based on outstanding student feedback and evaluation ratings exceeding 4.5 out of 5.0, the Head of Department and Academic Council acknowledge your exceptional contribution to academic excellence."
      : "Appreciation letters are conferred for performance ratings of 4.5 or above. Keep up the continuous effort toward academic excellence.",
  };

  // Warning threshold (EduRank standard: < 2.5)
  const hasWarning = hasEvaluations && overallRating < 2.5;
  const weakAreas = CRITERIA_KEYS.filter((k) => criteriaAverages[k] < 2.5).map(
    (k) => CRITERIA_METADATA[k].label,
  );

  const earlyWarning = {
    hasWarning,
    count: hasWarning ? 1 : 0,
    rating: hasWarning ? overallRating : 0,
    areasNeedingImprovement: weakAreas.length > 0 ? weakAreas : ["Overall Rating Improvement"],
    recommendations: [
      "Review student feedback comments for constructive suggestions.",
      "Engage in pedagogical development and interactive teaching methods.",
      "Establish personal milestones under 'My Improvement Plan'.",
      "Consult Head of Department (HOD) for mentorship and syllabus pace optimization.",
    ],
    status: hasWarning ? "Active Improvement Notice" : "Satisfactory",
  };

  // Personal Improvement Plans
  const improvementPlans = getPlansForFaculty(facultyName);

  // History periods (only actual recorded data)
  const history: Array<{ period: string; rating: number; responses: number }> = [];
  if (hasEvaluations) {
    const semestersSet = [...new Set(facultyEvaluations.map((r) => r.semester))];
    for (const sem of semestersSet) {
      const semRows = facultyEvaluations.filter((r) => r.semester === sem);
      const semAvg =
        CRITERIA_KEYS.reduce(
          (sum, k) => sum + semRows.reduce((s, r) => s + r[k], 0) / semRows.length,
          0,
        ) / CRITERIA_KEYS.length;
      const semResponses = new Set(semRows.map((r) => r.submission_id ?? r.id)).size;
      history.push({
        period: sem,
        rating: Number(semAvg.toFixed(2)),
        responses: semResponses,
      });
    }
  }

  return {
    profile,
    hasEvaluations,
    totalResponses,
    overallRating: Number(overallRating.toFixed(2)),
    previousRating: null,
    performanceTrend: hasEvaluations ? (overallRating >= 4.0 ? "improving" : "stable") : "new",
    criteriaAverages,
    classBreakdowns,
    anonymousComments,
    appreciation,
    earlyWarning,
    improvementPlans,
    history,
  };
}

export {
  getPlansForFaculty,
  addPlanForFaculty,
  updatePlanForFaculty,
  deletePlanForFaculty,
};
