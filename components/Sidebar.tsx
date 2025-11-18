
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
  <div className={`flex items-center gap-3 p-3 rounded-lg transition-all border ${active ? "bg-amber-500/10 border-amber-500/50" : "border-transparent hover:bg-slate-800"}`}>
    <div className={`p-2 rounded-full ${active ? "text-amber-400 bg-amber-400/10" : "text-slate-400 bg-slate-800"}`}>
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
    </div>
    <div>
      <p className={`text-sm font-medium ${active ? "text-amber-400" : "text-slate-300"}`}>{name}</p>
      <p className="text-[10px] text-slate-500">{desc}</p>
    </div>
    {active && <div className="ml-auto w-2 h-2 bg-amber-400 rounded-full animate-pulse" />}
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
    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
      {icon} {label}
    </label>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 outline-none transition-colors"
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
        className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2 outline-none animate-slideIn"
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
        fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 flex flex-col shadow-2xl
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
              <Music className="text-white w-5 h-5" />
            </div>
            <h1 className="text-2xl font-cinema font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">
              GeetGatha
            </h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          
          {/* Saved Profiles */}
          <section>
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Layout className="w-3 h-3" /> Profiles
             </h3>
             <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800 space-y-3">
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Name current setup..."
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded-md px-2 outline-none focus:border-amber-500"
                   />
                   <button 
                     onClick={handleSaveProfile}
                     disabled={!profileName}
                     className="bg-slate-700 hover:bg-amber-600 text-slate-200 p-1.5 rounded-md transition-colors disabled:opacity-50"
                     title="Save Profile"
                   >
                     <Save className="w-3 h-3" />
                   </button>
                </div>
                
                {savedProfiles.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-hide">
                     {savedProfiles.map(profile => (
                       <div key={profile.id} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-md group hover:bg-slate-800 transition-colors">
                          <div className="flex flex-col">
                             <span className="text-xs text-slate-300 font-medium">{profile.name}</span>
                             <span className="text-[9px] text-slate-500">{profile.language.primary} • {profile.generation.theme}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleLoadProfile(profile)}
                               className="text-amber-400 hover:bg-amber-400/10 p-1 rounded" 
                               title="Load"
                             >
                               <Download className="w-3 h-3" />
                             </button>
                             <button 
                               onClick={() => handleDeleteProfile(profile.id)}
                               className="text-red-400 hover:bg-red-400/10 p-1 rounded" 
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
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Languages className="w-3 h-3" /> Language Mix
             </h3>
             <div className="space-y-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800">
                {/* Primary */}
                <div className="relative group">
                  <div className="absolute left-2 -top-1.5 bg-slate-900 px-1 flex items-center gap-2 z-10 text-[10px] font-medium text-slate-400">
                    Primary
                    {isMixed && (
                       <span className="flex items-center gap-0.5 text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20">
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
                    className={`w-full bg-slate-800 border text-slate-200 text-xs rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 pt-3 outline-none transition-all ${
                      isMixed 
                        ? "border-amber-500/50 bg-gradient-to-b from-slate-800 to-slate-800/50" 
                        : "border-slate-700"
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
                    <label className="text-[10px] text-slate-500 absolute left-2 -top-1.5 bg-slate-900 px-1">Secondary</label>
                    <select 
                      value={languageSettings.secondary}
                      onChange={(e) => onLanguageChange('secondary', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 pt-3 outline-none"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tertiary */}
                  <div className="relative group">
                    <label className="text-[10px] text-slate-500 absolute left-2 -top-1.5 bg-slate-900 px-1">Tertiary</label>
                    <select 
                      value={languageSettings.tertiary}
                      onChange={(e) => onLanguageChange('tertiary', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 pt-3 outline-none"
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
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Settings className="w-3 h-3" /> Song Preferences
             </h3>
             <div className="space-y-4 bg-slate-800/30 p-3 rounded-xl border border-slate-800">
                <PreferenceSelect 
                  label="Theme" 
                  icon={<Palette className="w-3 h-3 text-purple-400" />}
                  value={generationSettings.theme} 
                  options={themes} 
                  customValue={generationSettings.customTheme}
                  onChange={(val) => onSettingChange('theme', val)}
                  onCustomChange={(val) => onSettingChange('customTheme', val)}
                />

                <PreferenceSelect 
                  label="Emotional Mood" 
                  icon={<Heart className="w-3 h-3 text-pink-400" />}
                  value={generationSettings.mood} 
                  options={moods} 
                  customValue={generationSettings.customMood}
                  onChange={(val) => onSettingChange('mood', val)}
                  onCustomChange={(val) => onSettingChange('customMood', val)}
                />

                <PreferenceSelect 
                  label="Musical Style" 
                  icon={<Mic2 className="w-3 h-3 text-blue-400" />}
                  value={generationSettings.style} 
                  options={styles} 
                  customValue={generationSettings.customStyle}
                  onChange={(val) => onSettingChange('style', val)}
                  onCustomChange={(val) => onSettingChange('customStyle', val)}
                />

                <PreferenceSelect 
                  label="Singer Voice" 
                  icon={<Users className="w-3 h-3 text-orange-400" />}
                  value={generationSettings.singerConfig} 
                  options={singerConfigs} 
                  customValue="" 
                  onChange={(val) => onSettingChange('singerConfig', val)}
                  onCustomChange={() => {}}
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Feather className="w-3 h-3 text-green-400" /> Lyrical Complexity
                  </label>
                  <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
                    {complexities.map((level) => (
                      <button
                        key={level}
                        onClick={() => onSettingChange('complexity', level)}
                        className={`flex-1 text-[10px] py-1.5 rounded-md transition-all ${
                          generationSettings.complexity === level 
                          ? "bg-slate-700 text-amber-400 font-medium shadow-sm" 
                          : "text-slate-400 hover:text-slate-300"
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
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               <ListOrdered className="w-3 h-3" /> Rhyme Scheme Assistant
             </h3>
             <div className="space-y-4 bg-slate-800/30 p-3 rounded-xl border border-slate-800">
                <PreferenceSelect 
                  label="Pattern" 
                  icon={<Sparkles className="w-3 h-3 text-yellow-400" />}
                  value={generationSettings.rhymeScheme} 
                  options={rhymeSchemes} 
                  customValue={generationSettings.customRhymeScheme}
                  onChange={(val) => onSettingChange('rhymeScheme', val)}
                  onCustomChange={(val) => onSettingChange('customRhymeScheme', val)}
                />
             </div>
          </section>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Agent Status</h3>
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