
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  Mic, Send, Menu, Globe, MoreVertical, MicOff, User, Bot, Feather, BookOpen, CheckCircle, Sparkles, Heart, ShieldCheck, Video, FileCode
} from "lucide-react";

// Modular Imports
import { AgentType, Message, LanguageProfile, GenerationSettings } from "./types";
import { runChatAgent } from "./agents/chat";
import { useOrchestrator } from "./hooks/useOrchestrator";

// Component Imports
import { Sidebar } from "./components/Sidebar";
import { WorkflowStatus } from "./components/WorkflowStatus";
import { LyricsRenderer } from "./components/LyricsRenderer";

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentStatus]);

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
    // Optional: Add a system toast or small message
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
    recognitionRef.current.lang = "en-IN"; 

    recognitionRef.current.onstart = () => setIsRecording(true);
    recognitionRef.current.onend = () => setIsRecording(false);
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognitionRef.current.start();
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-telugu">
      
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

      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-medium text-slate-200">Composition Studio</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${agentStatus.active ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></span>
                <span className="text-xs text-slate-400">
                  {agentStatus.active ? "Orchestration Active" : "Ready for Input"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-amber-400 transition-colors" title="Language Settings">
              <Globe className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
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
              <div className={`
                w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg
                ${msg.role === "user" ? "bg-slate-700" : "bg-amber-500/10 border border-amber-500/30"}
              `}>
                {msg.role === "user" ? (
                  <User className="w-5 h-5 text-slate-300" />
                ) : (
                  renderAgentIcon(msg.senderAgent)
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[85%] lg:max-w-[70%]`}>
                 <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${msg.role === "user" ? "text-slate-400 ml-auto" : "text-amber-400"}`}>
                      {msg.role === "user" ? "You" : msg.senderAgent || "GeetGatha"}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>

                 <div className={`
                   p-4 rounded-2xl shadow-xl text-sm leading-relaxed whitespace-pre-wrap
                   ${msg.role === "user" 
                     ? "bg-slate-800 text-slate-200 rounded-tr-none" 
                     : "bg-slate-900/80 border border-slate-800 text-slate-300 rounded-tl-none backdrop-blur-md"
                   }
                   ${msg.senderAgent === "ORCHESTRATOR" ? "border-amber-500/20 bg-gradient-to-b from-slate-900 to-amber-950/10" : ""}
                 `}>
                   {/* Custom Render for Lyrics vs Standard Text */}
                   {msg.senderAgent === "ORCHESTRATOR" && msg.content.includes("[") ? (
                     <>
                      <LyricsRenderer content={msg.content} sunoContent={msg.sunoFormattedContent} />
                      {msg.complianceReport && (
                        <div className="mt-4 pt-4 border-t border-slate-800/50 text-xs font-mono text-slate-500">
                          <div className="flex items-center gap-2">
                             <ShieldCheck className={`w-3 h-3 ${msg.complianceReport.originalityScore > 80 ? 'text-green-500' : 'text-red-500'}`} />
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
        <div className="p-4 lg:p-6 bg-slate-950 border-t border-slate-800 z-20">
          <div className="max-w-4xl mx-auto relative flex items-center gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-2xl focus-within:border-amber-500/50 transition-colors">
            <button 
              onClick={toggleRecording}
              className={`p-3 rounded-lg transition-all ${isRecording ? "bg-red-500/20 text-red-500 animate-pulse" : "hover:bg-slate-800 text-slate-400"}`}
              title="Voice Input"
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !agentStatus.active) processUserMessage(input);
                }
              }}
              placeholder="Describe the scene, mood, or hum a tune..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 resize-none max-h-32 py-3 text-sm scrollbar-hide"
              rows={1}
            />

            <button 
              onClick={() => {
                if (input.trim() && !agentStatus.active) processUserMessage(input);
              }}
              disabled={!input.trim() || agentStatus.active}
              className="p-3 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-600">
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