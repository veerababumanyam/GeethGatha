
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, RESEARCH_PROMPT_TEMPLATE } from "../config";

export const runResearchAgent = async (topic: string, mood?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: RESEARCH_PROMPT_TEMPLATE(topic, mood)
  });
  return response.text || "";
};
