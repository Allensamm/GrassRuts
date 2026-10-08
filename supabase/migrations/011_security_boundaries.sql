-- Local review only: apply to a development Supabase project before production.
-- Server submission functions require SUPABASE_SERVICE_ROLE_KEY. Never expose it publicly.
BEGIN;

-- Personal profiles are private; public issue pages do not depend on profile joins.
DROP POLICY IF EXISTS "Users are publicly readable" ON public.users;
CREATE POLICY "Users read own profile" ON public.users FOR SELECT TO authenticated USING (id = auth.uid());
REVOKE ALL ON public.users FROM anon;
REVOKE INSERT, UPDATE ON public.users FROM authenticated;
GRANT INSERT (id, email, full_name, lga_id, community, is_diaspora) ON public.users TO authenticated;
GRANT UPDATE (full_name, community, is_diaspora, updated_at) ON public.users TO authenticated;

-- Only authenticated server operations may create reports or change trusted issue fields.
DROP POLICY IF EXISTS "Authenticated users can create issues" ON public.issues;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Gov users can update issues" ON public.issues;
DROP POLICY IF EXISTS "Gov users can insert updates" ON public.issue_updates;
DROP POLICY IF EXISTS "Report owner can add evidence" ON public.evidence;
REVOKE INSERT, UPDATE, DELETE ON public.issues, public.reports, public.evidence, public.issue_updates FROM anon, authenticated;
DROP POLICY IF EXISTS "Reports are publicly readable" ON public.reports;
CREATE POLICY "Residents read own reports" ON public.reports FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Resolution confirmations readable" ON public.resolution_confirmations;
CREATE POLICY "Residents read own votes" ON public.resolution_confirmations FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can confirm resolution" ON public.resolution_confirmations;
DROP POLICY IF EXISTS "Users can update own confirmation" ON public.resolution_confirmations;
CREATE POLICY "Reporters vote on claimed resolutions" ON public.resolution_confirmations FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.reports r WHERE r.issue_id = resolution_confirmations.issue_id AND r.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.issues i WHERE i.id = resolution_confirmations.issue_id AND i.status IN ('resolved','verified'))
);
CREATE POLICY "Reporters revise own resolution vote" ON public.resolution_confirmations FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.reports r WHERE r.issue_id = resolution_confirmations.issue_id AND r.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.issues i WHERE i.id = resolution_confirmations.issue_id AND i.status IN ('resolved','verified'))
);
REVOKE UPDATE ON public.resolution_confirmations FROM authenticated;
GRANT UPDATE (is_resolved, comment) ON public.resolution_confirmations TO authenticated;
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (is_read) ON public.notifications TO authenticated;
REVOKE INSERT ON public.comments FROM anon, authenticated;

-- Public projections intentionally expose evidence and aggregate votes, never reporters' identities.
CREATE OR REPLACE VIEW public.public_issue_evidence WITH (security_barrier = true) AS
SELECT r.issue_id, e.url, e.type, e.created_at FROM public.evidence e JOIN public.reports r ON r.id = e.report_id;
CREATE OR REPLACE VIEW public.public_resolution_counts WITH (security_barrier = true) AS
SELECT issue_id, count(*) FILTER (WHERE is_resolved) AS confirmed, count(*) FILTER (WHERE NOT is_resolved) AS denied
FROM public.resolution_confirmations GROUP BY issue_id;
GRANT SELECT ON public.public_issue_evidence, public.public_resolution_counts TO anon, authenticated;

-- Actor identity is retained even for API-key updates.
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS actor_name text;
ALTER TABLE public.issue_updates ADD COLUMN IF NOT EXISTS api_key_id uuid REFERENCES public.gov_api_keys(id) ON DELETE SET NULL;
DROP INDEX IF EXISTS public.issues_idempotency_key_uidx;
CREATE UNIQUE INDEX issues_creator_idempotency_uidx ON public.issues(created_by, idempotency_key) WHERE idempotency_key IS NOT NULL;
ALTER TABLE public.issues ALTER COLUMN report_count SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_issue_report_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.issues SET report_count = (SELECT count(*) FROM public.reports WHERE issue_id = NEW.issue_id), updated_at = now() WHERE id = NEW.issue_id;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.check_resolution_confirmations() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE total_reporters integer; confirmed integer; denied integer;
BEGIN
  PERFORM 1 FROM public.issues WHERE id = NEW.issue_id AND status IN ('resolved','verified') FOR UPDATE;
  IF NOT FOUND THEN RETURN NEW; END IF;
  SELECT count(*) INTO total_reporters FROM public.reports WHERE issue_id = NEW.issue_id;
  IF total_reporters = 0 THEN RETURN NEW; END IF;
  SELECT count(*) FILTER (WHERE v.is_resolved), count(*) FILTER (WHERE NOT v.is_resolved) INTO confirmed, denied
    FROM public.resolution_confirmations v JOIN public.reports r ON r.issue_id = v.issue_id AND r.user_id = v.user_id WHERE v.issue_id = NEW.issue_id;
  IF confirmed >= ceil(total_reporters * 0.5) THEN
    UPDATE public.issues SET status='verified', verified_at=now(), updated_at=now() WHERE id=NEW.issue_id;
  ELSIF denied > total_reporters * 0.5 THEN
    UPDATE public.issues SET status='high_priority', resolved_at=NULL, verified_at=NULL, updated_at=now() WHERE id=NEW.issue_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.submit_community_issue(p_user_id uuid, p_payload jsonb, p_idempotency_key text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE resident public.users%ROWTYPE; category integer; issue_id uuid; report_id uuid;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || p_idempotency_key,0));
    SELECT id INTO issue_id FROM public.issues WHERE created_by=p_user_id AND idempotency_key=p_idempotency_key;
    IF issue_id IS NOT NULL THEN RETURN issue_id; END IF;
  END IF;
  SELECT * INTO resident FROM public.users WHERE id=p_user_id;
  IF resident.id IS NULL OR resident.lga_id IS NULL OR resident.is_diaspora THEN RAISE insufficient_privilege; END IF;
  SELECT id INTO category FROM public.categories WHERE slug=p_payload->>'category_slug';
  IF category IS NULL THEN RAISE invalid_parameter_value; END IF;
  INSERT INTO public.issues(title,description,category_id,lga_id,community,address,lat,lng,created_by,report_count,idempotency_key)
  VALUES(p_payload->>'title',p_payload->>'description',category,resident.lga_id,coalesce(nullif(p_payload->>'community',''),resident.community),nullif(p_payload->>'address',''),(p_payload->>'lat')::double precision,(p_payload->>'lng')::double precision,p_user_id,0,p_idempotency_key) RETURNING id INTO issue_id;
  INSERT INTO public.reports(issue_id,user_id,description) VALUES(issue_id,p_user_id,p_payload->>'description') RETURNING id INTO report_id;
  INSERT INTO public.evidence(report_id,url,type) SELECT report_id,value,'image' FROM jsonb_array_elements_text(coalesce(p_payload->'photo_urls','[]'::jsonb));
  RETURN issue_id;
END; $$;
REVOKE ALL ON FUNCTION public.submit_community_issue(uuid,jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_community_issue(uuid,jsonb,text) TO service_role;

CREATE OR REPLACE FUNCTION public.add_community_report(p_user_id uuid,p_issue_id uuid,p_payload jsonb) RETURNS uuid
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE resident public.users%ROWTYPE; issue public.issues%ROWTYPE; report_id uuid;
BEGIN
  SELECT * INTO resident FROM public.users WHERE id=p_user_id;
  SELECT * INTO issue FROM public.issues WHERE id=p_issue_id FOR UPDATE;
  IF resident.id IS NULL OR resident.is_diaspora OR resident.lga_id IS NULL OR issue.id IS NULL OR resident.lga_id <> issue.lga_id OR issue.status NOT IN ('pending','high_priority','in_review') THEN RAISE insufficient_privilege; END IF;
  INSERT INTO public.reports(issue_id,user_id,description) VALUES(p_issue_id,p_user_id,p_payload->>'description') RETURNING id INTO report_id;
  INSERT INTO public.evidence(report_id,url,type) SELECT report_id,value,'image' FROM jsonb_array_elements_text(coalesce(p_payload->'photo_urls','[]'::jsonb));
  RETURN report_id;
END; $$;
REVOKE ALL ON FUNCTION public.add_community_report(uuid,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_community_report(uuid,uuid,jsonb) TO service_role;

-- Persistent limits are shared by all application instances. Only hashes are stored.
CREATE TABLE public.request_limits (key_hash text PRIMARY KEY, count integer NOT NULL, reset_at timestamptz NOT NULL);
ALTER TABLE public.request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.request_limits FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.consume_request_limit(p_key text,p_limit integer,p_window_ms integer)
RETURNS TABLE(allowed boolean,remaining integer,reset_at timestamptz)
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE bucket public.request_limits%ROWTYPE;
BEGIN
  DELETE FROM public.request_limits r WHERE r.reset_at < now() - interval '1 day';
  INSERT INTO public.request_limits AS r VALUES(p_key,1,now()+p_window_ms*interval '1 millisecond')
    ON CONFLICT(key_hash) DO UPDATE SET count=CASE WHEN r.reset_at<=now() THEN 1 ELSE r.count+1 END,
    reset_at=CASE WHEN r.reset_at<=now() THEN now()+p_window_ms*interval '1 millisecond' ELSE r.reset_at END RETURNING * INTO bucket;
  RETURN QUERY SELECT bucket.count<=p_limit,greatest(0,p_limit-bucket.count),bucket.reset_at;
END; $$;
REVOKE ALL ON FUNCTION public.consume_request_limit(text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_request_limit(text,integer,integer) TO service_role;

-- These restrictive policies also constrain any pre-existing permissive upload rules.
UPDATE storage.buckets SET file_size_limit=5242880, allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'] WHERE id='evidence';
CREATE POLICY "Residents upload their own evidence" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Evidence uploads stay in owner folders" ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (bucket_id <> 'evidence' OR (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "No anonymous evidence uploads" ON storage.objects AS RESTRICTIVE FOR INSERT TO anon WITH CHECK (bucket_id <> 'evidence');
CREATE POLICY "No anonymous evidence changes" ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon
USING (bucket_id <> 'evidence') WITH CHECK (bucket_id <> 'evidence');
CREATE POLICY "No anonymous evidence deletion" ON storage.objects AS RESTRICTIVE FOR DELETE TO anon USING (bucket_id <> 'evidence');
CREATE POLICY "Evidence changes stay in owner folders" ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING (bucket_id <> 'evidence' OR (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id <> 'evidence' OR (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Evidence deletion stays in owner folders" ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
USING (bucket_id <> 'evidence' OR (storage.foldername(name))[1] = auth.uid()::text);
CREATE OR REPLACE FUNCTION public.record_authority_update(p_issue_id uuid,p_status text,p_update_type text,p_message text,p_actor text,p_api_key_id uuid,p_government_user_id uuid) RETURNS void
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  PERFORM 1 FROM public.issues WHERE id=p_issue_id FOR UPDATE;
  IF NOT FOUND THEN RAISE no_data_found; END IF;
  IF p_status IS NOT NULL THEN
    IF p_status NOT IN ('in_review','resolved') THEN RAISE invalid_parameter_value; END IF;
    UPDATE public.issues SET status=p_status,resolved_at=CASE WHEN p_status='resolved' THEN now() ELSE NULL END,verified_at=NULL,updated_at=now() WHERE id=p_issue_id;
  END IF;
  INSERT INTO public.issue_updates(issue_id,update_type,message,actor_name,api_key_id,government_user_id)
    VALUES(p_issue_id,p_update_type,p_message,p_actor,p_api_key_id,p_government_user_id);
END; $$;
REVOKE ALL ON FUNCTION public.record_authority_update(uuid,text,text,text,text,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_authority_update(uuid,text,text,text,text,uuid,uuid) TO service_role;
ALTER FUNCTION public.notify_threshold_reached() SET search_path = public, pg_temp;
COMMIT;
