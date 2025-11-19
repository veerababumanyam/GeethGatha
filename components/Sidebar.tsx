
import React, { useState, useEffect } from "react";
import { Music, X, Feather, CheckCircle, Languages, Sparkles, Mic2, Heart, Palette, ListOrdered, Users, Save, Download, Trash2, Layout, ChevronRight, ChevronDown, Coffee, Sliders, Wand2, Info, RotateCcw } from "lucide-react";
import { AgentStatus, LanguageProfile, GenerationSettings, SavedProfile } from "../types";
import { SCENARIO_KNOWLEDGE_BASE, CeremonyDefinition } from "../config";
import { APP_LOGO } from "../assets/logo";

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

const SidebarSection = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  badge
}: { 
  title: string, 
  icon: React.ReactNode, 
  children?: React.ReactNode, 
  defaultOpen?: boolean,
  badge?: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors group outline-none focus:bg-secondary/20"
      >
        <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" }) : icon}
          {title}
        </span>
        <div className="flex items-center gap-3">
          {badge}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden min-h-0">
          <div className="p-4 pt-0 space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentCard = ({ icon, name, desc, active }: { icon: React.ReactNode, name: string, desc: string, active: boolean }) => (
  <div className={`flex items-center gap-3 p-2 rounded-lg transition-all border ${
    active 
      ? "bg-primary/10 border-primary/30 shadow-sm" 
      : "border-transparent opacity-60 hover:opacity-100"
  }`}>
    <div className={`p-1.5 rounded-full ${
      active 
        ? "text-primary bg-primary/10" 
        : "text-muted-foreground bg-secondary"
    }`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-3 h-3" }) : icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-medium truncate ${active ? "text-primary" : "text-muted-foreground"}`}>{name}</p>
      <p className="text-[9px] text-muted-foreground/80 truncate">{desc}</p>
    </div>
    {active && <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
  </div>
);

const PreferenceSelect = ({ 
  label, 
  icon, 
  value, 
  options, 
  customValue, 
  onChange, 
  onCustomChange,
  compact = false
}: { 
  label: string, 
  icon: React.ReactNode, 
  value: string, 
  options: string[], 
  customValue: string, 
  onChange: (val: string) => void, 
  onCustomChange: (val: string) => void,
  compact?: boolean
}) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 truncate" title={label}>
      {icon} {label}
    </label>
    <div className="relative">
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-input text-foreground text-xs rounded-md focus:ring-1 focus:ring-primary focus:border-primary block p-2 pr-6 outline-none transition-colors appearance-none cursor-pointer hover:border-primary/50 truncate"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-muted-foreground">
        <ChevronDown className="w-3 h-3" />
      </div>
    </div>
    {value === "Custom" && (
      <input
        type="text"
        value={customValue}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder="Type custom..."
        className="w-full bg-background border border-input text-foreground text-xs rounded-md focus:ring-1 focus:ring-primary focus:border-primary block p-2 outline-none animate-slideIn"
      />
    )}
  </div>
);

export const Sidebar = React.memo(({ isOpen, onClose, agentStatus, languageSettings, onLanguageChange, generationSettings, onSettingChange, onLoadProfile }: SidebarProps) => {
  const [profileName, setProfileName] = useState("");
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [autoConfigured, setAutoConfigured] = useState(false);

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

  useEffect(() => {
    if (generationSettings.category && !activeCategory) {
      setActiveCategory(generationSettings.category);
    }
  }, [generationSettings.category]);

  // Clear Auto-configure badge after a delay
  useEffect(() => {
    if (autoConfigured) {
      const timer = setTimeout(() => setAutoConfigured(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [autoConfigured]);

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

  // --- SMART AUTO-CONFIGURATION LOGIC ---
  const handleCeremonySelect = (category: string, event: CeremonyDefinition) => {
    // 1. Set Context
    onSettingChange('category', category);
    onSettingChange('ceremony', event.id);
    
    // 2. Apply Smart Defaults from Knowledge Base
    onSettingChange('theme', event.label);
    onSettingChange('mood', event.defaultMood);
    onSettingChange('style', event.defaultStyle);
    onSettingChange('complexity', event.defaultComplexity);
    onSettingChange('rhymeScheme', event.defaultRhyme);
    onSettingChange('singerConfig', event.defaultSinger);

    // 3. Trigger Visual Feedback
    setAutoConfigured(true);
  };

  const languages = [
    "Assamese", "Bengali", "Bodo", "Dogri", "English", "Gujarati", "Hindi", "Kannada", "Kashmiri", "Konkani", "Maithili", 
    "Malayalam", "Manipuri", "Marathi", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi", "Tamil", "Telugu", "Urdu"
  ];

  const moods = ["Happy", "Sad (Pathos)", "Energetic", "Peaceful", "Romantic (Shringara)", "Angry (Raudra)", "Mysterious", "Funny (Hasya)", "Courageous (Veera)", "Playful (Kids)", "Devotional", "Philosophical", "Custom"];
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
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-card border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 
      `}>
        
        {/* --- Header --- */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-auto flex-shrink-0">
              <img 
                src={APP_LOGO} 
                alt="SWAZ Logo" 
                className="h-full w-auto object-contain"
              />
            </div>
            <h1 className="text-lg font-cinema font-bold text-foreground leading-none">
              SWAZ <span className="text-xs font-sans font-normal text-muted-foreground block">eLyrics</span>
            </h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- Scrollable Content --- */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pb-6">
          
          {/* 1. Language Studio */}
          <SidebarSection 
            title="Language Mix" 
            icon={<Languages />} 
            defaultOpen={true}
            badge={isMixed && <span className="text-[9px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium"><Sparkles className="w-2 h-2" /> Fusion</span>}
          >
             <div className="space-y-4 relative">
                {/* Primary */}
                <div>
                  <label className="text-[10px] font-bold text-foreground/80 mb-1.5 flex items-center justify-between">
                    <span>PRIMARY LANGUAGE</span>
                    <span className="text-[9px] text-muted-foreground bg-secondary px-1 rounded">Base</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={languageSettings.primary}
                      onChange={(e) => {
                         const newLang = e.target.value;
                         onLanguageChange('primary', newLang);
                         // Auto-sync others if they were matching previously
                         if (languageSettings.secondary === languageSettings.primary) onLanguageChange('secondary', newLang);
                         if (languageSettings.tertiary === languageSettings.primary) onLanguageChange('tertiary', newLang);
                      }}
                      className="w-full bg-background border border-primary/40 text-foreground text-sm font-medium rounded-lg focus:ring-1 focus:ring-primary block p-2.5 pr-8 outline-none appearance-none cursor-pointer shadow-sm hover:border-primary transition-colors"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-primary">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                <div className="absolute left-4 top-[60px] bottom-[30px] w-0.5 bg-gradient-to-b from-primary/20 to-transparent -z-10"></div>

                {/* Mixers */}
                <div className="grid grid-cols-2 gap-3 pl-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span> Secondary
                    </label>
                    <div className="relative">
                      <select 
                        value={languageSettings.secondary}
                        onChange={(e) => onLanguageChange('secondary', e.target.value)}
                        className="w-full bg-secondary/30 border border-border text-foreground/80 text-xs rounded-md block p-2 pr-6 outline-none appearance-none focus:border-primary/50"
                      >
                        {languages.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none text-muted-foreground">
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/20"></span> Tertiary
                    </label>
                    <div className="relative">
                      <select 
                        value={languageSettings.tertiary}
                        onChange={(e) => onLanguageChange('tertiary', e.target.value)}
                        className="w-full bg-secondary/30 border border-border text-foreground/80 text-xs rounded-md block p-2 pr-6 outline-none appearance-none focus:border-primary/50"
                      >
                        {languages.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none text-muted-foreground">
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          </SidebarSection>

          {/* 2. Context & Situation */}
          <SidebarSection 
            title="Context" 
            icon={<Coffee />}
            defaultOpen={true}
            badge={autoConfigured && (
              <span className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full animate-pulse border border-emerald-500/20">
                <Wand2 className="w-2.5 h-2.5" /> Optimized
              </span>
            )}
          >
             <div className="space-y-0.5">
               {SCENARIO_KNOWLEDGE_BASE.map((category) => (
                 <div key={category.id} className="overflow-hidden transition-colors">
                   <button 
                     onClick={() => setActiveCategory(activeCategory === category.id ? "" : category.id)}
                     className={`
                       w-full flex items-center justify-between p-2 text-left transition-all rounded-md
                       ${activeCategory === category.id ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}
                     `}
                   >
                     <span className="text-xs">{category.label}</span>
                     <ChevronRight className={`w-3 h-3 transition-transform duration-200 opacity-50 ${activeCategory === category.id ? "rotate-90" : ""}`} />
                   </button>
                   
                   <div className={`
                     grid transition-all duration-300 ease-in-out
                     ${activeCategory === category.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
                   `}>
                     <div className="overflow-hidden">
                       <div className="pl-3 pr-1 py-1 grid grid-cols-1 gap-1 border-l border-border ml-2.5 my-1">
                         {category.events.map((event) => (
                           <button
                             key={event.id}
                             title={event.promptContext} // Tooltip
                             onClick={() => handleCeremonySelect(category.id, event)}
                             className={`
                               text-left text-[11px] px-2.5 py-1.5 rounded-md transition-all flex items-center justify-between group relative
                               ${generationSettings.ceremony === event.id 
                                 ? "bg-primary/10 text-primary font-semibold" 
                                 : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                               }
                             `}
                           >
                             <span className="truncate mr-2">{event.label}</span>
                             {generationSettings.ceremony === event.id && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                           </button>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </SidebarSection>

          {/* 3. Fine Tuning */}
          <SidebarSection 
            title="Fine Tuning" 
            icon={<Sliders />}
            defaultOpen={true} 
          >
             <div className="space-y-4 animate-slideIn">
                {/* Theme Override - Full Width */}
                <PreferenceSelect 
                  label="Theme Override" 
                  icon={<Palette className="w-3 h-3 text-muted-foreground" />}
                  value={generationSettings.theme} 
                  options={["Custom", ...SCENARIO_KNOWLEDGE_BASE.flatMap(c => c.events.map(e => e.label))]} 
                  customValue={generationSettings.customTheme}
                  onChange={(val) => onSettingChange('theme', val)}
                  onCustomChange={(val) => onSettingChange('customTheme', val)}
                />

                {/* Grid Row 1 */}
                <div className="grid grid-cols-2 gap-3">
                  <PreferenceSelect 
                    label="Emotional Mood" 
                    icon={<Heart className="w-3 h-3 text-muted-foreground" />}
                    value={generationSettings.mood} 
                    options={moods} 
                    customValue={generationSettings.customMood}
                    onChange={(val) => onSettingChange('mood', val)}
                    onCustomChange={(val) => onSettingChange('customMood', val)}
                    compact
                  />

                  <PreferenceSelect 
                    label="Musical Style" 
                    icon={<Mic2 className="w-3 h-3 text-muted-foreground" />}
                    value={generationSettings.style} 
                    options={styles} 
                    customValue={generationSettings.customStyle}
                    onChange={(val) => onSettingChange('style', val)}
                    onCustomChange={(val) => onSettingChange('customStyle', val)}
                    compact
                  />
                </div>

                {/* Grid Row 2 */}
                <div className="grid grid-cols-2 gap-3">
                  <PreferenceSelect 
                    label="Singer Config" 
                    icon={<Users className="w-3 h-3 text-muted-foreground" />}
                    value={generationSettings.singerConfig} 
                    options={singerConfigs} 
                    customValue=""
                    onChange={(val) => onSettingChange('singerConfig', val)}
                    onCustomChange={() => {}}
                    compact
                  />

                  <PreferenceSelect 
                    label="Rhyme Pattern" 
                    icon={<ListOrdered className="w-3 h-3 text-muted-foreground" />}
                    value={generationSettings.rhymeScheme} 
                    options={rhymeSchemes} 
                    customValue={generationSettings.customRhymeScheme}
                    onChange={(val) => onSettingChange('rhymeScheme', val)}
                    onCustomChange={(val) => onSettingChange('customRhymeScheme', val)}
                    compact
                  />
                </div>

                {/* Complexity Toggles */}
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Feather className="w-3 h-3" /> Complexity
                  </label>
                  <div className="flex p-1 bg-secondary rounded-lg border border-border/50">
                    {complexities.map((level) => (
                      <button
                        key={level}
                        onClick={() => onSettingChange('complexity', level as any)}
                        className={`flex-1 text-[10px] py-1.5 rounded-md transition-all font-medium ${
                          generationSettings.complexity === level 
                          ? "bg-background text-primary shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
          </SidebarSection>

          {/* 4. Profiles */}
          <SidebarSection 
            title="Profiles" 
            icon={<Layout />}
            badge={savedProfiles.length > 0 ? <span className="bg-secondary text-[10px] px-1.5 py-0.5 rounded-full text-muted-foreground border border-border">{savedProfiles.length}</span> : null}
          >
             <div className="space-y-3">
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Name current setup..."
                      className="flex-1 bg-background border border-input text-foreground text-xs rounded-md px-3 py-2 outline-none focus:border-primary placeholder-muted-foreground/50"
                   />
                   <button 
                     onClick={handleSaveProfile}
                     disabled={!profileName}
                     className="bg-primary text-primary-foreground hover:brightness-110 px-3 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
                     title="Save Profile"
                   >
                     <Save className="w-3.5 h-3.5" />
                   </button>
                </div>
                
                {savedProfiles.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                     {savedProfiles.map(profile => (
                       <div key={profile.id} className="flex items-center justify-between bg-secondary/30 hover:bg-secondary/80 p-2 rounded-lg group transition-all border border-transparent hover:border-border/50">
                          <div className="flex flex-col min-w-0">
                             <span className="text-xs text-foreground font-medium truncate">{profile.name}</span>
                             <span className="text-[9px] text-muted-foreground truncate opacity-70">{profile.language.primary} • {profile.generation.theme}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleLoadProfile(profile)}
                               className="text-primary hover:bg-background p-1.5 rounded shadow-sm transition-colors" 
                               title="Load Profile"
                             >
                               <Download className="w-3 h-3" />
                             </button>
                             <button 
                               onClick={() => handleDeleteProfile(profile.id)}
                               className="text-destructive hover:bg-background p-1.5 rounded shadow-sm transition-colors" 
                               title="Delete"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                       </div>
                     ))}
                  </div>
                ) : (
                   <div className="text-center py-4 text-muted-foreground/40 border border-dashed border-border rounded-lg">
                      <p className="text-[10px]">No saved profiles yet</p>
                   </div>
                )}
             </div>
          </SidebarSection>

        </div>

        {/* --- Sticky Footer (Agent Status) --- */}
        <div className="border-t border-border bg-background/80 backdrop-blur-md p-4">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
               <Sparkles className="w-3 h-3" /> System Status
             </h3>
             <div className={`w-2 h-2 rounded-full ${agentStatus.active ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-700"}`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AgentCard 
              icon={<Feather />} 
              name="Lyricist" 
              desc="Composer" 
              active={agentStatus.currentAgent === "LYRICIST"} 
            />
            <AgentCard 
              icon={<CheckCircle />} 
              name="Review" 
              desc="Quality Check" 
              active={agentStatus.currentAgent === "REVIEW"} 
            />
          </div>
        </div>

      </div>
    </>
  );
});
    