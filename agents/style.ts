

import { GoogleGenAI } from "@google/genai";
import { MODEL_FAST, SYSTEM_INSTRUCTION_STYLE_AGENT } from "../config";

export const runStyleAgent = async (
  currentInput: string, 
  lyricsContext: string, 
  apiKey?: string
): Promise<string> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: key });

  const prompt = `
    USER INPUT / ROUGH IDEA: "${currentInput}"
    LYRICS CONTEXT: "${lyricsContext.substring(0, 300)}..."

    INSTRUCTION: 
    - Transform the user's rough idea into a pro-level Music Style Prompt.
    - **Scope:** Support ALL Global Music Styles (European, Western, Indian, Asian, etc.).
    - **If Indian:** Use Fusion Genres (e.g., EDM Carnatic, Trap Folk) and specific instruments (Sannai, Tabla).
    - **If European/Western:** Use specific sub-genres (e.g., Darkwave, Italo-Disco, Symphonic Metal) and era-specific sounds.
    - Append the mandatory High Fidelity tags.
    - If the user input is empty, generate a creative one based on the lyrics.
    - Output ONLY the final string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_STYLE_AGENT,
        temperature: 0.85, // High creativity for fusion
      }
    });

    return response.text?.trim() || currentInput;

  } catch (error) {
    console.error("Style Agent Error:", error);
    throw error; // Propagate error to UI for alert
  }
};
