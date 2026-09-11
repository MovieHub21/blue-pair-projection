
CREATE TABLE public.amenities (
  key text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  eyebrow text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  hero_image text NOT NULL DEFAULT '',
  gallery text[] NOT NULL DEFAULT '{}',
  hours text NOT NULL DEFAULT '',
  facilities text[] NOT NULL DEFAULT '{}',
  pricing_note text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT 'Reserve now',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.amenities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amenities TO authenticated;
GRANT ALL ON public.amenities TO service_role;

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read amenities" ON public.amenities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff manage amenities" ON public.amenities FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER amenities_touch_updated_at BEFORE UPDATE ON public.amenities
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "staff read site images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'site-images' AND public.is_staff(auth.uid()));
CREATE POLICY "staff upload site images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.is_staff(auth.uid()));
CREATE POLICY "staff update site images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-images' AND public.is_staff(auth.uid()));
CREATE POLICY "staff delete site images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-images' AND public.is_staff(auth.uid()));
