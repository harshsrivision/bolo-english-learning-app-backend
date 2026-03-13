export function scorePronunciation(sentence: string) {
  let score = 80;

  if (sentence.length < 5) {
    score = 50;
  }

  return {
    score,
    feedback: "Try speaking clearly and pronounce each word slowly."
  };
}
