import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

export type ImprovementPlan = {
  id: string;
  faculty_name: string;
  title: string;
  criterion: string;
  action_steps: string;
  target_date: string;
  notes: string;
  status: "not_started" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
};

const DATA_FILE = join(process.cwd(), "data", "improvement-plans.json");

function ensureDataDir() {
  const dir = dirname(DATA_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function readImprovementPlans(): ImprovementPlan[] {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as ImprovementPlan[];
  } catch {
    return [];
  }
}

export function writeImprovementPlans(plans: ImprovementPlan[]) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(plans, null, 2), "utf-8");
}

export function getPlansForFaculty(facultyName: string): ImprovementPlan[] {
  const all = readImprovementPlans();
  return all.filter((p) => p.faculty_name.trim().toLowerCase() === facultyName.trim().toLowerCase());
}

export function addPlanForFaculty(
  facultyName: string,
  input: {
    title: string;
    criterion?: string;
    action_steps: string;
    target_date?: string;
    notes?: string;
  },
): ImprovementPlan {
  const all = readImprovementPlans();
  const now = new Date().toISOString();
  const newPlan: ImprovementPlan = {
    id: crypto.randomUUID(),
    faculty_name: facultyName.trim(),
    title: input.title.trim(),
    criterion: input.criterion?.trim() || "General Teaching",
    action_steps: input.action_steps.trim(),
    target_date: input.target_date?.trim() || "",
    notes: input.notes?.trim() || "",
    status: "in_progress",
    created_at: now,
    updated_at: now,
  };
  all.unshift(newPlan);
  writeImprovementPlans(all);
  return newPlan;
}

export function updatePlanForFaculty(
  facultyName: string,
  id: string,
  updates: Partial<Pick<ImprovementPlan, "title" | "criterion" | "action_steps" | "target_date" | "notes" | "status">>,
): boolean {
  const all = readImprovementPlans();
  const index = all.findIndex(
    (p) => p.id === id && p.faculty_name.trim().toLowerCase() === facultyName.trim().toLowerCase(),
  );
  if (index === -1) return false;

  all[index] = {
    ...all[index]!,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  writeImprovementPlans(all);
  return true;
}

export function deletePlanForFaculty(facultyName: string, id: string): boolean {
  const all = readImprovementPlans();
  const filtered = all.filter(
    (p) => !(p.id === id && p.faculty_name.trim().toLowerCase() === facultyName.trim().toLowerCase()),
  );
  if (filtered.length === all.length) return false;
  writeImprovementPlans(filtered);
  return true;
}
