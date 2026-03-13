import OpenAI from "openai";

type SentenceAnalysis = {
  corrected: string;
  explanation: string;
  tip: string;
  pronunciationTip: string;
  fluencyFeedback: string;
};

function normalizeSentence(sentence: string) {
  const trimmedSentence = sentence.trim().replace(/\s+/g, " ");

  if (!trimmedSentence) {
    return "";
  }

  const correctedPronouns = trimmedSentence.replace(/\bi\b/g, "I");
  const baseSentence = `${correctedPronouns[0].toUpperCase()}${correctedPronouns.slice(1)}`;

  return /[.!?]$/.test(baseSentence) ? baseSentence : `${baseSentence}.`;
}

function buildExplanation(sentence: string, correctedSentence: string) {
  const notes: string[] = [];
  const trimmedSentence = sentence.trim();

  if (trimmedSentence !== trimmedSentence.replace(/\s+/g, " ")) {
    notes.push("Extra spaces hata do taki sentence clean lage.");
  }

  if (/\bi\b/.test(trimmedSentence) && !/\bI\b/.test(trimmedSentence)) {
    notes.push("Pronoun 'I' ko hamesha capital likho.");
  }

  if (trimmedSentence && trimmedSentence[0] !== trimmedSentence[0]?.toUpperCase()) {
    notes.push("Sentence ka first letter capital hona chahiye.");
  }

  if (trimmedSentence && !/[.!?]$/.test(trimmedSentence)) {
    notes.push("Sentence ke end me punctuation add karo.");
  }

  if (!notes.length && correctedSentence === trimmedSentence) {
    return "Sentence structure natural lag rahi hai. Subject aur verb ka flow sahi hai.";
  }

  if (!notes.length) {
    return "Sentence mostly sahi tha. Maine usko thoda cleaner aur more natural banaya.";
  }

  return notes.join(" ");
}

function buildPronunciationTip(wordCount: number) {
  if (wordCount <= 4) {
    return "Har word ko clearly alag bolo aur last sound ko complete karo.";
  }

  if (wordCount <= 8) {
    return "Important words par halka stress do aur do phrases ke beech short pause rakho.";
  }

  return "Sentence ko 2 ya 3 thought groups me bolo taki pronunciation aur clarity dono improve ho.";
}

function buildFluencyFeedback(wordCount: number) {
  if (wordCount <= 4) {
    return "Response abhi short hai. Ek extra detail jodoge to fluency zyada natural lagegi.";
  }

  if (wordCount <= 8) {
    return "Length theek hai. Pace ko even rakho aur beech me unnecessary pause mat lo.";
  }

  return "Fluency achchi lag rahi hai. Ab ideas ko smoother transitions ke saath jodo.";
}

function buildImprovementTip(sentence: string, correctedSentence: string) {
  if (correctedSentence !== sentence.trim()) {
    return "Bolne se pehle sentence ko ek baar dimag me frame karo, phir slow aur clear pace me bolo.";
  }

  return "Sentence sahi tha. Ab pronunciation aur rhythm par focus karo taki delivery zyada confident lage.";
}

function buildLocalAnalysis(sentence: string): SentenceAnalysis {
  const correctedSentence = normalizeSentence(sentence);
  const wordCount = correctedSentence.split(/\s+/).filter(Boolean).length;

  return {
    corrected: correctedSentence,
    explanation: buildExplanation(sentence, correctedSentence),
    tip: buildImprovementTip(sentence, correctedSentence),
    pronunciationTip: buildPronunciationTip(wordCount),
    fluencyFeedback: buildFluencyFeedback(wordCount)
  };
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

function parseJsonObject(text: string) {
  const cleanedText = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

  try {
    return JSON.parse(cleanedText) as Partial<SentenceAnalysis>;
  } catch {
    return null;
  }
}

function isSentenceAnalysis(value: Partial<SentenceAnalysis> | null): value is SentenceAnalysis {
  return Boolean(
    value &&
      typeof value.corrected === "string" &&
      typeof value.explanation === "string" &&
      typeof value.tip === "string" &&
      typeof value.pronunciationTip === "string" &&
      typeof value.fluencyFeedback === "string"
  );
}

export async function correctSentence(sentence: string) {
  const fallback = buildLocalAnalysis(sentence);
  const client = getClient();

  if (!client) {
    return fallback.corrected;
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `Return only the corrected English sentence. If it is already correct, return it unchanged.\nSentence: ${sentence}`
    });

    return response.output_text.trim() || fallback.corrected;
  } catch {
    return fallback.corrected;
  }
}

export async function analyzeSentence(sentence: string): Promise<SentenceAnalysis> {
  const fallback = buildLocalAnalysis(sentence);
  const client = getClient();

  if (!client) {
    return fallback;
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are an English speaking coach for Hindi speakers. Return only valid JSON with keys corrected, explanation, tip, pronunciationTip, fluencyFeedback. corrected must be an English sentence. explanation, tip, pronunciationTip, fluencyFeedback should be short and simple Hindi or Hinglish."
        },
        {
          role: "user",
          content: `Analyze this spoken English sentence and return JSON only.\nSentence: ${sentence}`
        }
      ]
    });

    const parsed = parseJsonObject(response.output_text);

    if (isSentenceAnalysis(parsed)) {
      return parsed;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
