
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME } from "../config";

export const runArtAgent = async (
  title: string, 
  lyricsSnippet: string, 
  mood: string, 
  apiKey?: string
): Promise<string | null> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: key });

  try {
    // Step 1: Generate a creative image prompt based on the lyrics
    const promptResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        Role: Expert Visual Artist.
        Task: Create a detailed text-to-image prompt for an album cover based on this song.
        
        Song Title: ${title}
        Mood: ${mood}
        Lyrics Snippet: "${lyricsSnippet.substring(0, 200)}..."
        
        Requirements:
        - Visual Style: Cinematic, High Detail, Digital Art.
        - Lighting: Dramatic.
        - Color Palette: Matching the '${mood}' emotion.
        - NO TEXT in the image description (except maybe the vibe).
        - Output: JUST the raw prompt string.
      `
    });

    const imagePrompt = promptResponse.text || `Album cover for ${title}, ${mood} atmosphere, cinematic lighting, high quality`;

    // Step 2: Generate the Image
    // Using imagen-3.0-generate-001 as a reliable fallback or imagen-4.0-generate-001 if available
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    
    return null;

  } catch (error) {
    console.error("Art Agent Error:", error);
    throw error;
  }
};
