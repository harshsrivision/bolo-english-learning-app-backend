import type { CefrLevel, Lesson, VocabularyCategory, VocabularyTerm } from "./content-builders";
import { foundationLessons } from "./lessons-a0-a1";
import { a2Lessons } from "./lessons-a2";
import { b1Lessons } from "./lessons-b1";
import { advancedLessons } from "./lessons-b2-c1";
import { foundationVocabularyTerms } from "./vocabulary-foundation";
import { advancedVocabularyTerms } from "./vocabulary-advanced";

export type { CefrLevel, Lesson, VocabularyCategory, VocabularyTerm } from "./content-builders";

export type GrammarTopic = {
  id: number;
  englishTitle: string;
  hindiTitle: string;
  explanation: string;
  example: string;
  level: "beginner" | "intermediate" | "advanced" | "professional";
};

export type Scenario = {
  id: number;
  title: string;
  context: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "professional";
  targetOutcome: string;
};

export const lessons: Lesson[] = [...foundationLessons, ...a2Lessons, ...b1Lessons, ...advancedLessons];

export const grammarTopics: GrammarTopic[] = [
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

export const vocabularyTerms: VocabularyTerm[] = [...foundationVocabularyTerms, ...advancedVocabularyTerms];

export const scenarios: Scenario[] = [
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
