"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessons = void 0;
const data_1 = require("./data");
exports.lessons = data_1.lessons.map((lesson) => ({
    id: lesson.id,
    level: lesson.cefrLevel,
    title: lesson.title,
    example: lesson.chapters[0]?.content.examples[0] ?? lesson.focus
}));
