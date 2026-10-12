import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import {
  getPlansForFaculty,
  addPlanForFaculty,
  updatePlanForFaculty,
  deletePlanForFaculty,
} from "@/lib/improvement.server";
import {
  buildFacultyDashboardData,
  getRegisteredFacultyListServer,
  verifyFacultyPassword,
} from "@/lib/faculty-dashboard.server";

describe("Faculty Dashboard Routing", () => {
  it("matches route for /faculty without falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/faculty");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.at(-1)?.routeId).toBe("/faculty");
  });

  it("preserves existing routes (/ and /principal and /about)", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/").at(-1)?.routeId).toBe("/");
    expect(router.matchRoutes("/principal").at(-1)?.routeId).toBe("/principal");
    expect(router.matchRoutes("/about").at(-1)?.routeId).toBe("/about");
  });
});

describe("Faculty Dashboard Server Logic & Real Data Calculations", () => {
  it("loads registered faculty list with expected assignments", () => {
    const list = getRegisteredFacultyListServer();
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((f) => f.facultyName === "Prof. Charul Singh")).toBe(true);
  });

  it("verifies faculty passwords accurately", async () => {
    const validDefault = await verifyFacultyPassword("faculty123");
    const validAdmin = await verifyFacultyPassword("admin123");
    const invalid = await verifyFacultyPassword("wrong-pass");

    expect(validDefault).toBe(true);
    expect(validAdmin).toBe(true);
    expect(invalid).toBe(false);
  });

  it("calculates faculty dashboard data strictly for the specific faculty member", () => {
    const data = buildFacultyDashboardData("Prof. Charul Singh");
    expect(data.profile.facultyName).toBe("Prof. Charul Singh");
    expect(data.profile.department).toBe("Information Technology");
    expect(data.hasEvaluations).toBe(true);
    expect(data.overallRating).toBeGreaterThan(0);
    expect(data.criteriaAverages.teaching).toBeGreaterThan(0);
    expect(data.classBreakdowns.length).toBeGreaterThan(0);
    // Student comments are anonymous strings
    for (const comment of data.anonymousComments) {
      expect(typeof comment).toBe("string");
    }
  });
});

describe("Faculty Personal Improvement Plan Privacy & Isolation", () => {
  const facultyA = "Prof. Test Faculty A";
  const facultyB = "Prof. Test Faculty B";

  it("isolates personal improvement goals between different faculty members", () => {
    // Add goal for Faculty A
    const goalA = addPlanForFaculty(facultyA, {
      title: "Integrate interactive polling in DBMS",
      criterion: "Student Interaction",
      action_steps: "Use Mentimeter in each lecture",
      target_date: "2026-11-01",
      notes: "Private note for Faculty A",
    });

    // Add goal for Faculty B
    const goalB = addPlanForFaculty(facultyB, {
      title: "Update lab manual for ADSA",
      criterion: "Subject Knowledge",
      action_steps: "Revise chapter 4 problems",
      target_date: "2026-12-01",
      notes: "Private note for Faculty B",
    });

    // Faculty A should see ONLY Faculty A's goals
    const plansA = getPlansForFaculty(facultyA);
    expect(plansA.some((p) => p.id === goalA.id)).toBe(true);
    expect(plansA.some((p) => p.id === goalB.id)).toBe(false);

    // Faculty B should see ONLY Faculty B's goals
    const plansB = getPlansForFaculty(facultyB);
    expect(plansB.some((p) => p.id === goalB.id)).toBe(true);
    expect(plansB.some((p) => p.id === goalA.id)).toBe(false);

    // Faculty A cannot delete Faculty B's goal
    const deleteAttempt = deletePlanForFaculty(facultyA, goalB.id);
    expect(deleteAttempt).toBe(false);

    // Faculty B's goal should still exist
    const plansBAfter = getPlansForFaculty(facultyB);
    expect(plansBAfter.some((p) => p.id === goalB.id)).toBe(true);

    // Faculty B can update their own goal
    const updateResult = updatePlanForFaculty(facultyB, goalB.id, {
      status: "completed",
    });
    expect(updateResult).toBe(true);
    const updatedPlansB = getPlansForFaculty(facultyB);
    expect(updatedPlansB.find((p) => p.id === goalB.id)?.status).toBe("completed");

    // Clean up test items
    deletePlanForFaculty(facultyA, goalA.id);
    deletePlanForFaculty(facultyB, goalB.id);
  });
});
