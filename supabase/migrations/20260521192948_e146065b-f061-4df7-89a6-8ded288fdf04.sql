
CREATE TABLE public.panaderias_rows (
  id BIGSERIAL PRIMARY KEY,
  batch_id UUID NOT NULL,
  nombre TEXT,
  foto_url TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_panaderias_batch ON public.panaderias_rows(batch_id);
CREATE INDEX idx_panaderias_created ON public.panaderias_rows(created_at);

ALTER TABLE public.panaderias_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read panaderias" ON public.panaderias_rows FOR SELECT USING (true);

CREATE TABLE public.released_files (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.released_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read released" ON public.released_files FOR SELECT USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('released', 'released', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read released bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'released');
