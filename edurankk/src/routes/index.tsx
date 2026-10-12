import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Facebook,
  GraduationCap,
  Instagram,
  Linkedin,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  TriangleAlert,
  Twitter,
  User,
  Youtube,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitEvaluations } from "@/lib/evaluations.functions";
import { getFacultyForClass } from "@/lib/faculty.functions";
import { validateUsername, validatePassword, USERNAME_REGEX } from "@/lib/validation";

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

type Step = "welcome" | "login" | "setup" | "faculty" | "evaluation" | "complete";
type RatingKey = "teaching" | "knowledge" | "punctuality" | "interaction" | "guidance" | "fairness";
type Ratings = Record<RatingKey, number>;

type FacultyItem = { name: string; subject: string; initials: string };

const CRITERIA: { key: RatingKey; label: string; description: string }[] = [
  { key: "teaching", label: "Teaching quality", description: "Clarity, pace and effectiveness" },
  { key: "knowledge", label: "Subject knowledge", description: "Depth and command of the subject" },
  { key: "punctuality", label: "Punctuality", description: "Timeliness and regularity" },
  { key: "interaction", label: "Student interaction", description: "Approachability and engagement" },
  { key: "guidance", label: "Guidance & support", description: "Helpfulness beyond lectures" },
  { key: "fairness", label: "Fairness", description: "Impartial and transparent assessment" },
];

const EMPTY_RATINGS: Ratings = {
  teaching: 0,
  knowledge: 0,
  punctuality: 0,
  interaction: 0,
  guidance: 0,
  fairness: 0,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduRank — Faculty Evaluation" },
      { name: "description", content: "Anonymous student feedback for fair faculty recognition." },
      { property: "og:title", content: "EduRank — Faculty Evaluation" },
      { property: "og:description", content: "Evaluate. Analyze. Rank. Anonymous academic feedback that matters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${inverse ? "text-hero-foreground" : "text-foreground"}`}>
      <img
        src="/college-logo.png"
        alt="A.P. Shah Institute of Technology"
        className="size-10 rounded-md object-contain"
      />
      <span>
        <span className="block text-lg font-bold leading-none">EduRank</span>
        <span className={`mt-1 block text-[10px] font-medium ${inverse ? "text-hero-foreground/65" : "text-muted-foreground"}`}>
          Evaluate. Analyze. Rank.
        </span>
      </span>
    </div>
  );
}

function Index() {
  const [step, setStep] = useState<Step>("welcome");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [division, setDivision] = useState("");
  const [faculty, setFaculty] = useState<FacultyItem[]>([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultyIndex, setFacultyIndex] = useState(0);
  const [ratings, setRatings] = useState<Ratings>(EMPTY_RATINGS);
  const [comment, setComment] = useState("");
  const [submissions, setSubmissions] = useState<Record<number, { ratings: Ratings; comment: string }>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitFn = useServerFn(submitEvaluations);
  const fetchFaculty = useServerFn(getFacultyForClass);

  const completedCount = Object.keys(submissions).length;
  const currentFaculty = faculty[facultyIndex] ?? faculty[0];
  const overallProgress = useMemo(() => {
    const total = faculty.length || 1;
    const map: Record<Step, number> = { welcome: 0, login: 12, setup: 25, faculty: 38, evaluation: 38 + ((facultyIndex + 1) / total) * 52, complete: 100 };
    return map[step];
  }, [step, facultyIndex, faculty.length]);

  const showAppHeader = step !== "welcome";

  function handleUsernameChange(event: React.ChangeEvent<HTMLInputElement>) {
    const val = event.target.value;
    setUsername(val);
    if (!val) {
      if (usernameTouched) {
        setUsernameError("Moodle ID is required.");
      } else {
        setUsernameError("");
      }
    } else if (!USERNAME_REGEX.test(val)) {
      setUsernameError("Moodle ID must contain numbers only (0–9).");
    } else {
      setUsernameError("");
    }
  }

  function handleUsernameBlur() {
    setUsernameTouched(true);
    if (!username || !username.trim()) {
      setUsernameError("Moodle ID is required.");
    } else if (!USERNAME_REGEX.test(username)) {
      setUsernameError("Moodle ID must contain numbers only (0–9).");
    } else {
      setUsernameError("");
    }
  }

  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    const val = event.target.value;
    setPassword(val);
    if (passwordTouched || passwordError) {
      const res = validatePassword(val);
      setPasswordError(res.isValid ? "" : res.error);
    }
  }

  function handlePasswordBlur() {
    setPasswordTouched(true);
    const res = validatePassword(password);
    setPasswordError(res.isValid ? "" : res.error);
  }

  function handleLogin(event: FormEvent) {
    event.preventDefault();
    setUsernameTouched(true);
    setPasswordTouched(true);

    const uRes = validateUsername(username);
    const pRes = validatePassword(password);

    setUsernameError(uRes.error);
    setPasswordError(pRes.error);

    if (!uRes.isValid || !pRes.isValid) {
      return;
    }

    setError("");
    setUsernameError("");
    setPasswordError("");
    setStep("setup");
  }

  async function startEvaluation() {
    if (!department || !semester || !division) {
      setError("Select your department, semester and division.");
      return;
    }
    setError("");
    setFacultyLoading(true);
    try {
      const res = await fetchFaculty({ data: { department, semester, division } });
      if (!res.ok || res.faculty.length === 0) {
        setError(res.faculty.length === 0 ? "No faculty assigned for this class yet. Contact the HOD." : "Could not load faculty list.");
        setFacultyLoading(false);
        return;
      }
      setFaculty(res.faculty);
      setSubmissions({});
      setFacultyIndex(0);
      setStep("faculty");
    } catch {
      setError("Could not load faculty list. Please try again.");
    } finally {
      setFacultyLoading(false);
    }
  }

  function openFaculty(index: number) {
    const saved = submissions[index];
    setFacultyIndex(index);
    setRatings(saved?.ratings ?? EMPTY_RATINGS);
    setComment(saved?.comment ?? "");
    setError("");
    setStep("evaluation");
  }

  async function finalize(all: Record<number, { ratings: Ratings; comment: string }>) {
    setSubmitting(true);
    try {
      const res = await submitFn({
        data: {
          department,
          semester,
          division,
          entries: Object.entries(all).map(([i, s]) => ({
            faculty_name: faculty[Number(i)]!.name,
            subject: faculty[Number(i)]!.subject,
            ...s.ratings,
            comment: s.comment,
          })),
        },
      });
      if (!res.ok) throw new Error();
      setStep("complete");
    } catch {
      setError("Could not submit your feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function saveEvaluation() {
    const isComplete = CRITERIA.every(({ key }) => ratings[key] > 0);
    if (!isComplete) {
      setError("Please rate all six criteria before continuing.");
      return;
    }
    const nextSubmissions = { ...submissions, [facultyIndex]: { ratings, comment } };
    setSubmissions(nextSubmissions);
    setError("");
    if (Object.keys(nextSubmissions).length === faculty.length) {
      void finalize(nextSubmissions);
      return;
    }
    const nextIndex = faculty.findIndex((_, i) => !nextSubmissions[i]);
    setFacultyIndex(nextIndex);
    setRatings(EMPTY_RATINGS);
    setComment("");
  }

  function resetFlow() {
    setStep("welcome");
    setUsername("");
    setPassword("");
    setUsernameError("");
    setPasswordError("");
    setUsernameTouched(false);
    setPasswordTouched(false);
    setDepartment("");
    setSemester("");
    setDivision("");
    setFaculty([]);
    setFacultyIndex(0);
    setRatings(EMPTY_RATINGS);
    setComment("");
    setSubmissions({});
    setError("");
  }

  if (step === "welcome") {
    return <Welcome onStart={() => setStep("login")} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {showAppHeader && (
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Brand />
            <div className="hidden items-center gap-3 text-xs font-semibold text-muted-foreground sm:flex">
              <ShieldCheck className="size-4 text-success" />
              Anonymous & confidential
            </div>
          </div>
          <Progress value={overallProgress} className="h-1 rounded-none bg-muted" />
        </header>
      )}

      <main className="mx-auto flex min-h-[calc(100vh-84px)] max-w-6xl items-start justify-center px-5 py-10 sm:px-8 sm:py-16">
        {step === "login" && (
          <section className="w-full max-w-md">
            <BackButton onClick={() => setStep("welcome")} />
            <div className="soft-shadow mt-5 rounded-lg border border-border bg-card p-6 sm:p-8">
              <div className="mb-7">
                <span className="mb-5 grid size-11 place-items-center rounded-md bg-accent text-violet"><LockKeyhole className="size-5" /></span>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Student access</p>
                <h1 className="mt-2 font-display text-3xl text-foreground">Welcome back</h1>
                <p className="mt-2 text-sm text-muted-foreground">Sign in to begin your anonymous evaluation.</p>
              </div>
              <form className="space-y-5" onSubmit={handleLogin} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="username">Moodle ID</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username}
                      onChange={handleUsernameChange}
                      onBlur={handleUsernameBlur}
                      placeholder="E.g. Moodle ID"
                      className={`h-11 pl-10 ${usernameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      autoComplete="username"
                      inputMode="numeric"
                      pattern="^[0-9]+$"
                      title="Moodle ID must contain numbers only (0–9)."
                      aria-invalid={Boolean(usernameError)}
                      aria-describedby={usernameError ? "username-error" : undefined}
                      required
                    />
                  </div>
                  {usernameError && (
                    <p id="username-error" role="alert" className="text-xs font-medium text-destructive">
                      {usernameError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      placeholder="Enter your password"
                      className={`h-11 pl-10 ${passwordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      autoComplete="current-password"
                      minLength={8}
                      aria-invalid={Boolean(passwordError)}
                      aria-describedby="password-requirements"
                      required
                    />
                  </div>
                  <p id="password-requirements" className="text-[11px] text-muted-foreground leading-snug">
                    At least 8 characters, one uppercase letter (A–Z), one lowercase letter (a–z), one number (0–9), and one special character (such as @, #, $, or !).
                  </p>
                  {passwordError && (
                    <p id="password-error" role="alert" className="text-xs font-medium text-destructive">
                      {passwordError}
                    </p>
                  )}
                </div>

                <ErrorMessage message={error} />
                <Button type="submit" variant="violet" size="lg" className="w-full">Login <ArrowRight /></Button>
              </form>
              <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><ShieldCheck className="size-4" /> Faculty see averages only, never your identity.</p>
            </div>
          </section>
        )}

        {step === "setup" && (
          <section className="w-full max-w-2xl">
            <BackButton onClick={() => setStep("login")} />
            <div className="mt-5 rounded-lg border border-border bg-card p-6 soft-shadow sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Academic details</p>
              <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">Set up your evaluation</h1>
              <p className="mt-2 text-sm text-muted-foreground">Choose your class details to load the correct faculty list.</p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <SelectField label="Department" value={department} onChange={setDepartment} placeholder="Select department" options={["Computer Engineering", "Information Technology", "Electronics & Telecommunication"]} />
                <SelectField label="Semester" value={semester} onChange={setSemester} placeholder="Select semester" options={["Semester I", "Semester II", "Semester III", "Semester IV", "Semester V", "Semester VI", "Semester VII", "Semester VIII"]} />
                <SelectField label="Division" value={division} onChange={setDivision} placeholder="Select division" options={["Division A", "Division B", "Division C"]} />
                <div className="rounded-md border border-border bg-secondary p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Evaluation set</p><p className="mt-2 font-semibold text-foreground">Faculty assigned by admin</p><p className="mt-1 text-xs text-muted-foreground">Loaded dynamically for your class</p></div>
              </div>
              <ErrorMessage message={error} />
              <Button variant="gold" size="lg" className="mt-8 w-full sm:w-auto" onClick={startEvaluation} disabled={facultyLoading}>{facultyLoading ? "Loading faculty…" : "View faculty"} <ArrowRight /></Button>
            </div>
          </section>
        )}

        {step === "faculty" && (
          <section className="w-full">
            <BackButton onClick={() => setStep("setup")} />
            <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Your faculty</p><h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">Choose where to begin</h1><p className="mt-2 text-sm text-muted-foreground">{department} · {semester} · {division}</p></div>
              <p className="text-sm font-semibold text-muted-foreground">{completedCount} of {faculty.length} completed</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {faculty.map((f, index) => {
                const completed = Boolean(submissions[index]);
                return (
                  <button key={f.name + f.subject} type="button" onClick={() => openFaculty(index)} className="group flex min-h-40 w-full flex-col items-start rounded-lg border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="flex w-full items-start justify-between"><span className="grid size-11 place-items-center rounded-md bg-accent font-bold text-violet">{f.initials}</span>{completed ? <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success"><CheckCircle2 className="size-3.5" /> Done</span> : <ChevronRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-violet" />}</div>
                    <h2 className="mt-5 text-base font-bold text-foreground">{f.name}</h2><p className="mt-1 text-sm font-medium text-muted-foreground">{f.subject}</p>
                  </button>
                );
              })}
            </div>
            {completedCount === faculty.length && <Button variant="gold" size="lg" className="mt-7" onClick={() => void finalize(submissions)} disabled={submitting}>Finish evaluation <ArrowRight /></Button>}
          </section>
        )}

        {step === "evaluation" && (
          <section className="w-full max-w-3xl">
            <BackButton onClick={() => setStep("faculty")} label="Faculty list" />
            <div className="mt-5 rounded-lg border border-border bg-card soft-shadow">
              <div className="border-b border-border p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-14 place-items-center rounded-md bg-accent text-lg font-bold text-violet">{currentFaculty?.initials}</span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Faculty {facultyIndex + 1} of {faculty.length}</p><h1 className="mt-1 font-display text-3xl text-foreground">{currentFaculty?.name}</h1><p className="mt-1 font-semibold text-muted-foreground">{currentFaculty?.subject}</p></div></div></div>
              <div className="space-y-7 p-6 sm:p-8">
                {CRITERIA.map((criterion) => <RatingRow key={criterion.key} criterion={criterion} value={ratings[criterion.key]} onChange={(value) => setRatings({ ...ratings, [criterion.key]: value })} />)}
                <div className="border-t border-border pt-6"><Label htmlFor="comment" className="text-base">Anonymous feedback <span className="font-normal text-muted-foreground">(optional)</span></Label><p className="mt-1 text-xs text-muted-foreground">Share a respectful suggestion or note of appreciation.</p><Textarea id="comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write your feedback here..." className="mt-3 min-h-28 resize-none" maxLength={500} /><p className="mt-2 text-right text-xs text-muted-foreground">{comment.length}/500</p></div>
                <ErrorMessage message={error} />
                <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between"><Button variant="outline" size="lg" onClick={() => setStep("faculty")}><ArrowLeft /> Save for later</Button><Button variant="gold" size="lg" onClick={saveEvaluation} disabled={submitting}>{submitting ? "Submitting…" : Object.keys(submissions).filter((k) => Number(k) !== facultyIndex).length === faculty.length - 1 ? "Submit all feedback" : "Save & next faculty"}<ArrowRight /></Button></div>
              </div>
            </div>
          </section>
        )}

        {step === "complete" && (
          <section className="w-full max-w-xl text-center">
            <div className="rounded-lg border border-border bg-card p-7 soft-shadow sm:p-12">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-success/10 text-success"><CheckCircle2 className="size-8" /></span>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-success">Evaluation complete</p>
              <h1 className="mt-2 font-display text-4xl text-foreground">Thank you!</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Your anonymous feedback for {Object.keys(submissions).length} faculty members has been securely recorded.</p>
              <div className="mt-8 grid grid-cols-2 gap-3 rounded-md bg-secondary p-4 text-left"><div><p className="text-xs text-muted-foreground">Faculty evaluated</p><p className="mt-1 text-2xl font-bold text-foreground">{Object.keys(submissions).length}</p></div><div><p className="text-xs text-muted-foreground">Identity shared</p><p className="mt-1 text-2xl font-bold text-foreground">Never</p></div></div>
              <Button variant="violet" size="lg" className="mt-8 w-full" onClick={resetFlow}>Return to home</Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  const features = [
    { icon: Star, title: "Six-criteria ratings", text: "Teaching, knowledge, punctuality, interaction, guidance and fairness." },
    { icon: ShieldCheck, title: "Private by design", text: "Faculty see their averages. Your individual response stays anonymous." },
    { icon: TriangleAlert, title: "Early warnings", text: "An alert is raised when a faculty average falls below 2.5." },
    { icon: Award, title: "Appreciation", text: "Excellent teaching is recognized when the average reaches 4.5 or more." },
  ];
  return (
    <main className="min-h-screen bg-background">
      <section className="academic-grid bg-hero text-hero-foreground">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 sm:pb-24">
          <nav className="flex items-center justify-between gap-3"><Brand inverse /><div className="flex items-center gap-2"><Button asChild variant="ghost" className="text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"><Link to="/principal"><LockKeyhole /> HOD</Link></Button><Button asChild variant="ghost" className="text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"><Link to="/faculty"><GraduationCap /> Faculty</Link></Button><Button variant="gold" onClick={onStart}>Student login</Button></div></nav>
          <div className="max-w-3xl pb-4 pt-20 sm:pt-28">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Academic feedback</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.05] sm:text-7xl">Honest feedback. Fair rankings. Recognition that matters.</h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-hero-foreground/70">A thoughtful evaluation system that helps students be heard and excellent educators be recognized.</p>
            <Button variant="gold" size="lg" className="mt-9" onClick={onStart}>Start evaluation <ArrowRight /></Button>
          </div>
        </div>
      </section>
      <section className="mx-auto -mt-1 max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Built on trust</p><h2 className="mt-2 font-display text-3xl text-foreground">Feedback with purpose</h2></div><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Sparkles className="size-4 text-gold" /> Designed for meaningful academic improvement</div></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-lg border border-border bg-card p-5 shadow-sm"><span className="grid size-10 place-items-center rounded-md bg-secondary text-gold"><Icon className="size-5" /></span><h3 className="mt-5 font-display text-lg text-foreground">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div>
        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-border pt-7 text-sm text-muted-foreground sm:flex-row sm:items-center"><div className="flex items-center gap-3"><BookOpen className="size-5 text-violet" /><span>Currently prepared for Second Year students</span></div><button type="button" onClick={onStart} className="flex items-center gap-2 font-bold text-violet hover:underline">Begin your evaluation <ArrowRight className="size-4" /></button></div>
      </section>
      <Footer />
    </main>
  );
}

function Footer() {
  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/share/1Gk5GYsbTR/", label: "Facebook" },
    { icon: Twitter, href: "https://x.com/APSIT_THANE", label: "Twitter" },
    { icon: Linkedin, href: "https://www.linkedin.com/school/apsit-thane/", label: "LinkedIn" },
    {
      icon: Instagram,
      href: "https://www.instagram.com/apsit.official?utm_source=ig_web_button_share_sheet&psln=ZDNlZDc0MzIxNw==",
      label: "Instagram",
    },
    {
      icon: Youtube,
      href: "https://youtube.com/@a.p.shahinstituteoftechnol5734?si=gyYHORcIuNTdJ5LU",
      label: "YouTube",
    },
  ];

  return (
    <footer className="bg-hero text-hero-foreground">
      <div className="mx-auto max-w-6xl px-5 pb-8 pt-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* College Info */}
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/college-logo.png"
                alt="A.P. Shah Institute of Technology"
                className="size-10 rounded-md object-contain"
              />
              <span className="text-lg font-bold">A.P. Shah Institute of Technology</span>
            </div>
            <p className="mt-4 text-sm italic leading-6 text-hero-foreground/60">
              Building future-ready professionals through excellence in education, innovation, and industry collaboration.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-hero-foreground/20 text-hero-foreground/60 transition-colors duration-200 hover:border-gold hover:text-gold"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em]">Quick Links</h3>
            <div className="mt-3 h-0.5 w-8 rounded-full bg-gold" />
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/" className="text-sm text-hero-foreground/60 transition hover:text-gold">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-hero-foreground/60 transition hover:text-gold">
                  About Us
                </Link>
              </li>
              <li>
                <a
                  href="https://www.apsit.edu.in/events"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-hero-foreground/60 transition hover:text-gold"
                >
                  Events
                </a>
              </li>
              <li>
                <Link to="/principal" className="text-sm text-hero-foreground/60 transition hover:text-gold">
                  HOD Login
                </Link>
              </li>
              <li>
                <Link to="/faculty" className="text-sm text-hero-foreground/60 transition hover:text-gold">
                  Faculty Login
                </Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-hero-foreground/60 transition hover:text-gold">
                  Student Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em]">Contact</h3>
            <div className="mt-3 h-0.5 w-8 rounded-full bg-gold" />
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-3 text-sm text-hero-foreground/60">
                <Mail className="size-4 shrink-0 text-hero-foreground/40" />
                <a href="mailto:it@apsit.edu.in" className="transition hover:text-gold">it@apsit.edu.in</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-hero-foreground/60">
                <Phone className="size-4 shrink-0 text-hero-foreground/40" />
                <a href="tel:+918779519343" className="transition hover:text-gold">+91 87795 19343</a>
              </li>
              <li className="flex items-start gap-3 text-sm text-hero-foreground/60">
                <MapPin className="mt-0.5 size-4 shrink-0 text-hero-foreground/40" />
                <span>Kasarvadavali, Ghodbunder Road, Thane (W) – 400615</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-hero-foreground/10 pt-6 text-center text-xs text-hero-foreground/40">
          © {new Date().getFullYear()} A.P. Shah Institute of Technology. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return <Button type="button" variant="ghost" onClick={onClick} className="-ml-3 text-muted-foreground"><ArrowLeft /> {label}</Button>;
}

function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return <p role="alert" className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"><TriangleAlert className="size-4 shrink-0" />{message}</p>;
}

function SelectField({ label, value, onChange, placeholder, options }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; options: string[] }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="h-11"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div>;
}

function RatingRow({ criterion, value, onChange }: { criterion: (typeof CRITERIA)[number]; value: number; onChange: (value: number) => void }) {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <legend className="sr-only">{criterion.label}</legend>
      <div><p className="font-semibold text-foreground">{criterion.label}</p><p className="mt-1 text-xs text-muted-foreground">{criterion.description}</p></div>
      <div className="flex gap-1.5" aria-label={`${criterion.label} rating`}>
        {[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" aria-label={`${score} star${score > 1 ? "s" : ""}`} aria-pressed={value === score} onClick={() => onChange(score)} className={`grid size-10 place-items-center rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${score <= value ? "border-gold bg-gold text-gold-foreground" : "border-border bg-background text-muted-foreground hover:border-gold/60 hover:text-gold"}`}><Star className={`size-4 ${score <= value ? "fill-current" : ""}`} /><span className="sr-only">{score}</span></button>)}
      </div>
    </fieldset>
  );
}
