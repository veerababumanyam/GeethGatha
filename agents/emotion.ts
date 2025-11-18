
import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_EMOTION } from "../config";
import { EmotionAnalysis } from "../types";
import { cleanAndParseJSON } from "../utils";

export const runEmotionAgent = async (input: string): Promise<EmotionAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const emotionSchema = {
    type: Type.OBJECT,
    properties: {
      sentiment: { type: Type.STRING, description: "Positive, Negative, or Neutral" },
      navarasa: { type: Type.STRING, description: "The dominant Rasa (e.g., Shringara, Raudra)" },
      intensity: { type: Type.INTEGER, description: "Scale of 1 to 10" },
      suggestedKeywords: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Keywords that match this emotion" 
      },
      vibeDescription: { type: Type.STRING, description: "A poetic description of the detected vibe" }
    },
    required: ["sentiment", "navarasa", "intensity", "vibeDescription"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: input,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_EMOTION,
        responseMimeType: "application/json",
        responseSchema: emotionSchema,
        temperature: 0.6,
      }
    });

    if (response.text) {
      return cleanAndParseJSON<EmotionAnalysis>(response.text);
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Emotion Agent Error:", error);
    return {
      sentiment: "Neutral",
      navarasa: "Shanta",
      intensity: 5,
      suggestedKeywords: [],
      vibeDescription: "Balanced and calm"
    };
  }
};
