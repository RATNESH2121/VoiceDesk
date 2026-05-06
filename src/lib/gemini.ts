import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateResponse(prompt: string) {
  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
