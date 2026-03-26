"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const ai_1 = require("./ai");
const auth_1 = require("./auth");
const conversation_1 = require("./conversation");
const data_1 = require("./data");
const database_1 = require("./database");
const lesson_progression_1 = require("./lesson-progression");
const pronunciation_1 = require("./pronunciation");
const routes_1 = require("./routes");
const curriculum_data_1 = require("./generated/curriculum-data");
dotenv_1.default.config({ path: [(0, node_path_1.resolve)(process.cwd(), ".env.local"), (0, node_path_1.resolve)(process.cwd(), ".env")] });
if (!process.env.PORT && process.env.API_PORT) {
    process.env.PORT = process.env.API_PORT;
}
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT || 4000);
function trimTrailingSlash(value) {
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
function matchesOriginPattern(origin, pattern) {
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
    }
    catch {
        return false;
    }
}
function isLocalDevelopmentOrigin(origin) {
    try {
        const originUrl = new URL(origin);
        return ((originUrl.protocol === "http:" || originUrl.protocol === "https:") &&
            (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1" || originUrl.hostname === "[::1]"));
    }
    catch {
        return false;
    }
}
const allowedOriginPatterns = parseClientOriginPatterns();
const corsOptions = {
    origin(origin, callback) {
        if (!origin || !allowedOriginPatterns.length) {
            callback(null, true);
            return;
        }
        const normalizedOrigin = trimTrailingSlash(origin);
        const isAllowed = isLocalDevelopmentOrigin(normalizedOrigin) || allowedOriginPatterns.some((pattern) => matchesOriginPattern(normalizedOrigin, pattern));
        callback(null, isAllowed);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: "1mb" }));
app.get("/", (_req, res) => {
    res.json({ status: "ok", service: "bolo-english-api" });
});
app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "bolo-english-api" });
});
function getTodayDateKey() {
    return new Date().toISOString().split("T")[0];
}
function parsePositiveInteger(value) {
    const parsed = typeof value === "string" ? Number(value) : value;
    return typeof parsed === "number" && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
function parseNonNegativeInteger(value) {
    const parsed = typeof value === "string" ? Number(value) : value;
    return typeof parsed === "number" && Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}
function isUniqueConstraintError(error) {
    if (!error || typeof error !== "object") {
        return false;
    }
    const code = "code" in error && typeof error.code === "string" ? error.code : "";
    const message = "message" in error && typeof error.message === "string" ? error.message : "";
    return code === "23505" || /unique/i.test(message);
}
function isJsonSyntaxError(error) {
    return error instanceof SyntaxError && "body" in error;
}
function toDayNumber(date) {
    const [year, month, day] = date.split("-").map((value) => Number(value));
    if (![year, month, day].every((value) => Number.isInteger(value) && value > 0)) {
        return null;
    }
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}
function getLessonById(lessonId) {
    return data_1.lessons.find((lesson) => lesson.id === lessonId) ?? null;
}
function getNextLessonId(lessonId) {
    const lessonIndex = data_1.lessons.findIndex((lesson) => lesson.id === lessonId);
    return lessonIndex >= 0 ? data_1.lessons[lessonIndex + 1]?.id ?? null : null;
}
function getLessonListItem(lesson) {
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
function normalizeCurriculumChapterId(chapterId) {
    if (/^L\d+-C\d+$/i.test(chapterId)) {
        return chapterId.toUpperCase();
    }
    const match = chapterId.match(/^(\d+)-(\d+)$/);
    if (!match) {
        return null;
    }
    return `L${match[1]}-C${match[2]}`;
}
function parseStoredChapterContent(content) {
    if (content && typeof content === "object") {
        return content;
    }
    if (typeof content === "string") {
        try {
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    return null;
}
async function handleCorrection(req, res) {
    const sentence = typeof req.body?.sentence === "string" ? req.body.sentence : "";
    if (!sentence.trim()) {
        return res.status(400).json({ error: "Sentence is required." });
    }
    try {
        const result = await (0, ai_1.correctSentence)(sentence);
        return res.json({ result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Correction request failed.";
        return res.status(500).json({ error: message });
    }
}
async function handleConversation(req, res) {
    const message = typeof req.body?.message === "string" ? req.body.message : "";
    if (!message.trim()) {
        return res.status(400).json({ error: "Message is required." });
    }
    try {
        const reply = await (0, conversation_1.conversationReply)(message);
        return res.json({ reply });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Conversation request failed.";
        return res.status(500).json({ error: message });
    }
}
async function handleAnalyze(req, res) {
    const sentence = typeof req.body?.sentence === "string" ? req.body.sentence : "";
    if (!sentence.trim()) {
        return res.status(400).json({ error: "Sentence is required." });
    }
    try {
        const result = await (0, ai_1.analyzeSentence)(sentence);
        return res.json(result);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Sentence analysis failed.";
        return res.status(500).json({ error: message });
    }
}
async function bootstrap() {
    const db = await (0, database_1.initDB)();
    async function queryOne(sql, params = []) {
        const result = await db.query(sql, params);
        return result.rows[0];
    }
    async function queryAll(sql, params = []) {
        const result = await db.query(sql, params);
        return result.rows;
    }
    async function runQuery(sql, params = []) {
        const result = await db.query(sql, params);
        return {
            lastID: (result.rows[0]?.id ?? 0),
            changes: result.rowCount ?? 0
        };
    }
    async function requireExistingUser(userId, res) {
        const user = await queryOne("SELECT id FROM users WHERE id = $1", [userId]);
        if (user) {
            return true;
        }
        res.status(404).json({ error: "User not found." });
        return false;
    }
    function requireExistingLesson(lessonId, res) {
        if (getLessonById(lessonId)) {
            return true;
        }
        res.status(404).json({ error: "Lesson not found." });
        return false;
    }
    async function requireExistingVocabularyWord(wordId, res) {
        const word = await queryOne("SELECT id FROM vocabulary WHERE id = $1", [wordId]);
        if (word) {
            return true;
        }
        res.status(404).json({ error: "Vocabulary word not found." });
        return false;
    }
    async function getTodayDailyProgress(userId) {
        return queryOne(`SELECT id, user_id, date, sentences_spoken, words_learned, lessons_completed
       FROM daily_progress
       WHERE user_id = $1 AND date = $2
       ORDER BY id DESC
       LIMIT 1`, [userId, getTodayDateKey()]);
    }
    async function persistDailyProgress(userId, counts) {
        const today = getTodayDateKey();
        const existingProgress = await getTodayDailyProgress(userId);
        if (existingProgress) {
            await runQuery(`UPDATE daily_progress
         SET sentences_spoken = $1, words_learned = $2, lessons_completed = $3
         WHERE id = $4`, [counts.sentences, counts.words, counts.lessons, existingProgress.id]);
        }
        else {
            await runQuery("INSERT INTO daily_progress (user_id, date, sentences_spoken, words_learned, lessons_completed) VALUES ($1, $2, $3, $4, $5)", [userId, today, counts.sentences, counts.words, counts.lessons]);
        }
    }
    async function calculateCurrentStreak(userId) {
        const activityRows = await queryAll(`SELECT DISTINCT date
       FROM daily_progress
       WHERE user_id = $1
         AND (sentences_spoken > 0 OR words_learned > 0 OR lessons_completed > 0)
       ORDER BY date DESC`, [userId]);
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
    async function syncUserStreak(userId) {
        const streak = await calculateCurrentStreak(userId);
        await runQuery("UPDATE users SET streak = $1 WHERE id = $2", [streak, userId]);
        return streak;
    }
    async function saveDailyProgressMaximum(userId, counts) {
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
    async function incrementDailyProgress(userId, delta) {
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
    async function getDashboardSummary(userId) {
        const todayProgress = await getTodayDailyProgress(userId);
        const totalLessonsCompleted = await queryOne(`SELECT COUNT(DISTINCT lesson) AS count
       FROM progress
       WHERE user_id = $1
         AND (COALESCE(score, 0) >= 100 OR completed_at IS NOT NULL)`, [userId]);
        const totalVocabularyLearned = await queryOne("SELECT COUNT(DISTINCT word_id) AS count FROM vocabulary_progress WHERE user_id = $1", [userId]);
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
    async function ensureLessonUnlock(userId, lessonId) {
        if (lessonId === 1) {
            return false;
        }
        const existing = await queryOne("SELECT id FROM lesson_unlocks WHERE user_id = $1 AND lesson_id = $2", [userId, lessonId]);
        if (existing) {
            return false;
        }
        await runQuery("INSERT INTO lesson_unlocks (user_id, lesson_id, unlocked_at) VALUES ($1, $2, $3)", [userId, lessonId, new Date().toISOString()]);
        return true;
    }
    async function getChapterProgressRows(userId) {
        return queryAll(`SELECT id, lesson_id, chapter_id, score, completed_at
       FROM chapter_progress
       WHERE user_id = $1`, [userId]);
    }
    function buildChapterProgressMaps(rows) {
        const completedChapterIdsByLesson = new Map();
        for (const row of rows) {
            const lessonId = Number(row.lesson_id);
            if (!completedChapterIdsByLesson.has(lessonId)) {
                completedChapterIdsByLesson.set(lessonId, new Set());
            }
            completedChapterIdsByLesson.get(lessonId)?.add(row.chapter_id);
        }
        return completedChapterIdsByLesson;
    }
    async function getUnlockedLessonIdsForUser(userId) {
        const [unlockRows, chapterRows] = await Promise.all([
            queryAll("SELECT lesson_id FROM lesson_unlocks WHERE user_id = $1", [userId]),
            getChapterProgressRows(userId)
        ]);
        const completedChapterIdsByLesson = buildChapterProgressMaps(chapterRows);
        const unlockedIds = new Set([1]);
        for (const row of unlockRows) {
            unlockedIds.add(Number(row.lesson_id));
        }
        for (const lesson of data_1.lessons) {
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
    async function getLessonChaptersFromDb(lessonId) {
        return queryAll(`SELECT id, lesson_id, title, hindi_title, type, content, sort_order
       FROM chapters
       WHERE lesson_id = $1
       ORDER BY sort_order ASC`, [lessonId]);
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
        const pool = (0, database_1.getPostgresPool)();
        if (!pool) {
            return res.status(503).json({ error: "Database is not configured." });
        }
        try {
            const [schemaSql, seedSql] = await Promise.all([
                (0, promises_1.readFile)((0, node_path_1.resolve)(process.cwd(), "db", "course-curriculum-schema.sql"), "utf8"),
                (0, promises_1.readFile)((0, node_path_1.resolve)(process.cwd(), "db", "generated", "course-curriculum-seed.sql"), "utf8")
            ]);
            await pool.query(schemaSql);
            await pool.query(seedSql);
            return res.json({ success: true, message: "Database seeded" });
        }
        catch (error) {
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
            const result = await runQuery("INSERT INTO users (name, email, password, created_at, level) VALUES ($1, $2, $3, $4, $5) RETURNING id", [name, email, (0, auth_1.hashPassword)(password), createdAt, "Beginner"]);
            await (0, lesson_progression_1.ensureUserLessonsInitialized)(db, result.lastID);
            return res.status(201).json({ userId: result.lastID });
        }
        catch (error) {
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
            const user = await queryOne("SELECT id, password FROM users WHERE email = $1", [email]);
            if (!user?.password || !(0, auth_1.verifyPassword)(password, user.password)) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
            await (0, lesson_progression_1.ensureUserLessonsInitialized)(db, user.id);
            return res.json({ userId: user.id });
        }
        catch (error) {
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
            await (0, lesson_progression_1.ensureUserLessonsInitialized)(db, result.lastID);
            return res.status(201).json({ userId: result.lastID });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "User creation failed.";
            return res.status(500).json({ error: message });
        }
    });
    app.get("/lessons", async (req, res) => {
        const userId = parsePositiveInteger(req.query.userId);
        if (!req.query.userId || !userId) {
            return res.json(data_1.lessons.map((lesson) => getLessonListItem(lesson)));
        }
        if (!(await requireExistingUser(userId, res))) {
            return;
        }
        try {
            const { unlockedIds, completedChapterIdsByLesson } = await getUnlockedLessonIdsForUser(userId);
            return res.json(data_1.lessons.map((lesson) => {
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
            }));
        }
        catch (error) {
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
            const completedChapterIds = new Set();
            if (userId) {
                const progressRows = await queryAll(`SELECT id, lesson_id, chapter_id, score, completed_at
           FROM chapter_progress
           WHERE user_id = $1 AND lesson_id = $2`, [userId, lessonId]);
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
        }
        catch (error) {
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
        const curriculumLevel = (0, curriculum_data_1.getCurriculumLevel)(lessonId);
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
            const existingProgress = await queryOne(`SELECT id, lesson_id, chapter_id, score, completed_at
         FROM chapter_progress
         WHERE user_id = $1 AND chapter_id = $2
         LIMIT 1`, [userId, chapterId]);
            const completedAt = existingProgress?.completed_at ?? new Date().toISOString();
            const nextScore = Math.max(existingProgress?.score ?? 0, score);
            const wasAlreadyCompleted = Boolean(existingProgress);
            if (existingProgress) {
                await runQuery(`UPDATE chapter_progress
           SET score = $1, completed_at = $2, lesson_id = $3
           WHERE id = $4`, [nextScore, completedAt, lessonId, existingProgress.id]);
            }
            else {
                await runQuery("INSERT INTO chapter_progress (user_id, lesson_id, chapter_id, completed_at, score) VALUES ($1, $2, $3, $4, $5)", [userId, lessonId, chapterId, completedAt, nextScore]);
            }
            const completedRows = await queryAll(`SELECT id, lesson_id, chapter_id, score, completed_at
         FROM chapter_progress
         WHERE user_id = $1 AND lesson_id = $2`, [userId, lessonId]);
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
                    const savedProgress = await (0, lesson_progression_1.saveLessonProgress)(db, userId, lessonId, 100);
                    if (savedProgress.justCompleted) {
                        await incrementDailyProgress(userId, { lessons: 1 });
                    }
                }
            }
            return res.json({ success: true, nextLessonUnlocked, xpAwarded: wasAlreadyCompleted ? 0 : 50 });
        }
        catch (error) {
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
        }
        catch (error) {
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
            const progressRows = await queryAll(`SELECT lesson, score, completed_at
         FROM progress
         WHERE user_id = $1`, [userId]);
            return res.json(progressRows);
        }
        catch (error) {
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
            const savedProgress = await (0, lesson_progression_1.saveLessonProgress)(db, userId, lessonId, lessonScore);
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Lesson progress could not be saved.";
            return res.status(500).json({ error: message });
        }
    });
    app.get("/vocabulary", (_req, res) => {
        return res.json(data_1.vocabularyTerms);
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
            const existingProgress = await queryOne("SELECT id, correct_count, last_seen FROM vocabulary_progress WHERE user_id = $1 AND word_id = $2 ORDER BY id DESC LIMIT 1", [userId, wordId]);
            if (existingProgress) {
                await runQuery("UPDATE vocabulary_progress SET last_seen = $1, correct_count = correct_count + 1 WHERE id = $2", [todayIso, existingProgress.id]);
                if (!existingProgress.last_seen?.startsWith(todayKey)) {
                    const progressUpdate = await incrementDailyProgress(userId, { words: 1 });
                    return res.json({ success: true, correctCount: existingProgress.correct_count + 1, currentStreak: progressUpdate.currentStreak });
                }
                return res.json({ success: true, correctCount: existingProgress.correct_count + 1 });
            }
            await runQuery("INSERT INTO vocabulary_progress (user_id, word_id, last_seen, correct_count) VALUES ($1, $2, $3, 1)", [userId, wordId, todayIso]);
            const progressUpdate = await incrementDailyProgress(userId, { words: 1 });
            return res.json({ success: true, correctCount: 1, currentStreak: progressUpdate.currentStreak });
        }
        catch (error) {
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
            const progressUpdate = mode === "increment"
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
        }
        catch (error) {
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Daily progress could not be loaded.";
            return res.status(500).json({ error: message });
        }
    });
    app.post("/pronunciation", (req, res) => {
        const sentence = typeof req.body?.sentence === "string" ? req.body.sentence.trim() : "";
        if (!sentence) {
            return res.status(400).json({ error: "Sentence is required." });
        }
        const result = (0, pronunciation_1.scorePronunciation)(sentence);
        return res.json(result);
    });
    app.post("/correct", handleCorrection);
    app.post("/api/correct", handleCorrection);
    app.post("/analyze", handleAnalyze);
    app.post("/chat", handleConversation);
    app.use("/api", routes_1.apiRouter);
    app.use((_req, res) => {
        res.status(404).json({ error: "Route not found." });
    });
    const errorHandler = (error, _req, res, _next) => {
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
    server.on("error", (error) => {
        const message = error.code === "EADDRINUSE"
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
