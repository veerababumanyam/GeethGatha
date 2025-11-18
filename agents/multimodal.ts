
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION_MULTIMODAL } from "../config";

export const runMultiModalAgent = async (input: string, image?: string, audio?: string): Promise<string> => {
  // If no media is provided, just return the text input
  if (!image && !audio) return input;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [{ text: `User Text Context: ${input}` }];

  if (image) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: image }
    });
  }
  
  if (audio) {
    parts.push({
      inlineData: { mimeType: "audio/mp3", data: audio }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: { systemInstruction: SYSTEM_INSTRUCTION_MULTIMODAL },
      contents: [{ role: "user", parts: parts }]
    });

    const analysis = response.text || "";
    return `[Visual/Audio Context: ${analysis}] \n\n User Request: ${input}`;

  } catch (error) {
    console.error("MultiModal Agent Error:", error);
    return input;
  }
};
