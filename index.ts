import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { analyzeSentence, correctSentence } from "./ai";
import { hashPassword, verifyPassword } from "./auth";
import { conversationReply } from "./conversation";
import { lessons, vocabularyTerms } from "./data";
import { getPostgresPool, initDB, type AppDatabase } from "./database";
import { ensureUserLessonsInitialized, saveLessonProgress } from "./lesson-progression";
import { scorePronunciation } from "./pronunciation";
import { apiRouter } from "./routes";
import { getCurriculumLevel } from "./generated/curriculum-data";

dotenv.config({ path: [resolve(process.cwd(), ".env.local"), resolve(process.cwd(), ".env")] });

if (!process.env.PORT && process.env.API_PORT) {
  process.env.PORT = process.env.API_PORT;
}

const app = express();
const PORT = Number(process.env.PORT || 4000);

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://*.vercel.app",
  "https://*.up.railway.app",
  "https://*.onrender.com"
];

function parseClientOriginPatterns() {
  const configuredOrigins = [process.env.CLIENT_ORIGINS ?? "", process.env.CLIENT_ORIGIN ?? "", process.env.FRONTEND_URL ?? "", process.env.NEXT_PUBLIC_APP_URL ?? ""]
    .flatMap((value) => value.split(","))
    .map((value) => trimTrailingSlash(value.trim()))
    .filter(Boolean);

  return Array.from(new Set([...defaultAllowedOrigins, ...configuredOrigins]));
}

function matchesOriginPattern(origin: string, pattern: string) {
  if (origin === pattern) {
    return true;
  }

  if (!pattern.includes("://*.")) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const patternUrl = new URL(pattern.replace("://*.", "://placeholder."));
    const suffix = patternUrl.hostname.replace(/^placeholder\./, "");

    return originUrl.protocol === patternUrl.protocol && (originUrl.hostname === suffix || originUrl.hostname.endsWith("." + suffix));
  } catch {
    return false;
  }
}

function isLocalDevelopmentOrigin(origin: string) {
  try {
    const originUrl = new URL(origin);

    return (
      (originUrl.protocol === "http:" || originUrl.protocol === "https:") &&
      (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1" || originUrl.hostname === "[::1]")
    );
  } catch {
    return false;
  }
}

const allowedOriginPatterns = parseClientOriginPatterns();
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || !allowedOriginPatterns.length) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = trimTrailingSlash(origin);
    const isAllowed =
      isLocalDevelopmentOrigin(normalizedOrigin) || allowedOriginPatterns.some((pattern) => matchesOriginPattern(normalizedOrigin, pattern));

    callback(null, isAllowed);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "bolo-english-api" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bolo-english-api" });
});

type DailyProgressCounts = {
  sentences: number;
  words: number;
  lessons: number;
};

type DailyProgressRow = {
  id: number;
  user_id: number;
  date: string;
  sentences_spoken: number;
  words_learned: number;
  lessons_completed: number;
};

type ChapterRow = {
  id: string;
  lesson_id: number;
  title: string;
  hindi_title: string;
  type: string;
  content: unknown;
  sort_order: number;
};

type ChapterProgressRow = {
  id: number;
  lesson_id: number;
  chapter_id: string;
  score: number | null;
  completed_at: string | null;
};

function getTodayDateKey() {
  return new Date().toISOString().split("T")[0];
}

function parsePositiveInteger(value: unknown) {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseNonNegativeInteger(value: unknown) {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function isUniqueConstraintError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const message = "message" in error && typeof error.message === "string" ? error.message : "";

  return code === "23505" || /unique/i.test(message);
}

function isJsonSyntaxError(error: unknown) {
  return error instanceof SyntaxError && "body" in error;
}

function toDayNumber(date: string) {
  const [year, month, day] = date.split("-").map((value) => Number(value));

  if (![year, month, day].every((value) => Number.isInteger(value) && value > 0)) {
    return null;
  }

  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function getLessonById(lessonId: number) {
  return lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

function getNextLessonId(lessonId: number) {
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  return lessonIndex >= 0 ? lessons[lessonIndex + 1]?.id ?? null : null;
}

function getLessonListItem(lesson: (typeof lessons)[number]) {
  return {
    id: lesson.id,
    title: lesson.title,
    cefrLevel: lesson.cefrLevel,
    durationMinutes: lesson.durationMinutes,
    focus: lesson.focus,
    hindiSummary: lesson.hindiSummary,
    unlockRequirement: lesson.unlockRequirement
  };
}

function normalizeCurriculumChapterId(chapterId: string) {
  if (/^L\d+-C\d+$/i.test(chapterId)) {
    return chapterId.toUpperCase();
  }

  const match = chapterId.match(/^(\d+)-(\d+)$/);

  if (!match) {
    return null;
  }

  return `L${match[1]}-C${match[2]}`;
}

function parseStoredChapterContent(content: unknown) {
  if (content && typeof content === "object") {
    return content;
  }

  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  return null;
}

async function handleCorrection(req: express.Request, res: express.Response) {
  const sentence = typeof req.body?.sentence === "string" ? req.body.sentence : "";

  if (!sentence.trim()) {
    return res.status(400).json({ error: "Sentence is required." });
  }

  try {
    const result = await correctSentence(sentence);
    return res.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Correction request failed.";
    return res.status(500).json({ error: message });
  }
}

async function handleConversation(req: express.Request, res: express.Response) {
  const message = typeof req.body?.message === "string" ? req.body.message : "";

  if (!message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const reply = await conversationReply(message);
    return res.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversation request failed.";
    return res.status(500).json({ error: message });
  }
}

async function handleAnalyze(req: express.Request, res: express.Response) {
  const sentence = typeof req.body?.sentence === "string" ? req.body.sentence : "";

  if (!sentence.trim()) {
    return res.status(400).json({ error: "Sentence is required." });
  }

  try {
    const result = await analyzeSentence(sentence);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sentence analysis failed.";
    return res.status(500).json({ error: message });
  }
}

async function bootstrap() {
  const db = await initDB();

  async function queryOne<T extends object>(sql: string, params: unknown[] = []) {
    const result = await db.query<T>(sql, params);
    return result.rows[0] as T | undefined;
  }

  async function queryAll<T extends object>(sql: string, params: unknown[] = []) {
    const result = await db.query<T>(sql, params);
    return result.rows as T[];
  }

  async function runQuery(sql: string, params: unknown[] = []) {
    const result = await db.query(sql, params);
    return {
      lastID: ((result.rows[0] as { id?: number } | undefined)?.id ?? 0) as number,
      changes: result.rowCount ?? 0
    };
  }

  async function requireExistingUser(userId: number, res: express.Response) {
    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE id = $1", [userId]);

    if (user) {
      return true;
    }

    res.status(404).json({ error: "User not found." });
    return false;
  }

  function requireExistingLesson(lessonId: number, res: express.Response) {
    if (getLessonById(lessonId)) {
      return true;
    }

    res.status(404).json({ error: "Lesson not found." });
    return false;
  }

  async function requireExistingVocabularyWord(wordId: number, res: express.Response) {
    const word = await queryOne<{ id: number }>("SELECT id FROM vocabulary WHERE id = $1", [wordId]);

    if (word) {
      return true;
    }

    res.status(404).json({ error: "Vocabulary word not found." });
    return false;
  }

  async function getTodayDailyProgress(userId: number) {
    return queryOne<DailyProgressRow>(
      `SELECT id, user_id, date, sentences_spoken, words_learned, lessons_completed
       FROM daily_progress
       WHERE user_id = $1 AND date = $2
       ORDER BY id DESC
       LIMIT 1`,
      [userId, getTodayDateKey()]
    );
  }

  async function persistDailyProgress(userId: number, counts: DailyProgressCounts) {
    const today = getTodayDateKey();
    const existingProgress = await getTodayDailyProgress(userId);

    if (existingProgress) {
      await runQuery(
        `UPDATE daily_progress
         SET sentences_spoken = $1, words_learned = $2, lessons_completed = $3
         WHERE id = $4`,
        [counts.sentences, counts.words, counts.lessons, existingProgress.id]
      );
    } else {
      await runQuery(
        "INSERT INTO daily_progress (user_id, date, sentences_spoken, words_learned, lessons_completed) VALUES ($1, $2, $3, $4, $5)",
        [userId, today, counts.sentences, counts.words, counts.lessons]
      );
    }
  }

  async function calculateCurrentStreak(userId: number) {
    const activityRows = await queryAll<{ date: string }>(
      `SELECT DISTINCT date
       FROM daily_progress
       WHERE user_id = $1
         AND (sentences_spoken > 0 OR words_learned > 0 OR lessons_completed > 0)
       ORDER BY date DESC`,
      [userId]
    );

    if (!activityRows.length) {
      return 0;
    }

    const todayNumber = toDayNumber(getTodayDateKey());
    const firstDayNumber = toDayNumber(activityRows[0].date);

    if (todayNumber === null || firstDayNumber === null || firstDayNumber !== todayNumber) {
      return 0;
    }

    let streak = 0;
    let expectedDayNumber = todayNumber;

    for (const row of activityRows) {
      const dayNumber = toDayNumber(row.date);

      if (dayNumber === null) {
        continue;
      }

      if (dayNumber === expectedDayNumber) {
        streak += 1;
        expectedDayNumber -= 1;
        continue;
      }

      if (dayNumber < expectedDayNumber) {
        break;
      }
    }

    return streak;
  }

  async function syncUserStreak(userId: number) {
    const streak = await calculateCurrentStreak(userId);
    await runQuery("UPDATE users SET streak = $1 WHERE id = $2", [streak, userId]);
    return streak;
  }

  async function saveDailyProgressMaximum(userId: number, counts: DailyProgressCounts) {
    const currentProgress = await getTodayDailyProgress(userId);
    const nextCounts = {
      sentences: Math.max(currentProgress?.sentences_spoken ?? 0, counts.sentences),
      words: Math.max(currentProgress?.words_learned ?? 0, counts.words),
      lessons: Math.max(currentProgress?.lessons_completed ?? 0, counts.lessons)
    };

    await persistDailyProgress(userId, nextCounts);
    const currentStreak = await syncUserStreak(userId);

    return { counts: nextCounts, currentStreak };
  }

  async function incrementDailyProgress(userId: number, delta: Partial<DailyProgressCounts>) {
    const currentProgress = await getTodayDailyProgress(userId);
    const nextCounts = {
      sentences: (currentProgress?.sentences_spoken ?? 0) + (delta.sentences ?? 0),
      words: (currentProgress?.words_learned ?? 0) + (delta.words ?? 0),
      lessons: (currentProgress?.lessons_completed ?? 0) + (delta.lessons ?? 0)
    };

    await persistDailyProgress(userId, nextCounts);
    const currentStreak = await syncUserStreak(userId);

    return { counts: nextCounts, currentStreak };
  }

  async function getDashboardSummary(userId: number) {
    const todayProgress = await getTodayDailyProgress(userId);
    const totalLessonsCompleted = await queryOne<{ count: number | string }>(
      `SELECT COUNT(DISTINCT lesson) AS count
       FROM progress
       WHERE user_id = $1
         AND (COALESCE(score, 0) >= 100 OR completed_at IS NOT NULL)`,
      [userId]
    );
    const totalVocabularyLearned = await queryOne<{ count: number | string }>(
      "SELECT COUNT(DISTINCT word_id) AS count FROM vocabulary_progress WHERE user_id = $1",
      [userId]
    );
    const currentStreak = await syncUserStreak(userId);

    return {
      user_id: userId,
      date: getTodayDateKey(),
      sentences_spoken: todayProgress?.sentences_spoken ?? 0,
      words_learned: todayProgress?.words_learned ?? 0,
      lessons_completed: todayProgress?.lessons_completed ?? 0,
      current_streak: currentStreak,
      total_lessons_completed: Number(totalLessonsCompleted?.count ?? 0),
      total_vocabulary_learned: Number(totalVocabularyLearned?.count ?? 0)
    };
  }

  async function ensureLessonUnlock(userId: number, lessonId: number) {
    if (lessonId === 1) {
      return false;
    }

    const existing = await queryOne<{ id: number }>("SELECT id FROM lesson_unlocks WHERE user_id = $1 AND lesson_id = $2", [userId, lessonId]);

    if (existing) {
      return false;
    }

    await runQuery("INSERT INTO lesson_unlocks (user_id, lesson_id, unlocked_at) VALUES ($1, $2, $3)", [userId, lessonId, new Date().toISOString()]);
    return true;
  }

  async function getChapterProgressRows(userId: number) {
    return queryAll<ChapterProgressRow>(
      `SELECT id, lesson_id, chapter_id, score, completed_at
       FROM chapter_progress
       WHERE user_id = $1`,
      [userId]
    );
  }

  function buildChapterProgressMaps(rows: ChapterProgressRow[]) {
    const completedChapterIdsByLesson = new Map<number, Set<string>>();

    for (const row of rows) {
      const lessonId = Number(row.lesson_id);

      if (!completedChapterIdsByLesson.has(lessonId)) {
        completedChapterIdsByLesson.set(lessonId, new Set<string>());
      }

      completedChapterIdsByLesson.get(lessonId)?.add(row.chapter_id);
    }

    return completedChapterIdsByLesson;
  }

  async function getUnlockedLessonIdsForUser(userId: number) {
    const [unlockRows, chapterRows] = await Promise.all([
      queryAll<{ lesson_id: number }>("SELECT lesson_id FROM lesson_unlocks WHERE user_id = $1", [userId]),
      getChapterProgressRows(userId)
    ]);

    const completedChapterIdsByLesson = buildChapterProgressMaps(chapterRows);
    const unlockedIds = new Set<number>([1]);

    for (const row of unlockRows) {
      unlockedIds.add(Number(row.lesson_id));
    }

    for (const lesson of lessons) {
      const completedCount = completedChapterIdsByLesson.get(lesson.id)?.size ?? 0;

      if (completedCount >= lesson.chapters.length) {
        unlockedIds.add(lesson.id);
        const nextLessonId = getNextLessonId(lesson.id);

        if (nextLessonId !== null) {
          unlockedIds.add(nextLessonId);
        }
      }
    }

    return { unlockedIds, completedChapterIdsByLesson };
  }

  async function getLessonChaptersFromDb(lessonId: number) {
    return queryAll<ChapterRow>(
      `SELECT id, lesson_id, title, hindi_title, type, content, sort_order
       FROM chapters
       WHERE lesson_id = $1
       ORDER BY sort_order ASC`,
      [lessonId]
    );
  }

  app.get("/seed-curriculum", async (req, res) => {
    const expectedKey = process.env.SEED_KEY;
    const providedKey = typeof req.query.key === "string" ? req.query.key : "";

    if (!expectedKey || providedKey !== expectedKey) {
      return res.status(403).json({ error: "Forbidden." });
    }

    if (db.dialect !== "postgres") {
      return res.status(503).json({ error: "Seeding requires PostgreSQL." });
    }

    const pool = getPostgresPool();

    if (!pool) {
      return res.status(503).json({ error: "Database is not configured." });
    }

    try {
      const [schemaSql, seedSql] = await Promise.all([
        readFile(resolve(process.cwd(), "db", "course-curriculum-schema.sql"), "utf8"),
        readFile(resolve(process.cwd(), "db", "generated", "course-curriculum-seed.sql"), "utf8")
      ]);

      await pool.query(schemaSql);
      await pool.query(seedSql);

      return res.json({ success: true, message: "Database seeded" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Database seeding failed.";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/signup", async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const createdAt = new Date().toISOString();

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    try {
      const result = await runQuery(
        "INSERT INTO users (name, email, password, created_at, level) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [name, email, hashPassword(password), createdAt, "Beginner"]
      );

      await ensureUserLessonsInitialized(db, result.lastID);
      return res.status(201).json({ userId: result.lastID });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed.";

      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      return res.status(500).json({ error: message });
    }
  });

  app.post("/login", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    try {
      const user = await queryOne<{ id: number; password: string | null }>("SELECT id, password FROM users WHERE email = $1", [email]);

      if (!user?.password || !verifyPassword(password, user.password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      await ensureUserLessonsInitialized(db, user.id);
      return res.json({ userId: user.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/user", async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const createdAt = new Date().toISOString();

    if (!name) {
      return res.status(400).json({ error: "Name is required." });
    }

    try {
      const result = await runQuery("INSERT INTO users (name, level, created_at) VALUES ($1, $2, $3) RETURNING id", [name, "Beginner", createdAt]);
      await ensureUserLessonsInitialized(db, result.lastID);
      return res.status(201).json({ userId: result.lastID });
    } catch (error) {
      const message = error instanceof Error ? error.message : "User creation failed.";
      return res.status(500).json({ error: message });
    }
  });

  app.get("/lessons", async (req, res) => {
    const userId = parsePositiveInteger(req.query.userId);

    if (!req.query.userId || !userId) {
      return res.json(lessons.map((lesson) => getLessonListItem(lesson)));
    }

    if (!(await requireExistingUser(userId, res))) {
      return;
    }

    try {
      const { unlockedIds, completedChapterIdsByLesson } = await getUnlockedLessonIdsForUser(userId);

      return res.json(
        lessons.map((lesson) => {
          const completedChapters = completedChapterIdsByLesson.get(lesson.id)?.size ?? 0;
          const totalChapters = lesson.chapters.length;
          const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

          return {
            ...getLessonListItem(lesson),
            isUnlocked: unlockedIds.has(lesson.id),
            completedChapters,
            totalChapters,
            progressPercent
          };
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lessons could not be loaded.";
      return res.status(500).json({ error: message });
    }
  });

  app.get("/lessons/:lessonId", async (req, res) => {
    const lessonId = Number(req.params.lessonId);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return res.status(400).json({ error: "Lesson ID must be a positive integer." });
    }

    const lesson = getLessonById(lessonId);

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found." });
    }

    const userId = parsePositiveInteger(req.query.userId);

    if (req.query.userId && !userId) {
      return res.status(400).json({ error: "User ID must be a positive integer." });
    }

    if (userId && !(await requireExistingUser(userId, res))) {
      return;
    }

    try {
      const chapterRows = await getLessonChaptersFromDb(lessonId);
      const lessonChapters = chapterRows.length
        ? chapterRows.map((row) => ({
            id: row.id,
            title: row.title,
            hindiTitle: row.hindi_title,
            type: row.type,
            content: parseStoredChapterContent(row.content)
          }))
        : lesson.chapters;

      const completedChapterIds = new Set<string>();

      if (userId) {
        const progressRows = await queryAll<ChapterProgressRow>(
          `SELECT id, lesson_id, chapter_id, score, completed_at
           FROM chapter_progress
           WHERE user_id = $1 AND lesson_id = $2`,
          [userId, lessonId]
        );

        for (const row of progressRows) {
          completedChapterIds.add(row.chapter_id);
        }
      }

      return res.json({
        ...getLessonListItem(lesson),
        totalChapters: lesson.chapters.length,
        completedChapters: completedChapterIds.size,
        chapters: lessonChapters.map((chapter) => ({
          ...chapter,
          isCompleted: completedChapterIds.has(chapter.id)
        }))
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lesson details could not be loaded.";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/chapter-progress", async (req, res) => {
    const userId = parsePositiveInteger(req.body?.userId);
    const lessonId = parsePositiveInteger(req.body?.lessonId);
    const chapterId = typeof req.body?.chapterId === "string" ? req.body.chapterId.trim() : "";
    const score = parseNonNegativeInteger(req.body?.score) ?? 100;

    if (!userId || !lessonId || !chapterId) {
      return res.status(400).json({ error: "User ID, lesson ID, and chapter ID are required." });
    }

    if (!(await requireExistingUser(userId, res))) {
      return;
    }

    const lesson = getLessonById(lessonId);
    const curriculumLevel = getCurriculumLevel(lessonId);
    const normalizedCurriculumChapterId = normalizeCurriculumChapterId(chapterId);
    const isCurriculumChapter = Boolean(curriculumLevel && normalizedCurriculumChapterId);

    if (!lesson && !curriculumLevel) {
      return res.status(404).json({ error: "Lesson not found." });
    }

    const chapterExists = isCurriculumChapter
      ? curriculumLevel?.chapters.some((chapter) => chapter.chapter_id === normalizedCurriculumChapterId)
      : lesson?.chapters.some((chapter) => chapter.id === chapterId);

    if (!chapterExists) {
      return res.status(404).json({ error: "Chapter not found." });
    }

    try {
      const existingProgress = await queryOne<ChapterProgressRow>(
        `SELECT id, lesson_id, chapter_id, score, completed_at
         FROM chapter_progress
         WHERE user_id = $1 AND chapter_id = $2
         LIMIT 1`,
        [userId, chapterId]
      );

      const completedAt = existingProgress?.completed_at ?? new Date().toISOString();
      const nextScore = Math.max(existingProgress?.score ?? 0, score);
      const wasAlreadyCompleted = Boolean(existingProgress);

      if (existingProgress) {
        await runQuery(
          `UPDATE chapter_progress
           SET score = $1, completed_at = $2, lesson_id = $3
           WHERE id = $4`,
          [nextScore, completedAt, lessonId, existingProgress.id]
        );
      } else {
        await runQuery(
          "INSERT INTO chapter_progress (user_id, lesson_id, chapter_id, completed_at, score) VALUES ($1, $2, $3, $4, $5)",
          [userId, lessonId, chapterId, completedAt, nextScore]
        );
      }

      const completedRows = await queryAll<ChapterProgressRow>(
        `SELECT id, lesson_id, chapter_id, score, completed_at
         FROM chapter_progress
         WHERE user_id = $1 AND lesson_id = $2`,
        [userId, lessonId]
      );

      const totalChapterCount = isCurriculumChapter ? curriculumLevel?.chapters.length ?? 0 : lesson?.chapters.length ?? 0;
      const isLessonCompleted = totalChapterCount > 0 && completedRows.length >= totalChapterCount;
      let nextLessonUnlocked = false;

      if (!isCurriculumChapter && lesson) {
        await ensureLessonUnlock(userId, lessonId);

        if (isLessonCompleted) {
          const nextLessonId = getNextLessonId(lessonId);

          if (nextLessonId !== null) {
            nextLessonUnlocked = await ensureLessonUnlock(userId, nextLessonId);
          }

          const savedProgress = await saveLessonProgress(db, userId, lessonId, 100);

          if (savedProgress.justCompleted) {
            await incrementDailyProgress(userId, { lessons: 1 });
          }
        }
      }

      return res.json({ success: true, nextLessonUnlocked, xpAwarded: wasAlreadyCompleted ? 0 : 50 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chapter progress could not be saved.";
      return res.status(500).json({ error: message });
    }
  });

  app.get("/lesson-unlocks/:userId", async (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "User ID must be a positive integer." });
    }

    if (!(await requireExistingUser(userId, res))) {
      return;
    }

    try {
      const { unlockedIds } = await getUnlockedLessonIdsForUser(userId);
      return res.json(Array.from(unlockedIds).sort((left, right) => left - right));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lesson unlocks could not be loaded.";
      return res.status(500).json({ error: message });
    }
  });

  app.get("/lesson-progress/:userId", async (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "User ID must be a positive integer." });
    }

    if (!(await requireExistingUser(userId, res))) {
      return;
    }

    try {
      const progressRows = await queryAll<{ lesson: string; score: number | null; completed_at: string | null }>(
        `SELECT lesson, score, completed_at
         FROM progress
         WHERE user_id = $1`,
        [userId]
      );

      return res.json(progressRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lesson progress could not be loaded.";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/lesson-progress", async (req, res) => {
    const userId = parsePositiveInteger(req.body?.userId);
    const lessonId = parsePositiveInteger(req.body?.lessonId);
    const lessonScore = parseNonNegativeInteger(req.body?.score) ?? 100;

    if (!userId || !lessonId) {
      return res.status(400).json({ error: "User ID and lesson ID must be positive integers." });
    }

    if (!(await requireExistingUser(userId, res))) {
      return;
    }

    if (!requireExistingLesson(lessonId, res)) {
      return;
    }

    try {
      const savedProgress = await saveLessonProgress(db, userId, lessonId, lessonScore);

      if (savedProgress.justCompleted) {
        const progressUpdate = await incrementDailyProgress(userId, { lessons: 1 });

        return res.json({
          success: true,
          alreadyCompleted: false,
          currentStreak: progressUpdate.currentStreak,
          lessonsCompletedToday: progressUpdate.counts.lessons,
          nextLessonId: savedProgress.nextLessonId,
          nextLessonUnlocked: savedProgress.nextLessonUnlocked
        });
      }

      const currentStreak = await syncUserStreak(userId);

      return res.json({
        success: true,
        alreadyCompleted: savedProgress.alreadyCompleted,
        currentStreak,
        nextLessonId: savedProgress.nextLessonId,
        nextLessonUnlocked: savedProgress.nextLessonUnlocked
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lesson progress could not be saved.";
      return res.status(500).json({ error: message });
    }
  });

  app.get("/vocabulary", (_req, res) => {
    return res.json(vocabularyTerms);
  });

  app.post("/vocabulary-progress", async (req, res) => {
    const userId = parsePositiveInteger(req.body?.userId);
    const wordId = parsePositiveInteger(req.body?.wordId);
    const todayIso = new Date().toISOString();
    const todayKey = getTodayDateKey();

    if (!userId || !wordId) {
      return res.status(400).json({ error: "User ID and word ID must be positive integers." });
    }

    if (!(await requireExistingUser(userId, res))) {
      return;
    }

    if (!(await requireExistingVocabularyWord(wordId, res))) {
      return;
    }

    try {
      const existingProgress = await queryOne<{ id: number; correct_count: number; last_seen: string | null }>(
        "SELECT id, correct_count, last_seen FROM vocabulary_progress WHERE user_id = $1 AND word_id = $2 ORDER BY id DESC LIMIT 1",
        [userId, wordId]
      );

      if (existingProgress) {
        await runQuery(
          "UPDATE vocabulary_progress SET last_seen = $1, correct_count = correct_count + 1 WHERE id = $2",
          [todayIso, existingProgress.id]
        );

        if (!existingProgress.last_seen?.startsWith(todayKey)) {
          const progressUpdate = await incrementDailyProgress(userId, { words: 1 });
          return res.json({ success: true, correctCount: existingProgress.correct_count + 1, currentStreak: progressUpdate.currentStreak });
        }

        return res.json({ success: true, correctCount: existingProgress.correct_count + 1 });
      }

      await runQuery(
        "INSERT INTO vocabulary_progress (user_id, word_id, last_seen, correct_count) VALUES ($1, $2, $3, 1)",
        [userId, wordId, todayIso]
      );

      const progressUpdate = await incrementDailyProgress(userId, { words: 1 });
      return res.json({ success: true, correctCount: 1, currentStreak: progressUpdate.currentStreak });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vocabulary progress could not be saved.";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/daily-progress", async (req, res) => {
    const userId = parsePositiveInteger(req.body?.userId);
    const sentences = parseNonNegativeInteger(req.body?.sentences);
    const words = parseNonNegativeInteger(req.body?.words);
    const lessonCount = parseNonNegativeInteger(req.body?.lessons);
    const mode = req.body?.mode === "increment" ? "increment" : "maximum";

    if (!userId) {
      return res.status(400).json({ error: "User ID must be a positive integer." });
    }

    if (sentences === null || words === null || lessonCount === null) {
      return res.status(400).json({ error: "Sentences, words, and lessons must be non-negative integers." });
    }

    if (!(await requireExistingUser(userId, res))) {
      return;
    }

    try {
      const progressUpdate =
        mode === "increment"
          ? await incrementDailyProgress(userId, { sentences, words, lessons: lessonCount })
          : await saveDailyProgressMaximum(userId, { sentences, words, lessons: lessonCount });

      return res.json({
        success: true,
        currentStreak: progressUpdate.currentStreak,
        progress: {
          sentences_spoken: progressUpdate.counts.sentences,
          words_learned: progressUpdate.counts.words,
          lessons_completed: progressUpdate.counts.lessons
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Daily progress could not be saved.";
      return res.status(500).json({ error: message });
    }
  });

  app.get("/daily-progress/:userId", async (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "User ID must be a positive integer." });
    }

    if (!(await requireExistingUser(userId, res))) {
      return;
    }

    try {
      const summary = await getDashboardSummary(userId);
      return res.json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Daily progress could not be loaded.";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/pronunciation", (req, res) => {
    const sentence = typeof req.body?.sentence === "string" ? req.body.sentence.trim() : "";

    if (!sentence) {
      return res.status(400).json({ error: "Sentence is required." });
    }

    const result = scorePronunciation(sentence);
    return res.json(result);
  });

  app.post("/correct", handleCorrection);
  app.post("/api/correct", handleCorrection);
  app.post("/analyze", handleAnalyze);
  app.post("/chat", handleConversation);
  app.use("/api", apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found." });
  });

  const errorHandler: express.ErrorRequestHandler = (error, _req, res, _next) => {
    if (isJsonSyntaxError(error)) {
      res.status(400).json({ error: "Invalid JSON payload." });
      return;
    }

    const message = error instanceof Error ? error.message : "Internal server error.";
    console.error(message);
    res.status(500).json({ error: "Internal server error." });
  };

  app.use(errorHandler);

  const server = app.listen(PORT, () => {
    console.log(`Bolo English API listening on port ${PORT}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    const message =
      error.code === "EADDRINUSE"
        ? `Port ${PORT} is already in use. Stop the existing process or choose a different PORT.`
        : error.message;

    console.error(`Bolo English API failed to start: ${message}`);
    process.exit(1);
  });
}

void bootstrap().catch((error) => {
  const message = error instanceof Error ? error.message : "Server failed to start.";
  console.error(message);
  process.exit(1);
});

