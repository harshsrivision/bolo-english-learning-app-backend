import OpenAI from "openai";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

function buildFallbackReply(message: string) {
  const trimmedMessage = message.trim();
  const lowerMessage = trimmedMessage.toLowerCase();

  if (!trimmedMessage) {
    return "Tell me one short sentence about your day, and I will help you continue the conversation.";
  }

  if (lowerMessage.includes("interview")) {
    return "Sure. Start with your name, your current role, and one recent achievement. Can you answer that in 2 or 3 sentences?";
  }

  if (lowerMessage.includes("meeting") || lowerMessage.includes("office")) {
    return "Good start. Now explain one work update and one next step in simple English.";
  }

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello. I am ready to practice with you. Tell me your name, your city, and one thing you want to improve in English.";
  }

  if (trimmedMessage.endsWith("?")) {
    return "That is a useful question. First answer it in one short line, then add one reason or example so your English sounds more natural.";
  }

  return `Nice. You said: "${trimmedMessage}". Now add one more detail about when, where, or why.`;
}

export async function conversationReply(message: string) {
  const client = getClient();

  if (!client) {
    return buildFallbackReply(message);
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `You are an English speaking teacher for Hindi-speaking learners. Reply in simple English, keep the tone encouraging, and end with one follow-up question when useful. Student said: ${message}`
    });

    return response.output_text || buildFallbackReply(message);
  } catch {
    return buildFallbackReply(message);
  }
}
