import { lessons as lessonCatalog } from "./data";

export const lessons = lessonCatalog.map((lesson) => ({
  id: lesson.id,
  level: lesson.cefrLevel,
  title: lesson.title,
  example: lesson.chapters[0]?.content.examples[0] ?? lesson.focus
}));
