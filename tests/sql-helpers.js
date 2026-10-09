/* Plaaslike Postgres (PGlite, WASM) met die ECHTE skema + migrasies. Raak nooit die lewendige databasis nie.
   Gedeel deur tests/sql-migration.test.js en die Playwright-bediener-nabootsing. */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

/* PGlite het nie pgcrypto nie; die ingest-/oorsig-funksies gebruik dit nie. Stompe net vir Pa se wagwoord/token-funksies. */
const PRELUDE = `
create role anon nologin; create role authenticated nologin;
create schema extensions;
create function extensions.digest(t text, alg text) returns bytea language sql as $$ select decode(md5(t), 'hex') $$;
create function extensions.gen_random_bytes(n int) returns bytea language sql as $$ select decode(md5(random()::text), 'hex') $$;
create function extensions.gen_salt(t text, n int default 0) returns text language sql as $$ select 'salt' $$;
create function extensions.crypt(p text, s text) returns text language sql as $$ select md5(p) $$;
`;

function baseSql() {
  return fs
    .readFileSync(path.join(root, "supabase/wallie911_live.sql"), "utf8")
    .replace(/create extension if not exists pgcrypto[^;]*;/i, "");
}

function migrationFiles() {
  return fs
    .readdirSync(path.join(root, "migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function newDb({ migrations = true } = {}) {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  await db.exec(PRELUDE);
  await db.exec(baseSql());
  if (migrations) {
    for (const f of migrationFiles()) await db.exec(fs.readFileSync(path.join(root, "migrations", f), "utf8"));
  }
  return db;
}

/* Pa-token wat pa_ok() aanvaar (die stomp-digest is md5) */
async function addPaToken(db, token = "tok_test") {
  await db.query(
    "insert into wallie911.pa_tokens (token_hash, expires_at) values (encode(extensions.digest($1, 'sha256'), 'hex'), now() + interval '1 day') on conflict do nothing",
    [token]
  );
}

module.exports = { newDb, addPaToken, baseSql, migrationFiles, PRELUDE, root };
