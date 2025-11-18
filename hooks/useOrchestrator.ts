
import { useState } from "react";
import { AgentStatus, AgentStep, Message, LanguageProfile, GenerationSettings } from "../types";
import { runMultiModalAgent } from "../agents/multimodal";
import { runEmotionAgent } from "../agents/emotion";
import { runResearchAgent } from "../agents/research";
import { runLyricistAgent } from "../agents/lyricist";
import { runComplianceAgent } from "../agents/compliance";
import { runReviewAgent } from "../agents/review";
import { runFormatterAgent } from "../agents/formatter";

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

  const runSongGenerationWorkflow = async (
    request: string,
    languageSettings: LanguageProfile,
    genSettings: GenerationSettings,
    addMessage: (msg: Message) => void
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
      const processedContext = await runMultiModalAgent(request); 
      updateAgentStep('multimodal', 'completed');

      // --- Step 1: Emotion Analysis & Preferences ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "EMOTION", message: "Feeling the vibe...", steps: prev.steps.map(s => s.id === 'emotion' ? { ...s, status: 'active' } : s) }));
      const emotionData = await runEmotionAgent(processedContext);
      
      const effectiveTheme = genSettings.theme === "Custom" ? genSettings.customTheme : genSettings.theme;
      const effectiveMood = genSettings.mood === "Custom" ? genSettings.customMood : genSettings.mood;

      updateAgentStep('emotion', 'completed');

      // --- Step 2: Research ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "RESEARCH", message: "Analyzing context...", steps: prev.steps.map(s => s.id === 'research' ? { ...s, status: 'active' } : s) }));
      const researchData = await runResearchAgent(processedContext, `${effectiveMood} - ${effectiveTheme}`);
      updateAgentStep('research', 'completed');

      // --- Step 3: Lyricist ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "LYRICIST", message: "Composing...", steps: prev.steps.map(s => s.id === 'lyricist' ? { ...s, status: 'active' } : s) }));
      const draftLyrics = await runLyricistAgent(researchData, processedContext, languageSettings, emotionData, genSettings);
      updateAgentStep('lyricist', 'completed');

      // --- Step 4: Compliance Check ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "COMPLIANCE", message: "Checking safety...", steps: prev.steps.map(s => s.id === 'compliance' ? { ...s, status: 'active' } : s) }));
      const complianceReport = await runComplianceAgent(draftLyrics);
      updateAgentStep('compliance', 'completed');

      // --- Step 5: Review ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "REVIEW", message: "Polishing...", steps: prev.steps.map(s => s.id === 'review' ? { ...s, status: 'active' } : s) }));
      const finalLyrics = await runReviewAgent(draftLyrics, processedContext, languageSettings, genSettings);
      updateAgentStep('review', 'completed');

      // --- Step 6: Formatter (Suno.com) ---
      setAgentStatus(prev => ({ ...prev, currentAgent: "FORMATTER", message: "Formatting for Suno.com...", steps: prev.steps.map(s => s.id === 'formatter' ? { ...s, status: 'active' } : s) }));
      const sunoLyrics = await runFormatterAgent(finalLyrics);
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
        sunoFormattedContent: sunoLyrics,
        senderAgent: "ORCHESTRATOR",
        timestamp: new Date(),
        complianceReport: complianceReport
      });

    } catch (error) {
      console.error("Workflow Error:", error);
      addMessage({
        id: Date.now().toString(),
        role: "system",
        content: "I encountered a musical block. Please try again.",
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
