
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, RESEARCH_PROMPT_TEMPLATE } from "../config";

export const runResearchAgent = async (topic: string, mood: string | undefined, apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: RESEARCH_PROMPT_TEMPLATE(topic, mood)
  });
  return response.text || "";
};
