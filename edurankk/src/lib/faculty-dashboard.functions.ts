import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

import type {
  ImprovementPlan,
  CriteriaKey,
  FacultyProfile,
  ClassBreakdown,
  FacultyDashboardData,
  FacultyAssignmentRow,
  EvaluationRow,
} from "@/lib/faculty-dashboard.types";

export type {
  ImprovementPlan,
  CriteriaKey,
  FacultyProfile,
  ClassBreakdown,
  FacultyDashboardData,
  FacultyAssignmentRow,
  EvaluationRow,
};

export { CRITERIA_METADATA, CRITERIA_KEYS } from "@/lib/faculty-dashboard.types";

type FacultySession = {
  facultyName?: string;
  department?: string;
  role?: "faculty";
};

function getSessionSecret(): string {
  return process.env["SESSION_SECRET"] || "edurank-session-key-x7k9m2p4q8w3n6j1-32chars";
}

function facultySessionConfig() {
  return {
    password: getSessionSecret(),
    name: "edurank-faculty",
    maxAge: 60 * 60 * 8, // 8 hours
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

// ── Public: List faculty members for login selection ──

export const getRegisteredFacultyList = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { getRegisteredFacultyListServer } = await import("@/lib/faculty-dashboard.server");
    const faculty = getRegisteredFacultyListServer();
    return { ok: true as const, faculty };
  } catch (err) {
    console.warn("[getRegisteredFacultyList] Failed:", err);
    return { ok: true as const, faculty: [] };
  }
});

export const getFacultyPortalList = getRegisteredFacultyList;

// ── Login ──

export const facultyLogin = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        facultyName: z.string().trim().min(1).max(200),
        password: z.string().min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const { readAllAssignments, verifyFacultyPassword } = await import("@/lib/faculty-dashboard.server");
      const assignments = readAllAssignments();
      const matched = assignments.find(
        (a) => a.faculty_name.trim().toLowerCase() === data.facultyName.trim().toLowerCase(),
      );

      if (!matched) {
        return { ok: false as const, error: "Faculty member not found. Please select from the list." };
      }

      const isMatch = await verifyFacultyPassword(data.password);
      if (!isMatch) {
        return { ok: false as const, error: "Incorrect password. Please verify your faculty password." };
      }

      const session = await useSession<FacultySession>(facultySessionConfig());
      await session.update({
        facultyName: matched.faculty_name,
        department: matched.department,
        role: "faculty",
      });

      return { ok: true as const, facultyName: matched.faculty_name };
    } catch (err) {
      console.warn("[facultyLogin] Error:", err);
      return { ok: false as const, error: "Authentication system error. Please try again." };
    }
  });

// ── Logout ──

export const facultyLogout = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const session = await useSession<FacultySession>(facultySessionConfig());
    await session.clear();
  } catch {}
  return { ok: true as const };
});

// ── Authenticated: Get Faculty Dashboard Data ──
// 🔐 PRIVACY ENFORCED: Backend exclusively looks at session.data.facultyName

export const getFacultyDashboardData = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const session = await useSession<FacultySession>(facultySessionConfig());
    if (!session.data.facultyName || session.data.role !== "faculty") {
      return { authorized: false as const };
    }

    try {
      const res = await fetch(`http://localhost:8090/api/faculty/dashboard`, {
        headers: { "Cookie": `facultyName=${encodeURIComponent(session.data.facultyName)}` }
      });
      const json = await res.json();
      if (json && json.data) {
        return { authorized: true as const, data: json.data as FacultyDashboardData };
      }
    } catch (e) {
      console.warn("Spring Boot getFacultyDashboardData fallback:", e);
    }

    const { buildFacultyDashboardData } = await import("@/lib/faculty-dashboard.server");
    const dashboardData = buildFacultyDashboardData(session.data.facultyName, session.data.department);

    return { authorized: true as const, data: dashboardData };
  } catch (err) {
    console.warn("[getFacultyDashboardData] Error:", err);
    return { authorized: false as const };
  }
});

// ── Improvement Plan Actions (Faculty Self-Directed) ──

const addGoalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  criterion: z.string().trim().max(100).optional(),
  action_steps: z.string().trim().min(1).max(1000),
  target_date: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const addImprovementGoal = createServerFn({ method: "POST" })
  .validator((data: unknown) => addGoalSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await useSession<FacultySession>(facultySessionConfig());
      if (!session.data.facultyName || session.data.role !== "faculty") {
        return { ok: false as const, error: "Unauthorized" };
      }
      const { addPlanForFaculty } = await import("@/lib/faculty-dashboard.server");
      const goal = addPlanForFaculty(session.data.facultyName, data as Parameters<typeof addPlanForFaculty>[1]);
      return { ok: true as const, goal };
    } catch {
      return { ok: false as const, error: "Failed to add goal" };
    }
  });

const updateGoalSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  criterion: z.string().trim().max(100).optional(),
  action_steps: z.string().trim().min(1).max(1000).optional(),
  target_date: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(1000).optional(),
  status: z.enum(["not_started", "in_progress", "completed"]).optional(),
});

export const updateImprovementGoal = createServerFn({ method: "POST" })
  .validator((data: unknown) => updateGoalSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await useSession<FacultySession>(facultySessionConfig());
      if (!session.data.facultyName || session.data.role !== "faculty") {
        return { ok: false as const, error: "Unauthorized" };
      }
      const { updatePlanForFaculty } = await import("@/lib/faculty-dashboard.server");
      const ok = updatePlanForFaculty(session.data.facultyName, data.id, data as Parameters<typeof updatePlanForFaculty>[2]);
      return { ok };
    } catch {
      return { ok: false };
    }
  });

const deleteGoalSchema = z.object({ id: z.string().uuid() });

export const deleteImprovementGoal = createServerFn({ method: "POST" })
  .validator((data: unknown) => deleteGoalSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const session = await useSession<FacultySession>(facultySessionConfig());
      if (!session.data.facultyName || session.data.role !== "faculty") {
        return { ok: false as const, error: "Unauthorized" };
      }
      const { deletePlanForFaculty } = await import("@/lib/faculty-dashboard.server");
      const ok = deletePlanForFaculty(session.data.facultyName, data.id);
      return { ok };
    } catch {
      return { ok: false };
    }
  });
