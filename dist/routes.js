"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const ai_1 = require("./ai");
const data_1 = require("./data");
const pronunciation_1 = require("./pronunciation");
const curriculum_routes_1 = require("./curriculum-routes");
exports.apiRouter = (0, express_1.Router)();
exports.apiRouter.use("/curriculum", curriculum_routes_1.curriculumRouter);
function getWordCount(text) {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Math.round(value)));
}
function buildPronunciationIssues(transcript) {
    const issues = [];
    if (/\b(think|this|that|three|the)\b/i.test(transcript)) {
        issues.push({
            sound: "th",
            word: transcript.match(/\b(think|this|that|three|the)\b/i)?.[0] ?? "think",
            feedback: "Let the tongue touch lightly between the teeth before releasing air."
        });
    }
    if (/\b(very|voice|view|love|leave)\b/i.test(transcript)) {
        issues.push({
            sound: "v/w",
            word: transcript.match(/\b(very|voice|view|love|leave)\b/i)?.[0] ?? "very",
            feedback: "Keep the lower lip lightly on the upper teeth so the sound stays 'v' instead of drifting toward 'w'."
        });
    }
    if (/\b(world|work|why|welcome|window)\b/i.test(transcript)) {
        issues.push({
            sound: "w",
            word: transcript.match(/\b(world|work|why|welcome|window)\b/i)?.[0] ?? "world",
            feedback: "Round the lips gently before starting the sound so the opening stays smooth and clear."
        });
    }
    if (!issues.length) {
        issues.push({
            sound: "stress",
            word: "key phrase",
            feedback: "The sounds are mostly clear. Focus next on stressing the important nouns and verbs more deliberately."
        });
    }
    return issues.slice(0, 3);
}
function buildHindiTips(issues) {
    return issues.map((issue) => {
        if (issue.sound === "th") {
            return "TH sound ke liye jeebh ko halkasa teeth ke beech lao aur hawa ko softly release karo.";
        }
        if (issue.sound === "v/w") {
            return "V aur W ko mix mat karo. V ke liye lower lip ko upper teeth se lightly touch karao.";
        }
        if (issue.sound === "w") {
            return "W sound se pehle lips ko halka round shape do, phir word bolo.";
        }
        return "Important words par thoda stress do aur har phrase ke beech tiny pause lo.";
    });
}
function buildNextPrompt(level, prompt) {
    if (/achievement|success|result/i.test(prompt)) {
        return "Now explain what action you took and what result you got in one more sentence.";
    }
    if (level === "beginner") {
        return "Now say the same idea again with one more short supporting sentence.";
    }
    if (level === "professional") {
        return "Now add one business-style detail about impact, timeline, or next step.";
    }
    return "Now add one specific detail about when, why, or what happened next.";
}
function buildSimulationHint(level) {
    if (level === "beginner") {
        return "Answer ko do chhote parts mein do: pehle need bolo, phir polite request bolo.";
    }
    if (level === "professional") {
        return "Pehle context do, phir impact bolo, aur last mein clear next step request karo.";
    }
    return "Pehle situation bolo, phir apni request ya response ko clear English mein add karo.";
}
exports.apiRouter.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "bolo-english-api" });
});
exports.apiRouter.get("/lessons", (req, res) => {
    const level = req.query.level?.toString();
    const data = level ? data_1.lessons.filter((lesson) => lesson.cefrLevel === level) : data_1.lessons;
    res.json(data.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        cefrLevel: lesson.cefrLevel,
        durationMinutes: lesson.durationMinutes,
        focus: lesson.focus,
        hindiSummary: lesson.hindiSummary,
        unlockRequirement: lesson.unlockRequirement
    })));
});
exports.apiRouter.get("/grammar-topics", (_req, res) => {
    res.json(data_1.grammarTopics);
});
exports.apiRouter.get("/vocabulary", (req, res) => {
    const category = req.query.category?.toString();
    const data = category ? data_1.vocabularyTerms.filter((term) => term.category.toLowerCase() === category.toLowerCase()) : data_1.vocabularyTerms;
    res.json(data);
});
exports.apiRouter.get("/conversations/scenarios", (_req, res) => {
    res.json(data_1.scenarios);
});
exports.apiRouter.post("/speaking/session", (req, res) => {
    const schema = zod_1.z.object({
        userId: zod_1.z.union([zod_1.z.string().uuid(), zod_1.z.number().int().positive()]).optional(),
        prompt: zod_1.z.string().min(3),
        transcribedText: zod_1.z.string().min(3),
        level: zod_1.z.enum(["beginner", "intermediate", "advanced", "professional"])
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid speaking session payload.", details: parsed.error.flatten() });
    }
    const analysis = (0, ai_1.analyzeSentence)(parsed.data.transcribedText);
    const pronunciation = (0, pronunciation_1.scorePronunciation)(parsed.data.transcribedText);
    const wordCount = getWordCount(parsed.data.transcribedText);
    const correctedChanged = analysis.corrected.trim() !== parsed.data.transcribedText.trim();
    const fluencyScore = clamp(54 + wordCount * 2, 46, 94);
    const grammarScore = clamp(pronunciation.score - (correctedChanged ? 8 : 0) + 6, 52, 95);
    return res.json({
        feedback: `${analysis.fluencyFeedback} ${pronunciation.feedback}`,
        hindiExplanation: analysis.explanation,
        fluencyScore,
        grammarScore,
        nextPrompt: buildNextPrompt(parsed.data.level, parsed.data.prompt)
    });
});
exports.apiRouter.post("/pronunciation/analyze", (req, res) => {
    const schema = zod_1.z.object({
        transcript: zod_1.z.string().min(3),
        ipaHint: zod_1.z.string().optional(),
        audioUrl: zod_1.z.string().url().optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid pronunciation payload.", details: parsed.error.flatten() });
    }
    const pronunciation = (0, pronunciation_1.scorePronunciation)(parsed.data.transcript);
    const issues = buildPronunciationIssues(parsed.data.transcript);
    return res.json({
        overallScore: pronunciation.score,
        issues,
        hindiTips: buildHindiTips(issues)
    });
});
exports.apiRouter.post("/conversations/simulate", (req, res) => {
    const schema = zod_1.z.object({
        scenarioId: zod_1.z.number().int(),
        learnerMessage: zod_1.z.string().min(3),
        proficiency: zod_1.z.enum(["beginner", "intermediate", "advanced", "professional"])
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid simulation payload.", details: parsed.error.flatten() });
    }
    const scenario = data_1.scenarios.find((item) => item.id === parsed.data.scenarioId);
    if (!scenario) {
        return res.status(404).json({ error: "Scenario not found." });
    }
    const learnerMessage = parsed.data.learnerMessage.trim();
    const followUpQuestion = parsed.data.proficiency === "beginner"
        ? "Can you say that again in one simple sentence?"
        : "Can you add one more concrete detail so I can help you better?";
    return res.json({
        scenario: scenario.title,
        aiResponse: `I understand. You said: "${learnerMessage}". In this ${scenario.title.toLowerCase()} scenario, ${followUpQuestion}`,
        hintInHindi: buildSimulationHint(parsed.data.proficiency),
        suggestedReply: parsed.data.proficiency === "professional"
            ? "Certainly. The issue started this morning, it is affecting the client timeline, and I need a resolution in the next hour."
            : "Sure. The problem started today, and I need help with the next step, please."
    });
});
