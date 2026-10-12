import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

// ── Types ──

export type EvaluationRow = {
  id: string;
  submission_id: string; // groups all faculty ratings from one student into a single submission
  faculty_name: string;
  subject: string;
  department: string;
  semester: string;
  division: string;
  teaching: number;
  knowledge: number;
  punctuality: number;
  interaction: number;
  guidance: number;
  fairness: number;
  comment: string;
  submitted_at: string;
};

// ── Local JSON file storage ──

const DATA_FILE = join(process.cwd(), "data", "evaluations.json");

function ensureDataDir() {
  const dir = dirname(DATA_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function readEvaluations(): EvaluationRow[] {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as EvaluationRow[];
  } catch {
    return [];
  }
}

export function writeEvaluations(evaluations: EvaluationRow[]) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(evaluations, null, 2), "utf-8");
}

export function getAllEvaluations(): EvaluationRow[] {
  return readEvaluations();
}

export type SubmissionInput = {
  department: string;
  semester: string;
  division: string;
  entries: Array<{
    faculty_name: string;
    subject: string;
    teaching: number;
    knowledge: number;
    punctuality: number;
    interaction: number;
    guidance: number;
    fairness: number;
    comment: string;
  }>;
};

export function saveEvaluations(data: SubmissionInput): void {
  const evaluations = readEvaluations();
  const now = new Date().toISOString();
  // One submission_id for ALL faculty ratings from this student.
  // This way, 8 faculty ratings = 1 student response.
  const submissionId = crypto.randomUUID();
  const newRows: EvaluationRow[] = data.entries.map((e) => ({
    id: crypto.randomUUID(),
    submission_id: submissionId,
    faculty_name: e.faculty_name,
    subject: e.subject,
    department: data.department,
    semester: data.semester,
    division: data.division,
    teaching: e.teaching,
    knowledge: e.knowledge,
    punctuality: e.punctuality,
    interaction: e.interaction,
    guidance: e.guidance,
    fairness: e.fairness,
    comment: e.comment.trim(),
    submitted_at: now,
  }));
  evaluations.push(...newRows);
  writeEvaluations(evaluations);
}
