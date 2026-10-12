import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  History,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Plus,
  Printer,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  getRegisteredFacultyList,
  getFacultyPortalList,
  facultyLogin,
  facultyLogout,
  getFacultyDashboardData,
  addImprovementGoal,
  updateImprovementGoal,
  deleteImprovementGoal,
} from "@/lib/faculty-dashboard.functions";
import {
  CRITERIA_METADATA,
  type FacultyDashboardData,
  type CriteriaKey,
  type ImprovementPlan,
} from "@/lib/faculty-dashboard.types";

export const Route = createFileRoute("/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty Portal — EduRank" },
      {
        name: "description",
        content: "Private faculty dashboard for ratings, appreciation letters, and continuous improvement.",
      },
      { property: "og:title", content: "Faculty Portal — EduRank" },
      {
        property: "og:description",
        content: "Secure personal evaluation insights, student feedback, and professional development.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FacultyPage,
});

function FacultyPage() {
  const fetchDashboard = useServerFn(getFacultyDashboardData);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await query.refetch();
      toast.success("Faculty dashboard refreshed with latest data.");
    } catch {
      toast.error("Could not refresh dashboard. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (query.isLoading) {
    return (
      <main className="academic-grid flex min-h-screen items-center justify-center bg-hero px-5 py-12">
        <div className="flex items-center gap-3 text-hero-foreground/80">
          <RotateCw className="size-5 animate-spin text-gold" />
          <span className="text-base font-medium">Loading faculty dashboard…</span>
        </div>
      </main>
    );
  }

  if (!query.data || !query.data.authorized || !query.data.data) {
    return (
      <main className="academic-grid flex min-h-screen items-center justify-center bg-hero px-5 py-12">
        <div className="w-full max-w-md">
          <FacultyLoginCard
            onSuccess={async () => {
              await queryClient.invalidateQueries({ queryKey: ["faculty-dashboard"] });
              await queryClient.refetchQueries({ queryKey: ["faculty-dashboard"] });
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <FacultyDashboardView
      data={query.data.data}
      onLogout={() => queryClient.setQueryData(["faculty-dashboard"], { authorized: false })}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing || query.isFetching}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Faculty Login Card
   ──────────────────────────────────────────────────────────────────────────── */

const DEFAULT_FACULTY_LIST = [
  { facultyName: "Prof. Charul Singh", department: "Information Technology" },
  { facultyName: "Dr. Kiran Deshpande", department: "Information Technology" },
  { facultyName: "Prof. Anagha Aher", department: "Information Technology" },
  { facultyName: "Prof. Rujata Chaudhari", department: "Information Technology" },
  { facultyName: "Prof. Pooja Chavan", department: "Information Technology" },
  { facultyName: "Chaitali Isal", department: "Information Technology" },
  { facultyName: "Prof. Vishal Badgujar", department: "Information Technology" },
  { facultyName: "Prof. Sangeeta Borde", department: "Information Technology" },
  { facultyName: "Prof. M. B. Kamble", department: "Information Technology" },
  { facultyName: "Prof. Nahid Shaikh", department: "Information Technology" },
  { facultyName: "Prof. A. M. Deshpande", department: "Information Technology" },
];

function FacultyLoginCard({ onSuccess }: { onSuccess: () => void }) {
  const fetchList = useServerFn(getRegisteredFacultyList);
  const loginFn = useServerFn(facultyLogin);

  const listQuery = useQuery({
    queryKey: ["faculty-portal-list"],
    queryFn: () => fetchList(),
  });

  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const facultyOptions =
    listQuery.data?.faculty && listQuery.data.faculty.length > 0
      ? listQuery.data.faculty
      : DEFAULT_FACULTY_LIST;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedFaculty.trim()) {
      return setError("Please select or enter your faculty name.");
    }
    if (!password) {
      return setError("Please enter your faculty password.");
    }

    setBusy(true);
    setError("");
    try {
      const res = await loginFn({
        data: {
          facultyName: selectedFaculty.trim(),
          password,
        },
      });

      if (res.ok) {
        toast.success(`Welcome, ${res.facultyName}!`);
        onSuccess();
      } else {
        setError(res.error || "Login failed. Please verify your credentials.");
      }
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="soft-shadow rounded-lg border border-border bg-card p-7 sm:p-8">
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Home
      </Link>

      <span className="mb-5 grid size-11 place-items-center rounded-md bg-gold text-gold-foreground">
        <GraduationCap className="size-5" />
      </span>

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Faculty Portal</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Faculty login</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to view your private evaluation ratings, feedback, and letters.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="faculty-select">Select your faculty name</Label>
          <div className="relative">
            <select
              id="faculty-select"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="flex h-11 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="" disabled>
                Choose your name
              </option>
              {facultyOptions.map((f) => (
                <option key={f.facultyName} value={f.facultyName}>
                  {f.facultyName} ({f.department})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <ChevronRight className="size-4 rotate-90" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty-password">Password</Label>
          <Input
            id="faculty-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your faculty password"
            className="h-11"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
          >
            <TriangleAlert className="size-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Access Faculty Dashboard"}
        </Button>
      </form>

      <div className="mt-6 rounded-md border border-border bg-secondary/60 p-3.5 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5 font-semibold text-foreground">
          <ShieldCheck className="size-4 text-success" /> Confidential & Protected
        </p>
        <p className="mt-1">
          Each faculty member can only view their own ratings and evaluation records.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Faculty Dashboard Layout & Tabs
   ──────────────────────────────────────────────────────────────────────────── */

type FacultyTab =
  | "overview"
  | "ratings"
  | "appreciation"
  | "warnings"
  | "improvement"
  | "history"
  | "profile";

function FacultyDashboardView({
  data,
  onLogout,
  onRefresh,
  isRefreshing,
}: {
  data: FacultyDashboardData;
  onLogout: () => void;
  onRefresh: () => Promise<void> | void;
  isRefreshing?: boolean;
}) {
  const logoutFn = useServerFn(facultyLogout);
  const [activeTab, setActiveTab] = useState<FacultyTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logoutFn();
    toast.success("Logged out successfully.");
    onLogout();
  }

  const navItems: Array<{
    id: FacultyTab;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: string | undefined;
  }> = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "ratings", label: "My Ratings", icon: Star },
    {
      id: "appreciation",
      label: "My Appreciation",
      icon: Award,
      badge: data.appreciation.isEligible ? "Award" : undefined,
    },
    {
      id: "warnings",
      label: "My Early Warnings",
      icon: TriangleAlert,
      badge: data.earlyWarning.hasWarning ? "Notice" : undefined,
    },
    {
      id: "improvement",
      label: "My Improvement Plan",
      icon: Target,
      badge: data.improvementPlans.length ? `${data.improvementPlans.length}` : undefined,
    },
    { id: "history", label: "Rating History", icon: History },
    { id: "profile", label: "My Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid size-10 place-items-center rounded-md border border-border text-foreground hover:bg-muted md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <div className="flex items-center gap-3">
              <img
                src="/college-logo.png"
                alt="A.P. Shah Institute of Technology"
                className="size-10 rounded-md object-contain"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">EduRank</span>
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gold">
                    Faculty Portal
                  </span>
                </div>
                <span className="block text-xs text-muted-foreground">{data.profile.facultyName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5"
              title="Refresh dashboard data"
            >
              <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin text-violet" : ""}`} />
              <span className="hidden sm:inline">{isRefreshing ? "Refreshing…" : "Refresh"}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1.5">
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="mx-auto flex max-w-7xl items-start px-4 py-6 sm:px-8">
        {/* Sidebar for Desktop */}
        <aside className="sticky top-28 hidden w-64 shrink-0 rounded-lg border border-border bg-card p-3 shadow-sm md:block">
          <div className="mb-4 border-b border-border p-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet">Faculty Member</p>
            <p className="mt-1 font-semibold text-foreground truncate">{data.profile.facultyName}</p>
            <p className="text-xs text-muted-foreground truncate">{data.profile.department}</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-violet text-white font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="size-4" />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active ? "bg-white/20 text-white" : "bg-gold/15 text-gold"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 border-t border-border mt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" /> Logout
              </button>
            </div>
          </nav>
        </aside>

        {/* Mobile Sidebar Modal/Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 flex bg-foreground/60 p-4 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-full max-w-xs rounded-lg border border-border bg-card p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-display text-lg text-foreground">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded p-1 hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="my-3">
                <p className="font-semibold text-foreground truncate">{data.profile.facultyName}</p>
                <p className="text-xs text-muted-foreground truncate">{data.profile.department}</p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium ${
                        active
                          ? "bg-violet text-white font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="size-4" />
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Pane */}
        <main className="min-w-0 flex-1 md:pl-8">
          {activeTab === "overview" && <FacultyOverviewTab data={data} onNavigate={setActiveTab} />}
          {activeTab === "ratings" && <FacultyRatingsTab data={data} />}
          {activeTab === "appreciation" && <FacultyAppreciationTab data={data} />}
          {activeTab === "warnings" && <FacultyWarningsTab data={data} onNavigate={setActiveTab} />}
          {activeTab === "improvement" && <FacultyImprovementTab data={data} onRefresh={onRefresh} />}
          {activeTab === "history" && <FacultyHistoryTab data={data} />}
          {activeTab === "profile" && <FacultyProfileTab data={data} />}
        </main>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   1. Dashboard Overview Tab
   ──────────────────────────────────────────────────────────────────────────── */

function FacultyOverviewTab({
  data,
  onNavigate,
}: {
  data: FacultyDashboardData;
  onNavigate: (tab: FacultyTab) => void;
}) {
  const { profile, hasEvaluations, overallRating, totalResponses, appreciation, earlyWarning } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet/10 px-2.5 py-0.5 text-xs font-bold text-violet">
                {profile.department}
              </span>
              <span className="text-xs text-muted-foreground">ID: {profile.facultyId}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl text-foreground">Welcome back, {profile.facultyName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here is your verified evaluation status and feedback for the current academic session.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate("ratings")}>
              View Details <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest Rating</p>
            <Star className="size-4 text-gold fill-current" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-foreground">
            {hasEvaluations ? `${overallRating.toFixed(2)} / 5.0` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasEvaluations
              ? overallRating >= 4.5
                ? "🌟 Academic Excellence Tier"
                : overallRating >= 2.5
                ? "✓ Meets College Standard"
                : "⚠️ Requires Improvement"
              : "No finalized rating"}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student Responses</p>
            <MessageSquare className="size-4 text-violet" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-foreground">{totalResponses}</p>
          <p className="mt-1 text-xs text-muted-foreground">Verified anonymous evaluations</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appreciation</p>
            <Award className="size-4 text-gold" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-foreground">
            {appreciation.isEligible ? "Recognized" : "Pending"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {appreciation.isEligible ? "Rating ≥ 4.5 letter issued" : "Earned at rating ≥ 4.5"}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Early Warning</p>
            <TriangleAlert
              className={`size-4 ${earlyWarning.hasWarning ? "text-destructive" : "text-success"}`}
            />
          </div>
          <p
            className={`mt-3 font-display text-3xl font-bold ${
              earlyWarning.hasWarning ? "text-destructive" : "text-foreground"
            }`}
          >
            {earlyWarning.hasWarning ? "Active" : "None"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {earlyWarning.hasWarning ? "Score below 2.5 notice" : "No active warnings"}
          </p>
        </div>
      </div>

      {/* Status Notice or Criteria preview */}
      {!hasEvaluations ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <BookOpen className="mx-auto size-10 text-muted-foreground/40" />
          <h3 className="mt-4 font-display text-xl text-foreground">
            No finalized evaluation is currently available.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Student evaluations for your assigned subjects have not yet concluded or reached minimum threshold.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category snapshot */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg text-foreground">Evaluation Criteria Snapshot</h3>
                <p className="text-xs text-muted-foreground">Aggregated across all verified student ratings</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("ratings")}>
                Full Breakdown
              </Button>
            </div>

            <div className="mt-4 space-y-3.5">
              {(Object.keys(CRITERIA_METADATA) as CriteriaKey[]).map((key) => {
                const score = data.criteriaAverages[key] || 0;
                const pct = (score / 5) * 100;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{CRITERIA_METADATA[key].label}</span>
                      <span className="font-bold text-foreground">{score.toFixed(2)} / 5.0</span>
                    </div>
                    <Progress value={pct} className="mt-1.5 h-2 bg-muted" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Classes & Recognition Snapshot */}
          <div className="space-y-6">
            {/* Appreciation or Warning Card */}
            {appreciation.isEligible && (
              <div className="rounded-lg border border-gold/40 bg-gold/10 p-5">
                <div className="flex items-start gap-3">
                  <Award className="size-6 text-gold shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-foreground">HOD Letter of Appreciation</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Congratulations on achieving an exceptional score of {overallRating.toFixed(2)} / 5.0.
                      Your letter is available for review and download.
                    </p>
                    <Button
                      variant="gold"
                      size="sm"
                      className="mt-3 text-xs"
                      onClick={() => onNavigate("appreciation")}
                    >
                      View Appreciation Letter
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {earlyWarning.hasWarning && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-5">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="size-6 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-destructive">Performance Early Warning Notice</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Your rating of {overallRating.toFixed(2)} is below the academic threshold of 2.5.
                      Review the recommended focus areas and construct a self-directed improvement plan.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs border-destructive text-destructive"
                      onClick={() => onNavigate("warnings")}
                    >
                      View Warning & Guidance
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Assigned classes snapshot */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg text-foreground">Assigned Subjects & Divisions</h3>
              <p className="text-xs text-muted-foreground">Current academic teaching portfolio</p>
              <div className="mt-4 space-y-2.5">
                {profile.assignedClasses.map((cls) => (
                  <div
                    key={`${cls.subject}-${cls.division}`}
                    className="flex items-center justify-between rounded-md bg-secondary p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{cls.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {cls.semester} · {cls.division}
                      </p>
                    </div>
                    <span className="text-xs rounded bg-card px-2.5 py-1 font-medium text-foreground border border-border">
                      {cls.department}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   2. My Ratings Tab
   ──────────────────────────────────────────────────────────────────────────── */

function FacultyRatingsTab({ data }: { data: FacultyDashboardData }) {
  const { hasEvaluations, overallRating, criteriaAverages, classBreakdowns, anonymousComments, totalResponses } =
    data;

  if (!hasEvaluations) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center">
        <Star className="mx-auto size-12 text-muted-foreground/30" />
        <h2 className="mt-4 font-display text-2xl text-foreground">
          No finalized evaluation is currently available.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          There are currently insufficient responses to display a finalized rating. As soon as the evaluation
          period closes and student responses are tallied, your rating breakdown will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Performance Metrics</p>
        <h1 className="mt-1 font-display text-3xl text-foreground">My Evaluation Ratings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregated anonymous student feedback across all six evaluation criteria.
        </p>
      </div>

      {/* Main Score Banner */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Overall Finalized Rating
            </span>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-display text-4xl sm:text-5xl font-bold text-foreground">
                {overallRating.toFixed(2)}
              </span>
              <span className="text-xl text-muted-foreground">/ 5.0</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`size-4 ${
                    star <= Math.round(overallRating)
                      ? "text-gold fill-current"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
              <span className="ml-2 text-xs text-muted-foreground">
                Based on {totalResponses} student responses
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary p-4 text-right">
            <span className="text-xs font-medium text-muted-foreground">Performance Classification</span>
            <p className="mt-1 text-base font-bold text-foreground">
              {overallRating >= 4.5
                ? "🌟 Outstanding / Letter of Appreciation"
                : overallRating >= 3.5
                ? "✓ Proficient & Commendable"
                : overallRating >= 2.5
                ? "✓ Satisfactory Academic Standard"
                : "⚠️ Early Warning — Improvement Required"}
            </p>
          </div>
        </div>
      </div>

      {/* 6 Category-wise breakdown */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="font-display text-xl text-foreground">Category-wise Ratings Breakdown</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Performance scores for each defined teaching evaluation criterion
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(CRITERIA_METADATA) as CriteriaKey[]).map((key) => {
            const score = criteriaAverages[key] || 0;
            const pct = (score / 5) * 100;
            const meta = CRITERIA_METADATA[key];

            return (
              <div key={key} className="rounded-md border border-border bg-secondary p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{meta.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                  </div>
                  <span className="font-display text-lg font-bold text-foreground">
                    {score.toFixed(2)}
                  </span>
                </div>
                <div className="mt-3">
                  <Progress value={pct} className="h-2 bg-muted" />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>Score: {score.toFixed(2)} / 5</span>
                  <span>{pct.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Class & Division Breakdown */}
      {classBreakdowns.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-xl text-foreground">Class & Division Breakdown</h2>
          <p className="mt-1 text-sm text-muted-foreground">Performance evaluated by specific class and subject</p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-semibold">Subject</th>
                  <th className="p-3 font-semibold">Semester</th>
                  <th className="p-3 font-semibold">Division</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Responses</th>
                  <th className="p-3 font-semibold text-right">Class Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classBreakdowns.map((b) => (
                  <tr key={`${b.subject}-${b.semester}-${b.division}`} className="hover:bg-muted/30">
                    <td className="p-3 font-semibold text-foreground">{b.subject}</td>
                    <td className="p-3 text-muted-foreground">{b.semester}</td>
                    <td className="p-3 text-muted-foreground">{b.division}</td>
                    <td className="p-3 text-muted-foreground">{b.department}</td>
                    <td className="p-3 text-muted-foreground">{b.responses} students</td>
                    <td className="p-3 text-right font-display font-bold text-foreground">
                      {b.overall.toFixed(2)} / 5.0
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Anonymous Feedback Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-violet" />
          <h2 className="font-display text-xl text-foreground">Anonymous Student Feedback</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Qualitative remarks submitted by students. All personal student identities are strictly protected.
        </p>

        {anonymousComments.length === 0 ? (
          <div className="mt-6 rounded-md border border-border bg-secondary p-5 text-center text-sm text-muted-foreground">
            No text comments were submitted during this evaluation cycle.
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {anonymousComments.map((comment, idx) => (
              <div
                key={idx}
                className="rounded-md border border-border bg-secondary p-4 text-sm leading-relaxed text-foreground italic"
              >
                “{comment}”
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   3. My Appreciation Tab
   ──────────────────────────────────────────────────────────────────────────── */

function FacultyAppreciationTab({ data }: { data: FacultyDashboardData }) {
  const { appreciation, profile, overallRating } = data;

  if (!appreciation.isEligible) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Recognition</p>
          <h1 className="mt-1 font-display text-3xl text-foreground">My Appreciation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Official appreciation recognitions awarded by the Head of Department (HOD).</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <Award className="mx-auto size-12 text-muted-foreground/30" />
          <h2 className="mt-4 font-display text-2xl text-foreground">No appreciation record currently awarded</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Letters of Appreciation are conferred to faculty members achieving an overall rating of{" "}
            <strong>4.50 or higher</strong>. Your current rating is{" "}
            <strong>{data.hasEvaluations ? overallRating.toFixed(2) : "not finalized"}</strong>.
          </p>

          <div className="mt-6 inline-block rounded-md border border-border bg-secondary p-4 text-left text-xs">
            <p className="font-bold text-foreground">Criteria to Earn Appreciation:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
              <li>Attain an aggregate student evaluation score ≥ 4.50 / 5.0</li>
              <li>Consistently high performance across all 6 teaching criteria</li>
              <li>Official endorsement by the HOD & Academic Council</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Official Recognition</p>
          <h1 className="mt-1 font-display text-3xl text-foreground">Letter of Appreciation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Academic Council and HOD Recognition of Superior Teaching Performance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-1.5 print:hidden">
          <Printer className="size-4" /> Print Letter
        </Button>
      </div>

      {/* Official Letter Format matching EduRank Principal Letter */}
      <div className="rounded-lg border border-gold/40 bg-card p-8 shadow-md">
        <div className="border-b border-border pb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src="/college-logo.png" alt="APSIT" className="size-12 object-contain" />
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">A.P. Shah Institute of Technology</h2>
              <p className="text-xs text-muted-foreground">Survey No. 12, Opp. Hypercity Mall, Ghodbunder Rd, Thane (W)</p>
            </div>
          </div>
          <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold uppercase tracking-wider">
            Academic Honors
          </span>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          Date: {appreciation.date}
        </div>

        <div className="mt-4 text-sm text-foreground space-y-1">
          <p className="font-semibold">To,</p>
          <p className="font-bold">{profile.facultyName}</p>
          <p className="text-muted-foreground">{profile.department}</p>
          <p className="text-muted-foreground">Faculty ID: {profile.facultyId}</p>
        </div>

        <div className="mt-6 font-bold text-foreground text-base border-l-2 border-gold pl-3">
          Subject: Letter of Appreciation regarding outstanding student evaluation performance
        </div>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground">
          <p>Dear {profile.facultyName},</p>
          <p>
            I am pleased to formally convey our appreciation on behalf of the A.P. Shah Institute of
            Technology for your stellar academic performance in the recent student evaluations.
          </p>
          <p>
            Your overall evaluated score of <strong>{overallRating.toFixed(2)} / 5.0</strong> places you in
            the highest tier of pedagogical excellence across our institution. The student body has
            expressed remarkable appreciation for your dedication, subject mastery, and inspiring classroom
            leadership.
          </p>

          <div className="rounded-md border border-border bg-secondary p-4">
            <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Recognized Strengths:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {appreciation.strengths.map((str) => (
                <span
                  key={str}
                  className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold"
                >
                  ✓ {str}
                </span>
              ))}
            </div>
          </div>

          <p>
            The college values your commitment to fostering an engaging learning environment. We trust that
            you will continue to inspire both students and colleagues alike.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex justify-between items-end text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Certified by EduRank Faculty Evaluation System</p>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-foreground">Head of Department (HOD)</p>
            <p className="text-xs text-muted-foreground">A.P. Shah Institute of Technology</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   4. My Early Warnings Tab
   ──────────────────────────────────────────────────────────────────────────── */

function FacultyWarningsTab({
  data,
  onNavigate,
}: {
  data: FacultyDashboardData;
  onNavigate: (tab: FacultyTab) => void;
}) {
  const { earlyWarning, profile, overallRating, hasEvaluations } = data;

  if (!earlyWarning.hasWarning) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Academic Guidance</p>
          <h1 className="mt-1 font-display text-3xl text-foreground">My Early Warnings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Official academic notices and improvement guidance.</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-4 font-display text-2xl text-foreground">No active improvement warnings</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {hasEvaluations
              ? `Your current evaluation rating (${overallRating.toFixed(2)} / 5.0) safely complies with academic benchmarks. No formal warnings or interventions have been issued.`
              : "No evaluations are currently available to trigger warnings."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">Administrative Notice</p>
        <h1 className="mt-1 font-display text-3xl text-foreground">Early Warning & Performance Guidance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Constructive institutional feedback to support your instructional improvement.
        </p>
      </div>

      {/* Notice Card */}
      <div className="rounded-lg border border-destructive/40 bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-destructive/10 text-destructive">
              <TriangleAlert className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl text-foreground">Academic Council Performance Notice</h2>
              <p className="text-xs text-muted-foreground">Issued in accordance with EduRank evaluation protocol</p>
            </div>
          </div>
          <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive uppercase">
            Action Required
          </span>
        </div>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground">
          <p>Dear {profile.facultyName},</p>
          <p>
            This notice is issued following the conclusion of the student evaluation cycle. Your evaluated
            overall score of <strong>{overallRating.toFixed(2)} / 5.0</strong> falls below the institutional
            benchmark of <strong>2.50 / 5.0</strong>.
          </p>

          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-destructive">
              Identified Focus Areas:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {earlyWarning.areasNeedingImprovement.map((area) => (
                <span
                  key={area}
                  className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-semibold text-destructive"
                >
                  ⚠️ {area}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground text-sm">Recommended Next Steps:</h3>
            <ul className="mt-2 space-y-2 list-disc list-inside text-muted-foreground text-xs leading-relaxed">
              {earlyWarning.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Official warning records cannot be altered or removed by faculty.
          </p>
          <Button variant="gold" onClick={() => onNavigate("improvement")}>
            Open Improvement Plan <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   5. My Improvement Plan Tab (Faculty Self-Directed)
   ──────────────────────────────────────────────────────────────────────────── */

function FacultyImprovementTab({
  data,
  onRefresh,
}: {
  data: FacultyDashboardData;
  onRefresh: () => Promise<void> | void;
}) {
  const addGoalFn = useServerFn(addImprovementGoal);
  const updateGoalFn = useServerFn(updateImprovementGoal);
  const deleteGoalFn = useServerFn(deleteImprovementGoal);

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [criterion, setCriterion] = useState("Teaching Quality");
  const [actionSteps, setActionSteps] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAddGoal(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !actionSteps.trim()) {
      toast.error("Goal title and action steps are required.");
      return;
    }

    setBusy(true);
    try {
      const res = await addGoalFn({
        data: {
          title,
          criterion,
          action_steps: actionSteps,
          target_date: targetDate,
          notes,
        },
      });

      if (res.ok) {
        toast.success("Improvement goal created.");
        setTitle("");
        setActionSteps("");
        setTargetDate("");
        setNotes("");
        setShowAddModal(false);
        await onRefresh();
      } else {
        toast.error("Could not save goal.");
      }
    } catch {
      toast.error("An error occurred while saving the goal.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleStatus(plan: ImprovementPlan) {
    const nextStatus = plan.status === "completed" ? "in_progress" : "completed";
    try {
      await updateGoalFn({
        data: {
          id: plan.id,
          status: nextStatus,
        },
      });
      toast.success(nextStatus === "completed" ? "Goal marked as completed!" : "Goal marked as in progress.");
      await onRefresh();
    } catch {
      toast.error("Could not update status.");
    }
  }

  async function handleDeleteGoal(id: string) {
    if (!confirm("Are you sure you want to delete this improvement goal?")) return;
    try {
      await deleteGoalFn({ data: { id } });
      toast.success("Goal removed.");
      await onRefresh();
    } catch {
      toast.error("Could not delete goal.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Professional Development</p>
          <h1 className="mt-1 font-display text-3xl text-foreground">My Improvement Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personal, self-directed goals and pedagogical development action steps.
          </p>
        </div>
        <Button variant="gold" onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5">
          <Plus className="size-4" /> Add Improvement Goal
        </Button>
      </div>

      {/* Clear Separation Note */}
      <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck className="size-4 text-success" /> Private & Self-Directed
        </div>
        <p className="mt-1">
          Your personal goals and action steps are private to you. Official evaluation ratings and administrative
          decisions remain strictly managed by the college academic council.
        </p>
      </div>

      {/* Goal List */}
      {data.improvementPlans.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center shadow-sm">
          <Target className="mx-auto size-12 text-muted-foreground/30" />
          <h2 className="mt-4 font-display text-2xl text-foreground">No improvement goals created yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Set actionable goals to enhance classroom engagement, update syllabus delivery, or incorporate
            student suggestions.
          </p>
          <Button variant="gold" className="mt-6" onClick={() => setShowAddModal(true)}>
            <Plus className="size-4" /> Create First Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.improvementPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border p-5 shadow-sm transition ${
                plan.status === "completed"
                  ? "border-success/40 bg-success/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-violet/10 px-2.5 py-0.5 text-xs font-semibold text-violet">
                      {plan.criterion}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        plan.status === "completed"
                          ? "bg-success/15 text-success"
                          : "bg-gold/15 text-gold"
                      }`}
                    >
                      {plan.status === "completed" ? "Completed" : "In Progress"}
                    </span>
                    {plan.target_date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" /> Due: {plan.target_date}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-foreground">{plan.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(plan)}
                    className="text-xs"
                  >
                    {plan.status === "completed" ? "Mark In Progress" : "Mark Done"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGoal(plan.id)}
                    className="text-destructive hover:bg-destructive/10"
                    aria-label="Delete goal"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 text-xs leading-relaxed text-foreground">
                <p className="font-semibold text-muted-foreground">Action Steps:</p>
                <p className="mt-1 whitespace-pre-line">{plan.action_steps}</p>
              </div>

              {plan.notes && (
                <div className="mt-3 rounded border border-border bg-secondary/60 p-2.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Personal Notes: </span>
                  {plan.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl sm:p-8">
            <h2 className="font-display text-2xl text-foreground">Create Improvement Goal</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Define a personal milestone to strengthen your instructional practice.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleAddGoal}>
              <div className="space-y-1.5">
                <Label htmlFor="goal-title">Goal Title</Label>
                <Input
                  id="goal-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Integrate live code demos in data structures"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="goal-criterion">Focus Area</Label>
                  <Select value={criterion} onValueChange={setCriterion}>
                    <SelectTrigger id="goal-criterion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CRITERIA_METADATA) as CriteriaKey[]).map((k) => (
                        <SelectItem key={k} value={CRITERIA_METADATA[k].label}>
                          {CRITERIA_METADATA[k].label}
                        </SelectItem>
                      ))}
                      <SelectItem value="General Pedagogy">General Pedagogy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="goal-date">Target Date</Label>
                  <Input
                    id="goal-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goal-actions">Action Steps</Label>
                <Textarea
                  id="goal-actions"
                  value={actionSteps}
                  onChange={(e) => setActionSteps(e.target.value)}
                  placeholder="List 2-3 specific actions you will take..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goal-notes">Personal Notes (optional)</Label>
                <Textarea
                  id="goal-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context or resources needed..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={busy}>
                  {busy ? "Saving…" : "Save Goal"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   6. Rating History Tab
   ──────────────────────────────────────────────────────────────────────────── */

function FacultyHistoryTab({ data }: { data: FacultyDashboardData }) {
  const { history, hasEvaluations } = data;

  if (!hasEvaluations || history.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center shadow-sm">
        <History className="mx-auto size-12 text-muted-foreground/30" />
        <h2 className="mt-4 font-display text-2xl text-foreground">No historical evaluations recorded</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Historical ratings will accumulate automatically across subsequent evaluation periods.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Longitudinal Trends</p>
        <h1 className="mt-1 font-display text-3xl text-foreground">Rating History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historical finalized ratings across verified evaluation periods.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="font-display text-xl text-foreground">Performance Over Evaluation Periods</h2>
        <p className="mt-1 text-xs text-muted-foreground">Verified academic evaluation sessions</p>

        <div className="mt-6 space-y-4">
          {history.map((item, idx) => {
            const pct = (item.rating / 5) * 100;
            return (
              <div key={idx} className="rounded-md border border-border bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground text-base">{item.period}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.responses} student evaluations finalized
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-2xl font-bold text-foreground">
                      {item.rating.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground"> / 5.0</span>
                  </div>
                </div>

                <div className="mt-3">
                  <Progress value={pct} className="h-2.5 bg-muted" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
          <p>
            ℹ️ In accordance with data integrity guidelines, only actual verified database records are shown.
            Historical trends reflect completed evaluation cycles.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   7. My Profile Tab
   ──────────────────────────────────────────────────────────────────────────── */

function FacultyProfileTab({ data }: { data: FacultyDashboardData }) {
  const { profile, overallRating, hasEvaluations } = data;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Account & Identity</p>
        <h1 className="mt-1 font-display text-3xl text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Faculty portfolio and verified institutional records at APSIT.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="grid size-16 place-items-center rounded-full bg-violet text-white font-display text-xl font-bold">
            {profile.initials}
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground">{profile.facultyName}</h2>
            <p className="text-sm text-muted-foreground">{profile.department}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                {profile.facultyId}
              </span>
              <span className="text-xs text-success font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Active Faculty
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">Institution</span>
              <p className="font-semibold text-foreground">A.P. Shah Institute of Technology</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Department</span>
              <p className="font-semibold text-foreground">{profile.department}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Official Email</span>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" /> {profile.email}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">Faculty ID</span>
              <p className="font-semibold text-foreground">{profile.facultyId}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Evaluation Status</span>
              <p className="font-semibold text-foreground">
                {hasEvaluations ? `${overallRating.toFixed(2)} / 5.0 (Active)` : "Awaiting evaluations"}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Role</span>
              <p className="font-semibold text-foreground">Faculty Member / Instructor</p>
            </div>
          </div>
        </div>

        {/* Teaching Portfolio */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-semibold text-foreground text-sm">Assigned Teaching Portfolio</h3>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {profile.assignedClasses.map((cls, idx) => (
              <div key={idx} className="rounded-md border border-border bg-secondary p-3 text-xs">
                <p className="font-bold text-foreground text-sm">{cls.subject}</p>
                <p className="text-muted-foreground mt-0.5">
                  {cls.department} · {cls.semester} · {cls.division}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
