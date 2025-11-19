

import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_FORMATTER, DEFAULT_HQ_TAGS } from "../config";
import { cleanAndParseJSON } from "../utils";

export interface FormatterOutput {
  stylePrompt: string;
  formattedLyrics: string;
}

export const runFormatterAgent = async (lyrics: string, apiKey?: string): Promise<FormatterOutput> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: key });

  const schema = {
    type: Type.OBJECT,
    properties: {
      stylePrompt: { type: Type.STRING, description: "A creative music style prompt with HQ tags." },
      formattedLyrics: { type: Type.STRING, description: "The lyrics with enhanced meta-tags." }
    },
    required: ["stylePrompt", "formattedLyrics"]
  };

  const prompt = `
    INPUT LYRICS:
    ${lyrics}

    TASK:
    1. Generate a "Creative Music Style Prompt" for Suno.com.
       - If Indian/Asian: Mix Global genres with Native instruments (Fusion).
       - If European/Western: Use specific sub-genres and authentic instrumentation.
    2. **IMPORTANT:** The stylePrompt MUST end with: "${DEFAULT_HQ_TAGS}".
    3. Format the lyrics with [Square Bracket] meta-tags for Suno.
    4. **STRICT RULE:** Do NOT generate [Spoken Word].
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_FORMATTER,
        temperature: 0.75,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (response.text) {
        return cleanAndParseJSON<FormatterOutput>(response.text);
    }
    
    // Fallback
    return { 
      stylePrompt: `Cinematic, Fusion, ${DEFAULT_HQ_TAGS}`, 
      formattedLyrics: lyrics 
    };

  } catch (error) {
    console.error("Formatter Agent Error:", error);
    return { 
      stylePrompt: `Global Music Style, ${DEFAULT_HQ_TAGS}`, 
      formattedLyrics: lyrics 
    };
  }
};
