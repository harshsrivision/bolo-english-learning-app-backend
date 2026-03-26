"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostgresPool = getPostgresPool;
exports.initDB = initDB;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_sqlite_1 = require("node:sqlite");
const pg_1 = require("pg");
const data_1 = require("./data");
const curriculum_data_1 = require("./generated/curriculum-data");
let dbPromise = null;
let postgresPool = null;
function resolveDatabasePath() {
    const serverDatabasePath = (0, node_path_1.resolve)(process.cwd(), "server", "database.db");
    if ((0, node_fs_1.existsSync)(serverDatabasePath)) {
        return serverDatabasePath;
    }
    return (0, node_path_1.resolve)(process.cwd(), "database.db");
}
function normalizeSqliteSql(sql) {
    return sql.replace(/\$\d+/g, "?").replace(/\bGREATEST\s*\(/gi, "MAX(");
}
function createSqliteAdapter(db) {
    return {
        dialect: "sqlite",
        async query(sql, params = []) {
            const normalizedSql = normalizeSqliteSql(sql).trim();
            const sqliteParams = params.map((param) => {
                if (typeof param === "boolean") {
                    return Number(param);
                }
                if (param && typeof param === "object" && !(param instanceof Uint8Array)) {
                    return JSON.stringify(param);
                }
                return param;
            });
            if (/\bRETURNING\s+id\s*$/i.test(normalizedSql)) {
                const statement = db.prepare(normalizedSql.replace(/\s+RETURNING\s+id\s*$/i, ""));
                const result = statement.run(...sqliteParams);
                return {
                    rows: [{ id: Number(result.lastInsertRowid) }],
                    rowCount: Number(result.changes)
                };
            }
            const statement = db.prepare(normalizedSql);
            if (/^SELECT\b/i.test(normalizedSql)) {
                const rows = statement.all(...sqliteParams);
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
async function preparePostgresDatabase(db) {
    await db.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, created_at TEXT, level TEXT, streak INTEGER DEFAULT 0)`);
    await db.query(`CREATE TABLE IF NOT EXISTS progress (id SERIAL PRIMARY KEY, user_id INTEGER, lesson TEXT, score INTEGER, completed_at TEXT)`);
    await db.query(`CREATE TABLE IF NOT EXISTS daily_progress (id SERIAL PRIMARY KEY, user_id INTEGER, date TEXT, sentences_spoken INTEGER, words_learned INTEGER, lessons_completed INTEGER)`);
    await db.query(`CREATE TABLE IF NOT EXISTS vocabulary (id SERIAL PRIMARY KEY, word TEXT, meaning TEXT, example TEXT)`);
    await db.query(`CREATE TABLE IF NOT EXISTS vocabulary_progress (id SERIAL PRIMARY KEY, user_id INTEGER, word_id INTEGER, last_seen TEXT, correct_count INTEGER DEFAULT 0)`);
    await db.query(`CREATE TABLE IF NOT EXISTS user_lessons (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, lesson_id INTEGER NOT NULL, is_unlocked BOOLEAN NOT NULL DEFAULT FALSE)`);
    await db.query(`CREATE TABLE IF NOT EXISTS chapters (id TEXT PRIMARY KEY, lesson_id INTEGER, title TEXT, hindi_title TEXT, type TEXT, content JSONB, sort_order INTEGER)`);
    await db.query(`CREATE TABLE IF NOT EXISTS chapter_progress (id SERIAL PRIMARY KEY, user_id INTEGER, lesson_id INTEGER, chapter_id TEXT, completed_at TEXT, score INTEGER DEFAULT 0, UNIQUE(user_id, chapter_id))`);
    await db.query(`CREATE TABLE IF NOT EXISTS lesson_unlocks (id SERIAL PRIMARY KEY, user_id INTEGER, lesson_id INTEGER, unlocked_at TEXT, UNIQUE(user_id, lesson_id))`);
    await db.query(`CREATE TABLE IF NOT EXISTS course_levels (level_id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, cefr_band TEXT NOT NULL, outcome TEXT NOT NULL, chapter_count INTEGER NOT NULL, lesson_count INTEGER NOT NULL, created_at TEXT DEFAULT NOW()::text)`);
    await db.query(`CREATE TABLE IF NOT EXISTS course_chapters (chapter_id TEXT PRIMARY KEY, level_id INTEGER NOT NULL REFERENCES course_levels(level_id) ON DELETE CASCADE, order_index INTEGER NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL, created_at TEXT DEFAULT NOW()::text, UNIQUE(level_id, order_index))`);
    await db.query(`CREATE TABLE IF NOT EXISTS course_lessons (lesson_id TEXT PRIMARY KEY, level_id INTEGER NOT NULL REFERENCES course_levels(level_id) ON DELETE CASCADE, level_title TEXT NOT NULL, cefr_band TEXT NOT NULL, chapter_id TEXT NOT NULL REFERENCES course_chapters(chapter_id) ON DELETE CASCADE, chapter_title TEXT NOT NULL, order_index INTEGER NOT NULL, global_order_index INTEGER NOT NULL UNIQUE, title TEXT NOT NULL, learning_objective TEXT NOT NULL, grammar_topic JSONB NOT NULL, content JSONB NOT NULL, vocabulary_list JSONB NOT NULL, exercises JSONB NOT NULL, quiz JSONB NOT NULL, answers JSONB NOT NULL, common_mistakes JSONB NOT NULL, confidence_tip TEXT NOT NULL, revision JSONB NOT NULL, unlock_logic JSONB NOT NULL, created_at TEXT DEFAULT NOW()::text, UNIQUE(chapter_id, order_index))`);
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
    await db.query("CREATE INDEX IF NOT EXISTS idx_chapters_lesson ON chapters(lesson_id, sort_order)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_chapter_progress_user_lesson ON chapter_progress(user_id, lesson_id)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_lesson_unlocks_user ON lesson_unlocks(user_id, lesson_id)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_course_chapters_level_order ON course_chapters(level_id, order_index)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_course_lessons_level_order ON course_lessons(level_id, global_order_index)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_course_lessons_chapter_order ON course_lessons(chapter_id, order_index)");
}
function prepareSqliteDatabase(db) {
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

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      lesson_id INTEGER,
      title TEXT,
      hindi_title TEXT,
      type TEXT,
      content TEXT,
      sort_order INTEGER
    );

    CREATE TABLE IF NOT EXISTS chapter_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      lesson_id INTEGER,
      chapter_id TEXT,
      completed_at TEXT,
      score INTEGER DEFAULT 0,
      UNIQUE(user_id, chapter_id)
    );

    CREATE TABLE IF NOT EXISTS lesson_unlocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      lesson_id INTEGER,
      unlocked_at TEXT,
      UNIQUE(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS course_levels (
      level_id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      cefr_band TEXT NOT NULL,
      outcome TEXT NOT NULL,
      chapter_count INTEGER NOT NULL,
      lesson_count INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_chapters (
      chapter_id TEXT PRIMARY KEY,
      level_id INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(level_id, order_index)
    );

    CREATE TABLE IF NOT EXISTS course_lessons (
      lesson_id TEXT PRIMARY KEY,
      level_id INTEGER NOT NULL,
      level_title TEXT NOT NULL,
      cefr_band TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      chapter_title TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      global_order_index INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      learning_objective TEXT NOT NULL,
      grammar_topic TEXT NOT NULL,
      content TEXT NOT NULL,
      vocabulary_list TEXT NOT NULL,
      exercises TEXT NOT NULL,
      quiz TEXT NOT NULL,
      answers TEXT NOT NULL,
      common_mistakes TEXT NOT NULL,
      confidence_tip TEXT NOT NULL,
      revision TEXT NOT NULL,
      unlock_logic TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(chapter_id, order_index)
    );
  `);
    const userColumns = new Set(db.prepare("PRAGMA table_info(users)").all().map((column) => column.name));
    const progressColumns = new Set(db.prepare("PRAGMA table_info(progress)").all().map((column) => column.name));
    const userLessonColumns = new Set(db.prepare("PRAGMA table_info(user_lessons)").all().map((column) => column.name));
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
    db.exec("CREATE INDEX IF NOT EXISTS idx_chapters_lesson ON chapters(lesson_id, sort_order)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_chapter_progress_user_lesson ON chapter_progress(user_id, lesson_id)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_lesson_unlocks_user ON lesson_unlocks(user_id, lesson_id)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_course_chapters_level_order ON course_chapters(level_id, order_index)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_course_lessons_level_order ON course_lessons(level_id, global_order_index)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_course_lessons_chapter_order ON course_lessons(chapter_id, order_index)");
}
function toStructuredValue(db, value) {
    return db.dialect === "postgres" ? value : JSON.stringify(value);
}
async function getRowCount(db, tableName) {
    const result = await db.query(`SELECT COUNT(*) AS count FROM ${tableName}`);
    return Number(result.rows[0]?.count ?? 0);
}
async function seedVocabulary(db) {
    const existingTerms = await db.query("SELECT id, word, meaning, example FROM vocabulary");
    const existingTermsById = new Map(existingTerms.rows.map((row) => [Number(row.id), row]));
    for (const term of data_1.vocabularyTerms) {
        const existingTerm = existingTermsById.get(term.id);
        if (!existingTerm) {
            await db.query("INSERT INTO vocabulary (id, word, meaning, example) VALUES ($1, $2, $3, $4)", [term.id, term.english, term.hindi, term.usage]);
            continue;
        }
        if (existingTerm.word !== term.english || existingTerm.meaning !== term.hindi || existingTerm.example !== term.usage) {
            await db.query("UPDATE vocabulary SET word = $1, meaning = $2, example = $3 WHERE id = $4", [term.english, term.hindi, term.usage, term.id]);
        }
    }
}
async function seedChapters(db) {
    const existingChapters = await db.query("SELECT id FROM chapters LIMIT 1");
    if (existingChapters.rows.length > 0) {
        return;
    }
    for (const lesson of data_1.lessons) {
        for (const [index, chapter] of lesson.chapters.entries()) {
            await db.query("INSERT INTO chapters (id, lesson_id, title, hindi_title, type, content, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
                chapter.id,
                lesson.id,
                chapter.title,
                chapter.hindiTitle,
                chapter.type,
                toStructuredValue(db, chapter.content),
                index + 1
            ]);
        }
    }
}
async function seedCourseCurriculum(db) {
    const expectedLevelCount = curriculum_data_1.curriculumStructure.levels.length;
    const expectedChapterCount = curriculum_data_1.curriculumStructure.levels.reduce((sum, level) => sum + level.chapters.length, 0);
    const expectedLessonCount = curriculum_data_1.completeCurriculumCourse.lessons.length;
    const [currentLevelCount, currentChapterCount, currentLessonCount] = await Promise.all([
        getRowCount(db, "course_levels"),
        getRowCount(db, "course_chapters"),
        getRowCount(db, "course_lessons")
    ]);
    if (currentLevelCount === expectedLevelCount && currentChapterCount === expectedChapterCount && currentLessonCount === expectedLessonCount) {
        return;
    }
    await db.query("DELETE FROM course_lessons");
    await db.query("DELETE FROM course_chapters");
    await db.query("DELETE FROM course_levels");
    for (const level of curriculum_data_1.curriculumStructure.levels) {
        await db.query("INSERT INTO course_levels (level_id, slug, title, cefr_band, outcome, chapter_count, lesson_count) VALUES ($1, $2, $3, $4, $5, $6, $7)", [level.level, level.slug, level.title, level.cefr_band, level.outcome, level.chapter_count, level.lesson_count]);
        for (const chapter of level.chapters) {
            await db.query("INSERT INTO course_chapters (chapter_id, level_id, order_index, title, summary) VALUES ($1, $2, $3, $4, $5)", [
                chapter.chapter_id,
                level.level,
                chapter.order_index,
                chapter.title,
                chapter.summary
            ]);
        }
    }
    for (const lesson of curriculum_data_1.completeCurriculumCourse.lessons) {
        await db.query("INSERT INTO course_lessons (lesson_id, level_id, level_title, cefr_band, chapter_id, chapter_title, order_index, global_order_index, title, learning_objective, grammar_topic, content, vocabulary_list, exercises, quiz, answers, common_mistakes, confidence_tip, revision, unlock_logic) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)", [
            lesson.lesson_id,
            lesson.level,
            lesson.level_title,
            lesson.cefr_band,
            lesson.chapter_id,
            lesson.chapter,
            lesson.order_index,
            lesson.global_order_index,
            lesson.title,
            lesson.learning_objective,
            toStructuredValue(db, lesson.grammar_topic),
            toStructuredValue(db, lesson.content),
            toStructuredValue(db, lesson.vocabulary_list),
            toStructuredValue(db, lesson.exercises),
            toStructuredValue(db, lesson.quiz),
            toStructuredValue(db, lesson.answers),
            toStructuredValue(db, lesson.common_mistakes),
            lesson.confidence_tip,
            toStructuredValue(db, lesson.revision),
            toStructuredValue(db, lesson.unlock_logic)
        ]);
    }
}
function createPostgresAdapter() {
    const pool = getPostgresPool();
    if (!pool) {
        throw new Error("DATABASE_URL is not configured.");
    }
    return {
        dialect: "postgres",
        query(sql, params = []) {
            return pool.query(sql, params);
        }
    };
}
function getPostgresPool() {
    if (!process.env.DATABASE_URL?.trim()) {
        return null;
    }
    if (!postgresPool) {
        postgresPool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL.trim(),
            ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
        });
    }
    return postgresPool;
}
async function initDB() {
    if (!dbPromise) {
        dbPromise = (async () => {
            if (process.env.DATABASE_URL?.trim()) {
                const db = createPostgresAdapter();
                await preparePostgresDatabase(db);
                await seedVocabulary(db);
                await seedChapters(db);
                await seedCourseCurriculum(db);
                return db;
            }
            const databasePath = resolveDatabasePath();
            const sqlite = new node_sqlite_1.DatabaseSync(databasePath);
            prepareSqliteDatabase(sqlite);
            const db = createSqliteAdapter(sqlite);
            await seedVocabulary(db);
            await seedChapters(db);
            await seedCourseCurriculum(db);
            return db;
        })().catch((error) => {
            dbPromise = null;
            throw error;
        });
    }
    return dbPromise;
}
