import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  Facebook,
  GraduationCap,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Twitter,
  Users,
  Youtube,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — EduRank" },
      {
        name: "description",
        content:
          "Learn about A.P. Shah Institute of Technology and the EduRank faculty evaluation system.",
      },
      { property: "og:title", content: "About Us — EduRank" },
      {
        property: "og:description",
        content:
          "About A.P. Shah Institute of Technology and the EduRank evaluation portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const collegeHighlights = [
    {
      icon: GraduationCap,
      title: "Established Excellence",
      text: "Founded under the Parshvanath Charitable Trust, APSIT has been nurturing engineers and technologists with a commitment to academic excellence and holistic development.",
    },
    {
      icon: Users,
      title: "Vibrant Community",
      text: "A diverse campus of students and faculty across multiple engineering disciplines, united by a shared passion for learning and innovation.",
    },
    {
      icon: Building2,
      title: "Modern Infrastructure",
      text: "State-of-the-art laboratories, well-stocked libraries, and modern classrooms designed to foster an optimal learning environment.",
    },
    {
      icon: Target,
      title: "Industry-Ready",
      text: "Strong industry tie-ups, internship programs, and placement cells ensure students are well-prepared for professional careers.",
    },
  ];

  const portalFeatures = [
    {
      icon: Star,
      title: "Multi-Criteria Evaluation",
      text: "Students rate faculty across six carefully chosen criteria — teaching quality, subject knowledge, punctuality, student interaction, guidance, and fairness.",
    },
    {
      icon: ShieldCheck,
      title: "Anonymous & Secure",
      text: "Responses are fully anonymized. Faculty only see aggregated averages, never individual ratings, ensuring honest and unbiased feedback.",
    },
    {
      icon: Award,
      title: "Recognition & Alerts",
      text: "Faculty scoring 4.5+ receive appreciation letters, while those below 2.5 receive constructive warning letters — driving continuous improvement.",
    },
    {
      icon: BookOpen,
      title: "Data-Driven Insights",
      text: "The HOD dashboard provides comprehensive analytics with department-wise breakdowns, enabling informed academic decisions.",
    },
  ];

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
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="academic-grid bg-hero text-hero-foreground">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 sm:pb-24">
          <nav className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3 text-hero-foreground">
              <img
                src="/college-logo.png"
                alt="A.P. Shah Institute of Technology"
                className="size-10 rounded-md object-contain"
              />
              <span>
                <span className="block text-lg font-bold leading-none">EduRank</span>
                <span className="mt-1 block text-[10px] font-medium text-hero-foreground/65">
                  Evaluate. Analyze. Rank.
                </span>
              </span>
            </Link>
            <Button asChild variant="ghost" className="text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">
              <Link to="/">
                <ArrowLeft /> Back to Home
              </Link>
            </Button>
          </nav>
          <div className="max-w-3xl pb-4 pt-20 sm:pt-28">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">About Us</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.05] sm:text-7xl">
              A.P. Shah Institute of Technology
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-hero-foreground/70">
              Affiliated to the University of Mumbai and approved by AICTE, APSIT is committed to creating
              future-ready engineers through a blend of academic rigor, practical learning, and ethical values.
            </p>
          </div>
        </div>
      </section>

      {/* College Section */}
      <section className="mx-auto -mt-1 max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Our College</p>
            <h2 className="mt-2 font-display text-3xl text-foreground">Where education meets excellence</h2>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="size-4 text-gold" /> Parshvanath Charitable Trust
          </div>
        </div>

        <div className="mb-10 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <img
              src="/college-logo.png"
              alt="APSIT Logo"
              className="size-20 shrink-0 rounded-lg object-contain"
            />
            <div>
              <p className="text-sm leading-7 text-muted-foreground">
                A.P. Shah Institute of Technology, located in Thane (West), Maharashtra, is one of the premier
                engineering institutions in the Mumbai Metropolitan Region. Established under the Parshvanath
                Charitable Trust, the institute offers undergraduate and postgraduate programs across multiple
                engineering disciplines including Computer Science, Information Technology, Electronics, and
                Mechanical Engineering.
              </p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                With a focus on innovation, research, and industry collaboration, APSIT prepares students not just
                for jobs, but for impactful careers. The college boasts a strong faculty, modern labs, an active
                student council, and a culture that encourages entrepreneurship and creative thinking.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {collegeHighlights.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <span className="grid size-10 place-items-center rounded-md bg-secondary text-violet">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* EduRank Portal Section */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">The Portal</p>
              <h2 className="mt-2 font-display text-3xl text-foreground">About EduRank</h2>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="size-4 text-gold" /> Faculty evaluation made meaningful
            </div>
          </div>

          <div className="mb-10 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
            <p className="text-sm leading-7 text-muted-foreground">
              <strong className="text-foreground">EduRank</strong> is a purpose-built faculty evaluation portal
              developed for A.P. Shah Institute of Technology. It enables students to provide anonymous,
              structured feedback on their faculty members across six key criteria. The platform is designed to
              promote transparency, recognize teaching excellence, and provide actionable insights to college
              leadership.
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Unlike traditional paper-based surveys, EduRank ensures complete anonymity for students while
              providing the Head of Department (HOD) with a secure, real-time dashboard to view aggregated results, identify
              top-performing faculty, and address areas that need attention — all backed by data rather than
              perception.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {portalFeatures.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <span className="grid size-10 place-items-center rounded-md bg-secondary text-gold">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-lg text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col justify-between gap-4 border-t border-border pt-7 text-sm text-muted-foreground sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <BookOpen className="size-5 text-violet" />
              <span>Ready to share your feedback?</span>
            </div>
            <Button asChild variant="default" className="bg-violet text-violet-foreground hover:bg-violet/90">
              <Link to="/">
                Start Evaluation <Star className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
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
    </main>
  );
}
