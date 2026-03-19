"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDB = initDB;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const sqlite_1 = require("sqlite");
const sqlite3_1 = __importDefault(require("sqlite3"));
let dbPromise = null;
function resolveDatabasePath() {
    const serverDatabasePath = (0, node_path_1.resolve)(process.cwd(), "server", "database.db");
    if ((0, node_fs_1.existsSync)(serverDatabasePath)) {
        return serverDatabasePath;
    }
    return (0, node_path_1.resolve)(process.cwd(), "database.db");
}
async function prepareDatabase(db) {
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
    const userColumns = await db.all("PRAGMA table_info(users)");
    const userColumnNames = new Set(userColumns.map((column) => column.name));
    const progressColumns = await db.all("PRAGMA table_info(progress)");
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
    const vocabCount = await db.get("SELECT COUNT(*) AS count FROM vocabulary");
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
async function initDB() {
    if (!dbPromise) {
        dbPromise = (0, sqlite_1.open)({
            filename: resolveDatabasePath(),
            driver: sqlite3_1.default.Database
        })
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
