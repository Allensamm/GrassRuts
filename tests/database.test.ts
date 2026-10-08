import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const A = '00000000-0000-4000-8000-000000000001',
  B = '00000000-0000-4000-8000-000000000002'
test('security migration protects identities, reporting, voting and atomic updates', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
 CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
 GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
 CREATE SCHEMA storage;
 CREATE TABLE storage.buckets(id text PRIMARY KEY,file_size_limit bigint,allowed_mime_types text[]);
 CREATE TABLE storage.objects(id uuid,name text,bucket_id text);
 ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;
 GRANT USAGE ON SCHEMA storage TO anon,authenticated;
 GRANT ALL ON storage.objects TO anon,authenticated;
 CREATE POLICY "Legacy broad storage policy" ON storage.objects FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon,authenticated,service_role;
 `)
    // PostGIS is unrelated to these access controls and unavailable in the test engine.
    let baseline = await readFile(
      'supabase/migrations/001_initial_schema.sql',
      'utf8',
    )
    baseline = baseline
      .replace('CREATE EXTENSION IF NOT EXISTS postgis;', '')
      .replace('location GEOMETRY(POINT, 4326)', 'location text')
      .replace(
        'CREATE INDEX idx_issues_location ON issues USING GIST(location);',
        '',
      )
    await db.exec(baseline)
    for (const name of [
      '002_make_phone_optional',
      '003_threshold_notifications',
      '004_add_lat_lng',
      '005_government_portal',
      '005_gov_api',
      '006_hardening',
      '007_hash_api_keys',
      '008_security_hardening',
      '009_comments',
      '010_idempotency',
      '011_security_boundaries',
    ])
      await db.exec(await readFile(`supabase/migrations/${name}.sql`, 'utf8'))
    await db.exec(
      `INSERT INTO auth.users VALUES('${A}','a@example.test'),('${B}','b@example.test');INSERT INTO states(id,name,code) VALUES(1,'State A','AA'),(2,'State B','BB');INSERT INTO lgas(id,name,state_id) VALUES(1,'Area A',1),(2,'Area B',2);INSERT INTO users(id,email,full_name,lga_id)VALUES('${A}','a@example.test','Resident A',1),('${B}','b@example.test','Resident B',2);`,
    )
    await db.exec(`SET ROLE anon`)
    await assert.rejects(db.query('SELECT email FROM public.users'))
    await assert.rejects(
      db.query(`INSERT INTO public.issues(title)VALUES('Unmoderated issue')`),
    )
    await assert.rejects(
      db.query(
        `INSERT INTO storage.objects(name,bucket_id)VALUES('anonymous.jpg','evidence')`,
      ),
    )
    await db.exec(
      `RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${A}',false)`,
    )
    const profiles = await db.query('SELECT email FROM public.users')
    assert.equal(profiles.rows.length, 1)
    await assert.rejects(
      db.query(`UPDATE public.users SET is_verified=true WHERE id='${A}'`),
    )
    await assert.rejects(
      db.query(`UPDATE public.users SET lga_id=2 WHERE id='${A}'`),
    )
    await assert.rejects(
      db.query(
        `INSERT INTO public.issues(title,created_by)VALUES('Bypass moderation','${A}')`,
      ),
    )
    await assert.rejects(
      db.query(`SELECT public.submit_community_issue('${A}','{}',null)`),
    )
    await db.query(
      `INSERT INTO storage.objects(name,bucket_id)VALUES('${A}/photo.jpg','evidence')`,
    )
    await assert.rejects(
      db.query(
        `INSERT INTO storage.objects(name,bucket_id)VALUES('${B}/photo.jpg','evidence')`,
      ),
    )
    await assert.rejects(
      db.query(
        `UPDATE storage.objects SET name='${B}/photo.jpg' WHERE name='${A}/photo.jpg'`,
      ),
    )
    await db.exec('RESET ROLE; SET ROLE service_role')
    const payload = {
      title: 'Broken water pipe',
      description: 'The water pipe near the market has been leaking.',
      category_slug: 'water',
      photo_urls: [],
    }
    const created = await db.query<{ id: string }>(
      'SELECT public.submit_community_issue($1,$2,$3) AS id',
      [A, JSON.stringify(payload), 'test-key'],
    )
    const id = created.rows[0].id
    const replay = await db.query<{ id: string }>(
      'SELECT public.submit_community_issue($1,$2,$3) AS id',
      [A, JSON.stringify(payload), 'test-key'],
    )
    assert.equal(replay.rows[0].id, id)
    const count = await db.query<{ report_count: number }>(
      'SELECT report_count FROM public.issues WHERE id=$1',
      [id],
    )
    assert.equal(count.rows[0].report_count, 1)
    await assert.rejects(
      db.query('SELECT public.add_community_report($1,$2,$3)', [B, id, '{}']),
    )
    await db.exec(
      `RESET ROLE;SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${B}',false)`,
    )
    await assert.rejects(
      db.query(
        'INSERT INTO resolution_confirmations(issue_id,user_id,is_resolved)VALUES($1,$2,true)',
        [id, B],
      ),
    )
    await db.exec(`RESET ROLE; SET ROLE service_role`)
    await db.query(
      `SELECT public.record_authority_update($1,'resolved','resolved','Work completed','Test authority',null,null)`,
      [id],
    )
    const updates = await db.query(
      'SELECT * FROM issue_updates WHERE issue_id=$1',
      [id],
    )
    assert.equal(updates.rows.length, 1)
    await db.exec(
      `RESET ROLE;SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${A}',false)`,
    )
    await db.query(
      'INSERT INTO resolution_confirmations(issue_id,user_id,is_resolved)VALUES($1,$2,true)',
      [id, A],
    )
    const verified = await db.query<{ status: string }>(
      'SELECT status FROM issues WHERE id=$1',
      [id],
    )
    assert.equal(verified.rows[0].status, 'verified')
    await assert.rejects(
      db.query(
        'UPDATE resolution_confirmations SET user_id=$1 WHERE issue_id=$2',
        [B, id],
      ),
    )
    await db.query(
      'UPDATE resolution_confirmations SET is_resolved=false WHERE issue_id=$1 AND user_id=$2',
      [id, A],
    )
    const reopened = await db.query<{ status: string }>(
      'SELECT status FROM issues WHERE id=$1',
      [id],
    )
    assert.equal(reopened.rows[0].status, 'high_priority')
    await db.exec('RESET ROLE; SET ROLE service_role')
    const limiter = await db.query<{ allowed: boolean }>(
      'SELECT * FROM consume_request_limit($1,1,60000)',
      ['hashed-test'],
    )
    assert.equal(limiter.rows[0].allowed, true)
    const limited = await db.query<{ allowed: boolean }>(
      'SELECT * FROM consume_request_limit($1,1,60000)',
      ['hashed-test'],
    )
    assert.equal(limited.rows[0].allowed, false)
  } finally {
    await db.close()
  }
})
