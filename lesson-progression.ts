import type { AppDatabase } from "./database";
import { lessons } from "./lessons";

type ProgressRow = {
  lesson: string | null;
  score: number | null;
  completed_at: string | null;
};

type StoredUserLesson = {
  lesson_id: number;
  is_unlocked: boolean | number | string | null;
};

type StoredLessonProgress = {
  id: number;
  score: number | null;
  completed_at: string | null;
};

export type UserLessonLibraryItem = (typeof lessons)[number] & {
  isUnlocked: boolean;
  isCompleted: boolean;
};

export type SavedLessonProgress = {
  alreadyCompleted: boolean;
  justCompleted: boolean;
  nextLessonId: number | null;
  nextLessonUnlocked: boolean;
};

function parseLessonId(value: string | null) {
  if (!value) {
    return null;
  }

  const parsedLessonId = Number(value);
  return Number.isInteger(parsedLessonId) && parsedLessonId > 0 ? parsedLessonId : null;
}

function toBoolean(value: boolean | number | string | null | undefined) {
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

function isCompletedProgress(row: ProgressRow | StoredLessonProgress) {
  return Boolean(row.completed_at) || (typeof row.score === "number" && row.score >= 100);
}

function getNextLessonId(currentLessonId: number) {
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === currentLessonId);

  if (lessonIndex < 0) {
    return null;
  }

  return lessons[lessonIndex + 1]?.id ?? null;
}

function getInitialUnlockedLessonIds(completedLessonIds: number[]) {
  const unlockedLessonIds = new Set<number>();

  if (lessons[0]) {
    unlockedLessonIds.add(lessons[0].id);
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

async function loadProgressRows(db: AppDatabase, userId: number) {
  const result = await db.query<ProgressRow>(
    `SELECT lesson, score, completed_at
     FROM progress
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows;
}

async function loadStoredUserLessons(db: AppDatabase, userId: number) {
  const result = await db.query<StoredUserLesson>(
    `SELECT lesson_id, is_unlocked
     FROM user_lessons
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows;
}

async function unlockLessonForUser(db: AppDatabase, userId: number, lessonId: number) {
  const result = await db.query<StoredUserLesson>(
    `SELECT lesson_id, is_unlocked
     FROM user_lessons
     WHERE user_id = $1 AND lesson_id = $2
     LIMIT 1`,
    [userId, lessonId]
  );

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

export function lessonExists(lessonId: number) {
  return lessons.some((lesson) => lesson.id === lessonId);
}

export async function getCompletedLessonIds(db: AppDatabase, userId: number) {
  const completedLessonIds = new Set<number>();
  const progressRows = await loadProgressRows(db, userId);

  for (const row of progressRows) {
    const lessonId = parseLessonId(row.lesson);

    if (lessonId !== null && isCompletedProgress(row)) {
      completedLessonIds.add(lessonId);
    }
  }

  return Array.from(completedLessonIds);
}

export async function ensureUserLessonsInitialized(db: AppDatabase, userId: number) {
  if (!lessons.length) {
    return;
  }

  const [completedLessonIds, storedUserLessons] = await Promise.all([getCompletedLessonIds(db, userId), loadStoredUserLessons(db, userId)]);
  const initialUnlockedLessonIds = getInitialUnlockedLessonIds(completedLessonIds);
  const storedLessonsById = new Map<number, StoredUserLesson>();

  for (const row of storedUserLessons) {
    storedLessonsById.set(Number(row.lesson_id), row);
  }

  for (const lesson of lessons) {
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

export async function getLessonsForUser(db: AppDatabase, userId: number): Promise<UserLessonLibraryItem[]> {
  await ensureUserLessonsInitialized(db, userId);

  const [completedLessonIds, storedUserLessons] = await Promise.all([getCompletedLessonIds(db, userId), loadStoredUserLessons(db, userId)]);
  const completedLessonIdSet = new Set(completedLessonIds);
  const unlockedLessonMap = new Map<number, boolean>();

  for (const row of storedUserLessons) {
    unlockedLessonMap.set(Number(row.lesson_id), toBoolean(row.is_unlocked));
  }

  return lessons.map((lesson) => ({
    ...lesson,
    isUnlocked: completedLessonIdSet.has(lesson.id) || unlockedLessonMap.get(lesson.id) === true,
    isCompleted: completedLessonIdSet.has(lesson.id)
  }));
}

export async function saveLessonProgress(db: AppDatabase, userId: number, lessonId: number, lessonScore: number): Promise<SavedLessonProgress> {
  await ensureUserLessonsInitialized(db, userId);

  const result = await db.query<StoredLessonProgress>(
    `SELECT id, score, completed_at
     FROM progress
     WHERE user_id = $1 AND lesson = $2
     ORDER BY id DESC
     LIMIT 1`,
    [userId, String(lessonId)]
  );

  const existingProgress = result.rows[0];
  const nextScore = Math.max(existingProgress?.score ?? 0, lessonScore);
  const alreadyCompleted = existingProgress ? isCompletedProgress(existingProgress) : false;
  const justCompleted = !alreadyCompleted && nextScore >= 100;
  const completedAt = existingProgress?.completed_at ?? (nextScore >= 100 ? new Date().toISOString() : null);

  if (existingProgress) {
    await db.query(
      `UPDATE progress
       SET score = $1,
           completed_at = $2
       WHERE id = $3`,
      [nextScore, completedAt, existingProgress.id]
    );
  } else {
    await db.query("INSERT INTO progress (user_id, lesson, score, completed_at) VALUES ($1, $2, $3, $4)", [
      userId,
      String(lessonId),
      nextScore,
      completedAt
    ]);
  }

  let nextLessonId: number | null = null;
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