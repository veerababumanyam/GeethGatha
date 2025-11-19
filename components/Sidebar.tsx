
import React, { useState, useEffect } from "react";
import { Music, X, Feather, BookOpen, CheckCircle, History, Languages, Sparkles, Settings, Mic2, Heart, Palette, ListOrdered, Users, Save, Download, Trash2, Layout } from "lucide-react";
import { AgentStatus, LanguageProfile, GenerationSettings, SavedProfile } from "../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  agentStatus: AgentStatus;
  languageSettings: LanguageProfile;
  onLanguageChange: (type: keyof LanguageProfile, value: string) => void;
  generationSettings: GenerationSettings;
  onSettingChange: (type: keyof GenerationSettings, value: string) => void;
  onLoadProfile: (lang: LanguageProfile, gen: GenerationSettings) => void;
}

const AgentCard = ({ icon, name, desc, active }: { icon: React.ReactNode, name: string, desc: string, active: boolean }) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg transition-all border ${
    active 
      ? "bg-[var(--bg-main)] border-[var(--accent)]" 
      : "border-transparent hover:bg-[var(--bg-main)]"
  }`}>
    <div className={`p-2 rounded-full ${
      active 
        ? "text-[var(--accent)] bg-[var(--bg-sidebar)]" 
        : "text-[var(--text-secondary)] bg-[var(--bg-sidebar)]"
    }`}>
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
    </div>
    <div>
      <p className={`text-sm font-medium ${active ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`}>{name}</p>
      <p className="text-[10px] text-[var(--text-secondary)]">{desc}</p>
    </div>
    {active && <div className="ml-auto w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />}
  </div>
);

const PreferenceSelect = ({ 
  label, 
  icon, 
  value, 
  options, 
  customValue, 
  onChange, 
  onCustomChange 
}: { 
  label: string, 
  icon: React.ReactNode, 
  value: string, 
  options: string[], 
  customValue: string, 
  onChange: (val: string) => void, 
  onCustomChange: (val: string) => void 
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
      {icon} {label}
    </label>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-main)] text-xs rounded-lg focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] block p-2.5 outline-none transition-colors"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {value === "Custom" && (
      <input
        type="text"
        value={customValue}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder={`Enter custom ${label.toLowerCase()}...`}
        className="w-full bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-main)] text-xs rounded-lg focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] block p-2 outline-none animate-slideIn"
      />
    )}
  </div>
);

export const Sidebar = React.memo(({ isOpen, onClose, agentStatus, languageSettings, onLanguageChange, generationSettings, onSettingChange, onLoadProfile }: SidebarProps) => {
  const [profileName, setProfileName] = useState("");
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);

  // Load profiles on mount
  useEffect(() => {
    const saved = localStorage.getItem("geetgatha_profiles");
    if (saved) {
      try {
        setSavedProfiles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved profiles", e);
      }
    }
  }, []);

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;
    const newProfile: SavedProfile = {
      id: Date.now().toString(),
      name: profileName,
      language: languageSettings,
      generation: generationSettings,
      timestamp: Date.now()
    };
    const updated = [newProfile, ...savedProfiles];
    setSavedProfiles(updated);
    localStorage.setItem("geetgatha_profiles", JSON.stringify(updated));
    setProfileName("");
  };

  const handleDeleteProfile = (id: string) => {
    const updated = savedProfiles.filter(p => p.id !== id);
    setSavedProfiles(updated);
    localStorage.setItem("geetgatha_profiles", JSON.stringify(updated));
  };

  const handleLoadProfile = (profile: SavedProfile) => {
    onLoadProfile(profile.language, profile.generation);
  };

  const languages = [
    "Assamese", "Bengali", "Bodo", "Dogri", "English", "Gujarati", "Hindi", "Kannada", "Kashmiri", "Konkani", "Maithili", 
    "Malayalam", "Manipuri", "Marathi", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi", "Tamil", "Telugu", "Urdu"
  ];

  const themes = [
    "Romance", "Heartbreak", "Heroism", "Inspirational/Motivational", "Nature", "Devotional", "Party/Dance", 
    "Philosophy", "Friendship", "Patriotism", "Item Song", "Wedding", "Kids Rhymes", "Lullaby", "Educational", "Custom"
  ];
  const moods = ["Happy", "Sad (Pathos)", "Energetic", "Peaceful", "Romantic (Shringara)", "Angry (Raudra)", "Mysterious", "Funny (Hasya)", "Courageous (Veera)", "Playful (Kids)", "Custom"];
  const styles = [
    "Melody", "Fast Beat/Mass", "Classical", "Folk", "Western Fusion", "Rap/HipHop", "Ghazal/Sufi", "GenZ/Trendy", 
    "Nursery Rhyme", "Anthem", "Custom"
  ];
  const complexities = ["Simple", "Poetic", "Complex"];
  const rhymeSchemes = ["AABB", "ABAB", "ABCB", "AAAA", "AABCCB", "Free Verse", "Custom"];
  const singerConfigs = [
    "Male Solo", "Female Solo", "Duet (Male + Female)", "Group Chorus", "Child Solo", "Duet (Male + Male)", "Duet (Female + Female)", "Child Group", "Custom"
  ];

  const isMixed = languageSettings.primary !== languageSettings.secondary || languageSettings.primary !== languageSettings.tertiary;
  
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-[var(--bg-sidebar)] border-r border-[var(--border)] transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 flex flex-col shadow-2xl
      `}>
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-main)]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-amber-600 flex items-center justify-center shadow-lg">
              <Music className="text-white w-5 h-5" />
            </div>
            <h1 className="text-2xl font-cinema font-bold" style={{ color: "var(--text-main)" }}>
              GeetGatha
            </h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-[var(--text-secondary)]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-slate-100 dark:scrollbar-track-slate-900">
          
          {/* Saved Profiles */}
          <section>
             <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
               <Layout className="w-3 h-3" /> Profiles
             </h3>
             <div className="bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border)] space-y-3">
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Name current setup..."
                      className="flex-1 bg-[var(--bg-sidebar)] border border-[var(--border)] text-[var(--text-main)] text-[10px] rounded-md px-2 outline-none focus:border-[var(--accent)]"
                   />
                   <button 
                     onClick={handleSaveProfile}
                     disabled={!profileName}
                     className="bg-[var(--bg-sidebar)] hover:bg-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent-text)] p-1.5 rounded-md transition-colors disabled:opacity-50"
                     title="Save Profile"
                   >
                     <Save className="w-3 h-3" />
                   </button>
                </div>
                
                {savedProfiles.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-hide">
                     {savedProfiles.map(profile => (
                       <div key={profile.id} className="flex items-center justify-between bg-[var(--bg-sidebar)] p-2 rounded-md group hover:brightness-95 transition-all border border-transparent hover:border-[var(--border)]">
                          <div className="flex flex-col">
                             <span className="text-xs text-[var(--text-main)] font-medium">{profile.name}</span>
                             <span className="text-[9px] text-[var(--text-secondary)]">{profile.language.primary} • {profile.generation.theme}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleLoadProfile(profile)}
                               className="text-[var(--accent)] hover:bg-[var(--bg-main)] p-1 rounded" 
                               title="Load"
                             >
                               <Download className="w-3 h-3" />
                             </button>
                             <button 
                               onClick={() => handleDeleteProfile(profile.id)}
                               className="text-red-500 hover:bg-[var(--bg-main)] p-1 rounded" 
                               title="Delete"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                       </div>
                     ))}
                  </div>
                )}
             </div>
          </section>

          {/* Language Settings */}
          <section>
             <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
               <Languages className="w-3 h-3" /> Language Mix
             </h3>
             <div className="space-y-3 bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border)]">
                {/* Primary */}
                <div className="relative group">
                  <div className="absolute left-2 -top-1.5 bg-[var(--bg-main)] px-1 flex items-center gap-2 z-10 text-[10px] font-medium text-[var(--text-secondary)]">
                    Primary
                    {isMixed && (
                       <span className="flex items-center gap-0.5 text-[9px] text-[var(--accent)] bg-[var(--bg-sidebar)] px-1.5 py-0.5 rounded-full border border-[var(--border)]">
                         <Sparkles className="w-2 h-2" /> Fusion
                       </span>
                    )}
                  </div>
                  <select 
                    value={languageSettings.primary}
                    onChange={(e) => {
                       const newLang = e.target.value;
                       onLanguageChange('primary', newLang);
                       if (languageSettings.secondary === languageSettings.primary) onLanguageChange('secondary', newLang);
                       if (languageSettings.tertiary === languageSettings.primary) onLanguageChange('tertiary', newLang);
                    }}
                    className={`w-full bg-[var(--bg-sidebar)] border text-[var(--text-main)] text-xs rounded-lg focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] block p-2.5 pt-3 outline-none transition-all ${
                      isMixed 
                        ? "border-[var(--accent)]" 
                        : "border-[var(--border)]"
                    }`}
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Secondary */}
                  <div className="relative group">
                    <label className="text-[10px] text-[var(--text-secondary)] absolute left-2 -top-1.5 bg-[var(--bg-main)] px-1">Secondary</label>
                    <select 
                      value={languageSettings.secondary}
                      onChange={(e) => onLanguageChange('secondary', e.target.value)}
                      className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] text-[var(--text-secondary)] text-xs rounded-lg focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] block p-2.5 pt-3 outline-none"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tertiary */}
                  <div className="relative group">
                    <label className="text-[10px] text-[var(--text-secondary)] absolute left-2 -top-1.5 bg-[var(--bg-main)] px-1">Tertiary</label>
                    <select 
                      value={languageSettings.tertiary}
                      onChange={(e) => onLanguageChange('tertiary', e.target.value)}
                      className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] text-[var(--text-secondary)] text-xs rounded-lg focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] block p-2.5 pt-3 outline-none"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>
             </div>
          </section>

          {/* Preferences */}
          <section>
             <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
               <Settings className="w-3 h-3" /> Song Preferences
             </h3>
             <div className="space-y-4 bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border)]">
                <PreferenceSelect 
                  label="Theme" 
                  icon={<Palette className="w-3 h-3 text-purple-500" />}
                  value={generationSettings.theme} 
                  options={themes} 
                  customValue={generationSettings.customTheme}
                  onChange={(val) => onSettingChange('theme', val)}
                  onCustomChange={(val) => onSettingChange('customTheme', val)}
                />

                <PreferenceSelect 
                  label="Emotional Mood" 
                  icon={<Heart className="w-3 h-3 text-pink-500" />}
                  value={generationSettings.mood} 
                  options={moods} 
                  customValue={generationSettings.customMood}
                  onChange={(val) => onSettingChange('mood', val)}
                  onCustomChange={(val) => onSettingChange('customMood', val)}
                />

                <PreferenceSelect 
                  label="Musical Style" 
                  icon={<Mic2 className="w-3 h-3 text-blue-500" />}
                  value={generationSettings.style} 
                  options={styles} 
                  customValue={generationSettings.customStyle}
                  onChange={(val) => onSettingChange('style', val)}
                  onCustomChange={(val) => onSettingChange('customStyle', val)}
                />

                <PreferenceSelect 
                  label="Singer Voice" 
                  icon={<Users className="w-3 h-3 text-orange-500" />}
                  value={generationSettings.singerConfig} 
                  options={singerConfigs} 
                  customValue="" 
                  onChange={(val) => onSettingChange('singerConfig', val)}
                  onCustomChange={() => {}}
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Feather className="w-3 h-3 text-green-500" /> Lyrical Complexity
                  </label>
                  <div className="flex p-1 bg-[var(--bg-sidebar)] rounded-lg border border-[var(--border)]">
                    {complexities.map((level) => (
                      <button
                        key={level}
                        onClick={() => onSettingChange('complexity', level)}
                        className={`flex-1 text-[10px] py-1.5 rounded-md transition-all ${
                          generationSettings.complexity === level 
                          ? "bg-[var(--bg-main)] text-[var(--accent)] font-medium shadow-sm" 
                          : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
          </section>

          {/* Rhyme Scheme Assistant */}
          <section>
             <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
               <ListOrdered className="w-3 h-3" /> Rhyme Scheme Assistant
             </h3>
             <div className="space-y-4 bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border)]">
                <PreferenceSelect 
                  label="Pattern" 
                  icon={<Sparkles className="w-3 h-3 text-yellow-500" />}
                  value={generationSettings.rhymeScheme} 
                  options={rhymeSchemes} 
                  customValue={generationSettings.customRhymeScheme}
                  onChange={(val) => onSettingChange('rhymeScheme', val)}
                  onCustomChange={(val) => onSettingChange('customRhymeScheme', val)}
                />
             </div>
          </section>

          <div className="border-t border-[var(--border)] pt-4">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Agent Status</h3>
            <div className="space-y-2">
              <AgentCard 
                icon={<Feather />} 
                name="Lyricist" 
                desc="Creative Composition" 
                active={agentStatus.currentAgent === "LYRICIST"} 
              />
              <AgentCard 
                icon={<BookOpen />} 
                name="Research" 
                desc="Context & Culture" 
                active={agentStatus.currentAgent === "RESEARCH"} 
              />
              <AgentCard 
                icon={<CheckCircle />} 
                name="Review" 
                desc="Quality Assurance" 
                active={agentStatus.currentAgent === "REVIEW"} 
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
