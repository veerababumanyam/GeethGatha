
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, RESEARCH_PROMPT_TEMPLATE } from "../config";

export const runResearchAgent = async (topic: string, mood: string | undefined, apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: key });
  
  // Enhance prompt to leverage search capabilities
  const searchPrompt = `${RESEARCH_PROMPT_TEMPLATE(topic, mood)}
  
  CRITICAL INSTRUCTION: 
  Use Google Search to find:
  1. Recent lyrical trends or slang relevant to this topic.
  2. If the user references a specific movie or song style, find its details (Composer, Raagam, Vibe).
  3. Cultural metaphors associated with this specific mood.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: searchPrompt,
      config: {
        // Enable Google Search Grounding
        tools: [{ googleSearch: {} }],
        temperature: 0.7
      }
    });

    let resultText = response.text || "";

    // Extract and append grounding metadata (sources) if available
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      const sources = groundingMetadata.groundingChunks
        .map((chunk: any) => chunk.web?.title ? `- ${chunk.web.title} (${chunk.web.uri})` : null)
        .filter(Boolean);
        
      if (sources.length > 0) {
        resultText += "\n\n[RESEARCH SOURCES]:\n" + sources.join("\n");
      }
    }

    return resultText;

  } catch (error) {
    console.warn("Research Agent (Search) failed, falling back to basic knowledge...", error);
    
    // Fallback without search tool if tool use fails (e.g., older model or permission issue)
    const fallbackResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: RESEARCH_PROMPT_TEMPLATE(topic, mood)
    });
    return fallbackResponse.text || "";
  }
};
