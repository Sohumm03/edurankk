-- Faculty assignment table: stores which faculty teaches which subject for each dept/sem/div
CREATE TABLE public.faculty_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_name text NOT NULL,
  subject text NOT NULL,
  department text NOT NULL,
  semester text NOT NULL,
  division text NOT NULL,
  initials text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (faculty_name, subject, department, semester, division)
);
GRANT ALL ON public.faculty_assignments TO service_role;
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;
