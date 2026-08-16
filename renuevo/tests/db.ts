import pg from "pg";

export const BASE_DATABASE_URL = "postgres://renuevo:renuevo@localhost:5432";
export const TEST_DB_NAME = "renuevo_test";
export const TEST_DATABASE_URL = `${BASE_DATABASE_URL}/${TEST_DB_NAME}`;

export async function resetDb(): Promise<void> {
  const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  await client.query(
    `TRUNCATE "Subscription", "bank_connection", "bank_transaction", "suggested_subscription" CASCADE`
  );
  await client.end();
}