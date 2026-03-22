import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { vocabularyTerms } from "./data";

type AppQueryResult<T extends QueryResultRow = QueryResultRow> = Pick<QueryResult<T>, "rows" | "rowCount">;

export type AppDatabase = {
  dialect: "postgres" | "sqlite";
  query<T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]): Promise<AppQueryResult<T>>;
};

type SqliteColumnRow = {
  name: string;
};

let dbPromise: Promise<AppDatabase> | null = null;

function resolveDatabasePath() {
  const serverDatabasePath = resolve(process.cwd(), "server", "database.db");

  if (existsSync(serverDatabasePath)) {
    return serverDatabasePath;
  }

  return resolve(process.cwd(), "database.db");
}

function normalizeSqliteSql(sql: string) {
  return sql.replace(/\$\d+/g, "?").replace(/\bGREATEST\s*\(/gi, "MAX(");
}

function createSqliteAdapter(db: DatabaseSync): AppDatabase {
  return {
    dialect: "sqlite",
    async query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
      const normalizedSql = normalizeSqliteSql(sql).trim();
      const sqliteParams = params.map((param) => (typeof param === "boolean" ? Number(param) : param)) as (string | number | bigint | Uint8Array | null)[];

      if (/\bRETURNING\s+id\s*$/i.test(normalizedSql)) {
        const statement = db.prepare(normalizedSql.replace(/\s+RETURNING\s+id\s*$/i, ""));
        const result = statement.run(...sqliteParams);

        return {
          rows: [{ id: Number(result.lastInsertRowid) }] as unknown as T[],
          rowCount: Number(result.changes)
        };
      }

      const statement = db.prepare(normalizedSql);

      if (/^SELECT\b/i.test(normalizedSql)) {
        const rows = statement.all(...sqliteParams) as T[];
        return {
          rows,
          rowCount: rows.length
        };
      }

      const result = statement.run(...sqliteParams);
      return {
        rows: [],
        rowCount: Number(result.changes)
      };
    }
  };
}

async function preparePostgresDatabase(db: AppDatabase) {
  await db.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, created_at TEXT, level TEXT, streak INTEGER DEFAULT 0)`);
  await db.query(`CREATE TABLE IF NOT EXISTS progress (id SERIAL PRIMARY KEY, user_id INTEGER, lesson TEXT, score INTEGER, completed_at TEXT)`);
  await db.query(`CREATE TABLE IF NOT EXISTS daily_progress (id SERIAL PRIMARY KEY, user_id INTEGER, date TEXT, sentences_spoken INTEGER, words_learned INTEGER, lessons_completed INTEGER)`);
  await db.query(`CREATE TABLE IF NOT EXISTS vocabulary (id SERIAL PRIMARY KEY, word TEXT, meaning TEXT, example TEXT)`);
  await db.query(`CREATE TABLE IF NOT EXISTS vocabulary_progress (id SERIAL PRIMARY KEY, user_id INTEGER, word_id INTEGER, last_seen TEXT, correct_count INTEGER DEFAULT 0)`);
  await db.query(`CREATE TABLE IF NOT EXISTS user_lessons (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, lesson_id INTEGER NOT NULL, is_unlocked BOOLEAN NOT NULL DEFAULT FALSE)`);

  await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT");
  await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT");
  await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TEXT");
  await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS level TEXT");
  await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0");
  await db.query("ALTER TABLE progress ADD COLUMN IF NOT EXISTS completed_at TEXT");
  await db.query("ALTER TABLE user_lessons ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT FALSE");

  await db.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  await db.query("CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON progress(user_id, lesson)");
  await db.query("CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date)");
  await db.query("CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_user_word ON vocabulary_progress(user_id, word_id)");
  await db.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_user_lessons_user_lesson ON user_lessons(user_id, lesson_id)");
  await db.query("CREATE INDEX IF NOT EXISTS idx_user_lessons_user_unlock ON user_lessons(user_id, is_unlocked)");
}

function prepareSqliteDatabase(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      created_at TEXT,
      level TEXT,
      streak INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      lesson TEXT,
      score INTEGER,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date TEXT,
      sentences_spoken INTEGER,
      words_learned INTEGER,
      lessons_completed INTEGER
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT,
      meaning TEXT,
      example TEXT
    );

    CREATE TABLE IF NOT EXISTS vocabulary_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      word_id INTEGER,
      last_seen TEXT,
      correct_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      is_unlocked INTEGER NOT NULL DEFAULT 0
    );
  `);

  const userColumns = new Set((db.prepare("PRAGMA table_info(users)").all() as SqliteColumnRow[]).map((column) => column.name));
  const progressColumns = new Set((db.prepare("PRAGMA table_info(progress)").all() as SqliteColumnRow[]).map((column) => column.name));
  const userLessonColumns = new Set((db.prepare("PRAGMA table_info(user_lessons)").all() as SqliteColumnRow[]).map((column) => column.name));

  if (!userColumns.has("email")) {
    db.exec("ALTER TABLE users ADD COLUMN email TEXT");
  }

  if (!userColumns.has("password")) {
    db.exec("ALTER TABLE users ADD COLUMN password TEXT");
  }

  if (!userColumns.has("created_at")) {
    db.exec("ALTER TABLE users ADD COLUMN created_at TEXT");
  }

  if (!userColumns.has("level")) {
    db.exec("ALTER TABLE users ADD COLUMN level TEXT");
  }

  if (!userColumns.has("streak")) {
    db.exec("ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0");
  }

  if (!progressColumns.has("completed_at")) {
    db.exec("ALTER TABLE progress ADD COLUMN completed_at TEXT");
  }

  if (!userLessonColumns.has("is_unlocked")) {
    db.exec("ALTER TABLE user_lessons ADD COLUMN is_unlocked INTEGER NOT NULL DEFAULT 0");
  }

  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON progress(user_id, lesson)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_user_word ON vocabulary_progress(user_id, word_id)");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_user_lessons_user_lesson ON user_lessons(user_id, lesson_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_user_lessons_user_unlock ON user_lessons(user_id, is_unlocked)");
}

async function seedVocabulary(db: AppDatabase) {
  const existingTerms = await db.query<{
    id: number;
    word: string;
    meaning: string | null;
    example: string | null;
  }>("SELECT id, word, meaning, example FROM vocabulary");

  const existingTermsByWord = new Map(
    existingTerms.rows
      .filter((row) => typeof row.word === "string" && row.word.trim().length > 0)
      .map((row) => [row.word.trim().toLowerCase(), row])
  );

  for (const term of vocabularyTerms) {
    const wordKey = term.english.trim().toLowerCase();
    const existingTerm = existingTermsByWord.get(wordKey);

    if (!existingTerm) {
      await db.query("INSERT INTO vocabulary (word, meaning, example) VALUES ($1, $2, $3)", [term.english, term.hindi, term.usage]);
      continue;
    }

    if (existingTerm.meaning !== term.hindi || existingTerm.example !== term.usage || existingTerm.word !== term.english) {
      await db.query("UPDATE vocabulary SET word = $1, meaning = $2, example = $3 WHERE id = $4", [term.english, term.hindi, term.usage, existingTerm.id]);
    }
  }
}

function createPostgresAdapter() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL?.trim(),
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });

  return {
    dialect: "postgres" as const,
    query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
      return pool.query<T>(sql, params);
    }
  } satisfies AppDatabase;
}

export async function initDB() {
  if (!dbPromise) {
    dbPromise = (async () => {
      if (process.env.DATABASE_URL?.trim()) {
        const db = createPostgresAdapter();
        await preparePostgresDatabase(db);
        await seedVocabulary(db);
        return db;
      }

      const databasePath = resolveDatabasePath();
      console.warn(`DATABASE_URL is not configured. Using local SQLite fallback at ${databasePath}.`);

      const sqlite = new DatabaseSync(databasePath);
      prepareSqliteDatabase(sqlite);

      const db = createSqliteAdapter(sqlite);
      await seedVocabulary(db);
      return db;
    })().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}
