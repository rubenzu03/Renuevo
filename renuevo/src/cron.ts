import "dotenv/config";
import cron from "node-cron";

const schedule = process.env.CRON_SCHEDULE ?? "0 9 * * *";
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

async function trigger() {
  const res = await fetch(`${baseUrl}/api/cron/check-subscriptions`, {
    headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
  });
  if (!res.ok) {
    console.error(`[cron] ping failed: ${res.status} ${res.statusText}`);
    return;
  }
  const body = await res.json();
  console.log(`[cron] ${new Date().toISOString()}`, body);

  if (process.env.RUN_ONCE === "true") {
    trigger().finally(() => process.exit(0));
  } else {
    cron.schedule(schedule, trigger);
    console.log(
      `[cron] scheduled '${schedule}' -> ${baseUrl}/api/cron/check-subscriptions`,
    );
  }
}
