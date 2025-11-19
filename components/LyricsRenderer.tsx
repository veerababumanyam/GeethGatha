
import React, { useState, useEffect, useRef } from "react";
import { Music, Copy, Play, RefreshCw, Sparkles, Clock, ListMusic, FileCode, Eye, Loader2, StopCircle, Download, Printer, Share2, Edit3, Save, Wand2, Check } from "lucide-react";
import { GoogleGenAI, Modality } from "@google/genai";
import { TTS_MODEL, MODEL_NAME } from "../config";
import { playPCMData, wrapGenAIError } from "../utils";

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  primary?: boolean;
  title?: string;
}

const ActionButton = ({ icon, label, onClick, active, disabled, primary, title }: ActionButtonProps) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border shadow-sm select-none
      ${active 
        ? "bg-primary text-primary-foreground border-primary shadow-primary/25" 
        : primary
          ? "bg-primary text-primary-foreground border-primary hover:brightness-110 shadow-md shadow-primary/20"
          : disabled
            ? "bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-50"
            : "bg-card text-card-foreground border-border hover:bg-secondary hover:border-primary/30 hover:shadow-sm"
      }
    `}
  >
    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5" })}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const renderStyledLine = (line: string) => {
  // Regex to find English structure tags and voice tags
  const parts = line.split(/(\[(?:Male|Female|Both|Chorus|Verse|Pre-Chorus|Bridge|Hook|Intro|Outro|Instrumental|Child|Group|Duet|Big Chorus).*?\])/gi);

  return (
    <span>
      {parts.map((part, index) => {
        const isTag = part.startsWith('[') && part.endsWith(']');
        if (isTag) {
          let colorClass = "text-muted-foreground font-medium"; // default
          const p = part.toLowerCase();
          
          // Voices
          if (p.includes("male")) colorClass = "text-blue-500 dark:text-blue-400 font-semibold";
          if (p.includes("female")) colorClass = "text-pink-500 dark:text-pink-400 font-semibold";
          if (p.includes("both") || p.includes("duet")) colorClass = "text-purple-500 dark:text-purple-400 font-semibold";
          if (p.includes("child")) colorClass = "text-green-500 dark:text-green-400 font-semibold";
          
          // Structural (if embedded in line)
          if (p.includes("chorus") || p.includes("hook") || p.includes("group")) colorClass = "text-amber-600 dark:text-amber-400";
          
          // Instructional
          if (p.includes("intro") || p.includes("outro") || p.includes("instrumental")) colorClass = "text-muted-foreground font-mono text-[10px] uppercase tracking-widest opacity-70";

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

export const LyricsRenderer = ({ content, sunoContent, apiKey }: { content: string, sunoContent?: string, apiKey?: string }) => {
  const [viewMode, setViewMode] = useState<'PRETTY' | 'SUNO'>('PRETTY');
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const [audioStatus, setAudioStatus] = useState<'IDLE' | 'GENERATING' | 'PLAYING'>('IDLE');
  const [isFixingRhyme, setIsFixingRhyme] = useState(false);

  // Sync props to edit state if props change (new generation)
  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  const lines = editableContent.split('\n');
  
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

  const copyToClipboard = () => {
    const textToCopy = viewMode === 'SUNO' && sunoContent ? sunoContent : editableContent;
    navigator.clipboard.writeText(textToCopy);
  };

  const handleDownload = () => {
    const textToSave = viewMode === 'SUNO' && sunoContent ? sunoContent : editableContent;
    const blob = new Blob([textToSave], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Generate filename based on title or timestamp
    let filename = "swaz-elyrics.txt";
    if (metadata.title) {
      // Sanitize title for filename
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
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&family=Playfair+Display:wght@600&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Noto Sans Telugu', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1e293b; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; }
                    h1 { font-family: 'Playfair Display', serif; color: #0f172a; margin: 0 0 10px 0; font-size: 32px; }
                    .meta { font-size: 12px; color: #64748b; margin-top: 16px; display: flex; justify-content: center; gap: 24px; text-transform: uppercase; letter-spacing: 0.05em; }
                    .meta span { display: flex; align-items: center; gap: 6px; background: #f8fafc; padding: 4px 12px; border-radius: 20px; border: 1px solid #e2e8f0; }
                    .content { font-family: 'Noto Sans Telugu', sans-serif; }
                    .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; font-family: sans-serif; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${metadata.title || 'Untitled Composition'}</h1>
                    <div class="meta">
                        ${metadata.language ? `<span>🗣️ ${metadata.language}</span>` : ''}
                        ${metadata.music ? `<span>🎵 ${metadata.music}</span>` : ''}
                        ${metadata.taalam ? `<span>🕒 ${metadata.taalam}</span>` : ''}
                    </div>
                </div>
                <div class="content">
                    ${printContent}
                </div>
                <div class="footer">
                    Generated by SWAZ eLyrics Studio
                </div>
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
    const shareData = {
        title: metadata.title || 'SWAZ eLyrics Song',
        text: shareText,
    };
    
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.debug('Share cancelled or failed', err);
        }
    } else {
        navigator.clipboard.writeText(shareText);
        alert('Lyrics copied to clipboard!');
    }
  };

  const handleMagicRhymeFix = async () => {
    if (!apiKey) return;
    setIsFixingRhyme(true);
    try {
       const ai = new GoogleGenAI({ apiKey: apiKey });
       const response = await ai.models.generateContent({
         model: MODEL_NAME,
         contents: `Review the following song lyrics. Identify lines that have weak rhymes (Anthya Prasa). Rewrite ONLY those specific lines to have better rhyming endings while keeping the same meaning. Output the FULL improved lyrics. \n\n ${editableContent}`
       });
       if (response.text) {
         setEditableContent(response.text);
         setIsEditing(true); // Enter edit mode so user can see changes
       }
    } catch (e) {
      console.error("Magic Fix Error", e);
      const err = wrapGenAIError(e);
      alert(`Optimization Failed: ${err.message}`);
    } finally {
      setIsFixingRhyme(false);
    }
  };

  const handlePlay = async () => {
    if (audioStatus !== 'IDLE') return;
    
    const key = apiKey || process.env.API_KEY;
    if (!key) {
      alert("API Key missing. Please add it in settings to use TTS.");
      return;
    }

    setAudioStatus('GENERATING');

    try {
      const cleanLyrics = lyricsLines.join("\n");
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: `Recite these lyrics rhythmically and clearly. Do not sing, but recite with emotion: \n\n${cleanLyrics}` }] }],
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
        setAudioStatus('PLAYING');
        await playPCMData(audioData);
        setAudioStatus('IDLE');
      } else {
        setAudioStatus('IDLE');
      }
    } catch (e) {
      const err = wrapGenAIError(e);
      console.error("TTS Error", e);
      alert(`TTS Failed: ${err.message}`);
      setAudioStatus('IDLE');
    }
  };

  return (
    <div className="relative group/renderer">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-border gap-4 sm:gap-0">
         <div className="flex gap-2 items-center flex-wrap">
            <ActionButton 
              icon={<Eye />} 
              label="Visual" 
              onClick={() => { setViewMode('PRETTY'); setIsEditing(false); }} 
              active={viewMode === 'PRETTY' && !isEditing}
            />
            <ActionButton 
              icon={isEditing ? <Save /> : <Edit3 />} 
              label={isEditing ? "Save Edits" : "Studio Mode"} 
              onClick={() => {
                if (isEditing) {
                   setIsEditing(false); // Save happens automatically via state
                } else {
                   setViewMode('PRETTY'); // Ensure we are in visual mode underlying
                   setIsEditing(true);
                }
              }}
              active={isEditing}
              title="Edit lyrics manually"
            />
            {sunoContent && (
              <ActionButton 
                icon={<FileCode />} 
                label="Suno Code" 
                onClick={() => { setViewMode('SUNO'); setIsEditing(false); }} 
                active={viewMode === 'SUNO'}
              />
            )}
         </div>
         
         <div className="flex gap-2">
            {!isEditing && viewMode === 'PRETTY' && (
               <ActionButton 
                 icon={isFixingRhyme ? <Loader2 className="animate-spin" /> : <Wand2 />}
                 label="Magic Rhymes"
                 onClick={handleMagicRhymeFix}
                 disabled={isFixingRhyme || !apiKey}
               />
            )}
            <ActionButton 
              icon={
                audioStatus === 'GENERATING' ? <Loader2 className="animate-spin" /> : 
                audioStatus === 'PLAYING' ? <StopCircle className="animate-pulse text-red-400" /> : 
                <Play className="ml-0.5" />
              } 
              label={
                audioStatus === 'GENERATING' ? "Loading..." : 
                audioStatus === 'PLAYING' ? "Playing" : 
                "Listen"
              } 
              onClick={handlePlay}
              primary={audioStatus === 'IDLE'}
              disabled={audioStatus !== 'IDLE'}
            />
         </div>
      </div>

      {viewMode === 'PRETTY' ? (
        <div className="font-serif-telugu relative">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
            <Music className="w-64 h-64 text-foreground" />
          </div>

          {/* Metadata Card */}
          {!isEditing && (metadata.title || metadata.music || metadata.taalam) && (
            <div className="mb-8 p-5 rounded-xl bg-secondary/30 border border-border/50 backdrop-blur-sm relative overflow-hidden group hover:border-primary/20 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {metadata.title && (
                <h3 className="text-2xl font-cinema font-bold text-foreground mb-4 tracking-wide relative z-10 leading-tight">
                  {metadata.title}
                </h3>
              )}
              
              <div className="flex flex-wrap gap-2 relative z-10">
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
          )}
          
          {/* Lyrics Content */}
          {isEditing ? (
            <div className="relative animate-slideIn">
              <textarea 
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="w-full h-[60vh] p-6 bg-card rounded-xl border border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm leading-loose resize-none shadow-inner"
                spellCheck={false}
              />
              <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">
                Studio Mode Active
              </div>
            </div>
          ) : (
            <div className="space-y-1 px-1">
              {lyricsLines.map((line, i) => {
                const trimmed = line.trim();
                const isSectionHeader = trimmed.startsWith('[') && trimmed.endsWith(']') 
                  && (trimmed.includes("Verse") || trimmed.includes("Chorus") || trimmed.includes("Bridge") || trimmed.includes("Intro") || trimmed.includes("Outro") || trimmed.includes("Hook"));

                if (isSectionHeader) {
                  return (
                    <div key={i} className="mt-8 mb-4 flex items-center gap-4 select-none group/header">
                       <h4 className="text-primary font-cinema text-xs font-bold uppercase tracking-[0.25em] border-b-2 border-primary/20 pb-1 group-hover/header:border-primary/50 transition-colors">
                          {trimmed.replace(/[\[\]]/g, '')}
                       </h4>
                       <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                    </div>
                  );
                }
                
                if (!trimmed) return <div key={i} className="h-3" />;
                
                return (
                  <p key={i} className="text-lg text-foreground/90 leading-relaxed hover:text-foreground transition-colors cursor-text selection:bg-primary/20 selection:text-primary pl-1">
                    {renderStyledLine(line)}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="font-mono text-sm relative animate-slideIn">
          <div className="bg-slate-950 text-slate-300 p-6 rounded-xl border border-slate-800 shadow-inner overflow-x-auto relative">
            <div className="absolute top-0 right-0 px-3 py-1.5 bg-slate-900 rounded-bl-lg text-[10px] text-slate-500 font-bold border-l border-b border-slate-800">
               SUNO V3.5
            </div>
            <pre className="whitespace-pre-wrap selection:bg-slate-700">
              {sunoContent || "No Suno format available."}
            </pre>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5 opacity-80">
             <FileCode className="w-3.5 h-3.5" /> 
             <span>Raw format optimized for music generation models. Metadata stripped.</span>
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
        <ActionButton icon={<Copy />} label="Copy" onClick={copyToClipboard} />
        <ActionButton icon={<Printer />} label="Print / PDF" onClick={handlePrint} />
        <ActionButton icon={<Share2 />} label="Share" onClick={handleShare} />
        <ActionButton icon={<Download />} label="Save Text" onClick={handleDownload} />
        
        <div className="ml-auto">
          <ActionButton icon={<RefreshCw />} label="Re-compose" onClick={() => alert("To re-compose, please type a new instruction in the chat.")} />
        </div>
      </div>
    </div>
  );
};
