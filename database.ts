import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

type SQLiteValue = null | number | bigint | string | Uint8Array;
type AppDatabase = {
  exec(sql: string): Promise<void>;
  all<T>(sql: string, params?: SQLiteValue[]): Promise<T>;
  get<T>(sql: string, params?: SQLiteValue[]): Promise<T | undefined>;
  run(sql: string, params?: SQLiteValue[]): Promise<{ changes: number; lastID: number }>;
};
type TableInfoRow = { name: string };

let dbPromise: Promise<AppDatabase> | null = null;

function resolveDatabasePath() {
  const serverDatabasePath = resolve(process.cwd(), "server", "database.db");

  if (existsSync(serverDatabasePath)) {
    return serverDatabasePath;
  }

  return resolve(process.cwd(), "database.db");
}

function createDatabase() {
  const database = new DatabaseSync(resolveDatabasePath(), {
    enableForeignKeyConstraints: true,
    timeout: 5000
  });

  return {
    async exec(sql: string) {
      database.exec(sql);
    },
    async all<T>(sql: string, params: SQLiteValue[] = []) {
      return database.prepare(sql).all(...params) as T;
    },
    async get<T>(sql: string, params: SQLiteValue[] = []) {
      return database.prepare(sql).get(...params) as T | undefined;
    },
    async run(sql: string, params: SQLiteValue[] = []) {
      const result = database.prepare(sql).run(...params);

      return {
        changes: Number(result.changes),
        lastID: Number(result.lastInsertRowid)
      };
    }
  } satisfies AppDatabase;
}

async function prepareDatabase(db: AppDatabase) {
  await db.exec(`
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
  `);

  const userColumns = await db.all<TableInfoRow[]>("PRAGMA table_info(users)");
  const userColumnNames = new Set(userColumns.map((column) => column.name));
  const progressColumns = await db.all<TableInfoRow[]>("PRAGMA table_info(progress)");
  const progressColumnNames = new Set(progressColumns.map((column) => column.name));

  if (!userColumnNames.has("email")) {
    await db.exec("ALTER TABLE users ADD COLUMN email TEXT");
  }

  if (!userColumnNames.has("password")) {
    await db.exec("ALTER TABLE users ADD COLUMN password TEXT");
  }

  if (!userColumnNames.has("created_at")) {
    await db.exec("ALTER TABLE users ADD COLUMN created_at TEXT");
  }

  if (!userColumnNames.has("level")) {
    await db.exec("ALTER TABLE users ADD COLUMN level TEXT");
  }

  if (!userColumnNames.has("streak")) {
    await db.exec("ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0");
  }

  if (!progressColumnNames.has("completed_at")) {
    await db.exec("ALTER TABLE progress ADD COLUMN completed_at TEXT");
  }

  await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  await db.exec("CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON progress(user_id, lesson)");
  await db.exec("CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date)");
  await db.exec("CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_user_word ON vocabulary_progress(user_id, word_id)");

  const vocabCount = await db.get<{ count: number }>("SELECT COUNT(*) AS count FROM vocabulary");

  if ((vocabCount?.count ?? 0) === 0) {
    await db.run("INSERT INTO vocabulary (word, meaning, example) VALUES (?, ?, ?)", [
      "Opportunity",
      "\u0905\u0935\u0938\u0930",
      "This is a great opportunity."
    ]);
    await db.run("INSERT INTO vocabulary (word, meaning, example) VALUES (?, ?, ?)", [
      "Improve",
      "\u0938\u0941\u0927\u093e\u0930\u0928\u093e",
      "I want to improve my English."
    ]);
  }
}

export async function initDB() {
  if (!dbPromise) {
    dbPromise = Promise.resolve()
      .then(() => createDatabase())
      .then(async (db) => {
        await prepareDatabase(db);
        return db;
      })
      .catch((error) => {
        dbPromise = null;
        throw error;
      });
  }

  return dbPromise;
}
