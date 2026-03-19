"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const node_path_1 = require("node:path");
const ai_1 = require("./ai");
const auth_1 = require("./auth");
const conversation_1 = require("./conversation");
const database_1 = require("./database");
const lessons_1 = require("./lessons");
const pronunciation_1 = require("./pronunciation");
const routes_1 = require("./routes");
dotenv_1.default.config({ path: (0, node_path_1.resolve)(process.cwd(), ".env") });
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
        const suffix = patternUrl.hostname.replace(/^placeholder\\./, "");
        return originUrl.protocol === patternUrl.protocol && (originUrl.hostname === suffix || originUrl.hostname.endsWith("." + suffix));
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
        const isAllowed = allowedOriginPatterns.some((pattern) => matchesOriginPattern(normalizedOrigin, pattern));
        callback(null, isAllowed);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
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
    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}
function parseNonNegativeInteger(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}
function toDayNumber(date) {
    const [year, month, day] = date.split("-").map((value) => Number(value));
    if (![year, month, day].every((value) => Number.isInteger(value) && value > 0)) {
        return null;
    }
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
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
    async function getTodayDailyProgress(userId) {
        return db.get(`SELECT id, user_id, date, sentences_spoken, words_learned, lessons_completed
       FROM daily_progress
       WHERE user_id = ? AND date = ?
       ORDER BY id DESC
       LIMIT 1`, [userId, getTodayDateKey()]);
    }
    async function persistDailyProgress(userId, counts) {
        const today = getTodayDateKey();
        const existingProgress = await getTodayDailyProgress(userId);
        if (existingProgress) {
            await db.run(`UPDATE daily_progress
         SET sentences_spoken = ?, words_learned = ?, lessons_completed = ?
         WHERE id = ?`, [counts.sentences, counts.words, counts.lessons, existingProgress.id]);
        }
        else {
            await db.run("INSERT INTO daily_progress (user_id, date, sentences_spoken, words_learned, lessons_completed) VALUES (?, ?, ?, ?, ?)", [userId, today, counts.sentences, counts.words, counts.lessons]);
        }
        return {
            user_id: userId,
            date: today,
            sentences_spoken: counts.sentences,
            words_learned: counts.words,
            lessons_completed: counts.lessons
        };
    }
    async function calculateCurrentStreak(userId) {
        const activityRows = await db.all(`SELECT DISTINCT date
       FROM daily_progress
       WHERE user_id = ?
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
        await db.run("UPDATE users SET streak = ? WHERE id = ?", [streak, userId]);
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
        return {
            counts: nextCounts,
            currentStreak
        };
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
        return {
            counts: nextCounts,
            currentStreak
        };
    }
    async function getDashboardSummary(userId) {
        const todayProgress = await getTodayDailyProgress(userId);
        const totalLessonsCompleted = await db.get("SELECT COUNT(*) AS count FROM progress WHERE user_id = ?", [userId]);
        const totalVocabularyLearned = await db.get("SELECT COUNT(DISTINCT word_id) AS count FROM vocabulary_progress WHERE user_id = ?", [userId]);
        const currentStreak = await syncUserStreak(userId);
        return {
            user_id: userId,
            date: getTodayDateKey(),
            sentences_spoken: todayProgress?.sentences_spoken ?? 0,
            words_learned: todayProgress?.words_learned ?? 0,
            lessons_completed: todayProgress?.lessons_completed ?? 0,
            current_streak: currentStreak,
            total_lessons_completed: totalLessonsCompleted?.count ?? 0,
            total_vocabulary_learned: totalVocabularyLearned?.count ?? 0
        };
    }
    app.post("/signup", async (req, res) => {
        const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const password = typeof req.body?.password === "string" ? req.body.password : "";
        const createdAt = new Date().toISOString();
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required." });
        }
        try {
            const result = await db.run("INSERT INTO users (name, email, password, created_at, level) VALUES (?, ?, ?, ?, ?)", [name, email, (0, auth_1.hashPassword)(password), createdAt, "Beginner"]);
            return res.json({ userId: result.lastID });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Signup failed.";
            if (message.includes("UNIQUE")) {
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
            const user = await db.get("SELECT id, password FROM users WHERE email = ?", [email]);
            if (!user?.password || !(0, auth_1.verifyPassword)(password, user.password)) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
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
            const result = await db.run("INSERT INTO users (name, level, created_at) VALUES (?, ?, ?)", [name, "Beginner", createdAt]);
            return res.json({ userId: result.lastID });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "User creation failed.";
            return res.status(500).json({ error: message });
        }
    });
    app.get("/lessons", (_req, res) => {
        return res.json(lessons_1.lessons);
    });
    app.get("/lesson-progress/:userId", async (req, res) => {
        const userId = Number(req.params.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ error: "User ID must be a positive integer." });
        }
        try {
            const progressRows = await db.all(`SELECT lesson, score, completed_at
         FROM progress
         WHERE user_id = ?`, [userId]);
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
        const completedAt = new Date().toISOString();
        if (!userId || !lessonId) {
            return res.status(400).json({ error: "User ID and lesson ID must be positive integers." });
        }
        try {
            const existingProgress = await db.get("SELECT id FROM progress WHERE user_id = ? AND lesson = ? ORDER BY id DESC LIMIT 1", [userId, String(lessonId)]);
            if (existingProgress) {
                await db.run(`UPDATE progress
           SET score = MAX(COALESCE(score, 0), ?),
               completed_at = COALESCE(completed_at, ?)
           WHERE id = ?`, [lessonScore, completedAt, existingProgress.id]);
                const currentStreak = await syncUserStreak(userId);
                return res.json({
                    success: true,
                    alreadyCompleted: true,
                    currentStreak
                });
            }
            await db.run("INSERT INTO progress (user_id, lesson, score, completed_at) VALUES (?, ?, ?, ?)", [
                userId,
                String(lessonId),
                lessonScore,
                completedAt
            ]);
            const progressUpdate = await incrementDailyProgress(userId, { lessons: 1 });
            return res.json({
                success: true,
                alreadyCompleted: false,
                currentStreak: progressUpdate.currentStreak,
                lessonsCompletedToday: progressUpdate.counts.lessons
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Lesson progress could not be saved.";
            return res.status(500).json({ error: message });
        }
    });
    app.get("/vocabulary", async (_req, res) => {
        try {
            const words = await db.all("SELECT * FROM vocabulary LIMIT 5");
            return res.json(words);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Vocabulary could not be loaded.";
            return res.status(500).json({ error: message });
        }
    });
    app.post("/vocabulary-progress", async (req, res) => {
        const userId = parsePositiveInteger(req.body?.userId);
        const wordId = parsePositiveInteger(req.body?.wordId);
        const todayIso = new Date().toISOString();
        const todayKey = getTodayDateKey();
        if (!userId || !wordId) {
            return res.status(400).json({ error: "User ID and word ID must be positive integers." });
        }
        try {
            const existingProgress = await db.get("SELECT id, correct_count, last_seen FROM vocabulary_progress WHERE user_id = ? AND word_id = ? ORDER BY id DESC LIMIT 1", [userId, wordId]);
            if (existingProgress) {
                await db.run("UPDATE vocabulary_progress SET last_seen = ?, correct_count = correct_count + 1 WHERE id = ?", [todayIso, existingProgress.id]);
                if (!existingProgress.last_seen?.startsWith(todayKey)) {
                    const progressUpdate = await incrementDailyProgress(userId, { words: 1 });
                    return res.json({
                        success: true,
                        correctCount: existingProgress.correct_count + 1,
                        currentStreak: progressUpdate.currentStreak
                    });
                }
                return res.json({ success: true, correctCount: existingProgress.correct_count + 1 });
            }
            await db.run("INSERT INTO vocabulary_progress (user_id, word_id, last_seen, correct_count) VALUES (?, ?, ?, 1)", [userId, wordId, todayIso]);
            const progressUpdate = await incrementDailyProgress(userId, { words: 1 });
            return res.json({
                success: true,
                correctCount: 1,
                currentStreak: progressUpdate.currentStreak
            });
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
        try {
            const progressUpdate = mode === "increment"
                ? await incrementDailyProgress(userId, {
                    sentences,
                    words,
                    lessons: lessonCount
                })
                : await saveDailyProgressMaximum(userId, {
                    sentences,
                    words,
                    lessons: lessonCount
                });
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
    app.listen(PORT, () => {
        console.log(`Bolo English API listening on port ${PORT}`);
    });
}
void bootstrap().catch((error) => {
    const message = error instanceof Error ? error.message : "Server failed to start.";
    console.error(message);
    process.exit(1);
});
