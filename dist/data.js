"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scenarios = exports.vocabularyTerms = exports.grammarTopics = exports.lessons = void 0;
const lessons_a0_a1_1 = require("./lessons-a0-a1");
const lessons_a2_1 = require("./lessons-a2");
const lessons_b1_1 = require("./lessons-b1");
const lessons_b2_c1_1 = require("./lessons-b2-c1");
const vocabulary_foundation_1 = require("./vocabulary-foundation");
const vocabulary_advanced_1 = require("./vocabulary-advanced");
exports.lessons = [...lessons_a0_a1_1.foundationLessons, ...lessons_a2_1.a2Lessons, ...lessons_b1_1.b1Lessons, ...lessons_b2_c1_1.advancedLessons];
exports.grammarTopics = [
    {
        id: 1,
        englishTitle: "Simple Present",
        hindiTitle: "Simple Present Tense",
        explanation: "Jab hum habit, routine ya universal truth ke baare mein bolte hain tab simple present use hota hai.",
        example: "I go to the office every day. / Main roz office jata hoon.",
        level: "beginner"
    },
    {
        id: 2,
        englishTitle: "Present Continuous",
        hindiTitle: "Present Continuous Tense",
        explanation: "Jo kaam abhi chal raha hai uske liye is tense ka use hota hai. Helping verb plus verb-ing lagta hai.",
        example: "She is speaking with the teacher. / Woh teacher se baat kar rahi hai.",
        level: "beginner"
    },
    {
        id: 3,
        englishTitle: "Modal Verbs",
        hindiTitle: "Can, Could, Should ka use",
        explanation: "Permission, ability, suggestion aur polite request batane ke liye modal verbs ka use hota hai.",
        example: "Could you repeat that please? / Kya aap ise dobara bol sakte hain?",
        level: "intermediate"
    },
    {
        id: 4,
        englishTitle: "Professional Connectors",
        hindiTitle: "Formal linking phrases",
        explanation: "Presentation aur meetings mein ideas ko connect karne ke liye however, therefore, in addition jaise phrases use hote hain.",
        example: "Therefore, we recommend a phased rollout. / Isliye hum phase-wise rollout suggest karte hain.",
        level: "professional"
    }
];
exports.vocabularyTerms = [...vocabulary_foundation_1.foundationVocabularyTerms, ...vocabulary_advanced_1.advancedVocabularyTerms];
exports.scenarios = [
    {
        id: 1,
        title: "Restaurant Visit",
        context: "Practice ordering food, asking about the menu, and paying politely.",
        difficulty: "beginner",
        targetOutcome: "Speak clearly in a basic public interaction."
    },
    {
        id: 2,
        title: "Job Interview",
        context: "Answer common interview questions with Hindi hints and follow-up prompts.",
        difficulty: "advanced",
        targetOutcome: "Explain experience and strengths with confidence."
    },
    {
        id: 3,
        title: "Client Escalation Call",
        context: "Handle an upset customer, show empathy, and propose next steps.",
        difficulty: "professional",
        targetOutcome: "Maintain calm, clarity, and authority in spoken English."
    }
];
