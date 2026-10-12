import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  FileText,
  LockKeyhole,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  Printer,
  RotateCw,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { FormEvent, ReactNode, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPrincipalResults,
  principalLogin,
  principalLogout,
  type FacultyResult,
  type AnalyticsSummary,
} from "@/lib/principal.functions";
import {
  getFacultyAssignments,
  addFacultyAssignment,
  updateFacultyAssignment,
  deleteFacultyAssignment,
  type FacultyAssignment,
} from "@/lib/faculty.functions";

export const Route = createFileRoute("/principal")({
  head: () => ({
    meta: [
      { title: "HOD Results — EduRank" },
      { name: "description", content: "Secure HOD-only view of faculty evaluation results and letters." },
      { property: "og:title", content: "HOD Results — EduRank" },
      { property: "og:description", content: "Restricted access to faculty rankings, warning and appreciation letters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrincipalPage,
});

const LABELS: Record<keyof FacultyResult["averages"], string> = {
  teaching: "Teaching",
  knowledge: "Knowledge",
  punctuality: "Punctuality",
  interaction: "Interaction",
  guidance: "Guidance",
  fairness: "Fairness",
};

const DEPARTMENTS = ["Computer Engineering", "Information Technology", "Electronics & Telecommunication"];
const SEMESTERS = [
  "Semester I",
  "Semester II",
  "Semester III",
  "Semester IV",
  "Semester V",
  "Semester VI",
  "Semester VII",
  "Semester VIII",
];
const DIVISIONS = ["Division A", "Division B", "Division C"];

function PrincipalPage() {
  const fetchResults = useServerFn(getPrincipalResults);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["principal-results"], queryFn: () => fetchResults() });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        query.refetch(),
        queryClient.refetchQueries({ queryKey: ["faculty-assignments"] }),
      ]);
      toast.success("Dashboard refreshed with latest data.");
    } catch {
      toast.error("Could not refresh dashboard. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (query.isLoading) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  if (!query.data || !query.data.authorized) {
    return (
      <Shell>
        <LoginCard
          onSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ["principal-results"] });
            await queryClient.refetchQueries({ queryKey: ["principal-results"] });
          }}
        />
      </Shell>
    );
  }
  return (
    <Dashboard
      results={query.data.results}
      analytics={"analytics" in query.data ? query.data.analytics : undefined}
      error={"error" in query.data ? query.data.error : undefined}
      onLogout={() => queryClient.setQueryData(["principal-results"], { authorized: false })}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing || query.isFetching}
    />
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="academic-grid flex min-h-screen items-center justify-center bg-hero px-5 py-12">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}

function LoginCard({ onSuccess }: { onSuccess: () => void }) {
  const login = useServerFn(principalLogin);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password) return setError("Enter the HOD password.");
    setBusy(true);
    try {
      const res = await login({ data: { password } });
      if (res.ok) onSuccess();
      else setError("Incorrect password. Access is restricted to the HOD.");
    } catch {
      setError("Could not sign in right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="soft-shadow rounded-lg border border-border bg-card p-7 sm:p-8">
      <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Home</Link>
      <span className="mb-5 grid size-11 place-items-center rounded-md bg-gold text-gold-foreground"><LockKeyhole className="size-5" /></span>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Restricted area</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">HOD login</h1>
      <p className="mt-2 text-sm text-muted-foreground">Only the Head of Department (HOD) can view results and generated letters.</p>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="principal-password">Password</Label>
          <Input id="principal-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" autoComplete="current-password" />
        </div>
        {error && <p role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"><TriangleAlert className="size-4 shrink-0" />{error}</p>}
        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>{busy ? "Checking…" : "Unlock results"}</Button>
      </form>
    </div>
  );
}

type Tab = "overview" | "results" | "faculty";

function Dashboard({
  results,
  analytics,
  error,
  onLogout,
  onRefresh,
  isRefreshing = false,
}: {
  results: FacultyResult[];
  analytics?: AnalyticsSummary | undefined;
  error?: string | undefined;
  onLogout: () => void;
  onRefresh: () => Promise<void> | void;
  isRefreshing?: boolean;
}) {
  const logout = useServerFn(principalLogout);
  const [letter, setLetter] = useState<FacultyResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const total = results.reduce((s, r) => s + r.responses, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-success" /><span className="font-bold text-foreground">HOD Dashboard</span></div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 transition-all"
              title="Refresh dashboard data and faculty"
            >
              <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin text-violet" : ""}`} />
              <span>{isRefreshing ? "Refreshing…" : "Refresh"}</span>
            </Button>
            <Button variant="outline" onClick={async () => { await logout(); onLogout(); }}><LogOut /> Log out</Button>
          </div>
        </div>
        {/* Tab bar */}
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex gap-1 border-t border-border">
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<TrendingUp className="size-4" />} label="Overview & Analytics" />
            <TabButton active={activeTab === "results"} onClick={() => setActiveTab("results")} icon={<BarChart3 className="size-4" />} label="Faculty Results" />
            <TabButton active={activeTab === "faculty"} onClick={() => setActiveTab("faculty")} icon={<Settings className="size-4" />} label="Manage Faculty" />
          </div>
        </div>
      </header>

      {activeTab === "overview" && <OverviewTab results={results} analytics={analytics} error={error} />}

      {activeTab === "results" && (
        <ResultsTab results={results} total={total} error={error} onViewLetter={setLetter} />
      )}

      {activeTab === "faculty" && <FacultyManager />}

      {letter && <LetterView result={letter} onClose={() => setLetter(null)} />}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${active ? "border-violet text-violet" : "border-transparent text-muted-foreground hover:text-foreground"}`}
    >
      {icon} {label}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Overview & Analytics Tab
   ──────────────────────────────────────────────────────────────────────────── */

function OverviewTab({
  results,
  analytics,
  error,
}: {
  results: FacultyResult[];
  analytics?: AnalyticsSummary | undefined;
  error?: string | undefined;
}) {
  if (!analytics || analytics.totalResponses === 0) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Dashboard overview</p>
        <h1 className="mt-2 font-display text-4xl text-foreground">Analytics</h1>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="mt-10 rounded-lg border border-border bg-card p-8 text-center">
          <BarChart3 className="mx-auto size-12 text-muted-foreground/30" />
          <p className="mt-4 font-semibold text-foreground">No evaluations yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Once students submit their evaluations, analytics and results will appear here.</p>
        </div>
      </main>
    );
  }

  const topFaculty = results.slice(0, 5);
  const bottomFaculty = [...results].sort((a, b) => a.overall - b.overall).slice(0, 5);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Dashboard overview</p>
      <h1 className="mt-2 font-display text-4xl text-foreground">Analytics & Insights</h1>
      <p className="mt-2 text-sm text-muted-foreground">Real-time overview of all student evaluations</p>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {/* Stats Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<MessageSquare className="size-5" />} label="Total Responses" value={analytics.totalResponses.toString()} accent="violet" />
        <StatCard icon={<Users className="size-5" />} label="Faculty Evaluated" value={analytics.totalFaculty.toString()} accent="gold" />
        <StatCard icon={<Star className="size-5" />} label="Average Rating" value={analytics.averageOverall.toFixed(2)} accent="violet" />
        <StatCard icon={<TrendingUp className="size-5" />} label="Last 7 Days" value={analytics.recentSubmissions.toString()} accent="gold" />
      </div>

      {/* Warning / Appreciation summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive"><TriangleAlert className="size-5" /></span>
          <div>
            <p className="text-2xl font-bold text-foreground">{analytics.warningCount}</p>
            <p className="text-sm text-muted-foreground">Faculty below 2.5 (warning)</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold/15 text-gold"><Award className="size-5" /></span>
          <div>
            <p className="text-2xl font-bold text-foreground">{analytics.appreciationCount}</p>
            <p className="text-sm text-muted-foreground">Faculty at 4.5+ (appreciation)</p>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-xl text-foreground">Overall Criteria Breakdown</h2>
        <p className="mt-1 text-sm text-muted-foreground">Average rating across all faculty for each criterion</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((key) => {
            const val = analytics.criteriaAverages?.[key] ?? 0;
            const pct = (val / 5) * 100;
            return (
              <div key={key} className="rounded-md bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{LABELS[key]}</p>
                  <p className="text-lg font-bold text-foreground">{val.toFixed(2)}</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${val >= 4.5 ? "bg-success" : val < 2.5 ? "bg-destructive" : "bg-violet"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Breakdown */}
      {(analytics.departmentBreakdown ?? []).length > 0 && (
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-xl text-foreground">Department Breakdown</h2>
          <p className="mt-1 text-sm text-muted-foreground">Evaluation statistics per department</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(analytics.departmentBreakdown ?? []).map((dept) => (
              <div key={dept.department} className="rounded-md border border-border p-4">
                <p className="text-sm font-bold text-foreground">{dept.department}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Responses</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{dept.responses}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className={`mt-1 text-xl font-bold ${dept.average >= 4.5 ? "text-success" : dept.average < 2.5 ? "text-destructive" : "text-foreground"}`}>
                      {dept.average.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top & Bottom performers */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-gold" />
            <h2 className="font-display text-xl text-foreground">Top Performers</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Highest rated faculty</p>
          {topFaculty.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topFaculty.map((r, i) => (
                <div key={r.faculty_name + r.subject} className="flex items-center justify-between rounded-md bg-secondary p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-gold/15 text-xs font-bold text-gold">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.faculty_name}</p>
                      <p className="text-xs text-muted-foreground">{r.subject}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${r.overall >= 4.5 ? "text-success" : "text-foreground"}`}>{r.overall.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Needs Improvement */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-destructive" />
            <h2 className="font-display text-xl text-foreground">Needs Improvement</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Lowest rated faculty</p>
          {bottomFaculty.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {bottomFaculty.map((r, i) => (
                <div key={r.faculty_name + r.subject} className="flex items-center justify-between rounded-md bg-secondary p-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid size-8 place-items-center rounded-full text-xs font-bold ${r.overall < 2.5 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>#{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.faculty_name}</p>
                      <p className="text-xs text-muted-foreground">{r.subject}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${r.overall < 2.5 ? "text-destructive" : "text-foreground"}`}>{r.overall.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: "violet" | "gold" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-md ${accent === "violet" ? "bg-accent text-violet" : "bg-gold/15 text-gold"}`}>{icon}</span>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Results Tab
   ──────────────────────────────────────────────────────────────────────────── */

function ResultsTab({
  results,
  total,
  error,
  onViewLetter,
}: {
  results: FacultyResult[];
  total: number;
  error?: string | undefined;
  onViewLetter: (r: FacultyResult) => void;
}) {
  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterDiv, setFilterDiv] = useState("");

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (filterDept && r.department !== filterDept) return false;
      if (filterSem && r.semester !== filterSem) return false;
      if (filterDiv && r.division !== filterDiv) return false;
      return true;
    });
  }, [results, filterDept, filterSem, filterDiv]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 print:hidden">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Faculty ranking</p>
      <h1 className="mt-2 font-display text-4xl text-foreground">Evaluation results</h1>
      <p className="mt-2 text-sm text-muted-foreground">{total} anonymous responses · Warning below 2.5 · Appreciation at 4.5 or above</p>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {/* Filters */}
      <div className="mt-6 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Filter by Department</Label>
          <Select value={filterDept || "__all__"} onValueChange={(v) => setFilterDept(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="All departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All departments</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Filter by Semester</Label>
          <Select value={filterSem || "__all__"} onValueChange={(v) => setFilterSem(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="All semesters" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All semesters</SelectItem>
              {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Filter by Division</Label>
          <Select value={filterDiv || "__all__"} onValueChange={(v) => setFilterDiv(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="All divisions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All divisions</SelectItem>
              {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Count & Clear */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} faculty result{filtered.length !== 1 ? "s" : ""} found</span>
        {(filterDept || filterSem || filterDiv) && (
          <button
            type="button"
            onClick={() => { setFilterDept(""); setFilterSem(""); setFilterDiv(""); }}
            className="text-xs font-semibold text-violet hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 && !error && (
        <div className="mt-10 rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          {results.length === 0 ? "No evaluations have been submitted yet." : "No results match the selected filters."}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {filtered.map((r, i) => {
          const status = r.overall < 2.5 ? "warning" : r.overall >= 4.5 ? "appreciation" : null;
          return (
            <article key={r.faculty_name + r.subject + r.department + r.semester + r.division} className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent font-bold text-violet">#{i + 1}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground">{r.faculty_name}</h2>
                      <span className="inline-flex items-center rounded-md border border-border bg-accent/60 px-2 py-0.5 text-xs font-semibold text-violet">
                        {r.division}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.subject} · {r.responses} response{r.responses !== 1 ? "s" : ""}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.department} · {r.semester}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {status === "warning" && <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive"><TriangleAlert className="size-3.5" /> Warning</span>}
                  {status === "appreciation" && <span className="flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold"><Award className="size-3.5" /> Appreciation</span>}
                  <span className="font-display text-3xl text-foreground">{r.overall.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((k) => (
                  <div key={k} className="rounded-md bg-secondary p-3"><p className="text-xs text-muted-foreground">{LABELS[k]}</p><p className="mt-1 font-bold text-foreground">{r.averages[k].toFixed(1)}</p></div>
                ))}
              </div>
              {r.comments.length > 0 && (
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer font-semibold text-violet">Anonymous comments ({r.comments.length})</summary>
                  <ul className="mt-3 space-y-2">{r.comments.map((c, j) => <li key={j} className="rounded-md border border-border p-3 text-muted-foreground">"{c}"</li>)}</ul>
                </details>
              )}
              {status && <Button variant={status === "warning" ? "outline" : "gold"} className="mt-4" onClick={() => onViewLetter(r)}><FileText /> View {status} letter</Button>}
            </article>
          );
        })}
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Faculty Manager Tab
   ──────────────────────────────────────────────────────────────────────────── */

function FacultyManager() {
  const fetchAssignments = useServerFn(getFacultyAssignments);
  const addFn = useServerFn(addFacultyAssignment);
  const updateFn = useServerFn(updateFacultyAssignment);
  const deleteFn = useServerFn(deleteFacultyAssignment);

  const query = useQuery({ queryKey: ["faculty-assignments"], queryFn: () => fetchAssignments() });
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FacultyAssignment | null>(null);
  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterDiv, setFilterDiv] = useState("");

  const assignments = query.data?.assignments ?? [];

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (filterDept && a.department !== filterDept) return false;
      if (filterSem && a.semester !== filterSem) return false;
      if (filterDiv && a.division !== filterDiv) return false;
      return true;
    });
  }, [assignments, filterDept, filterSem, filterDiv]);

  async function refresh() {
    await query.refetch();
    await queryClient.invalidateQueries({ queryKey: ["faculty-assignments"] });
  }

  function openEdit(a: FacultyAssignment) {
    setEditing(a);
    setShowForm(true);
  }

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this faculty assignment?")) return;
    try {
      await deleteFn({ data: { id } });
      await refresh();
      toast.success("Assignment removed.");
    } catch {
      toast.error("Could not remove assignment.");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Administration</p>
          <h1 className="mt-2 font-display text-4xl text-foreground">Manage Faculty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Assign faculty to subjects for each department, semester, and division.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await refresh();
              toast.success("Faculty list refreshed.");
            }}
            disabled={query.isFetching}
            className="flex items-center gap-1.5"
            title="Refresh faculty assignments"
          >
            <RotateCw className={`size-4 ${query.isFetching ? "animate-spin text-violet" : ""}`} />
            <span>{query.isFetching ? "Refreshing…" : "Refresh"}</span>
          </Button>
          <Button variant="gold" onClick={openAdd}><Plus className="size-4" /> Add Faculty</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Filter by Department</Label>
          <Select value={filterDept || "__all__"} onValueChange={(v) => setFilterDept(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="All departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All departments</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Filter by Semester</Label>
          <Select value={filterSem || "__all__"} onValueChange={(v) => setFilterSem(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="All semesters" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All semesters</SelectItem>
              {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Filter by Division</Label>
          <Select value={filterDiv || "__all__"} onValueChange={(v) => setFilterDiv(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="All divisions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All divisions</SelectItem>
              {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Count */}
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="size-4" /> {filtered.length} assignment{filtered.length !== 1 ? "s" : ""} found
        {(filterDept || filterSem || filterDiv) && (
          <button
            type="button"
            onClick={() => { setFilterDept(""); setFilterSem(""); setFilterDiv(""); }}
            className="ml-2 text-xs font-semibold text-violet hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {query.isLoading ? (
        <p className="mt-10 text-center text-muted-foreground">Loading assignments…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-lg border border-border bg-card p-8 text-center">
          <Users className="mx-auto size-10 text-muted-foreground/40" />
          <p className="mt-4 font-semibold text-foreground">No assignments found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {assignments.length === 0
              ? "Start by adding faculty assignments using the button above."
              : "No assignments match the current filters."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Faculty Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Subject</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Semester</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Division</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-xs font-bold text-violet">{a.initials}</span>
                      {a.faculty_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.department}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.semester}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.division}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(a)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <FacultyForm
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={refresh}
          addFn={addFn}
          updateFn={updateFn}
        />
      )}
    </main>
  );
}

/* ── Add / Edit Form Modal ── */

type FacultyFormProps = {
  editing: FacultyAssignment | null;
  onClose: () => void;
  onSaved: () => void;
  addFn: ReturnType<typeof useServerFn<typeof addFacultyAssignment>>;
  updateFn: ReturnType<typeof useServerFn<typeof updateFacultyAssignment>>;
};

function FacultyForm({ editing, onClose, onSaved, addFn, updateFn }: FacultyFormProps) {
  const [facultyName, setFacultyName] = useState(editing?.faculty_name ?? "");
  const [subject, setSubject] = useState(editing?.subject ?? "");
  const [department, setDepartment] = useState(editing?.department ?? "");
  const [semester, setSemester] = useState(editing?.semester ?? "");
  const [division, setDivision] = useState(editing?.division ?? "");
  const [initials, setInitials] = useState(editing?.initials ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!facultyName.trim() || !subject.trim() || !department || !semester || !division) {
      setError("All fields are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (editing) {
        const res = await updateFn({ data: { id: editing.id, faculty_name: facultyName.trim(), subject: subject.trim(), department, semester, division, initials: initials.trim() } });
        if (!res.ok) { setError("error" in res ? res.error : "Update failed."); setBusy(false); return; }
        toast.success("Faculty updated successfully.");
      } else {
        const res = await addFn({ data: { faculty_name: facultyName.trim(), subject: subject.trim(), department, semester, division, initials: initials.trim() } });
        if (!res.ok) { setError("error" in res ? res.error : "Could not add faculty."); setBusy(false); return; }
        toast.success("Faculty added successfully.");
      }
      await onSaved();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-2xl text-foreground">{editing ? "Edit Faculty" : "Add Faculty"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{editing ? "Update the details below." : "Assign a faculty member to a subject for a specific class."}</p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Faculty Name</Label>
              <Input value={facultyName} onChange={(e) => setFacultyName(e.target.value)} placeholder="Prof. John Doe" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Data Structures" className="h-11" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Division</Label>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Initials <span className="font-normal text-muted-foreground">(optional, auto-generated if blank)</span></Label>
            <Input value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="JD" className="h-11 w-24" maxLength={5} />
          </div>

          {error && <p role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"><TriangleAlert className="size-4 shrink-0" />{error}</p>}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={busy}>{busy ? "Saving…" : editing ? "Update Faculty" : "Add Faculty"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LetterView({ result, onClose }: { result: FacultyResult; onClose: () => void }) {
  const warning = result.overall < 2.5;
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/60 p-4 print:static print:bg-transparent print:p-0">
      <div className="mx-auto max-w-2xl rounded-lg bg-card p-8 shadow-xl sm:p-12 print:shadow-none">
        <div className="mb-6 flex justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <p className="text-sm text-muted-foreground">Date: {date}</p>
        <p className="mt-6 text-foreground">To,<br />{result.faculty_name}<br />Faculty — {result.subject} ({result.department} · {result.semester} · {result.division})</p>
        <p className="mt-6 font-bold text-foreground">Subject: {warning ? "Notice regarding student feedback" : "Letter of appreciation"}</p>
        <div className="mt-5 space-y-4 leading-7 text-foreground">
          <p>Dear {result.faculty_name},</p>
          {warning ? (
            <p>Based on {result.responses} anonymous student evaluations, your overall average rating for {result.subject} is {result.overall.toFixed(2)} out of 5, which is below the institution's minimum threshold of 2.5. We request you to review the feedback and work on improving teaching quality, interaction and support for students. The department will be glad to assist you in this effort.</p>
          ) : (
            <p>We are pleased to inform you that, based on {result.responses} anonymous student evaluations, your overall average rating for {result.subject} is {result.overall.toFixed(2)} out of 5. This reflects your outstanding commitment to teaching and to your students. On behalf of the institution, we sincerely appreciate your dedication and contribution.</p>
          )}
          <p>{warning ? "We look forward to seeing positive improvement in the coming semester." : "Keep up the excellent work."}</p>
        </div>
        <p className="mt-10 text-foreground">Regards,<br /><span className="font-bold">Head of Department (HOD)</span></p>
      </div>
    </div>
  );
}
