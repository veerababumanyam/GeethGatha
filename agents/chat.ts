
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_CHAT } from "../config";
import { Message } from "../types";

// Define Part type locally to ensure type safety without depending on specific SDK exports
type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface ChatAgentOptions {
  image?: string; // Base64 string
  audio?: string; // Base64 string
}

/**
 * Filters history to maintain relevance while staying within token limits.
 * Implements a sliding window approach (Last 15 turns) which is efficient for chat.
 */
const getOptimizedHistory = (history: Message[]): { role: string, parts: Part[] }[] => {
  const MAX_HISTORY_TURNS = 15;
  
  // Filter for valid chat roles and slice the last N messages
  const recentHistory = history
    .filter(m => m.role === "user" || m.role === "model")
    .slice(-MAX_HISTORY_TURNS);

  return recentHistory.map(m => ({
    role: m.role,
    parts: [{ text: m.content }]
  }));
};

/**
 * Generates a dynamic system instruction based on the conversation context.
 * This allows the agent to adapt its persona (e.g., empathetic vs. technical).
 */
const getDynamicInstruction = (history: Message[], currentInput: string) => {
  let instruction = SYSTEM_INSTRUCTION_CHAT;
  const lowerInput = currentInput.toLowerCase();

  // 1. Context: Feedback on Lyrics
  const lastModelMsg = [...history].reverse().find(m => m.role === "model");
  if (lastModelMsg?.lyricsData) {
    instruction += `\n\n[CONTEXT: POST-GENERATION]\nThe user is discussing the lyrics you just helped orchestrate.
    - If they offer critique, be humble and suggest specific linguistic or rhythmic fixes.
    - If they ask about the 'Raagam' or 'Thalam', explain like a knowledgeable music director.
    - If they are satisfied, suggest next steps (e.g., "Shall we try a different stanza?").`;
  }

  // 2. Intent: Emotional Tone Detection
  if (/(sad|pain|tears|breakup|lonely|loss)/i.test(lowerInput)) {
    instruction += `\n\n[TONE: EMPATHETIC]\nThe user seems to be in a somber mood. Respond with poetic empathy and gentleness.`;
  } else if (/(party|dance|beat|energy|fast|fun)/i.test(lowerInput)) {
    instruction += `\n\n[TONE: ENERGETIC]\nThe user wants high energy. Keep your responses punchy, rhythmic, and enthusiastic.`;
  }

  return instruction;
};

export const runChatAgent = async (
  text: string, 
  history: Message[], 
  options: ChatAgentOptions | undefined,
  apiKey?: string
) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing. Please configure it in settings.");

  const ai = new GoogleGenAI({ apiKey: key });

  // 1. Optimize Context
  const chatHistory = getOptimizedHistory(history);

  // 2. Construct Current Message (Text + Optional Multi-modal)
  const currentParts: Part[] = [{ text: text }];
  
  if (options?.image) {
    currentParts.push({
      inlineData: { mimeType: "image/jpeg", data: options.image }
    });
  }
  
  if (options?.audio) {
    currentParts.push({
      inlineData: { mimeType: "audio/mp3", data: options.audio }
    });
  }

  const contents = [
    ...chatHistory,
    { role: "user", parts: currentParts }
  ];

  // 3. Determine Dynamic Instruction
  const systemInstruction = getDynamicInstruction(history, text);

  try {
    // 4. API Call
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // Balanced creativity and coherence
        topK: 40,
      },
      contents: contents
    });

    return response.text || "I'm listening... could you tell me more?";

  } catch (error) {
    console.warn("Chat Agent initial attempt failed, retrying...", error);
    
    // 5. Retry Strategy: Fallback to basic context if complex context fails
    try {
      const retryResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        config: { systemInstruction: SYSTEM_INSTRUCTION_CHAT },
        contents: [{ role: "user", parts: [{ text: text }] }]
      });
      return retryResponse.text || "I apologize, I'm having trouble connecting to the muse right now.";
    } catch (retryError) {
      console.error("Chat Agent retry failed:", retryError);
      throw new Error("Failed to generate response. Please check your API Key.");
    }
  }
};
