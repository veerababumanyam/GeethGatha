
import React, { useState } from "react";
import { X, Type, Palette, Sparkles, Check, Loader2, Undo2 } from "lucide-react";
import { AppearanceSettings, AppTheme } from "../types";
import { runThemeAgent } from "../agents/theme";
import { DEFAULT_THEMES } from "../config";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppearanceSettings;
  onUpdateSettings: (settings: AppearanceSettings) => void;
}

export const SettingsModal = ({ isOpen, onClose, settings, onUpdateSettings }: SettingsModalProps) => {
  const [themePrompt, setThemePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleFontSizeChange = (size: number) => {
    onUpdateSettings({ ...settings, fontSize: size });
  };

  const handleThemeSelect = (themeId: string) => {
    onUpdateSettings({ ...settings, themeId });
  };

  const handleGenerateTheme = async () => {
    if (!themePrompt.trim()) return;
    setIsGenerating(true);
    const newTheme = await runThemeAgent(themePrompt);
    if (newTheme) {
      const updatedCustomThemes = [newTheme, ...settings.customThemes];
      onUpdateSettings({
        ...settings,
        customThemes: updatedCustomThemes,
        themeId: newTheme.id
      });
      setThemePrompt("");
    } else {
      alert("Failed to generate theme. Please try a clearer description.");
    }
    setIsGenerating(false);
  };

  const currentTheme = [...DEFAULT_THEMES, ...settings.customThemes].find(t => t.id === settings.themeId) || DEFAULT_THEMES[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[var(--text-main)]">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-cinema font-bold">Appearance Settings</h2>
            <p className="text-sm opacity-70">Customize readability and aesthetics</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-main)] rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
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

              <div className="mt-6 p-4 border border-[var(--border)] rounded-lg bg-[var(--bg-sidebar)]">
                <p className="text-base leading-relaxed">
                  This is a preview of how the text will look. 
                  <span className="font-bold"> GeetGatha</span> adjusts dynamically to ensure comfortable reading.
                  Legibility is key for creative flow.
                </p>
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
                  placeholder="e.g., 'Sunset in Jaipur', 'Cyberpunk Neon', 'Old Paper'"
                  className="w-full bg-transparent border-none focus:ring-0 text-[var(--text-main)] placeholder-opacity-50 px-0"
                />
              </div>
              <button
                onClick={handleGenerateTheme}
                disabled={isGenerating || !themePrompt.trim()}
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
        </div>
      </div>
    </div>
  );
};
