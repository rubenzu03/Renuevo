import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { BASE_DATABASE_URL, TEST_DB_NAME, TEST_DATABASE_URL } from "./db";

function projectRoot(): string {
  return fileURLToPath(new URL("..", import.meta.url));
}

export default async function globalSetup(): Promise<void> {
  const admin = new pg.Client({ connectionString: `${BASE_DATABASE_URL}/postgres` });
  await admin.connect();
  const res = await admin.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM pg_database WHERE datname = $1`,
    [TEST_DB_NAME]
  );
  if (res.rows[0]?.count === "0") {
    await admin.query(`CREATE DATABASE "${TEST_DB_NAME}" TEMPLATE template0`);
  }
  await admin.end();

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execSync(`${npm} exec -- prisma migrate deploy`, {
    cwd: projectRoot(),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}