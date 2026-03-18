"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const data_1 = require("./data");
exports.apiRouter = (0, express_1.Router)();
exports.apiRouter.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "bolo-english-api" });
});
exports.apiRouter.get("/lessons", (req, res) => {
    const level = req.query.level?.toString();
    const data = level ? data_1.lessons.filter((lesson) => lesson.level === level) : data_1.lessons;
    res.json(data);
});
exports.apiRouter.get("/grammar-topics", (_req, res) => {
    res.json(data_1.grammarTopics);
});
exports.apiRouter.get("/vocabulary", (req, res) => {
    const category = req.query.category?.toString();
    const data = category
        ? data_1.vocabularyTerms.filter((term) => term.category.toLowerCase() === category.toLowerCase())
        : data_1.vocabularyTerms;
    res.json(data);
});
exports.apiRouter.get("/conversations/scenarios", (_req, res) => {
    res.json(data_1.scenarios);
});
exports.apiRouter.post("/speaking/session", (req, res) => {
    const schema = zod_1.z.object({
        userId: zod_1.z.string().uuid().optional(),
        prompt: zod_1.z.string().min(3),
        transcribedText: zod_1.z.string().min(3),
        level: zod_1.z.enum(["beginner", "intermediate", "advanced", "professional"])
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid speaking session payload.", details: parsed.error.flatten() });
    }
    return res.json({
        feedback: "Good structure. Slow down slightly and stress the main nouns more clearly.",
        hindiExplanation: "Sentence sahi hai, lekin speed thodi kam rakho aur important words par zyada stress do.",
        fluencyScore: 78,
        grammarScore: 82,
        nextPrompt: "Now explain one recent achievement in your work."
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
    return res.json({
        overallScore: 74,
        issues: [
            {
                sound: "v/w",
                word: "very",
                feedback: "The initial sound is drifting toward 'w'. Keep the lower lip lightly on the upper teeth."
            },
            {
                sound: "th",
                word: "think",
                feedback: "Let the tongue touch lightly between the teeth before releasing air."
            }
        ],
        hindiTips: [
            "V aur W ka fark clear rakhne ke liye mirror practice karo.",
            "TH sound ke liye jeebh ko halkasa teeth ke beech lao."
        ]
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
    return res.json({
        scenario: scenario.title,
        aiResponse: `I understand your point. Could you explain that in a little more detail so I can help you better in this ${scenario.title.toLowerCase()} scenario?`,
        hintInHindi: "Answer ko do parts mein do: pehle problem bolo, phir request bolo.",
        suggestedReply: "Certainly. The issue started this morning, and I need a quick resolution before the client meeting."
    });
});
