export type CefrLevel = "A0" | "A1" | "A2" | "B1" | "B2" | "C1";

export type ChapterType = "vocabulary" | "grammar" | "speaking" | "listening" | "quiz";

export type ChapterExercise = {
  question: string;
  options: string[];
  answer: string;
  hindiHint: string;
};

export type ChapterContent = {
  explanation: string;
  hindiExplanation: string;
  examples: string[];
  hindiTranslations: string[];
  exercise: ChapterExercise;
};

export type Chapter = {
  id: string;
  title: string;
  hindiTitle: string;
  type: ChapterType;
  content: ChapterContent;
};

export type Lesson = {
  id: number;
  title: string;
  cefrLevel: CefrLevel;
  durationMinutes: number;
  focus: string;
  hindiSummary: string;
  unlockRequirement: number | null;
  chapters: Chapter[];
};

export type VocabularyCategory =
  | "Work"
  | "Business"
  | "Daily Life"
  | "Travel"
  | "Personality"
  | "Communication"
  | "Meetings"
  | "Interview"
  | "Leadership"
  | "Social";

export type VocabularyTerm = {
  id: number;
  english: string;
  hindi: string;
  hindiPronunciation: string;
  category: VocabularyCategory;
  cefrLevel: CefrLevel;
  usage: string;
  hindiUsage: string;
  useCases: string[];
  memoryTip: string;
  synonyms: string[];
};

type VocabularyTermSeed = Omit<VocabularyTerm, "useCases" | "memoryTip"> & {
  useCases?: string[];
  memoryTip?: string;
};

const defaultUseCasesByCategory: Record<VocabularyCategory, string[]> = {
  Work: ["daily office work", "manager update", "team task"],
  Business: ["sales discussion", "client pitch", "finance review"],
  "Daily Life": ["home routine", "market visit", "phone conversation"],
  Travel: ["station or airport", "cab ride", "hotel stay"],
  Personality: ["self-introduction", "interview answer", "team feedback"],
  Communication: ["call or meeting", "email or chat", "explaining a point"],
  Meetings: ["team sync", "client call", "project review"],
  Interview: ["HR round", "self-description", "joining discussion"],
  Leadership: ["team direction", "strategy talk", "people management"],
  Social: ["friends or family", "events and invites", "small talk"]
};

function buildChapterExplanation(title: string, type: ChapterType) {
  if (type === "vocabulary") {
    return `This chapter builds practical vocabulary around ${title.toLowerCase()} so you can use the words in real conversations, not only in memory drills.`;
  }

  if (type === "grammar") {
    return `This chapter simplifies ${title.toLowerCase()} into an easy pattern with practical examples so the rule becomes usable while speaking.`;
  }

  if (type === "speaking") {
    return `This chapter helps you speak about ${title.toLowerCase()} with a clear structure, natural flow, and enough detail to sound confident.`;
  }

  if (type === "listening") {
    return `This chapter trains your ear for ${title.toLowerCase()} so you can catch familiar phrases and respond with less hesitation.`;
  }

  return `This chapter reviews ${title.toLowerCase()} through a quick decision-based practice so you can lock the lesson into memory.`;
}

function buildHindiChapterExplanation(hindiTitle: string, type: ChapterType) {
  if (type === "vocabulary") {
    return `${hindiTitle} se jude practical words yahan diye gaye hain, taaki tum inhe yaad karke seedha real life mein use kar sako.`;
  }

  if (type === "grammar") {
    return `${hindiTitle} ko yahan simple rule aur easy examples ke saath samjhaya gaya hai, taaki bolte waqt grammar load na lage.`;
  }

  if (type === "speaking") {
    return `${hindiTitle} ko bolne ke liye yahan ready structure diya gaya hai, jisse tum fluent aur confident lag sakte ho.`;
  }

  if (type === "listening") {
    return `${hindiTitle} se judi phrases ko samajhne ke liye yeh chapter tumhari listening awareness ko strong karta hai.`;
  }

  return `${hindiTitle} ko quick quiz format mein revise kiya gaya hai, taaki tumhara recall fast aur accurate ho jaaye.`;
}

function buildMemoryTip(word: string, category: VocabularyCategory) {
  if (category === "Work") {
    return `${word} ko office wale scene se jodo. Socho manager ne yahi word bola aur sab seedha serious mode mein aa gaye.`;
  }

  if (category === "Business") {
    return `${word} ko dukaan ya startup ke paisa-wale moment se link karo. Tab word seedha dimaag mein baithta hai.`;
  }

  if (category === "Daily Life") {
    return `${word} ko apne ghar ya market ke real scene se jodo. Real image bante hi word pakka ho jata hai.`;
  }

  if (category === "Travel") {
    return `${word} ko station, airport, ya cab booking ke rush wale moment mein imagine karo. Word turant yaad rahega.`;
  }

  if (category === "Personality") {
    return `${word} ko kisi asli insaan ke face se jodo. Character image banti hai to word jaldi yaad rehta hai.`;
  }

  if (category === "Communication") {
    return `${word} ko call ya WhatsApp ke context mein socho. Conversation wali memory is word ko sticky bana degi.`;
  }

  if (category === "Meetings") {
    return `${word} ko meeting table, notebook, aur laptop ke scene ke saath yaad karo. Corporate memory strong hoti hai.`;
  }

  if (category === "Interview") {
    return `${word} ko interview chair par baithkar answer dete hue imagine karo. Pressure wali memory word ko lock kar deti hai.`;
  }

  if (category === "Leadership") {
    return `${word} ko team lead mode mein socho, jahan log tumhari next line sunne ka wait kar rahe hain.`;
  }

  return `${word} ko doston, family, ya event ke real scene se jodo. Social words image ke saath sabse fast yaad hote hain.`;
}

export function createChapter(
  id: string,
  title: string,
  hindiTitle: string,
  type: ChapterType,
  examples: Array<[string, string]>,
  exercise: ChapterExercise
): Chapter {
  return {
    id,
    title,
    hindiTitle,
    type,
    content: {
      explanation: buildChapterExplanation(title, type),
      hindiExplanation: buildHindiChapterExplanation(hindiTitle, type),
      examples: examples.map(([english]) => english),
      hindiTranslations: examples.map(([, hindi]) => hindi),
      exercise
    }
  };
}

export function createLesson(
  id: number,
  title: string,
  cefrLevel: CefrLevel,
  durationMinutes: number,
  focus: string,
  hindiSummary: string,
  unlockRequirement: number | null,
  chapters: Chapter[]
): Lesson {
  return {
    id,
    title,
    cefrLevel,
    durationMinutes,
    focus,
    hindiSummary,
    unlockRequirement,
    chapters
  };
}

export function createVocabularyTerm(term: VocabularyTermSeed): VocabularyTerm {
  return {
    ...term,
    useCases: term.useCases ?? defaultUseCasesByCategory[term.category],
    memoryTip: term.memoryTip ?? buildMemoryTip(term.english, term.category)
  };
}
