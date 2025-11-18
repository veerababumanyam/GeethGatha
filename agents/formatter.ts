
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_FORMATTER } from "../config";

export const runFormatterAgent = async (lyrics: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    INPUT LYRICS:
    ${lyrics}

    TASK:
    Convert the above lyrics into strict Suno.com format.
    1. **PRESERVE STRUCTURE:** Keep ALL repeated Choruses. Ensure [Intro], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Verse 3], [Chorus], [Outro] are all present in this order.
    2. **REMOVE** all lines starting with "Title:", "Language:", "Raagam:", "Taalam:", "Structure:", "Context:".
    3. **REMOVE** any "Editor's Report" or "Analysis" sections.
    4. **FORMAT** section headers to [Chorus], [Verse], [Bridge], [Outro], [Intro].
    5. **FORMAT** voice tags to [Male Vocals], [Female Vocals].
    6. **OUTPUT** only the raw tag-based lyrics. No markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_FORMATTER,
        temperature: 0.1, // Low temperature for strict formatting adherence
        topP: 0.8,
      }
    });

    return response.text || lyrics;
  } catch (error) {
    console.error("Formatter Agent Error:", error);
    // Fallback: Return original if formatting fails
    return lyrics;
  }
};
