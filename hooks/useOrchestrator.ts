

import { useState } from "react";
import { AgentStatus, AgentStep, Message, LanguageProfile, GenerationSettings, EmotionAnalysis } from "../types";
import { runMultiModalAgent } from "../agents/multimodal";
import { runEmotionAgent } from "../agents/emotion";
import { runResearchAgent } from "../agents/research";
import { runLyricistAgent } from "../agents/lyricist";
import { runComplianceAgent } from "../agents/compliance";
import { runReviewAgent } from "../agents/review";
import { runFormatterAgent } from "../agents/formatter";
import { GeminiError } from "../utils";
import { AUTO_OPTION } from "../config";

export const useOrchestrator = () => {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    active: false,
    currentAgent: "CHAT",
    message: "Ready",
    steps: []
  });

  const updateAgentStep = (stepId: string, status: 'active' | 'completed') => {
    setAgentStatus(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, status } : s)
    }));
  };

  // Helper to resolve "Auto" settings using emotion analysis
  const resolveAutoSettings = (gen: GenerationSettings, emotion: EmotionAnalysis): GenerationSettings => {
    const resolved = { ...gen };
    const isHappy = emotion.sentiment.toLowerCase().includes('positive');
    
    if (resolved.mood === AUTO_OPTION) {
      resolved.mood = `${emotion.navarasa} (${emotion.sentiment})`;
    }
    
    if (resolved.theme === AUTO_OPTION) {
        // Map vibe directly to theme fallback
        resolved.theme = emotion.vibeDescription;
    }

    if (resolved.style === AUTO_OPTION) {
      // Heuristic based on intensity and emotion
      if (emotion.intensity >= 8 || ['Raudra', 'Veera', 'Hasya'].includes(emotion.navarasa)) {
         resolved.style = "Fast Beat/Mass";
      } else if (['Shringara', 'Karuna', 'Shanta'].includes(emotion.navarasa)) {
         resolved.style = "Melody";
      } else {
         resolved.style = "Folk";
      }
    }
    
    if (resolved.singerConfig === AUTO_OPTION) {
      if (emotion.navarasa.includes("Shringara")) resolved.singerConfig = "Duet (Male + Female)";
      else if (emotion.navarasa.includes("Hasya")) resolved.singerConfig = "Group Chorus";
      else resolved.singerConfig = "Male Solo";
    }

    if (resolved.complexity === AUTO_OPTION) {
        // High intensity often implies simpler, punchier lyrics. Low intensity = poetic.
        resolved.complexity = emotion.intensity > 7 ? "Simple" : "Poetic";
    }
    
    if (resolved.rhymeScheme === AUTO_OPTION) {
        resolved.rhymeScheme = "AABB"; // Safe default
    }

    return resolved;
  };

  const runSongGenerationWorkflow = async (
    request: string,
    languageSettings: LanguageProfile,
    genSettings: GenerationSettings,
    addMessage: (msg: Message) => void,
    apiKey?: string
  ) => {
    const workflowId = Date.now().toString();
    
    const isMixed = languageSettings.primary !== languageSettings.secondary || languageSettings.primary !== languageSettings.tertiary;
    const langLabel = isMixed ? `${languageSettings.primary} Mix` : languageSettings.primary;

    const initialSteps: AgentStep[] = [
      { id: 'multimodal', label: 'Multimodal: Processing Input', status: 'pending' },
      { id: 'emotion', label: 'Emotion: Analyzing Vibe', status: 'pending' },
      { id: 'research', label: 'Research: Context & Culture', status: 'pending' },
      { id: 'lyricist', label: `Lyricist: Composing in ${langLabel}`, status: 'pending' },
      { id: 'compliance', label: 'Compliance: Plagiarism Check', status: 'pending' },
      { id: 'review', label: 'Review: Polishing', status: 'pending' },
      { id: 'formatter', label: 'Formatter: Suno Style', status: 'pending' },
      { id: 'final', label: 'Orchestrator: Finalizing', status: 'pending' },
    ];

    try {
      // --- Step 0: Multi-Modal Pre-processing ---
      setAgentStatus({ 
        active: true, 
        currentAgent: "MULTIMODAL", 
        message: "Processing inputs...", 
        steps: initialSteps.map(s => s.id === 'multimodal' ? { ...s, status: 'active' } : s)
      });
      const processedContext = await runMultiModalAgent(request, undefined, undefined, apiKey); 
      updateAgentStep('multimodal', 'completed');

      // --- Step 1: Emotion Analysis & Preferences ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "EMOTION", message: "Feeling the vibe...", steps: prev.steps.map(s => s.id === 'emotion' ? { ...s, status: 'active' } : s) }));
      const emotionData = await runEmotionAgent(processedContext, apiKey);
      
      // RESOLVE SMART DEFAULTS
      const resolvedSettings = resolveAutoSettings(genSettings, emotionData);

      updateAgentStep('emotion', 'completed');

      // --- Step 2: Research ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "RESEARCH", message: `Analyzing context (${resolvedSettings.mood})...`, steps: prev.steps.map(s => s.id === 'research' ? { ...s, status: 'active' } : s) }));
      const researchData = await runResearchAgent(processedContext, `${resolvedSettings.mood} - ${resolvedSettings.theme}`, apiKey);
      updateAgentStep('research', 'completed');

      // --- Step 3: Lyricist ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "LYRICIST", message: `Composing (${resolvedSettings.style})...`, steps: prev.steps.map(s => s.id === 'lyricist' ? { ...s, status: 'active' } : s) }));
      // Pass resolved settings to Lyricist
      const draftLyrics = await runLyricistAgent(researchData, processedContext, languageSettings, emotionData, resolvedSettings, apiKey);
      updateAgentStep('lyricist', 'completed');

      // --- Step 4: Compliance Check ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "COMPLIANCE", message: "Checking safety...", steps: prev.steps.map(s => s.id === 'compliance' ? { ...s, status: 'active' } : s) }));
      const complianceReport = await runComplianceAgent(draftLyrics, apiKey);
      updateAgentStep('compliance', 'completed');

      // --- Step 5: Review ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "REVIEW", message: "Polishing...", steps: prev.steps.map(s => s.id === 'review' ? { ...s, status: 'active' } : s) }));
      const finalLyrics = await runReviewAgent(draftLyrics, processedContext, languageSettings, resolvedSettings, apiKey);
      updateAgentStep('review', 'completed');

      // --- Step 6: Formatter (Suno.com) ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "FORMATTER", message: "Formatting for Suno.com...", steps: prev.steps.map(s => s.id === 'formatter' ? { ...s, status: 'active' } : s) }));
      
      // Now returns object { stylePrompt, formattedLyrics }
      const sunoData = await runFormatterAgent(finalLyrics, apiKey);
      updateAgentStep('formatter', 'completed');

      // --- Step 7: Final Output ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "ORCHESTRATOR", message: "Done!", steps: prev.steps.map(s => s.id === 'final' ? { ...s, status: 'completed' } : s) }));

      let outputContent = finalLyrics;
      if (complianceReport.originalityScore < 70) {
        outputContent += `\n\n[⚠️ COMPLIANCE ALERT: Originality Score ${complianceReport.originalityScore}%. Some phrases may resemble existing songs.]`;
      }

      addMessage({
        id: workflowId + "_final",
        role: "model",
        content: outputContent,
        sunoFormattedContent: sunoData.formattedLyrics,
        sunoStylePrompt: sunoData.stylePrompt, // Store the specific style prompt
        senderAgent: "ORCHESTRATOR",
        timestamp: new Date(),
        complianceReport: complianceReport
      });

    } catch (error: any) {
      console.error("Workflow Error:", error);
      let friendlyMessage = "I encountered a musical block. Please try again.";
      
      // Handle known errors
      if (error.name === 'GeminiError') {
         if (error.type === 'AUTH') {
           // Re-throw Auth errors to be caught by main UI for opening settings
           throw error; 
         }
         friendlyMessage = `⚠️ ${error.message}`;
      }

      addMessage({
        id: Date.now().toString(),
        role: "system",
        content: friendlyMessage,
        timestamp: new Date()
      });
    } finally {
      setTimeout(() => {
        setAgentStatus({ active: false, currentAgent: "CHAT", message: "Ready", steps: [] });
      }, 2000);
    }
  };

  return {
    agentStatus,
    setAgentStatus,
    runSongGenerationWorkflow
  };
};