"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correctSentence = correctSentence;
exports.analyzeSentence = analyzeSentence;
function normalizeWhitespace(text) {
    return text.replace(/\s+/g, " ").trim();
}
function applyCommonCorrections(text) {
    let corrected = normalizeWhitespace(text);
    const replacements = [
        [/\bi\b/g, "I"],
        [/\bim\b/gi, "I'm"],
        [/\bdont\b/gi, "don't"],
        [/\bcant\b/gi, "can't"],
        [/\bwont\b/gi, "won't"],
        [/\bcan u\b/gi, "can you"],
        [/\bpls\b/gi, "please"],
        [/\benglish\b/g, "English"],
        [/\bi am learn\b/gi, "I am learning"],
        [/\bi am practice\b/gi, "I am practicing"]
    ];
    for (const [pattern, replacement] of replacements) {
        corrected = corrected.replace(pattern, replacement);
    }
    corrected = corrected.replace(/\s+([,.!?])/g, "$1");
    corrected = corrected.replace(/(^|[.!?]\s+)([a-z])/g, (_match, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
    if (corrected && !/[.!?]$/.test(corrected)) {
        corrected = `${corrected}.`;
    }
    return corrected;
}
function getWordCount(text) {
    return normalizeWhitespace(text)
        .split(" ")
        .filter(Boolean).length;
}
function getExplanation(original, corrected) {
    const changes = [];
    if (original.trim() !== corrected.trim()) {
        changes.push("capitalization, spacing, ya punctuation ko clean kiya gaya hai");
    }
    if (/\benglish\b/i.test(original) && !/\bEnglish\b/.test(original)) {
        changes.push("language name ko proper noun ki tarah capital letter diya gaya hai");
    }
    if (/\bdont\b|\bcant\b|\bwont\b/i.test(original)) {
        changes.push("common short forms ko standard English contractions mein badla gaya hai");
    }
    if (!changes.length) {
        return "Sentence overall samajhne layak tha. Maine bas usse thoda zyada natural aur polished English flow diya hai.";
    }
    return `Is sentence mein ${changes.join(", ")}. Isliye final version zyada natural aur readable lagta hai.`;
}
function getPracticeTip(wordCount) {
    if (wordCount < 6) {
        return "Ek aur supporting sentence jodo taaki answer zyada complete lage.";
    }
    if (wordCount < 14) {
        return "Answer theek hai. Ab ek example ya reason add karke isse stronger banao.";
    }
    return "Structure achha hai. Ab pauses aur sentence stress ko control karke delivery aur strong karo.";
}
function getPronunciationTip(text) {
    if (/\b(think|this|that|the|thing|three)\b/i.test(text)) {
        return "TH sound ke liye tongue ko halkasa teeth ke beech lao, phir soft air release karo.";
    }
    if (/\b(very|voice|view|love|leave)\b/i.test(text)) {
        return "V sound ke liye lower lip ko upper teeth se lightly touch karao, phir voice nikalo.";
    }
    if (/\b(world|work|why|welcome|window)\b/i.test(text)) {
        return "W sound ke liye lips ko round shape do. V aur W ko mix mat karo.";
    }
    return "Important nouns aur verbs par halka stress do, aur har phrase ke beech tiny pause lo.";
}
function getFluencyFeedback(text) {
    const wordCount = getWordCount(text);
    if (wordCount < 6) {
        return "Response kaafi short hai. Confidence build karne ke liye do connected sentences bolne ki practice karo.";
    }
    if (wordCount < 14) {
        return "Flow theek hai. Next step yeh hai ki answer ko start, detail, aur close ke simple structure mein do.";
    }
    return "Fluency achhi lag rahi hai. Ab speed ko stable rakho aur key ideas ko slightly stress karo.";
}
function correctSentence(text) {
    return applyCommonCorrections(text);
}
function analyzeSentence(text) {
    const corrected = correctSentence(text);
    const wordCount = getWordCount(corrected);
    return {
        corrected,
        explanation: getExplanation(text, corrected),
        tip: getPracticeTip(wordCount),
        pronunciationTip: getPronunciationTip(corrected),
        fluencyFeedback: getFluencyFeedback(corrected)
    };
}
