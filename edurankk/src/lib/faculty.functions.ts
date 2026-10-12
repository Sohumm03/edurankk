import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

type PrincipalSession = { principal?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"] || "edurank-session-key-x7k9m2p4q8w3n6j1-32chars",
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

async function requirePrincipal() {
  const session = await useSession<PrincipalSession>(sessionConfig());
  if (!session.data.principal) throw new Error("Unauthorized");
}

// ── Local JSON file storage ──

export type FacultyAssignment = {
  id: string;
  faculty_name: string;
  subject: string;
  department: string;
  semester: string;
  division: string;
  initials: string;
};

const DATA_FILE = join(process.cwd(), "data", "faculty-assignments.json");

function ensureDataDir() {
  const dir = dirname(DATA_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readAssignments(): FacultyAssignment[] {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as FacultyAssignment[];
  } catch {
    return [];
  }
}

function writeAssignments(assignments: FacultyAssignment[]) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(assignments, null, 2), "utf-8");
}

function generateId() {
  return crypto.randomUUID();
}

function generateInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase())
    .filter(Boolean)
    .join("")
    .slice(0, 3);
}

// ── Fetch all assignments (principal only) ──

export const getFacultyAssignments = createServerFn({ method: "POST" }).handler(async () => {
  await requirePrincipal();
  try {
    const res = await fetch("http://localhost:8090/api/faculty-assignments");
    const json = await res.json();
    if (json.ok && Array.isArray(json.assignments) && json.assignments.length > 0) {
      writeAssignments(json.assignments as FacultyAssignment[]);
      return { ok: true as const, assignments: json.assignments as FacultyAssignment[] };
    }
  } catch (e) {
    console.warn("Spring Boot getFacultyAssignments fallback:", e);
  }
  const assignments = readAssignments();
  return { ok: true as const, assignments };
});

// ── Fetch faculty for a specific dept/sem/div (used by students — no auth needed) ──

const fetchFacultySchema = z.object({
  department: z.string().trim().min(1),
  semester: z.string().trim().min(1),
  division: z.string().trim().min(1),
});

function normalizeSemStr(s: string): string {
  const clean = s.trim().toUpperCase();
  if (clean === "1" || clean === "I" || clean === "SEM 1" || clean === "SEMESTER 1" || clean === "SEMESTER I") return "1";
  if (clean === "2" || clean === "II" || clean === "SEM 2" || clean === "SEMESTER 2" || clean === "SEMESTER II") return "2";
  if (clean === "3" || clean === "III" || clean === "SEM 3" || clean === "SEMESTER 3" || clean === "SEMESTER III") return "3";
  if (clean === "4" || clean === "IV" || clean === "SEM 4" || clean === "SEMESTER 4" || clean === "SEMESTER IV") return "4";
  if (clean === "5" || clean === "V" || clean === "SEM 5" || clean === "SEMESTER 5" || clean === "SEMESTER V") return "5";
  if (clean === "6" || clean === "VI" || clean === "SEM 6" || clean === "SEMESTER 6" || clean === "SEMESTER VI") return "6";
  if (clean === "7" || clean === "VII" || clean === "SEM 7" || clean === "SEMESTER 7" || clean === "SEMESTER VII") return "7";
  if (clean === "8" || clean === "VIII" || clean === "SEM 8" || clean === "SEMESTER 8" || clean === "SEMESTER VIII") return "8";
  return clean.replace(/SEMESTER\s*/g, "").replace(/SEM\s*/g, "").trim();
}

function normalizeDivStr(d: string): string {
  const clean = d.trim().toUpperCase();
  if (clean.startsWith("DIVISION ")) return clean.substring(9).trim();
  if (clean.startsWith("DIV ")) return clean.substring(4).trim();
  return clean;
}

export const getFacultyForClass = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => fetchFacultySchema.parse(data))
  .handler(async ({ data }) => {
    // 1. Try fetching from MySQL via Spring Boot
    try {
      const res = await fetch("http://localhost:8090/api/faculty/for-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.ok && Array.isArray(json.faculty) && json.faculty.length > 0) {
        return { ok: true as const, faculty: json.faculty };
      }
    } catch (e) {
      console.warn("Spring Boot getForClass fallback:", e);
    }

    // 2. Fallback to local assignments with flexible matching
    const assignments = readAssignments();
    const reqSem = normalizeSemStr(data.semester);
    const reqDiv = normalizeDivStr(data.division);
    const reqDept = data.department.trim().toLowerCase();

    const matched = assignments.filter((a) => {
      const aDept = a.department.trim().toLowerCase();
      const aSem = normalizeSemStr(a.semester);
      const aDiv = normalizeDivStr(a.division);
      return aDept === reqDept && aSem === reqSem && aDiv === reqDiv;
    });

    return {
      ok: true as const,
      faculty: matched.map((r) => ({ name: r.faculty_name, subject: r.subject, initials: r.initials })),
    };
  });

// ── Add a faculty assignment (principal only) ──

const addSchema = z.object({
  faculty_name: z.string().trim().min(1).max(100),
  subject: z.string().trim().min(1).max(100),
  department: z.string().trim().min(1).max(100),
  semester: z.string().trim().min(1).max(50),
  division: z.string().trim().min(1).max(50),
  initials: z.string().trim().max(5).default(""),
});

export const addFacultyAssignment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => addSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePrincipal();
    const id = generateId();
    const initials = data.initials || generateInitials(data.faculty_name);

    // 1. Send to Spring Boot (MySQL)
    try {
      await fetch("http://localhost:8090/api/faculty-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          faculty_name: data.faculty_name,
          subject: data.subject,
          department: data.department,
          semester: data.semester,
          division: data.division,
          initials,
        }),
      });
    } catch (e) {
      console.warn("Spring Boot addFacultyAssignment sync warning:", e);
    }

    // 2. Also save to local JSON file
    const assignments = readAssignments();
    const duplicate = assignments.find(
      (a) =>
        a.faculty_name.trim().toLowerCase() === data.faculty_name.trim().toLowerCase() &&
        a.subject.trim().toLowerCase() === data.subject.trim().toLowerCase() &&
        a.department === data.department &&
        normalizeSemStr(a.semester) === normalizeSemStr(data.semester) &&
        normalizeDivStr(a.division) === normalizeDivStr(data.division),
    );
    if (duplicate) {
      return { ok: false as const, error: "This faculty-subject assignment already exists for this class." };
    }

    assignments.push({
      id,
      faculty_name: data.faculty_name,
      subject: data.subject,
      department: data.department,
      semester: data.semester,
      division: data.division,
      initials,
    });
    writeAssignments(assignments);
    return { ok: true as const };
  });

// ── Update a faculty assignment (principal only) ──

const updateSchema = z.object({
  id: z.string().uuid(),
  faculty_name: z.string().trim().min(1).max(100),
  subject: z.string().trim().min(1).max(100),
  department: z.string().trim().min(1).max(100),
  semester: z.string().trim().min(1).max(50),
  division: z.string().trim().min(1).max(50),
  initials: z.string().trim().max(5).default(""),
});

export const updateFacultyAssignment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePrincipal();
    const initials = data.initials || generateInitials(data.faculty_name);

    // 1. Send to Spring Boot (MySQL)
    try {
      await fetch("http://localhost:8090/api/faculty-assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.id,
          faculty_name: data.faculty_name,
          subject: data.subject,
          department: data.department,
          semester: data.semester,
          division: data.division,
          initials,
        }),
      });
    } catch (e) {
      console.warn("Spring Boot updateFacultyAssignment sync warning:", e);
    }

    // 2. Also update local JSON
    const assignments = readAssignments();
    const index = assignments.findIndex((a) => a.id === data.id);
    if (index === -1) return { ok: false as const, error: "Assignment not found." };
    assignments[index] = {
      ...assignments[index]!,
      faculty_name: data.faculty_name,
      subject: data.subject,
      department: data.department,
      semester: data.semester,
      division: data.division,
      initials,
    };
    writeAssignments(assignments);
    return { ok: true as const };
  });

// ── Delete a faculty assignment (principal only) ──

const deleteSchema = z.object({ id: z.string().uuid() });

export const deleteFacultyAssignment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePrincipal();

    // 1. Send to Spring Boot (MySQL)
    try {
      await fetch(`http://localhost:8090/api/faculty-assignments?id=${encodeURIComponent(data.id)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Spring Boot deleteFacultyAssignment sync warning:", e);
    }

    // 2. Also update local JSON
    const assignments = readAssignments();
    const filtered = assignments.filter((a) => a.id !== data.id);
    if (filtered.length === assignments.length) return { ok: false as const };
    writeAssignments(filtered);
    return { ok: true as const };
  });
