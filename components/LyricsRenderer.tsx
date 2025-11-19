
import React, { useState, useEffect, useRef } from "react";
import { Music, Copy, Play, RefreshCw, Sparkles, Clock, ListMusic, FileCode, Eye, Loader2, Square, Download, Printer, Share2, Edit3, Save, Wand2, Check, Image as ImageIcon2, XCircle, CheckCircle2, Bookmark, Speaker, Mic } from "lucide-react";
import { GoogleGenAI, Modality } from "@google/genai";
import { TTS_MODEL, MODEL_NAME, MODEL_FAST } from "../config";
import { playPCMData, wrapGenAIError } from "../utils";
import { runArtAgent } from "../agents/art";
import { runStyleAgent } from "../agents/style";

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton = ({ icon, label, active, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
      ${active 
        ? "bg-background text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
      }
    `}
  >
    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-3.5 h-3.5 ${active ? 'text-primary' : ''}` })}
    <span>{label}</span>
  </button>
);

const ActionButton = ({ icon, label, onClick, disabled, title }: { icon: React.ReactNode, label: string, onClick: () => void, disabled?: boolean, title?: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      flex flex-col items-center gap-1 p-2 rounded-lg transition-all w-20
      ${disabled 
        ? "opacity-40 cursor-not-allowed bg-transparent" 
        : "hover:bg-secondary text-muted-foreground hover:text-foreground bg-transparent"
      }
    `}
  >
    <div className="p-2 bg-secondary rounded-full mb-0.5 border border-border/50 shadow-sm group-hover:border-primary/30">
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
    </div>
    <span className="text-[9px] font-medium text-center leading-none">{label}</span>
  </button>
);

const renderStyledLine = (line: string) => {
  // Enhanced Regex to capture music meta-tags like [Guitar Solo] alongside voice tags
  const parts = line.split(/(\[(?:Male|Female|Both|Chorus|Verse|Pre-Chorus|Bridge|Hook|Intro|Outro|Instrumental|Child|Group|Duet|Big Chorus|Drop|Build Up|Solo|Guitar|Spoken|Whisper).*?\])/gi);

  return (
    <span>
      {parts.map((part, index) => {
        const isTag = part.startsWith('[') && part.endsWith(']');
        if (isTag) {
          let colorClass = "text-muted-foreground font-medium"; // default
          const p = part.toLowerCase();
          
          // Voices
          if (p.includes("male") || p.includes("spoken")) colorClass = "text-blue-500 dark:text-blue-400 font-semibold";
          if (p.includes("female") || p.includes("whisper")) colorClass = "text-pink-500 dark:text-pink-400 font-semibold";
          if (p.includes("both") || p.includes("duet")) colorClass = "text-purple-500 dark:text-purple-400 font-semibold";
          if (p.includes("child")) colorClass = "text-green-500 dark:text-green-400 font-semibold";
          
          // Structural (if embedded in line)
          if (p.includes("chorus") || p.includes("hook") || p.includes("group")) colorClass = "text-amber-600 dark:text-amber-400";
          
          // Instrumental / Music Events
          if (p.includes("intro") || p.includes("outro") || p.includes("instrumental") || p.includes("solo") || p.includes("drop")) {
             colorClass = "text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 px-1 rounded";
          }

          return (
            <span key={index} className={`mx-1 ${colorClass}`}>
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

// Helper to group lines into sections for rendering
const parseLyricsIntoSections = (lines: string[]) => {
  const sections: { type: 'header' | 'content', text: string, id: number }[] = [];
  let currentId = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();
    const isHeader = trimmed.startsWith('[') && trimmed.endsWith(']') 
      && (trimmed.includes("Verse") || trimmed.includes("Chorus") || trimmed.includes("Bridge") || trimmed.includes("Intro") || trimmed.includes("Outro") || trimmed.includes("Hook"));
    
    if (isHeader) {
      sections.push({ type: 'header', text: trimmed, id: currentId++ });
    } else if (trimmed) {
      sections.push({ type: 'content', text: line, id: currentId++ });
    } else {
       sections.push({ type: 'content', text: '', id: currentId++ });
    }
  });
  return sections;
};

export const LyricsRenderer = ({ 
  content, 
  sunoContent, 
  sunoStylePrompt, 
  apiKey,
  onSave 
}: { 
  content: string, 
  sunoContent?: string, 
  sunoStylePrompt?: string,
  apiKey?: string,
  onSave?: (data: any) => void
}) => {
  const [viewMode, setViewMode] = useState<'PRETTY' | 'EDIT' | 'SUNO'>('PRETTY');
  const [editableContent, setEditableContent] = useState(content);
  
  // Style Prompt State
  const [localStylePrompt, setLocalStylePrompt] = useState(sunoStylePrompt || "");
  const [isEnhancingStyle, setIsEnhancingStyle] = useState(false);

  // Audio States
  const [globalAudioStatus, setGlobalAudioStatus] = useState<'IDLE' | 'GENERATING' | 'PLAYING'>('IDLE');
  const [playingSectionId, setPlayingSectionId] = useState<number | null>(null);
  const stopAudioRef = useRef<(() => void) | null>(null);
  
  // Feature States
  const [isFixingRhyme, setIsFixingRhyme] = useState(false);
  const [coverArtUrl, setCoverArtUrl] = useState<string | null>(null);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [styleCopyStatus, setStyleCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  useEffect(() => {
    if (sunoStylePrompt) setLocalStylePrompt(sunoStylePrompt);
  }, [sunoStylePrompt]);

  useEffect(() => {
    if (copyStatus === 'copied') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  useEffect(() => {
    if (styleCopyStatus === 'copied') {
      const timer = setTimeout(() => setStyleCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [styleCopyStatus]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const lines = editableContent.split('\n');
  const sections = parseLyricsIntoSections(lines);
  
  // Extract metadata if present
  const metadata: Record<string, string> = {};
  const lyricsLines: string[] = [];

  lines.forEach(line => {
    if (line.startsWith('Title:')) metadata.title = line.replace('Title:', '').trim();
    else if (line.startsWith('Language:')) metadata.language = line.replace('Language:', '').trim();
    else if (line.startsWith('Raagam:')) metadata.music = line.replace('Raagam:', '').trim();
    else if (line.startsWith('Taalam:')) metadata.taalam = line.replace('Taalam:', '').trim();
    else if (line.startsWith('Structure:')) metadata.structure = line.replace('Structure:', '').trim();
    else lyricsLines.push(line);
  });

  const copyToClipboard = (text: string, isStyle = false) => {
    navigator.clipboard.writeText(text);
    if (isStyle) setStyleCopyStatus('copied');
    else setCopyStatus('copied');
  };

  const handleSaveLibrary = () => {
    if (onSave) {
      onSave({
         title: metadata.title || "Untitled Song",
         content: editableContent, // Save the edited version
         sunoContent: sunoContent,
         sunoStylePrompt: localStylePrompt, // Save the enhanced style
         language: metadata.language,
         structure: metadata.structure
      });
      setSaveStatus('saved');
    }
  };

  const handleDownload = () => {
    const textToSave = viewMode === 'SUNO' && sunoContent ? sunoContent : editableContent;
    const blob = new Blob([textToSave], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    let filename = "swaz-elyrics.txt";
    if (metadata.title) {
      const safeTitle = metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      filename = `${safeTitle}.txt`;
    } else {
       filename = `swaz_lyrics_${Date.now()}.txt`;
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printContent = lyricsLines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
             return `<h3 style="color: #d97706; margin-top: 24px; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">${trimmed}</h3>`;
        }
        return `<p style="margin: 6px 0; font-size: 16px; line-height: 1.6;">${line}</p>`;
    }).join('');

    const printWindow = window.open('', '', 'width=800,height=900');
    if (printWindow) {
        printWindow.document.write(`
            <html>
            <head>
                <title>${metadata.title || 'SWAZ eLyrics'}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1e293b; }
                    h1 { margin: 0 0 10px 0; font-size: 32px; text-align: center; }
                    .content { font-family: sans-serif; }
                </style>
            </head>
            <body>
                ${coverArtUrl ? `<div style="text-align:center;margin-bottom:20px;"><img src="${coverArtUrl}" style="max-width:200px;border-radius:10px;" /></div>` : ''}
                <h1>${metadata.title || 'Untitled Composition'}</h1>
                <div class="content">${printContent}</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
             printWindow.print();
             printWindow.close();
        }, 500);
    }
  };

  const handleShare = async () => {
    const shareText = `${metadata.title ? metadata.title + '\n\n' : ''}${editableContent}\n\n(Created with SWAZ eLyrics)`;
    const shareData: ShareData = {
        title: metadata.title || 'SWAZ eLyrics Song',
        text: shareText,
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) {}
    } else {
        copyToClipboard(shareText);
    }
  };

  const handleMagicRhymeFix = async () => {
    if (!apiKey) return;
    setIsFixingRhyme(true);
    try {
       const ai = new GoogleGenAI({ apiKey: apiKey });
       const response = await ai.models.generateContent({
         model: MODEL_FAST, // Use FAST model for responsiveness
         contents: `Review the following song lyrics. Identify lines that have weak rhymes (Anthya Prasa). Rewrite ONLY those specific lines to have better rhyming endings while keeping the same meaning. Output the FULL improved lyrics. \n\n ${editableContent}`
       });
       if (response.text) {
         setEditableContent(response.text);
         setViewMode('EDIT'); 
       }
    } catch (e) {
      const err = wrapGenAIError(e);
      alert(`Optimization Failed: ${err.message}`);
    } finally {
      setIsFixingRhyme(false);
    }
  };

  const handleEnhanceStyle = async () => {
    if (!apiKey) return;
    setIsEnhancingStyle(true);
    try {
      const enhanced = await runStyleAgent(localStylePrompt, editableContent, apiKey);
      setLocalStylePrompt(enhanced);
    } catch (e) {
      const err = wrapGenAIError(e);
      alert(`Style Enhancement Failed: ${err.message}`);
    } finally {
      setIsEnhancingStyle(false);
    }
  };

  const handleGenerateArt = async () => {
    if (!apiKey) return;
    setIsGeneratingArt(true);
    try {
      const url = await runArtAgent(
        metadata.title || "Song",
        lyricsLines.join(" ").substring(0, 500),
        "Cinematic, " + (metadata.music || "Musical"),
        apiKey
      );
      if (url) setCoverArtUrl(url);
    } catch (e) {
      const err = wrapGenAIError(e);
      alert(`Art Generation Failed: ${err.message}`);
    } finally {
      setIsGeneratingArt(false);
    }
  };

  const stopAudio = () => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    setGlobalAudioStatus('IDLE');
    setPlayingSectionId(null);
  };

  const handlePlayTTS = async (textToPlay: string, sectionId?: number) => {
    // If already playing, stop it
    if (globalAudioStatus === 'PLAYING') {
      stopAudio();
      return;
    }

    const key = apiKey || process.env.API_KEY;
    if (!key) {
      alert("API Key missing. Please add it in settings to use TTS.");
      return;
    }

    if (sectionId !== undefined) setPlayingSectionId(sectionId);
    setGlobalAudioStatus('GENERATING');

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: `Recite these lyrics rhythmically and clearly. Do not sing, but recite with emotion: \n\n${textToPlay}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        setGlobalAudioStatus('PLAYING');
        const controller = await playPCMData(audioData, () => {
           setGlobalAudioStatus('IDLE');
           setPlayingSectionId(null);
           stopAudioRef.current = null;
        });
        stopAudioRef.current = controller.stop;
      } else {
        setGlobalAudioStatus('IDLE');
        setPlayingSectionId(null);
      }
    } catch (e) {
      const err = wrapGenAIError(e);
      console.error("TTS Error", e);
      alert(`TTS Failed: ${err.message}`);
      setGlobalAudioStatus('IDLE');
      setPlayingSectionId(null);
    }
  };

  const handlePlayFull = () => handlePlayTTS(lyricsLines.join("\n"));

  const handlePlaySection = (startIndex: number) => {
    // If playing this specific section, stop.
    if (globalAudioStatus === 'PLAYING' && playingSectionId === sections[startIndex].id) {
      stopAudio();
      return;
    }
    
    // Gather text from startIndex until the next header
    let sectionText = "";
    for (let i = startIndex + 1; i < sections.length; i++) {
      if (sections[i].type === 'header') break;
      sectionText += sections[i].text + "\n";
    }
    if (sectionText.trim()) {
      handlePlayTTS(sectionText, sections[startIndex].id);
    }
  };

  return (
    <div className="relative group/renderer bg-card/40 border border-primary/10 rounded-xl overflow-hidden shadow-sm my-4">
      
      {/* --- Main Toolbar --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 border-b border-border bg-secondary/10 backdrop-blur-md gap-4 sm:gap-0">
         
         {/* View Toggles */}
         <div className="flex bg-secondary/40 p-1 rounded-lg gap-0.5">
            <TabButton 
              icon={<Eye />} 
              label="Visual" 
              active={viewMode === 'PRETTY'} 
              onClick={() => setViewMode('PRETTY')} 
            />
            <TabButton 
              icon={<Edit3 />} 
              label="Studio Mode" 
              active={viewMode === 'EDIT'} 
              onClick={() => setViewMode('EDIT')} 
            />
            {sunoContent && (
              <TabButton 
                icon={<FileCode />} 
                label="Suno Code" 
                active={viewMode === 'SUNO'} 
                onClick={() => setViewMode('SUNO')} 
              />
            )}
         </div>

         {/* Center Actions */}
         <div className="flex items-center gap-1">
            <ActionButton 
                icon={isFixingRhyme ? <Loader2 className="animate-spin" /> : <Wand2 />} 
                label="Magic Rhymes" 
                onClick={handleMagicRhymeFix}
                disabled={isFixingRhyme || !apiKey}
                title={!apiKey ? "API Key Required" : "Auto-fix rhymes"}
            />
            <ActionButton 
                icon={isGeneratingArt ? <Loader2 className="animate-spin" /> : <ImageIcon2 />} 
                label="Album Art" 
                onClick={handleGenerateArt}
                disabled={isGeneratingArt || !apiKey || !!coverArtUrl}
                title={!apiKey ? "API Key Required" : "Generate Art"}
            />
            {/* SAVE TO LIBRARY BUTTON */}
            <ActionButton 
                icon={saveStatus === 'saved' ? <CheckCircle2 className="text-green-500" /> : <Bookmark />} 
                label={saveStatus === 'saved' ? "Saved" : "Save to Library"}
                onClick={handleSaveLibrary}
                title="Save to persistent library"
            />
         </div>
         
         {/* Playback Control */}
         <div>
            <button 
              onClick={handlePlayFull}
              disabled={globalAudioStatus === 'GENERATING'}
              className={`
                 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md
                 ${globalAudioStatus === 'PLAYING' 
                   ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" 
                   : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                 }
              `}
            >
               {globalAudioStatus === 'GENERATING' ? (
                 <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</>
               ) : globalAudioStatus === 'PLAYING' ? (
                 <><Square className="w-3.5 h-3.5 fill-current" /> Stop</>
               ) : (
                 <><Play className="w-3.5 h-3.5 fill-current" /> Listen All</>
               )}
            </button>
         </div>
      </div>

      <div className="bg-background/50 min-h-[300px] relative">
      {viewMode === 'PRETTY' && (
        <div className="p-6 font-serif-telugu relative">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
            <Music className="w-64 h-64 text-foreground" />
          </div>

          {/* Metadata & Art Card */}
          <div className="mb-8 p-5 rounded-xl bg-secondary/30 border border-border/50 backdrop-blur-sm relative overflow-hidden group hover:border-primary/20 transition-colors flex flex-col md:flex-row gap-6 items-start">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              {/* Album Art Display */}
              {coverArtUrl && (
                <div className="relative shrink-0 w-32 h-32 rounded-lg overflow-hidden shadow-lg border border-border/50 group/art">
                   <img src={coverArtUrl} alt="Generated Album Art" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/art:opacity-100 transition-opacity gap-2">
                      <button onClick={() => {
                        const a = document.createElement('a');
                        a.href = coverArtUrl;
                        a.download = 'album_art.jpg';
                        a.click();
                      }} className="p-1.5 bg-white/10 backdrop-blur hover:bg-white/20 rounded-full text-white">
                        <Download className="w-4 h-4" />
                      </button>
                       <button onClick={() => setCoverArtUrl(null)} className="p-1.5 bg-white/10 backdrop-blur hover:bg-red-500/50 rounded-full text-white">
                        <XCircle className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              )}

              <div className="flex-1 relative z-10">
                {metadata.title && (
                  <h3 className="text-2xl font-cinema font-bold text-foreground mb-4 tracking-wide leading-tight">
                    {metadata.title}
                  </h3>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {metadata.language && (
                    <span className="flex items-center gap-1.5 bg-background/80 px-3 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      {metadata.language}
                    </span>
                  )}
                  {metadata.music && (
                    <span className="flex items-center gap-1.5 bg-background/80 px-3 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      {metadata.music}
                    </span>
                  )}
                   {metadata.taalam && (
                    <span className="flex items-center gap-1.5 bg-background/80 px-3 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
                      <Clock className="w-3.5 h-3.5 text-cyan-500" />
                      {metadata.taalam}
                    </span>
                  )}
                  {metadata.structure && (
                    <span className="flex items-center gap-1.5 bg-background/80 px-3 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
                      <ListMusic className="w-3.5 h-3.5 text-green-500" />
                      {metadata.structure}
                    </span>
                  )}
                </div>
              </div>
            </div>
          
          {/* Lyrics Content Visual */}
          <div className="space-y-1 px-1">
              {sections.map((section, i) => {
                if (section.type === 'header') {
                  return (
                    <div key={i} className="mt-8 mb-4 flex items-center gap-4 select-none group/header">
                       <div className="flex items-center gap-3">
                          <h4 className="text-primary font-cinema text-xs font-bold uppercase tracking-[0.25em] border-b-2 border-primary/20 pb-1 group-hover/header:border-primary/50 transition-colors">
                              {section.text.replace(/[\[\]]/g, '')}
                          </h4>
                          <button 
                            onClick={() => handlePlaySection(i)}
                            disabled={globalAudioStatus === 'GENERATING'}
                            className={`p-1 rounded-full transition-all opacity-0 group-hover/header:opacity-100 ${
                                playingSectionId === section.id 
                                ? "opacity-100 text-red-500 bg-red-500/10" 
                                : "text-muted-foreground hover:text-primary hover:bg-secondary"
                            }`}
                            title={playingSectionId === section.id ? "Stop Section" : "Play Section"}
                          >
                             {playingSectionId === section.id ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3" />}
                          </button>
                       </div>
                       <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                    </div>
                  );
                }
                
                if (!section.text.trim()) return <div key={i} className="h-3" />;
                
                return (
                  <p key={i} className="text-lg text-foreground/90 leading-relaxed hover:text-foreground transition-colors cursor-text selection:bg-primary/20 selection:text-primary pl-1">
                    {renderStyledLine(section.text)}
                  </p>
                );
              })}
          </div>
        </div>
      )}

      {viewMode === 'EDIT' && (
            <div className="relative animate-slideIn h-full bg-card">
              <textarea 
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="w-full h-[60vh] p-6 bg-transparent border-none focus:ring-0 outline-none font-mono text-sm leading-loose resize-none text-foreground/80"
                spellCheck={false}
              />
              <button 
                 onClick={() => copyToClipboard(editableContent)}
                 className="absolute top-4 right-4 bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-medium"
              >
                {copyStatus === 'copied' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copyStatus === 'copied' ? 'Copied' : 'Copy Text'}
              </button>
            </div>
      )}

      {viewMode === 'SUNO' && (
        <div className="font-mono text-sm relative animate-slideIn p-0">
          <div className="bg-slate-950 text-slate-300 p-6 min-h-[400px] overflow-x-auto relative">
             <div className="absolute top-0 left-0 w-full h-10 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-4">
                 <span className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                   <Music className="w-3 h-3" /> SUNO.COM WORKFLOW
                 </span>
             </div>
             
             <div className="mt-6 space-y-6">
                 {/* Editable Style Prompt Section */}
                 <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                         Step 1: Music Style
                         {isEnhancingStyle && <Loader2 className="w-3 h-3 animate-spin" />}
                       </span>
                       <div className="flex gap-2">
                         <button 
                            onClick={handleEnhanceStyle}
                            disabled={isEnhancingStyle || !apiKey}
                            className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                            title="Generate creative fusion style with AI"
                          >
                              <Sparkles className="w-3 h-3" />
                              Enhance
                          </button>
                          <button 
                            onClick={() => copyToClipboard(localStylePrompt, true)}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                          >
                              {styleCopyStatus === 'copied' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                              {styleCopyStatus === 'copied' ? 'Copied' : 'Copy'}
                          </button>
                       </div>
                    </div>
                    <textarea 
                      value={localStylePrompt}
                      onChange={(e) => setLocalStylePrompt(e.target.value)}
                      className="w-full bg-slate-950 text-white/90 text-sm leading-relaxed p-3 rounded border border-slate-700 focus:border-amber-500/50 outline-none resize-none selection:bg-amber-900/50"
                      rows={3}
                      placeholder="Describe the music style (e.g., Cinematic, fast tempo...)"
                    />
                 </div>

                 {/* Lyrics Section */}
                 <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">Step 2: Lyrics</span>
                        <button 
                          onClick={() => copyToClipboard(sunoContent || '')}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            {copyStatus === 'copied' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            {copyStatus === 'copied' ? 'Copied' : 'Copy Lyrics'}
                        </button>
                    </div>
                    <pre className="whitespace-pre-wrap selection:bg-purple-900/50 text-slate-300 font-mono leading-relaxed">
                      {sunoContent || "No Suno format available."}
                    </pre>
                 </div>
             </div>
          </div>
        </div>
      )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap gap-3 p-4 border-t border-border bg-secondary/5">
        <button onClick={() => copyToClipboard(viewMode === 'SUNO' && sunoContent ? sunoContent : editableContent)} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
             <Copy className="w-3.5 h-3.5" /> Copy Full Text
        </button>
        <button onClick={handleDownload} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
             <Download className="w-3.5 h-3.5" /> Save .txt
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
             <Printer className="w-3.5 h-3.5" /> Print / PDF
        </button>
        <button onClick={handleShare} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors ml-auto">
             <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>
    </div>
  );
};
