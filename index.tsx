
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  Mic, Send, Menu, Globe, MoreVertical, MicOff, User, Bot, Feather, BookOpen, CheckCircle, Sparkles, Heart, ShieldCheck, Video, FileCode, Settings as SettingsIcon, Key, HelpCircle, Trash2
} from "lucide-react";

// Modular Imports
import { AgentType, Message, LanguageProfile, GenerationSettings, AppearanceSettings, AppTheme, SavedSong } from "./types";
import { runChatAgent } from "./agents/chat";
import { useOrchestrator } from "./hooks/useOrchestrator";
import { getLanguageCode, GeminiError } from "./utils";
import { DEFAULT_THEMES, SUGGESTION_CHIPS, ENHANCED_PROMPTS, AUTO_OPTION } from "./config";
import "./global.css";

// Component Imports
import { Sidebar } from "./components/Sidebar";
import { WorkflowStatus } from "./components/WorkflowStatus";
import { LyricsRenderer } from "./components/LyricsRenderer";
import { SettingsModal } from "./components/SettingsModal";
import { HelpModal } from "./components/HelpModal";
import { MoodBackground } from "./components/MoodBackground";

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
    default: return <Bot className="w-4 h-4 text-muted-foreground" />;
  }
};

// --- Helper to convert hex to HSL for CSS vars ---
const hexToHSL = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
};

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "model",
  content: "Namaste! I am SWAZ eLyrics. I can help you weave magic into words for your next melody. Tell me the situation, mood, or language you have in mind.",
  senderAgent: "CHAT",
  timestamp: new Date(),
};

// --- Main App Orchestrator ---

const App = () => {
  // Load messages from persistence with Safety Check
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("swaz_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Safety Check: Ensure it's an array
        if (Array.isArray(parsed)) {
          return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      } catch (e) {
        console.error("Failed to load history, resetting.", e);
        localStorage.removeItem("swaz_chat_history");
      }
    }
    return [INITIAL_MESSAGE];
  });

  // Load Saved Songs Library with Safety Check
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>(() => {
    const saved = localStorage.getItem("swaz_song_library");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to load library", e);
        localStorage.removeItem("swaz_song_library");
      }
    }
    return [];
  });

  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // API Key Management
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("gemini_api_key") || "";
  });

  const handleUpdateApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem("gemini_api_key", key);
    } else {
      localStorage.removeItem("gemini_api_key");
    }
  };
  
  // Appearance State with Persistence
  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    const saved = localStorage.getItem("swaz_appearance");
    try {
      return saved ? JSON.parse(saved) : {
        fontSize: 16,
        themeId: "swaz",
        customThemes: []
      };
    } catch (e) {
      return { fontSize: 16, themeId: "swaz", customThemes: [] };
    }
  });

  const handleUpdateAppearance = (newSettings: AppearanceSettings) => {
    setAppearance(newSettings);
    localStorage.setItem("swaz_appearance", JSON.stringify(newSettings));
  };

  // Complex Language State
  const [languageSettings, setLanguageSettings] = useState<LanguageProfile>({
    primary: "Telugu",
    secondary: "Telugu",
    tertiary: "Telugu"
  });

  // Detailed Generation Preferences
  const [genSettings, setGenSettings] = useState<GenerationSettings>({
    category: "",
    ceremony: "",
    theme: AUTO_OPTION,
    customTheme: "",
    mood: AUTO_OPTION,
    customMood: "",
    style: AUTO_OPTION,
    customStyle: "",
    complexity: AUTO_OPTION, 
    rhymeScheme: AUTO_OPTION,
    customRhymeScheme: "",
    singerConfig: AUTO_OPTION,
    customSingerConfig: ""
  });

  const { agentStatus, setAgentStatus, runSongGenerationWorkflow } = useOrchestrator();

  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist Messages (Auto-Save)
  useEffect(() => {
    if (messages.length > 0) {
      const messagesToSave = messages.slice(-100); 
      localStorage.setItem("swaz_chat_history", JSON.stringify(messagesToSave));
    }
  }, [messages]);

  // Persist Saved Songs Library
  useEffect(() => {
    localStorage.setItem("swaz_song_library", JSON.stringify(savedSongs));
  }, [savedSongs]);

  // Apply Appearance Changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${appearance.fontSize}px`;
    const allThemes = [...DEFAULT_THEMES, ...appearance.customThemes];
    const activeTheme = allThemes.find(t => t.id === appearance.themeId) || DEFAULT_THEMES[0];

    if (activeTheme) {
      root.style.setProperty('--background', hexToHSL(activeTheme.colors.bgMain));
      root.style.setProperty('--foreground', hexToHSL(activeTheme.colors.textMain));
      root.style.setProperty('--card', hexToHSL(activeTheme.colors.bgSidebar));
      root.style.setProperty('--card-foreground', hexToHSL(activeTheme.colors.textMain));
      root.style.setProperty('--popover', hexToHSL(activeTheme.colors.bgSidebar));
      root.style.setProperty('--popover-foreground', hexToHSL(activeTheme.colors.textMain));
      root.style.setProperty('--primary', hexToHSL(activeTheme.colors.accent));
      root.style.setProperty('--primary-foreground', hexToHSL(activeTheme.colors.accentText));
      root.style.setProperty('--secondary', hexToHSL(activeTheme.colors.bgSidebar)); 
      root.style.setProperty('--secondary-foreground', hexToHSL(activeTheme.colors.textSecondary));
      root.style.setProperty('--muted', hexToHSL(activeTheme.colors.border)); 
      root.style.setProperty('--muted-foreground', hexToHSL(activeTheme.colors.textSecondary));
      root.style.setProperty('--accent', hexToHSL(activeTheme.colors.border)); 
      root.style.setProperty('--accent-foreground', hexToHSL(activeTheme.colors.textMain));
      root.style.setProperty('--border', hexToHSL(activeTheme.colors.border));
      root.style.setProperty('--input', hexToHSL(activeTheme.colors.border));
      root.style.setProperty('--ring', hexToHSL(activeTheme.colors.accent));

      if (appearance.themeId === 'dark' || appearance.themeId === 'royal' || appearance.themeId === 'swaz') {
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

  // --- Handlers ---

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

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear the conversation history? Saved songs in the Library will remain.")) {
      setMessages([INITIAL_MESSAGE]);
    }
  };

  const handleSuggestionClick = (label: string) => {
    const enhancedPrompt = ENHANCED_PROMPTS[label] || label;
    setInput(enhancedPrompt);
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, 10);
  };

  // --- Library Handlers ---

  const handleSaveSong = (data: { title: string, content: string, sunoContent?: string, sunoStylePrompt?: string, language?: string }) => {
     const newSong: SavedSong = {
         id: Date.now().toString(),
         title: data.title || "Untitled Composition",
         content: data.content,
         sunoContent: data.sunoContent,
         sunoStylePrompt: data.sunoStylePrompt,
         language: data.language,
         timestamp: Date.now()
     };
     setSavedSongs(prev => [newSong, ...prev]);
  };

  const handleDeleteSong = (id: string) => {
    if (confirm("Delete this song from your library?")) {
      setSavedSongs(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleLoadSong = (song: SavedSong) => {
    addMessage({
        id: Date.now().toString(),
        role: "model",
        content: song.content,
        sunoFormattedContent: song.sunoContent,
        sunoStylePrompt: song.sunoStylePrompt,
        senderAgent: "ORCHESTRATOR",
        timestamp: new Date(),
    });
    setIsSidebarOpen(false);
  };

  // --- Processing Logic ---

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const processUserMessage = async (userText: string) => {
    if (!apiKey && !process.env.API_KEY) {
        setIsSettingsOpen(true);
        return;
    }

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

    try {
      if (isSongRequest) {
        await runSongGenerationWorkflow(userText, languageSettings, genSettings, addMessage, apiKey);
      } else {
        await runChatWorkflow(userText);
      }
    } catch (error: any) {
      if (error.name === 'GeminiError' && error.type === 'AUTH') {
        setIsSettingsOpen(true);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "system",
          content: "🚫 Your API Key seems invalid. Please check settings.",
          timestamp: new Date()
        }]);
      } else {
        addErrorMessage(error.message);
      }
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
      const responseText = await runChatAgent(text, messages, undefined, apiKey);

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
    } catch (error: any) {
      if (error.name === 'GeminiError' && error.type === 'AUTH') {
        throw error; 
      }
      addErrorMessage(error.message || "Connection failed.");
    } finally {
      setAgentStatus({ active: false, currentAgent: "CHAT", message: "Ready", steps: [] });
    }
  };

  const addErrorMessage = (msg: string = "I encountered a connection issue. Please check your API Key in settings.") => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "system",
      content: msg,
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
  
  const getSuggestions = () => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderAgent === 'ORCHESTRATOR') return SUGGESTION_CHIPS['lyrics_generated'];
    }
    if (genSettings.category === 'love_romance') return SUGGESTION_CHIPS['love_romance'];
    if (genSettings.category === 'cinematic') return SUGGESTION_CHIPS['cinematic'];
    return SUGGESTION_CHIPS['default'];
  };

  const root = document.getElementById("root");
  if (!root) return null;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-telugu transition-colors duration-300 relative">
      
      {/* --- Dynamic Background Engine --- */}
      <MoodBackground mood={genSettings.mood} />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        agentStatus={agentStatus}
        languageSettings={languageSettings}
        onLanguageChange={handleLanguageChange}
        generationSettings={genSettings}
        onSettingChange={handleSettingChange}
        onLoadProfile={handleLoadProfile}
        onOpenHelp={() => setIsHelpOpen(true)}
        savedSongs={savedSongs}
        onDeleteSong={handleDeleteSong}
        onLoadSong={handleLoadSong}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appearance}
        onUpdateSettings={handleUpdateAppearance}
        apiKey={apiKey}
        onUpdateApiKey={handleUpdateApiKey}
      />
      
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-panel z-20 transition-colors">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-medium text-foreground">SWAZ eLyrics Studio</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${agentStatus.active ? 'bg-primary animate-pulse' : 'bg-green-500'}`}></span>
                <span className="text-xs text-muted-foreground">
                  {agentStatus.active ? "Orchestration Active" : "Ready for Input"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!apiKey && !process.env.API_KEY && (
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full animate-pulse"
                >
                    <Key className="w-3 h-3" /> Set API Key
                </button>
            )}
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              title="Help & Prompts"
            >
               <HelpCircle className="w-5 h-5" />
               <span className="hidden sm:inline text-xs font-medium">Help</span>
            </button>
             <button 
              onClick={handleClearChat}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              title="Clear Chat History"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-medium">Theme</span>
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
                  w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg border border-border/50 backdrop-blur-md
                  ${msg.role === "user" ? "bg-secondary/80 text-secondary-foreground" : "bg-card/80 text-primary"}
                `}
              >
                {msg.role === "user" ? (
                  <User className="w-5 h-5" />
                ) : (
                  renderAgentIcon(msg.senderAgent)
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[95%] lg:max-w-[75%] relative group`}>
                 <div className="flex items-center gap-2 mb-1">
                    <span 
                      className={`text-xs font-bold uppercase tracking-wider ${msg.role === "user" ? "ml-auto text-muted-foreground" : "text-primary"}`}
                    >
                      {msg.role === "user" ? "You" : msg.senderAgent || "SWAZ AI"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>

                 <div 
                   className={`
                     p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap transition-all duration-300
                     border backdrop-blur-md
                     ${msg.senderAgent === "ORCHESTRATOR" ? "border-primary/30 bg-card/80" : "border-border/50"}
                     ${msg.role === "user" ? "bg-secondary/80 text-secondary-foreground" : "bg-card/90 text-card-foreground"}
                   `}
                   style={{
                     borderTopRightRadius: msg.role === "user" ? 0 : '1rem',
                     borderTopLeftRadius: msg.role === "user" ? '1rem' : 0,
                   }}
                 >
                   {/* Custom Render for Lyrics vs Standard Text */}
                   {msg.senderAgent === "ORCHESTRATOR" && msg.content.includes("[") ? (
                     <>
                      <LyricsRenderer 
                        content={msg.content} 
                        sunoContent={msg.sunoFormattedContent} 
                        sunoStylePrompt={msg.sunoStylePrompt}
                        apiKey={apiKey}
                        onSave={(data) => handleSaveSong(data)} 
                      />
                      {msg.complianceReport && (
                        <div className="mt-4 pt-4 border-t border-border text-xs font-mono text-muted-foreground">
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
        <div className="p-4 lg:p-6 border-t border-border/30 z-20 transition-colors duration-300 bg-background/60 backdrop-blur-md">
          <div className="max-w-4xl mx-auto">
             
             {/* Suggestion Chips */}
             {!agentStatus.active && (
               <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
                 {getSuggestions().map((sug, i) => (
                   <button
                     key={i}
                     onClick={() => handleSuggestionClick(sug)}
                     className="text-[10px] whitespace-nowrap px-3 py-1.5 rounded-full bg-secondary/50 border border-border hover:bg-primary/10 hover:border-primary hover:text-primary transition-all backdrop-blur-sm font-medium text-muted-foreground"
                   >
                     <Sparkles className="w-2.5 h-2.5 inline mr-1" /> {sug}
                   </button>
                 ))}
               </div>
             )}

             <div className="relative flex items-end gap-3 bg-card/80 p-2 rounded-xl border border-border shadow-lg transition-colors backdrop-blur-md">
              <button 
                onClick={toggleRecording}
                className={`p-3 rounded-lg transition-all ${isRecording ? "bg-destructive/10 text-destructive animate-pulse" : "hover:bg-accent text-muted-foreground"}`}
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
                placeholder={apiKey ? "Describe the scene, mood, characters (e.g. Ram & Sita), or hum a tune..." : "Please connect your API Key in settings..."}
                disabled={!apiKey && !process.env.API_KEY}
                className="flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder-muted-foreground resize-none max-h-32 py-3 text-sm overflow-y-auto disabled:cursor-not-allowed"
                rows={1}
              />

              <button 
                onClick={() => {
                  if (input.trim() && !agentStatus.active) processUserMessage(input);
                }}
                disabled={!input.trim() || agentStatus.active || (!apiKey && !process.env.API_KEY)}
                className="p-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:brightness-110"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-muted-foreground opacity-70">
                AI-generated content can be inaccurate. Please review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
