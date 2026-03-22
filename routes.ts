import { Router } from "express";
import { z } from "zod";
import { analyzeSentence } from "./ai";
import { grammarTopics, lessons, scenarios, vocabularyTerms } from "./data";
import { scorePronunciation } from "./pronunciation";

export const apiRouter = Router();

type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "professional";

type PronunciationIssue = {
  sound: string;
  word: string;
  feedback: string;
};

function getWordCount(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function buildPronunciationIssues(transcript: string) {
  const issues: PronunciationIssue[] = [];

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

function buildHindiTips(issues: PronunciationIssue[]) {
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

function buildNextPrompt(level: ProficiencyLevel, prompt: string) {
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

function buildSimulationHint(level: ProficiencyLevel) {
  if (level === "beginner") {
    return "Answer ko do chhote parts mein do: pehle need bolo, phir polite request bolo.";
  }

  if (level === "professional") {
    return "Pehle context do, phir impact bolo, aur last mein clear next step request karo.";
  }

  return "Pehle situation bolo, phir apni request ya response ko clear English mein add karo.";
}

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bolo-english-api" });
});

apiRouter.get("/lessons", (req, res) => {
  const level = req.query.level?.toString();
  const data = level ? lessons.filter((lesson) => lesson.level === level) : lessons;
  res.json(data);
});

apiRouter.get("/grammar-topics", (_req, res) => {
  res.json(grammarTopics);
});

apiRouter.get("/vocabulary", (req, res) => {
  const category = req.query.category?.toString();
  const data = category
    ? vocabularyTerms.filter((term) => term.category.toLowerCase() === category.toLowerCase())
    : vocabularyTerms;

  res.json(data);
});

apiRouter.get("/conversations/scenarios", (_req, res) => {
  res.json(scenarios);
});

apiRouter.post("/speaking/session", (req, res) => {
  const schema = z.object({
    userId: z.union([z.string().uuid(), z.number().int().positive()]).optional(),
    prompt: z.string().min(3),
    transcribedText: z.string().min(3),
    level: z.enum(["beginner", "intermediate", "advanced", "professional"])
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid speaking session payload.", details: parsed.error.flatten() });
  }

  const analysis = analyzeSentence(parsed.data.transcribedText);
  const pronunciation = scorePronunciation(parsed.data.transcribedText);
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

apiRouter.post("/pronunciation/analyze", (req, res) => {
  const schema = z.object({
    transcript: z.string().min(3),
    ipaHint: z.string().optional(),
    audioUrl: z.string().url().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid pronunciation payload.", details: parsed.error.flatten() });
  }

  const pronunciation = scorePronunciation(parsed.data.transcript);
  const issues = buildPronunciationIssues(parsed.data.transcript);

  return res.json({
    overallScore: pronunciation.score,
    issues,
    hindiTips: buildHindiTips(issues)
  });
});

apiRouter.post("/conversations/simulate", (req, res) => {
  const schema = z.object({
    scenarioId: z.number().int(),
    learnerMessage: z.string().min(3),
    proficiency: z.enum(["beginner", "intermediate", "advanced", "professional"])
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid simulation payload.", details: parsed.error.flatten() });
  }

  const scenario = scenarios.find((item) => item.id === parsed.data.scenarioId);
  if (!scenario) {
    return res.status(404).json({ error: "Scenario not found." });
  }

  const learnerMessage = parsed.data.learnerMessage.trim();
  const followUpQuestion =
    parsed.data.proficiency === "beginner"
      ? "Can you say that again in one simple sentence?"
      : "Can you add one more concrete detail so I can help you better?";

  return res.json({
    scenario: scenario.title,
    aiResponse: `I understand. You said: "${learnerMessage}". In this ${scenario.title.toLowerCase()} scenario, ${followUpQuestion}`,
    hintInHindi: buildSimulationHint(parsed.data.proficiency),
    suggestedReply:
      parsed.data.proficiency === "professional"
        ? "Certainly. The issue started this morning, it is affecting the client timeline, and I need a resolution in the next hour."
        : "Sure. The problem started today, and I need help with the next step, please."
  });
});
