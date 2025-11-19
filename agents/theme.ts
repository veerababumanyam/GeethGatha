
import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_FAST, SYSTEM_INSTRUCTION_THEME } from "../config";
import { AppTheme } from "../types";
import { cleanAndParseJSON } from "../utils";

export const runThemeAgent = async (description: string, apiKey?: string): Promise<AppTheme | null> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: key });

  const themeSchema = {
    type: Type.OBJECT,
    properties: {
      colors: {
        type: Type.OBJECT,
        properties: {
            bgMain: { type: Type.STRING, description: "Hex color for main background" },
            bgSidebar: { type: Type.STRING, description: "Hex color for panels/sidebar" },
            textMain: { type: Type.STRING, description: "Hex color for primary text (High Contrast)" },
            textSecondary: { type: Type.STRING, description: "Hex color for secondary text" },
            accent: { type: Type.STRING, description: "Hex color for buttons/highlights" },
            accentText: { type: Type.STRING, description: "Hex color for text on accent buttons" },
            border: { type: Type.STRING, description: "Hex color for borders" },
        },
        required: ["bgMain", "bgSidebar", "textMain", "textSecondary", "accent", "accentText", "border"]
      },
      name: { type: Type.STRING, description: "A creative name for this theme" }
    },
    required: ["colors", "name"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Generate a UI color theme based on this description: "${description}". Ensure strict WCAG AA contrast compliance for readability.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_THEME,
        responseMimeType: "application/json",
        responseSchema: themeSchema,
        temperature: 0.7,
      }
    });

    if (response.text) {
      const data = cleanAndParseJSON<{colors: any, name: string}>(response.text);
      return {
        id: `custom-${Date.now()}`,
        name: data.name,
        colors: data.colors
      };
    }
    return null;
  } catch (error) {
    console.error("Theme Agent Error:", error);
    return null;
  }
};
