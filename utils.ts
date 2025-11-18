
import { GeneratedLyrics } from "./types";

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