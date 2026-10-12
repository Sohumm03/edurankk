import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { EvaluationRow } from "@/lib/evaluations.server";

export type { EvaluationRow };

// ── Submit evaluations (student-facing, no auth needed) ──

const ratingSchema = z.number().int().min(1).max(5);
const submissionSchema = z.object({
  department: z.string().trim().min(1).max(100),
  semester: z.string().trim().min(1).max(50),
  division: z.string().trim().min(1).max(50),
  entries: z
    .array(
      z.object({
        faculty_name: z.string().trim().min(1).max(100),
        subject: z.string().trim().min(1).max(100),
        teaching: ratingSchema,
        knowledge: ratingSchema,
        punctuality: ratingSchema,
        interaction: ratingSchema,
        guidance: ratingSchema,
        fairness: ratingSchema,
        comment: z.string().max(500),
      }),
    )
    .min(1)
    .max(20),
});

export const submitEvaluations = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submissionSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await fetch("http://localhost:8090/api/evaluations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return { ok: (json.ok ?? true) as true };
    } catch (err) {
      console.error("submitEvaluations failed on Spring Boot backend, falling back to local:", err);
      try {
        const { saveEvaluations } = await import("@/lib/evaluations.server");
        saveEvaluations(data);
        return { ok: true as const };
      } catch {
        return { ok: false as const };
      }
    }
  });
