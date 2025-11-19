
import { GeneratedLyrics } from "./types";

/**
 * Custom Error class for categorized AI failures
 */
export class GeminiError extends Error {
  constructor(message: string, public type: 'AUTH' | 'QUOTA' | 'SERVER' | 'NETWORK' | 'UNKNOWN') {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * Helper to wrap raw GoogleGenAI errors into categorized GeminiErrors
 */
export const wrapGenAIError = (error: any): GeminiError => {
  console.error("GenAI Original Error:", error);
  const msg = (error?.message || error?.toString() || "").toLowerCase();
  
  if (msg.includes("api key") || msg.includes("403") || msg.includes("unauthenticated") || msg.includes("key not valid")) {
    return new GeminiError("Invalid API Key. Please check your settings.", 'AUTH');
  }
  if (msg.includes("429") || msg.includes("quota") || msg.includes("exhausted")) {
    return new GeminiError("Usage limit exceeded. Please try again later.", 'QUOTA');
  }
  if (msg.includes("503") || msg.includes("overloaded") || msg.includes("500")) {
    return new GeminiError("AI Service is currently overloaded. Please retry.", 'SERVER');
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
    return new GeminiError("Network connection failed. Check your internet.", 'NETWORK');
  }
  
  return new GeminiError("Something went wrong. Please try again.", 'UNKNOWN');
};

/**
 * safely parses JSON from LLM responses, handling Markdown code blocks.
 */
export const cleanAndParseJSON = <T>(text: string): T => {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Try stripping Markdown code blocks (```json ... ``` or ``` ... ```)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        // Continue to fallback
      }
    }
    
    // 3. Try finding the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      const potentialJson = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(potentialJson);
      } catch (e3) {
        console.error("Failed to extract JSON via brace matching", e3);
      }
    }

    throw new Error(`Failed to parse JSON from response: ${text.substring(0, 50)}...`);
  }
};

export const formatLyricsForDisplay = (data: GeneratedLyrics): string => {
  let output = "";
  output += `Title: ${data.title}\n`;
  output += `Language: ${data.language}\n`;
  if (data.ragam) output += `Raagam: ${data.ragam}\n`;
  if (data.taalam) output += `Taalam: ${data.taalam}\n`;
  if (data.structure) output += `Structure: ${data.structure}\n`;
  output += `\n`;

  data.sections.forEach(section => {
    // Strictly enforce English Square Brackets for section names
    let header = section.sectionName.trim();
    
    // Remove existing brackets if partial or malformed to re-wrap securely
    header = header.replace(/[\[\](){}]/g, '');
    
    // Normalize common terms to standard English tags
    if (header.toLowerCase().includes("pallavi")) header = "Chorus";
    if (header.toLowerCase().includes("charanam")) header = "Verse";
    if (header.toLowerCase().includes("anupallavi")) header = "Verse";
    if (header.toLowerCase().includes("mukhda")) header = "Chorus";
    if (header.toLowerCase().includes("antara")) header = "Verse";
    
    // Re-wrap in brackets
    header = `[${header}]`;
    
    output += `${header}\n`;
    section.lines.forEach(line => {
      output += `${line}\n`;
    });
    output += `\n`;
  });

  return output;
};

/**
 * Maps human readable language names to BCP 47 language tags for speech recognition
 */
export const getLanguageCode = (lang: string): string => {
  const map: Record<string, string> = {
    "Hindi": "hi-IN",
    "Telugu": "te-IN",
    "Tamil": "ta-IN",
    "Kannada": "kn-IN",
    "Malayalam": "ml-IN",
    "Marathi": "mr-IN",
    "Gujarati": "gu-IN",
    "Bengali": "bn-IN",
    "Punjabi": "pa-IN",
    "Urdu": "ur-IN",
    "English": "en-IN",
    "Assamese": "as-IN"
  };
  // Default to Indian English if specific mapping not found, as it handles mixed input well
  return map[lang] || "en-IN";
};

/**
 * Decodes and plays raw PCM audio data (24kHz) from Gemini TTS
 */
export const playPCMData = async (base64Data: string): Promise<void> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  // Decode Base64
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Convert PCM to Float32 AudioBuffer (raw 16-bit PCM to -1.0 to 1.0 float)
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  // Play
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();

  return new Promise((resolve) => {
    source.onended = () => {
      source.disconnect();
      audioContext.close();
      resolve();
    };
  });
};
