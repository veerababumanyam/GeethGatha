
import React, { useState, useEffect } from "react";
import { X, Type, Palette, Sparkles, Check, Loader2, Undo2, Key, ShieldAlert, Eye, EyeOff, ExternalLink, HelpCircle, Wifi, CheckCircle2, AlertCircle } from "lucide-react";
import { AppearanceSettings, AppTheme } from "../types";
import { runThemeAgent } from "../agents/theme";
import { DEFAULT_THEMES } from "../config";
import { GoogleGenAI } from "@google/genai";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppearanceSettings;
  onUpdateSettings: (settings: AppearanceSettings) => void;
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
}

export const SettingsModal = ({ isOpen, onClose, settings, onUpdateSettings, apiKey, onUpdateApiKey }: SettingsModalProps) => {
  const [themePrompt, setThemePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'appearance' | 'connection'>('appearance');
  
  // API Key State
  const [tempKey, setTempKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setTempKey(apiKey);
    setConnectionStatus('idle');
    setStatusMessage("");
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleFontSizeChange = (size: number) => {
    onUpdateSettings({ ...settings, fontSize: size });
  };

  const handleThemeSelect = (themeId: string) => {
    onUpdateSettings({ ...settings, themeId });
  };

  const handleGenerateTheme = async () => {
    if (!themePrompt.trim()) return;
    if (!apiKey) {
      alert("Please enter your API Key in the 'AI Connection' tab first.");
      setActiveTab('connection');
      return;
    }
    setIsGenerating(true);
    const newTheme = await runThemeAgent(themePrompt, apiKey);
    if (newTheme) {
      const updatedCustomThemes = [newTheme, ...settings.customThemes];
      onUpdateSettings({
        ...settings,
        customThemes: updatedCustomThemes,
        themeId: newTheme.id
      });
      setThemePrompt("");
    } else {
      alert("Failed to generate theme. Please check your API Key or try a clearer description.");
    }
    setIsGenerating(false);
  };

  const testConnection = async (): Promise<boolean> => {
    if (!tempKey) return false;
    setConnectionStatus('testing');
    try {
       const ai = new GoogleGenAI({ apiKey: tempKey });
       await ai.models.generateContent({
         model: "gemini-2.5-flash",
         contents: "Test connection.",
       });
       setConnectionStatus('success');
       setStatusMessage("Verified! Connection successful.");
       
       // Auto-save on success
       setTimeout(() => {
          onUpdateApiKey(tempKey);
       }, 500);
       return true;
    } catch (e: any) {
       setConnectionStatus('error');
       const msg = e.message.toLowerCase();
       if (msg.includes('403') || msg.includes('api key') || msg.includes('unauthenticated')) {
         setStatusMessage("Invalid API Key. Please check carefully.");
       } else if (msg.includes('fetch')) {
         setStatusMessage("Network error. Check internet connection.");
       } else {
         setStatusMessage("Connection failed. Please try again.");
       }
       return false;
    }
  };

  const handleSaveKey = () => {
    if (connectionStatus === 'success') {
        onUpdateApiKey(tempKey);
        onClose();
    } else {
        testConnection().then((success) => {
            // If test passes after explicit save click, close modal
            if (success) onClose();
        });
    }
  };

  const currentTheme = [...DEFAULT_THEMES, ...settings.customThemes].find(t => t.id === settings.themeId) || DEFAULT_THEMES[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[var(--text-main)]">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-cinema font-bold">Settings</h2>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setActiveTab('appearance')}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === 'appearance' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                Appearance
              </button>
              <button 
                onClick={() => setActiveTab('connection')}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === 'connection' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                AI Connection
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-main)] rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {activeTab === 'appearance' ? (
            <>
              {/* Font Size Section */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                  <Type className="w-5 h-5 text-[var(--accent)]" /> Text Size & Readability
                </h3>
                <div className="bg-[var(--bg-main)] p-6 rounded-xl border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-wider font-bold opacity-60">Size: {settings.fontSize}px</span>
                    <button 
                      onClick={() => handleFontSizeChange(16)}
                      className="text-xs flex items-center gap-1 hover:text-[var(--accent)]"
                    >
                      <Undo2 className="w-3 h-3" /> Reset to Default
                    </button>
                  </div>
                  
                  <input 
                    type="range" 
                    min="12" 
                    max="26" 
                    step="1"
                    value={settings.fontSize}
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                  
                  <div className="flex justify-between mt-2 text-sm opacity-60 font-mono">
                    <span>Aa (Small)</span>
                    <span>Aa (Standard)</span>
                    <span>Aa (Large)</span>
                    <span>Aa (Extra Large)</span>
                  </div>
                </div>
              </section>

              {/* Theme Section */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                  <Palette className="w-5 h-5 text-[var(--accent)]" /> Color Themes
                </h3>
                
                {/* AI Generator */}
                <div className="mb-6 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border)] flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs uppercase tracking-wider font-bold opacity-60 mb-1 block">AI Theme Generator</label>
                    <input
                      type="text"
                      value={themePrompt}
                      onChange={(e) => setThemePrompt(e.target.value)}
                      placeholder={apiKey ? "e.g., 'Sunset in Jaipur', 'Cyberpunk Neon'" : "Enter API Key in AI Connection tab first"}
                      disabled={!apiKey}
                      className="w-full bg-transparent border-none focus:ring-0 text-[var(--text-main)] placeholder-opacity-50 px-0 disabled:cursor-not-allowed"
                    />
                  </div>
                  <button
                    onClick={handleGenerateTheme}
                    disabled={isGenerating || !themePrompt.trim() || !apiKey}
                    className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate
                  </button>
                </div>

                {/* Theme Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...DEFAULT_THEMES, ...settings.customThemes].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme.id)}
                      className={`relative p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                        settings.themeId === theme.id 
                          ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" 
                          : "border-[var(--border)] hover:border-[var(--text-secondary)]"
                      }`}
                      style={{ backgroundColor: theme.colors.bgSidebar }}
                    >
                      <div className="flex gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.bgMain }}></div>
                        <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.accent }}></div>
                        <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.textMain }}></div>
                      </div>
                      <span className="text-sm font-medium" style={{ color: theme.colors.textMain }}>{theme.name}</span>
                      {settings.themeId === theme.id && (
                        <div className="absolute top-2 right-2 p-1 bg-[var(--accent)] rounded-full text-[var(--accent-text)]">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            /* Connection Tab */
            <section>
               <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                  <Key className="w-5 h-5 text-[var(--accent)]" /> AI Connection
                </h3>

                <div className="bg-[var(--bg-main)] p-6 rounded-xl border border-[var(--border)] space-y-6">
                  
                  {/* Security Notice */}
                  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                      <p className="font-bold mb-1">Security Notice</p>
                      <p>Your API Key is stored locally in your browser's storage. It is sent directly to Google's servers and is never stored on any intermediary backend.</p>
                    </div>
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider font-bold opacity-70 flex items-center gap-2">
                      Google Gemini API Key
                    </label>
                    <div className="relative">
                      <input 
                        type={showKey ? "text" : "password"}
                        value={tempKey}
                        onChange={(e) => {
                          setTempKey(e.target.value);
                          setConnectionStatus('idle');
                        }}
                        placeholder="AIzaSy..."
                        className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg p-3 pr-12 outline-none focus:border-[var(--accent)] transition-colors font-mono text-sm shadow-inner"
                      />
                      <button 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-main)] p-1"
                        title={showKey ? "Hide Key" : "Show Key"}
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Connection Status Feedback */}
                    {connectionStatus !== 'idle' && (
                        <div className={`flex items-center gap-2 text-xs font-medium mt-2 px-1 animate-slideIn ${
                            connectionStatus === 'success' ? 'text-green-500' : 
                            connectionStatus === 'error' ? 'text-red-500' : 'text-[var(--text-secondary)]'
                        }`}>
                            {connectionStatus === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
                            {connectionStatus === 'success' && <CheckCircle2 className="w-3 h-3" />}
                            {connectionStatus === 'error' && <AlertCircle className="w-3 h-3" />}
                            <span>{statusMessage || "Checking connection..."}</span>
                        </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 gap-4">
                     <button 
                       onClick={() => testConnection()}
                       disabled={!tempKey || connectionStatus === 'testing'}
                       className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--text-main)] bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-main)] transition-colors disabled:opacity-50"
                     >
                       {connectionStatus === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                       Test Connection
                     </button>

                     <button 
                      onClick={handleSaveKey}
                      disabled={!tempKey}
                      className="bg-[var(--accent)] text-[var(--accent-text)] px-8 py-2.5 rounded-lg font-bold hover:brightness-110 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Key
                    </button>
                  </div>

                  {/* Beginner Guide */}
                  <div className="bg-[var(--bg-sidebar)]/50 rounded-xl p-4 border border-[var(--border)] text-sm space-y-3 mt-4">
                     <h4 className="font-semibold flex items-center gap-2">
                       <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold">?</span>
                       How to get your Free Key
                     </h4>
                     <ol className="list-decimal list-inside space-y-2 text-[var(--text-secondary)] ml-1">
                       <li>
                         Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline font-medium inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a> (requires Google account).
                       </li>
                       <li>Click the blue <strong>"Create API Key"</strong> button.</li>
                       <li>Select your project or create a new one.</li>
                       <li>Copy the code that looks like <code className="bg-[var(--bg-sidebar)] px-1 py-0.5 rounded border border-[var(--border)] text-xs">AIzaSy...</code></li>
                       <li>Paste it in the box above and click <strong>Test Connection</strong>.</li>
                     </ol>
                  </div>
                </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
    