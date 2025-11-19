
import React, { useState } from "react";
import { X, Layout, Sparkles, Music, Mic2, Copy, Check, BookOpen, Command, Zap, Heart, Terminal } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SectionTitle = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-3 border-b border-border pb-2">
    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 text-primary" })}
    {title}
  </h3>
);

const CopyablePrompt = ({ label, text }: { label: string, text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-secondary/30 border border-border rounded-lg p-3 group hover:border-primary/40 transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">{label}</span>
        <button 
          onClick={handleCopy}
          className="text-muted-foreground hover:text-primary transition-colors"
          title="Copy Prompt"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-sm text-foreground/80 font-medium leading-relaxed font-mono text-[11px] sm:text-xs">
        "{text}"
      </p>
    </div>
  );
};

export const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  const [activeTab, setActiveTab] = useState<'tour' | 'prompts' | 'suno'>('tour');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-foreground">
        
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-cinema font-bold">Guide & Prompts</h2>
              <p className="text-xs text-muted-foreground">Master SWAZ eLyrics Studio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 bg-background/50">
          {[
            { id: 'tour', label: 'App Tour', icon: <Layout /> },
            { id: 'prompts', label: 'Pro Prompts', icon: <Sparkles /> },
            { id: 'suno', label: 'Suno Workflow', icon: <Music /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'}
              `}
            >
              {React.cloneElement(tab.icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-background">
          
          {/* --- APP TOUR TAB --- */}
          {activeTab === 'tour' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
              <div className="grid md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <SectionTitle icon={<Layout />} title="The Sidebar" />
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="bg-secondary p-1 rounded h-fit"><Command className="w-4 h-4" /></span>
                      <span>
                        <strong className="text-foreground">Context Engine:</strong> Don't just write generic songs. Select a specific "Ceremony" (like <em>Pelli Choopulu</em> or <em>Hero Entry</em>) to unlock hidden cultural metaphors.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-secondary p-1 rounded h-fit"><Zap className="w-4 h-4" /></span>
                      <span>
                        <strong className="text-foreground">Language Mix:</strong> Want "Tanglish" or "Hinglish"? Set Primary to your native language and Secondary to English.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <SectionTitle icon={<Terminal />} title="The Renderer" />
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="bg-secondary p-1 rounded h-fit"><Sparkles className="w-4 h-4" /></span>
                      <span>
                        <strong className="text-foreground">Magic Rhymes:</strong> If the AI generates weak rhymes, click the Wand icon. It uses a specialized model to rewrite specific lines for perfect phonetic ending (Anthya Prasa).
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-secondary p-1 rounded h-fit"><Mic2 className="w-4 h-4" /></span>
                      <span>
                        <strong className="text-foreground">Listen (TTS):</strong> Click Play to hear the rhythm. Note: It recites lyrics, it doesn't sing them. Use this to check the meter (Maatra).
                      </span>
                    </li>
                  </ul>
                </div>

              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-4 items-start">
                 <div className="p-2 bg-amber-500/20 rounded-full text-amber-600 dark:text-amber-400">
                   <Zap className="w-5 h-5" />
                 </div>
                 <div>
                   <h4 className="font-bold text-amber-700 dark:text-amber-300 text-sm">Power User Tip</h4>
                   <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1">
                     You don't always need the sidebar. You can just type: <br/>
                     <em>"Write a fast-beat hero intro song in Telugu mixed with Hindi slang about a guy who loves Biryani."</em>
                   </p>
                 </div>
              </div>
            </div>
          )}

          {/* --- PRO PROMPTS TAB --- */}
          {activeTab === 'prompts' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-muted-foreground">
                The AI works best with specificity. Instead of "Write a love song", try these patterns.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <CopyablePrompt 
                  label="Mass / Action (Hero)"
                  text="Write a high-energy Hero Introduction song. Context: The hero steps out of a helicopter in a dust storm. Style: Mass Beat. Language: Telugu. Keywords: Lion, Fire, Ruler. Include strong Sanskrit words for power."
                />
                <CopyablePrompt 
                  label="Deep Romance (Melody)"
                  text="Compose a romantic duet about two lovers meeting secretly on a terrace under the moonlight. Mood: Intimate and whispered. Language: Hindi. Metaphors: Clouds hiding the moon, silence speaking louder than words."
                />
                <CopyablePrompt 
                  label="Heartbreak (Soup Song)"
                  text="Write a 'Soup Song' (Love Failure) that is funny but sad. The guy is drinking with friends complaining about how expensive dating is. Style: Catchy Folk Beat. Language: Tamil + English Mix."
                />
                <CopyablePrompt 
                  label="Devotional / Classical"
                  text="Compose a devotional song for Lord Shiva. Use 'Grandhika Bhasha' (Classical Telugu). Structure: Pallavi, 3 Charanams. Focus on the Rudra avatar and the cosmic dance."
                />
                <CopyablePrompt 
                  label="Item / Party Song"
                  text="Write a glitzy Party song set in a modern club. The lyrics should be trendy, using Gen-Z slang. Focus on dancing, bling, and the night life. High tempo."
                />
                <CopyablePrompt 
                  label="Suno Optimized Structure"
                  text="Write a song with this specific structure: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Guitar Solo], [Chorus], [Outro]. Theme: Cyberpunk city chase."
                />
              </div>
            </div>
          )}

          {/* --- SUNO WORKFLOW TAB --- */}
          {activeTab === 'suno' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-center py-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-30"></div>
                   <div className="relative bg-card border border-border p-6 rounded-2xl text-center max-w-md shadow-xl">
                      <h3 className="font-bold text-lg mb-2">From Lyrics to Audio</h3>
                      <p className="text-sm text-muted-foreground">
                        SWAZ generates the <em>Blueprint</em>. Suno/Udio generates the <em>Audio</em>.
                      </p>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-sm">Generate & Switch View</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Once SWAZ generates lyrics, click the <strong>"Suno Code"</strong> button in the top toolbar of the lyrics card. This strips away metadata and formats tags perfectly (e.g., <code className="bg-secondary px-1 py-0.5 rounded text-xs">[Verse]</code> instead of "Verse 1:").
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-sm">Copy to Clipboard</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click the <strong>Copy</strong> button.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-sm">Paste in Suno/Udio</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Go to Suno.com. Select <strong>"Custom Mode"</strong>. Paste the lyrics into the lyrics box.
                    </p>
                  </div>
                </div>

                 <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-sm shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-sm">Style Prompts</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      In the "Style of Music" box in Suno, use the metadata SWAZ provided (e.g., <em>"Tollywood Mass Beat, Fast Tempo, Male Vocals, Dappu Drums"</em>).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
