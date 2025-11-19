
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  Mic, Send, Menu, Globe, MoreVertical, MicOff, User, Bot, Feather, BookOpen, CheckCircle, Sparkles, Heart, ShieldCheck, Video, FileCode, Settings as SettingsIcon
} from "lucide-react";

// Modular Imports
import { AgentType, Message, LanguageProfile, GenerationSettings, AppearanceSettings, AppTheme } from "./types";
import { runChatAgent } from "./agents/chat";
import { useOrchestrator } from "./hooks/useOrchestrator";
import { getLanguageCode } from "./utils";
import { DEFAULT_THEMES } from "./config";

// Component Imports
import { Sidebar } from "./components/Sidebar";
import { WorkflowStatus } from "./components/WorkflowStatus";
import { LyricsRenderer } from "./components/LyricsRenderer";
import { SettingsModal } from "./components/SettingsModal";

// --- Helpers ---
const renderAgentIcon = (agent?: AgentType) => {
  switch (agent) {
    case "RESEARCH": return <BookOpen className="w-4 h-4 text-blue-400" />;
    case "LYRICIST": return <Feather className="w-4 h-4 text-amber-400" />;
    case "REVIEW": return <CheckCircle className="w-4 h-4 text-green-400" />;
    case "EMOTION": return <Heart className="w-4 h-4 text-pink-500" />;
    case "COMPLIANCE": return <ShieldCheck className="w-4 h-4 text-red-400" />;
    case "MULTIMODAL": return <Video className="w-4 h-4 text-indigo-400" />;
    case "FORMATTER": return <FileCode className="w-4 h-4 text-cyan-400" />;
    case "ORCHESTRATOR": return <Sparkles className="w-4 h-4 text-purple-400" />;
    default: return <Bot className="w-4 h-4 text-gray-400" />;
  }
};

// --- Main App Orchestrator ---

const App = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      content: "Namaste! I am GeetGatha. I can help you weave magic into words for your next melody. Tell me the situation, mood, or language you have in mind.",
      senderAgent: "CHAT",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Appearance State
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    fontSize: 16,
    themeId: "dark",
    customThemes: []
  });

  // Complex Language State
  const [languageSettings, setLanguageSettings] = useState<LanguageProfile>({
    primary: "Telugu",
    secondary: "Telugu",
    tertiary: "Telugu"
  });

  // Detailed Generation Preferences
  const [genSettings, setGenSettings] = useState<GenerationSettings>({
    theme: "Romance",
    customTheme: "",
    mood: "Romantic (Shringara)",
    customMood: "",
    style: "Melody",
    customStyle: "",
    complexity: "Poetic",
    rhymeScheme: "AABB",
    customRhymeScheme: "",
    singerConfig: "Male Solo"
  });

  const { agentStatus, setAgentStatus, runSongGenerationWorkflow } = useOrchestrator();

  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Apply Appearance Changes (Theme Variables + Font Size)
  useEffect(() => {
    const root = document.documentElement;
    
    // 1. Set Font Size on HTML Root (Scales Rem units)
    root.style.fontSize = `${appearance.fontSize}px`;

    // 2. Find Current Theme
    const allThemes = [...DEFAULT_THEMES, ...appearance.customThemes];
    const activeTheme = allThemes.find(t => t.id === appearance.themeId) || DEFAULT_THEMES[1]; // Default to Dark

    // 3. Set CSS Variables
    if (activeTheme) {
      root.style.setProperty('--bg-main', activeTheme.colors.bgMain);
      root.style.setProperty('--bg-sidebar', activeTheme.colors.bgSidebar);
      root.style.setProperty('--text-main', activeTheme.colors.textMain);
      root.style.setProperty('--text-secondary', activeTheme.colors.textSecondary);
      root.style.setProperty('--accent', activeTheme.colors.accent);
      root.style.setProperty('--accent-text', activeTheme.colors.accentText);
      root.style.setProperty('--border', activeTheme.colors.border);
      
      // Sync with Tailwind dark mode class if it's a dark theme
      if (appearance.themeId === 'dark' || appearance.themeId === 'royal') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

  }, [appearance]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentStatus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // --- Handlers (Memoized) ---

  const handleLanguageChange = useCallback((key: keyof LanguageProfile, value: string) => {
    setLanguageSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSettingChange = useCallback((key: keyof GenerationSettings, value: string) => {
    setGenSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleLoadProfile = useCallback((lang: LanguageProfile, gen: GenerationSettings) => {
    setLanguageSettings(lang);
    setGenSettings(gen);
  }, []);

  // --- Processing Logic ---

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const processUserMessage = async (userText: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      senderAgent: "CHAT",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const isSongRequest = /write|compose|song|lyrics|create|about/i.test(userText) && userText.length > 10;

    if (isSongRequest) {
      await runSongGenerationWorkflow(userText, languageSettings, genSettings, addMessage);
    } else {
      await runChatWorkflow(userText);
    }
  };

  const runChatWorkflow = async (text: string) => {
    setAgentStatus({ 
      active: true, 
      currentAgent: "CHAT", 
      message: "Thinking...", 
      steps: [{ id: 'chat', label: 'Processing Response', status: 'active' }] 
    });
    
    try {
      const responseText = await runChatAgent(text, messages);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          content: responseText,
          senderAgent: "CHAT",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      addErrorMessage();
    } finally {
      setAgentStatus({ active: false, currentAgent: "CHAT", message: "Ready", steps: [] });
    }
  };

  const addErrorMessage = () => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "system",
      content: "I encountered a musical block. Please try again.",
      timestamp: new Date()
    }]);
  };

  // --- Voice Logic ---
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = getLanguageCode(languageSettings.primary);

    recognitionRef.current.onstart = () => setIsRecording(true);
    recognitionRef.current.onend = () => setIsRecording(false);
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognitionRef.current.start();
  };

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-telugu transition-colors duration-300">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        agentStatus={agentStatus}
        languageSettings={languageSettings}
        onLanguageChange={handleLanguageChange}
        generationSettings={genSettings}
        onSettingChange={handleSettingChange}
        onLoadProfile={handleLoadProfile}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appearance}
        onUpdateSettings={setAppearance}
      />

      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-16 border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--bg-sidebar)]/80 backdrop-blur-sm z-10 transition-colors">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-main)]">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-medium text-[var(--text-main)]">Composition Studio</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${agentStatus.active ? 'bg-[var(--accent)] animate-pulse' : 'bg-green-500'}`}></span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {agentStatus.active ? "Orchestration Active" : "Ready for Input"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors flex items-center gap-2"
              title="Appearance Settings"
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-medium">Theme & Text</span>
            </button>
            <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors" title="Language Settings">
              <Globe className="w-5 h-5" />
            </button>
            <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6" ref={scrollRef}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 message-enter ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div 
                className={`
                  w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg border border-[var(--border)]
                `}
                style={{ 
                  backgroundColor: msg.role === "user" ? "var(--bg-sidebar)" : "var(--bg-sidebar)",
                  color: msg.role === "user" ? "var(--text-secondary)" : "var(--accent)"
                }}
              >
                {msg.role === "user" ? (
                  <User className="w-5 h-5" />
                ) : (
                  renderAgentIcon(msg.senderAgent)
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[85%] lg:max-w-[70%]`}>
                 <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-xs font-bold uppercase tracking-wider ml-auto" 
                      style={{ color: msg.role === "user" ? "var(--text-secondary)" : "var(--accent)" }}
                    >
                      {msg.role === "user" ? "You" : msg.senderAgent || "GeetGatha"}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>

                 <div 
                   className={`
                     p-4 rounded-2xl shadow-xl text-sm leading-relaxed whitespace-pre-wrap transition-colors duration-300
                     border
                   `}
                   style={{
                     backgroundColor: msg.role === "user" ? "var(--bg-sidebar)" : "var(--bg-sidebar)",
                     borderColor: msg.senderAgent === "ORCHESTRATOR" ? "var(--accent)" : "var(--border)",
                     color: "var(--text-main)",
                     borderTopRightRadius: msg.role === "user" ? 0 : '1rem',
                     borderTopLeftRadius: msg.role === "user" ? '1rem' : 0,
                   }}
                 >
                   {/* Custom Render for Lyrics vs Standard Text */}
                   {msg.senderAgent === "ORCHESTRATOR" && msg.content.includes("[") ? (
                     <>
                      <LyricsRenderer content={msg.content} sunoContent={msg.sunoFormattedContent} />
                      {msg.complianceReport && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)] text-xs font-mono text-[var(--text-secondary)]">
                          <div className="flex items-center gap-2">
                             <ShieldCheck className={`w-3 h-3 ${msg.complianceReport.originalityScore > 80 ? 'text-green-600' : 'text-red-500'}`} />
                             <span>Originality Score: {msg.complianceReport.originalityScore}%</span>
                             <span className="ml-auto">{msg.complianceReport.verdict}</span>
                          </div>
                        </div>
                      )}
                     </>
                   ) : (
                     msg.content
                   )}
                 </div>
              </div>
            </div>
          ))}

          {/* Enhanced Status Display */}
          {agentStatus.active && (
             <WorkflowStatus status={agentStatus} />
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-6 bg-[var(--bg-main)] border-t border-[var(--border)] z-20 transition-colors duration-300">
          <div className="max-w-4xl mx-auto relative flex items-end gap-3 bg-[var(--bg-sidebar)] p-2 rounded-xl border border-[var(--border)] shadow-2xl transition-colors">
            <button 
              onClick={toggleRecording}
              className={`p-3 rounded-lg transition-all ${isRecording ? "bg-red-100 text-red-600 animate-pulse" : "hover:bg-[var(--bg-main)] text-[var(--text-secondary)]"}`}
              title="Voice Input"
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !agentStatus.active) processUserMessage(input);
                }
              }}
              placeholder="Describe the scene, mood, or hum a tune..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-[var(--text-main)] placeholder-[var(--text-secondary)] resize-none max-h-32 py-3 text-sm overflow-y-auto"
              rows={1}
            />

            <button 
              onClick={() => {
                if (input.trim() && !agentStatus.active) processUserMessage(input);
              }}
              disabled={!input.trim() || agentStatus.active}
              className="p-3 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-[var(--text-secondary)]">
              AI-generated content can be inaccurate. Please review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
