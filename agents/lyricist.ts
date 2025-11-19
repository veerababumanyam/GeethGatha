
import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_LYRICIST, SCENARIO_KNOWLEDGE_BASE } from "../config";
import { GeneratedLyrics, LanguageProfile, EmotionAnalysis, GenerationSettings } from "../types";
import { cleanAndParseJSON, formatLyricsForDisplay, wrapGenAIError } from "../utils";

const getRhymeDescription = (scheme: string): string => {
  switch (scheme) {
    case "AABB": return "Couplets. Line 1 MUST rhyme with Line 2. Line 3 MUST rhyme with Line 4. (e.g., aa-ta, paa-ta)";
    case "ABAB": return "Alternate rhyme. Line 1 MUST rhyme with Line 3. Line 2 MUST rhyme with Line 4.";
    case "ABCB": return "Ballad style. Line 2 MUST rhyme with Line 4. Lines 1 and 3 do not need to rhyme.";
    case "AAAA": return "Monorhyme. All lines MUST end with the same phonetic sound.";
    case "AABCCB": return "Line 1 rhymes with 2. Line 4 rhymes with 5. Line 3 rhymes with 6.";
    case "Free Verse": return "No strict rhyme required, but focus on rhythm and flow.";
    default: return "Ensure consistent end rhymes (Anthya Prasa) where appropriate.";
  }
};

export const runLyricistAgent = async (
  researchData: string, 
  userRequest: string, 
  languageProfile: LanguageProfile,
  emotionData: EmotionAnalysis | undefined,
  generationSettings: GenerationSettings | undefined,
  apiKey?: string
): Promise<string> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing");
  
  const ai = new GoogleGenAI({ apiKey: key });

  const lyricsSchema = {
    type: Type.OBJECT,
    properties: {
      title: { 
        type: Type.STRING, 
        description: "Format: 'Native Title'. Title should be in Native Script." 
      },
      language: { type: Type.STRING, description: "Description of the language mix used" },
      ragam: { type: Type.STRING, description: "Suggested Carnatic/Hindustani Raagam" },
      taalam: { type: Type.STRING, description: "Suggested Time Signature or Beat" },
      structure: { type: Type.STRING, description: "Structure Overview (e.g., Intro-V1-C-V2-C-Br-V3-C-Outro)" },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sectionName: { type: Type.STRING, description: "STRICTLY ENGLISH TAGS IN SQUARE BRACKETS: [Chorus], [Verse 1], [Verse 2], [Verse 3], [Bridge], [Intro], [Outro]." },
            lines: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: `The lyrics lines written STRICTLY in the ${languageProfile.primary} NATIVE SCRIPT. Do NOT use Roman/English characters for lyrics.`
            }
          },
          required: ["sectionName", "lines"]
        }
      }
    },
    required: ["title", "language", "ragam", "taalam", "sections"]
  };

  // Construct the language instruction
  const isMixed = languageProfile.primary !== languageProfile.secondary || languageProfile.primary !== languageProfile.tertiary;
  let languageInstruction = `PRIMARY LANGUAGE: "${languageProfile.primary}".
    CRITICAL: Write the lyrics content STRICTLY in ${languageProfile.primary} NATIVE SCRIPT (e.g., if Telugu, use Telugu characters).
    DO NOT USE ROMAN/LATIN CHARACTERS FOR LYRICS. DO NOT TRANSLITERATE.`;
  
  if (isMixed) {
    languageInstruction += `\n    SECONDARY LANGUAGES: "${languageProfile.secondary}" and "${languageProfile.tertiary}". Mix naturally, but keep the primary script as ${languageProfile.primary}.`;
  } else {
    languageInstruction += `\n    DO NOT mix other languages. Pure ${languageProfile.primary}.`;
  }

  // Resolve custom vs dropdown values
  const theme = generationSettings?.customTheme || generationSettings?.theme || "Love";
  const mood = generationSettings?.customMood || generationSettings?.mood || "Romantic";
  const style = generationSettings?.customStyle || generationSettings?.style || "Melody";
  const complexity = generationSettings?.complexity || "Poetic";
  const rhymeScheme = generationSettings?.customRhymeScheme || generationSettings?.rhymeScheme || "AABB";
  const singerConfig = generationSettings?.singerConfig || "Male Solo";
  
  // --- SCENARIO CONTEXT INJECTION ---
  let scenarioInstruction = "";
  if (generationSettings?.ceremony && generationSettings.ceremony !== "None") {
    // Find the scenario definition in the Knowledge Base
    let foundScenario = null;
    for (const cat of SCENARIO_KNOWLEDGE_BASE) {
      const hit = cat.events.find(e => e.id === generationSettings.ceremony);
      if (hit) {
        foundScenario = hit;
        break;
      }
    }

    if (foundScenario) {
      scenarioInstruction = `
      *** SCENARIO / CONTEXT INSTRUCTION (CRITICAL) ***
      SCENARIO: ${foundScenario.label}
      ${foundScenario.promptContext}
      
      INSTRUCTION: The song MUST explicitly reference the emotions, metaphors, and cultural tropes described above.
      Do not write a generic ${theme} song. Write a specific song for ${foundScenario.label}.
      `;
    }
  }
  
  const rhymeInstruction = getRhymeDescription(rhymeScheme);

  // Define explicit complexity instructions to override "Great Poet" bias
  const complexityInstructions: Record<string, string> = {
    "Simple": "STRICTLY use colloquial, everyday conversational language (e.g., Vaduka Bhasha for Telugu). Avoid Sanskritized words. Keep it catchy and simple to sing.",
    "Poetic": "Use standard literary style with beautiful metaphors and flow.",
    "Complex": "Use high classical vocabulary (e.g., Grandhika Bhasha), complex metaphors, and deep concepts."
  };
  
  const specificComplexityInstruction = complexityInstructions[complexity] || complexityInstructions["Poetic"];

  const prompt = `
    USER REQUEST: "${userRequest}"
    
    *** LANGUAGE INSTRUCTION (CRITICAL) ***
    ${languageInstruction}
    - **OUTPUT SCRIPT:** The lyrics text must be in ${languageProfile.primary} native script.
    - **NO ENGLISH CONTENT:** Do NOT write the lyrics in English/Roman Script. Only the tags like [Chorus] are English.
    
    STRICT CONFIGURATION:
    - Theme: ${theme}
    - Mood: ${mood}
    - Musical Style: ${style}
    - Lyrical Complexity Level: ${complexity}
    - SINGER CONFIGURATION: ${singerConfig}
    - RHYME SCHEME: ${rhymeScheme}
    
    ${scenarioInstruction}

    *** COMPLEXITY INSTRUCTION (${complexity}): ***
    ${specificComplexityInstruction}

    *** RHYME & PRASA INSTRUCTION (CRITICAL): ***
    - **SELECTED SCHEME:** ${rhymeScheme}
    - **PATTERN DEFINITION:** ${rhymeInstruction}
    - You MUST maintain **ANTHYA PRASA** (End Rhyme) strictly according to the pattern above.
    - The last words/syllables of the matching lines MUST sound similar phonetically.
    - **NO FREE VERSE** (Unless specifically requested). Every stanza must satisfy the ${rhymeScheme} structure.
    
    EMOTIONAL ANALYSIS:
    - Navarasa: ${emotionData?.navarasa || 'N/A'}
    - Intensity: ${emotionData?.intensity || 5}/10

    RESEARCH CONTEXT:
    ${researchData}

    TASK:
    Compose a high-fidelity Indian Cinema song.
    
    MANDATORY STRUCTURAL BLUEPRINT (DO NOT DEVIATE):
    1. **[Intro]**: Include humming, alaap, or atmospheric sounds.
    2. **[Verse 1]**: First stanza.
    3. **[Chorus]**: Main Hook.
    4. **[Verse 2]**: Second stanza (progression).
    5. **[Chorus]**: Main Hook (Repeat).
    6. **[Bridge]**: Emotional/Tempo shift.
    7. **[Verse 3]**: Third stanza (Climax).
    8. **[Chorus]**: Main Hook (Final Repeat).
    9. **[Outro]**: Fading out, humming.

    Output strictly in JSON format matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_LYRICIST,
        responseMimeType: "application/json",
        responseSchema: lyricsSchema,
        thinkingConfig: { thinkingBudget: 4096 }, 
        temperature: 0.85, 
      }
    });

    if (response.text) {
      const data = cleanAndParseJSON<GeneratedLyrics>(response.text);
      return formatLyricsForDisplay(data);
    }
    
    return "Error: Could not generate lyrics structure.";

  } catch (error) {
    console.error("Lyricist Agent Error:", error);
    // Wrap error logic
    throw wrapGenAIError(error);
  }
};
