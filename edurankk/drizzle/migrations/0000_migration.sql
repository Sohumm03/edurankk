CREATE TABLE public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_name text NOT NULL,
  subject text NOT NULL,
  department text NOT NULL,
  semester text NOT NULL,
  division text NOT NULL,
  teaching smallint NOT NULL CHECK (teaching BETWEEN 1 AND 5),
  knowledge smallint NOT NULL CHECK (knowledge BETWEEN 1 AND 5),
  punctuality smallint NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
  interaction smallint NOT NULL CHECK (interaction BETWEEN 1 AND 5),
  guidance smallint NOT NULL CHECK (guidance BETWEEN 1 AND 5),
  fairness smallint NOT NULL CHECK (fairness BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '' CHECK (char_length(comment) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.evaluations TO service_role;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;