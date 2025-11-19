
import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_REVIEW } from "../config";
import { GeneratedLyrics, LanguageProfile, GenerationSettings } from "../types";
import { cleanAndParseJSON, formatLyricsForDisplay } from "../utils";

const getRhymeDescription = (scheme: string): string => {
  switch (scheme) {
    case "AABB": return "Line 1 rhymes with 2. Line 3 rhymes with 4.";
    case "ABAB": return "Line 1 rhymes with 3. Line 2 rhymes with 4.";
    case "ABCB": return "Line 2 rhymes with 4. Lines 1 and 3 can be free.";
    case "AAAA": return "All 4 lines must end with the same sound.";
    case "AABCCB": return "Line 1 rhymes with 2. Line 4 rhymes with 5. Line 3 rhymes with 6.";
    default: return "Consistent end rhymes (Anthya Prasa) for all couplets.";
  }
};

export const runReviewAgent = async (
  draftLyrics: string, 
  originalContext: string,
  languageProfile: LanguageProfile,
  generationSettings: GenerationSettings | undefined,
  apiKey?: string
): Promise<string> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: key });

  const lyricsSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Refined title in Native Script" },
      language: { type: Type.STRING },
      ragam: { type: Type.STRING },
      taalam: { type: Type.STRING },
      structure: { type: Type.STRING },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sectionName: { type: Type.STRING, description: "MUST BE [English Tag] like [Chorus] or [Verse]" },
            lines: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["sectionName", "lines"]
        }
      }
    },
    required: ["title", "sections"]
  };

  const complexity = generationSettings?.complexity || "Poetic";
  const rhymeScheme = generationSettings?.rhymeScheme || "AABB";
  const rhymeInstruction = getRhymeDescription(rhymeScheme);
  
  const prompt = `
    INPUT LYRICS (DRAFT):
    ${draftLyrics}

    ORIGINAL CONTEXT:
    ${originalContext}

    TARGET LANGUAGE: ${languageProfile.primary}
    REQUESTED COMPLEXITY: ${complexity}
    REQUESTED RHYME SCHEME: ${rhymeScheme}

    TASK:
    1. **LANGUAGE INTEGRITY (CRITICAL):**
       - The content MUST be in ${languageProfile.primary} NATIVE SCRIPT.
       - If the draft is in Romanized/Latin script (e.g., "Nenu"), CONVERT it to Native Script (e.g., "నేను").
       - If the draft is in English Translation, REWRITE in ${languageProfile.primary}.

    2. **COMPLEXITY CHECK:**
       - If "Simple": Ensure conversational vocabulary.
       - If "Poetic": Ensure beauty without being obscure.
    
    3. **RHYME & PRASA REPAIR (CRITICAL):**
       - **TARGET SCHEME:** ${rhymeScheme} (${rhymeInstruction})
       - **AUDIT:** Read the ending of every line in Verses and Choruses.
       - **CHECK:** Do they strictly follow the ${rhymeScheme} pattern?
       - **FIX:** If lines break the pattern, **REWRITE THEM IMMEDIATELY**.
         *Example for AABB:* If Line 1 ends in "Raagam" and Line 2 ends in "Pata" (No rhyme), change Line 2 to something ending in "gam/gham" like "Thyaagam".
    
    4. **STRUCTURAL AUDIT:**
       - Ensure there is an **[Intro]** with humming/mood lines.
       - Ensure there are **[Verse 1]**, **[Verse 2]**, and **[Verse 3]**.
       - Ensure the **[Chorus]** is repeated at least 2-3 times.
       - Ensure there is a **[Bridge]** and **[Outro]**.
       - **IF ANY SECTION IS MISSING, YOU MUST GENERATE IT.**
    
    5. **SYNTAX ENFORCEMENT:** 
       - Change "Pallavi" -> **[Chorus]**.
       - Change "Charanam" -> **[Verse]**.
       - All headers must be in **[Square Brackets]** and in English.

    Return the COMPLETE, CORRECTED version in JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_REVIEW,
        responseMimeType: "application/json",
        responseSchema: lyricsSchema,
        temperature: 0.4, // Low temperature for precision
      }
    });

    if (response.text) {
      const data = cleanAndParseJSON<GeneratedLyrics>(response.text);
      return formatLyricsForDisplay(data);
    }
    
    return draftLyrics; // Return original if review fails

  } catch (error) {
    console.error("Review Agent Error:", error);
    return draftLyrics;
  }
};
