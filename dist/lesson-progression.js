"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonExists = lessonExists;
exports.getCompletedLessonIds = getCompletedLessonIds;
exports.ensureUserLessonsInitialized = ensureUserLessonsInitialized;
exports.getLessonsForUser = getLessonsForUser;
exports.saveLessonProgress = saveLessonProgress;
const lessons_1 = require("./lessons");
function parseLessonId(value) {
    if (!value) {
        return null;
    }
    const parsedLessonId = Number(value);
    return Number.isInteger(parsedLessonId) && parsedLessonId > 0 ? parsedLessonId : null;
}
function toBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    if (typeof value === "string") {
        return value === "1" || value.toLowerCase() === "true";
    }
    return false;
}
function isCompletedProgress(row) {
    return Boolean(row.completed_at) || (typeof row.score === "number" && row.score >= 100);
}
function getNextLessonId(currentLessonId) {
    const lessonIndex = lessons_1.lessons.findIndex((lesson) => lesson.id === currentLessonId);
    if (lessonIndex < 0) {
        return null;
    }
    return lessons_1.lessons[lessonIndex + 1]?.id ?? null;
}
function getInitialUnlockedLessonIds(completedLessonIds) {
    const unlockedLessonIds = new Set();
    if (lessons_1.lessons[0]) {
        unlockedLessonIds.add(lessons_1.lessons[0].id);
    }
    for (const lessonId of completedLessonIds) {
        unlockedLessonIds.add(lessonId);
        const nextLessonId = getNextLessonId(lessonId);
        if (nextLessonId !== null) {
            unlockedLessonIds.add(nextLessonId);
        }
    }
    return unlockedLessonIds;
}
async function loadProgressRows(db, userId) {
    const result = await db.query(`SELECT lesson, score, completed_at
     FROM progress
     WHERE user_id = $1`, [userId]);
    return result.rows;
}
async function loadStoredUserLessons(db, userId) {
    const result = await db.query(`SELECT lesson_id, is_unlocked
     FROM user_lessons
     WHERE user_id = $1`, [userId]);
    return result.rows;
}
async function unlockLessonForUser(db, userId, lessonId) {
    const result = await db.query(`SELECT lesson_id, is_unlocked
     FROM user_lessons
     WHERE user_id = $1 AND lesson_id = $2
     LIMIT 1`, [userId, lessonId]);
    const storedLesson = result.rows[0];
    if (!storedLesson) {
        await db.query("INSERT INTO user_lessons (user_id, lesson_id, is_unlocked) VALUES ($1, $2, $3)", [userId, lessonId, true]);
        return true;
    }
    if (toBoolean(storedLesson.is_unlocked)) {
        return false;
    }
    await db.query("UPDATE user_lessons SET is_unlocked = $1 WHERE user_id = $2 AND lesson_id = $3", [true, userId, lessonId]);
    return true;
}
function lessonExists(lessonId) {
    return lessons_1.lessons.some((lesson) => lesson.id === lessonId);
}
async function getCompletedLessonIds(db, userId) {
    const completedLessonIds = new Set();
    const progressRows = await loadProgressRows(db, userId);
    for (const row of progressRows) {
        const lessonId = parseLessonId(row.lesson);
        if (lessonId !== null && isCompletedProgress(row)) {
            completedLessonIds.add(lessonId);
        }
    }
    return Array.from(completedLessonIds);
}
async function ensureUserLessonsInitialized(db, userId) {
    if (!lessons_1.lessons.length) {
        return;
    }
    const [completedLessonIds, storedUserLessons] = await Promise.all([getCompletedLessonIds(db, userId), loadStoredUserLessons(db, userId)]);
    const initialUnlockedLessonIds = getInitialUnlockedLessonIds(completedLessonIds);
    const storedLessonsById = new Map();
    for (const row of storedUserLessons) {
        storedLessonsById.set(Number(row.lesson_id), row);
    }
    for (const lesson of lessons_1.lessons) {
        const storedLesson = storedLessonsById.get(lesson.id);
        if (!storedLesson) {
            await db.query("INSERT INTO user_lessons (user_id, lesson_id, is_unlocked) VALUES ($1, $2, $3)", [
                userId,
                lesson.id,
                initialUnlockedLessonIds.has(lesson.id)
            ]);
            continue;
        }
        if (initialUnlockedLessonIds.has(lesson.id) && !toBoolean(storedLesson.is_unlocked)) {
            await db.query("UPDATE user_lessons SET is_unlocked = $1 WHERE user_id = $2 AND lesson_id = $3", [true, userId, lesson.id]);
        }
    }
}
async function getLessonsForUser(db, userId) {
    await ensureUserLessonsInitialized(db, userId);
    const [completedLessonIds, storedUserLessons] = await Promise.all([getCompletedLessonIds(db, userId), loadStoredUserLessons(db, userId)]);
    const completedLessonIdSet = new Set(completedLessonIds);
    const unlockedLessonMap = new Map();
    for (const row of storedUserLessons) {
        unlockedLessonMap.set(Number(row.lesson_id), toBoolean(row.is_unlocked));
    }
    return lessons_1.lessons.map((lesson) => ({
        ...lesson,
        isUnlocked: completedLessonIdSet.has(lesson.id) || unlockedLessonMap.get(lesson.id) === true,
        isCompleted: completedLessonIdSet.has(lesson.id)
    }));
}
async function saveLessonProgress(db, userId, lessonId, lessonScore) {
    await ensureUserLessonsInitialized(db, userId);
    const result = await db.query(`SELECT id, score, completed_at
     FROM progress
     WHERE user_id = $1 AND lesson = $2
     ORDER BY id DESC
     LIMIT 1`, [userId, String(lessonId)]);
    const existingProgress = result.rows[0];
    const nextScore = Math.max(existingProgress?.score ?? 0, lessonScore);
    const alreadyCompleted = existingProgress ? isCompletedProgress(existingProgress) : false;
    const justCompleted = !alreadyCompleted && nextScore >= 100;
    const completedAt = existingProgress?.completed_at ?? (nextScore >= 100 ? new Date().toISOString() : null);
    if (existingProgress) {
        await db.query(`UPDATE progress
       SET score = $1,
           completed_at = $2
       WHERE id = $3`, [nextScore, completedAt, existingProgress.id]);
    }
    else {
        await db.query("INSERT INTO progress (user_id, lesson, score, completed_at) VALUES ($1, $2, $3, $4)", [
            userId,
            String(lessonId),
            nextScore,
            completedAt
        ]);
    }
    let nextLessonId = null;
    let nextLessonUnlocked = false;
    if (nextScore >= 100) {
        await unlockLessonForUser(db, userId, lessonId);
        nextLessonId = getNextLessonId(lessonId);
        if (nextLessonId !== null) {
            nextLessonUnlocked = await unlockLessonForUser(db, userId, nextLessonId);
        }
    }
    return {
        alreadyCompleted,
        justCompleted,
        nextLessonId,
        nextLessonUnlocked
    };
}
