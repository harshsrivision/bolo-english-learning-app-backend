function getWordCount(sentence: string) {
  return sentence
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getSoundTips(sentence: string) {
  const tips: string[] = [];

  if (/\b(think|this|that|three|the)\b/i.test(sentence)) {
    tips.push("TH sound ko soft rakho. Tongue ko teeth ke beech halkasa lao aur hawa release karo.");
  }

  if (/\b(very|voice|view|love|leave)\b/i.test(sentence)) {
    tips.push("V sound ke liye lower lip ko upper teeth se touch karao. W jaisa round mat banao.");
  }

  if (/\b(world|work|why|welcome|window)\b/i.test(sentence)) {
    tips.push("W sound ke liye lips ko round shape do aur voice smooth rakho.");
  }

  return tips;
}

export function scorePronunciation(sentence: string) {
  const wordCount = getWordCount(sentence);
  const soundTips = getSoundTips(sentence);
  const baseScore = Math.min(92, Math.max(52, 58 + wordCount * 3 - soundTips.length * 5));

  const feedback = soundTips.length
    ? `${soundTips.join(" ")} Important words par halka stress bhi do.`
    : "Clarity achhi hai. Har phrase ke beech chhota pause lo aur key words ko thoda stress do.";

  return {
    score: baseScore,
    feedback
  };
}
