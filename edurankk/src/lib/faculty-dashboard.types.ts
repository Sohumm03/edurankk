export const CRITERIA_KEYS = [
  "teaching",
  "knowledge",
  "punctuality",
  "interaction",
  "guidance",
  "fairness",
] as const;

export type CriteriaKey = (typeof CRITERIA_KEYS)[number];

export const CRITERIA_METADATA: Record<CriteriaKey, { label: string; description: string }> = {
  teaching: { label: "Teaching Quality", description: "Clarity, pace and instructional effectiveness" },
  knowledge: { label: "Subject Knowledge", description: "Depth and command of the subject matter" },
  punctuality: { label: "Punctuality", description: "Timeliness and regular lecture attendance" },
  interaction: { label: "Student Interaction", description: "Approachability and active classroom engagement" },
  guidance: { label: "Guidance & Support", description: "Helpfulness beyond lectures and academic mentoring" },
  fairness: { label: "Fairness", description: "Impartial, unbiased and transparent evaluation" },
};

export type FacultyAssignmentRow = {
  id: string;
  faculty_name: string;
  subject: string;
  department: string;
  semester: string;
  division: string;
  initials: string;
};

export type EvaluationRow = {
  id: string;
  submission_id?: string;
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

export type FacultyProfile = {
  facultyName: string;
  facultyId: string;
  department: string;
  email: string;
  initials: string;
  assignedClasses: Array<{
    subject: string;
    department: string;
    semester: string;
    division: string;
  }>;
};

export type ClassBreakdown = {
  subject: string;
  department: string;
  semester: string;
  division: string;
  responses: number;
  overall: number;
  averages: Record<CriteriaKey, number>;
};

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

export type FacultyDashboardData = {
  profile: FacultyProfile;
  hasEvaluations: boolean;
  totalResponses: number;
  overallRating: number;
  previousRating: number | null;
  performanceTrend: "improving" | "declining" | "stable" | "new";
  criteriaAverages: Record<CriteriaKey, number>;
  classBreakdowns: ClassBreakdown[];
  anonymousComments: string[];
  appreciation: {
    isEligible: boolean;
    count: number;
    title: string;
    strengths: string[];
    date: string;
    message: string;
  };
  earlyWarning: {
    hasWarning: boolean;
    count: number;
    rating: number;
    areasNeedingImprovement: string[];
    recommendations: string[];
    status: string;
  };
  improvementPlans: ImprovementPlan[];
  history: Array<{
    period: string;
    rating: number;
    responses: number;
  }>;
};
