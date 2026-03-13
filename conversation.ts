import OpenAI from "openai";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

export async function conversationReply(message: string) {
  const response = await getClient().responses.create({
    model: "gpt-4.1-mini",
    input: `You are an English speaking teacher. Reply in simple English and help the student practice conversation. Student said: ${message}`
  });

  return response.output_text;
}
