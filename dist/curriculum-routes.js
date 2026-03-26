"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.curriculumRouter = void 0;
const express_1 = require("express");
const curriculum_data_1 = require("./generated/curriculum-data");
exports.curriculumRouter = (0, express_1.Router)();
function parseLevelId(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 4 ? parsed : null;
}
function parseChapterId(value) {
    if (!value) {
        return null;
    }
    const normalizedValue = value.trim();
    if (/^L\d+-C\d+$/i.test(normalizedValue)) {
        return normalizedValue.toUpperCase();
    }
    const match = normalizedValue.match(/^(\d+)-(\d+)$/);
    if (!match) {
        return null;
    }
    const levelId = Number(match[1]);
    const chapterOrder = Number(match[2]);
    if (!Number.isInteger(levelId) || levelId < 1 || levelId > 4 || !Number.isInteger(chapterOrder) || chapterOrder < 1) {
        return null;
    }
    return `L${levelId}-C${chapterOrder}`;
}
function buildChapterRouteId(chapterId) {
    const match = chapterId.match(/^L(\d+)-C(\d+)$/i);
    if (!match) {
        return chapterId;
    }
    return `${match[1]}-${match[2]}`;
}
function deriveChapterType(title, summary) {
    const combined = `${title} ${summary}`.toLowerCase();
    if (/sound|first|survival|basic|introduction/.test(combined)) {
        return "Foundation";
    }
    if (/home|family|daily|travel|shop|community|routine|life/.test(combined)) {
        return "Daily Life";
    }
    if (/speak|conversation|discussion|talk|presentation|interview|role-play/.test(combined)) {
        return "Speaking";
    }
    if (/work|office|professional|client|business|leadership|meeting/.test(combined)) {
        return "Professional";
    }
    return "Revision";
}
exports.curriculumRouter.get("/manifest", (_req, res) => {
    res.json(curriculum_data_1.curriculumManifest);
});
exports.curriculumRouter.get("/structure", (_req, res) => {
    res.json(curriculum_data_1.curriculumStructure);
});
exports.curriculumRouter.get("/systems", (_req, res) => {
    res.json(curriculum_data_1.completeCurriculumCourse.systems);
});
exports.curriculumRouter.get("/levels", (_req, res) => {
    res.json(curriculum_data_1.curriculumStructure.levels);
});
exports.curriculumRouter.get("/levels/:levelId", (req, res) => {
    const levelId = parseLevelId(req.params.levelId);
    if (!levelId) {
        return res.status(400).json({ error: "Level ID must be 1, 2, 3, or 4." });
    }
    const level = (0, curriculum_data_1.getCurriculumLevel)(levelId);
    if (!level) {
        return res.status(404).json({ error: "Level not found." });
    }
    return res.json(level);
});
exports.curriculumRouter.get("/levels/:levelId/lessons", (req, res) => {
    const levelId = parseLevelId(req.params.levelId);
    if (!levelId) {
        return res.status(400).json({ error: "Level ID must be 1, 2, 3, or 4." });
    }
    const lessons = curriculum_data_1.completeCurriculumCourse.lessons.filter((lesson) => lesson.level === levelId);
    return res.json(lessons);
});
exports.curriculumRouter.get("/chapters/:levelId", (req, res) => {
    const levelId = parseLevelId(req.params.levelId);
    if (!levelId) {
        return res.status(400).json({ error: "Level ID must be 1, 2, 3, or 4." });
    }
    const level = (0, curriculum_data_1.getCurriculumLevel)(levelId);
    if (!level) {
        return res.status(404).json({ error: "Level not found." });
    }
    return res.json(level.chapters.map((chapter) => ({
        level: level.level,
        level_title: level.title,
        cefr_band: level.cefr_band,
        chapter_id: chapter.chapter_id,
        route_id: buildChapterRouteId(chapter.chapter_id),
        order_index: chapter.order_index,
        title: chapter.title,
        summary: chapter.summary,
        kind: deriveChapterType(chapter.title, chapter.summary),
        type: deriveChapterType(chapter.title, chapter.summary),
        lesson_count: chapter.lesson_titles.length,
        lesson_titles: chapter.lesson_titles
    })));
});
exports.curriculumRouter.get("/levels/1/phase-2", (_req, res) => {
    res.json(curriculum_data_1.level1CurriculumLessons);
});
exports.curriculumRouter.get("/lessons/:lessonId", (req, res) => {
    const requestedId = req.params.lessonId?.trim();
    const chapterId = parseChapterId(requestedId);
    if (chapterId) {
        const lessons = curriculum_data_1.completeCurriculumCourse.lessons.filter((lesson) => lesson.chapter_id === chapterId);
        if (!lessons.length) {
            return res.status(404).json({ error: "Chapter not found." });
        }
        return res.json(lessons);
    }
    const lesson = (0, curriculum_data_1.getCurriculumLesson)(requestedId ?? "");
    if (!lesson) {
        return res.status(404).json({ error: "Lesson not found." });
    }
    return res.json(lesson);
});
