import { Pool } from "pg";

const eventsPool = new Pool({
  connectionString: process.env.EVENTS_DATABASE_URL,
  max: 10,
});

const mainPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

export { eventsPool, mainPool };

/**
 * Health check — verifies both pools can connect.
 * Returns { events: boolean, main: boolean }.
 */
export async function healthCheck(): Promise<{
  events: boolean;
  main: boolean;
}> {
  const [eventsOk, mainOk] = await Promise.all([
    eventsPool
      .query("SELECT 1")
      .then(() => true)
      .catch(() => false),
    mainPool
      .query("SELECT 1")
      .then(() => true)
      .catch(() => false),
  ]);
  return { events: eventsOk, main: mainOk };
}
