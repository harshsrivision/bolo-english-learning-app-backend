import { Pool, QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;

export const db = connectionString ? new Pool({ connectionString }) : null;

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  if (!db) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return db.query<T>(text, params);
}
