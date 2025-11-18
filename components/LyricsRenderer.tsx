
import React, { useState } from "react";
import { Music, Copy, Play, RefreshCw, Sparkles, Clock, ListMusic, FileCode, Eye } from "lucide-react";

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}

const ActionButton = ({ icon, label, onClick, active }: ActionButtonProps) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors border ${
      active 
      ? "bg-amber-500/20 border-amber-500 text-amber-400" 
      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
    }`}
  >
    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-3 h-3" })}
    {label}
  </button>
);

const renderStyledLine = (line: string) => {
  // Regex to find English structure tags and voice tags
  // Covers: [Verse], [Chorus], [Pre-Chorus], [Bridge], [Hook], [Intro], [Outro], [Instrumental]
  // Covers: [Male Vocals], [Female], [Duet], [Child], [Group]
  const parts = line.split(/(\[(?:Male|Female|Both|Chorus|Verse|Pre-Chorus|Bridge|Hook|Intro|Outro|Instrumental|Child|Group|Duet|Big Chorus).*?\])/gi);

  return (
    <span>
      {parts.map((part, index) => {
        const isTag = part.startsWith('[') && part.endsWith(']');
        if (isTag) {
          let colorClass = "text-slate-500"; // default
          const p = part.toLowerCase();
          
          // Voices
          if (p.includes("male")) colorClass = "text-blue-400";
          if (p.includes("female")) colorClass = "text-pink-400";
          if (p.includes("both") || p.includes("duet")) colorClass = "text-purple-400";
          if (p.includes("child")) colorClass = "text-green-400";
          
          // Structural
          if (p.includes("chorus") || p.includes("hook") || p.includes("group")) colorClass = "text-amber-400";
          if (p.includes("verse")) colorClass = "text-cyan-400";
          if (p.includes("bridge")) colorClass = "text-orange-400";
          if (p.includes("intro") || p.includes("outro") || p.includes("instrumental")) colorClass = "text-slate-500 font-mono";

          return (
            <span key={index} className={`text-[10px] font-bold uppercase tracking-wider mr-2 ${colorClass}`}>
              {part.replace(/[\[\]]/g, '')}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export const LyricsRenderer = ({ content, sunoContent }: { content: string, sunoContent?: string }) => {
  const [viewMode, setViewMode] = useState<'PRETTY' | 'SUNO'>('PRETTY');

  const lines = content.split('\n');
  
  // Extract metadata if present (lines starting with Title:, Language:, Raagam:)
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
    const textToCopy = viewMode === 'SUNO' && sunoContent ? sunoContent : content;
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="relative">
      {/* Tab Toggle */}
      <div className="flex items-center justify-end gap-2 mb-4 pb-2 border-b border-slate-800/50">
         <ActionButton 
           icon={<Eye />} 
           label="Visual" 
           onClick={() => setViewMode('PRETTY')} 
           active={viewMode === 'PRETTY'}
         />
         {sunoContent && (
           <ActionButton 
             icon={<FileCode />} 
             label="Suno.com" 
             onClick={() => setViewMode('SUNO')} 
             active={viewMode === 'SUNO'}
           />
         )}
      </div>

      {viewMode === 'PRETTY' ? (
        <div className="font-serif-telugu">
          {/* Background Watermark */}
          <div className="absolute -top-2 -right-2 opacity-5 pointer-events-none">
            <Music className="w-32 h-32 text-amber-400" />
          </div>

          {/* Metadata Card */}
          {(metadata.title || metadata.music || metadata.taalam) && (
            <div className="mb-6 p-4 rounded-lg bg-slate-950/50 border border-amber-900/30 backdrop-blur-sm">
              {metadata.title && (
                <h3 className="text-xl font-cinema text-amber-200 mb-2">{metadata.title}</h3>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                {metadata.language && (
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-amber-100/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {metadata.language}
                  </span>
                )}
                {metadata.music && (
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    {metadata.music}
                  </span>
                )}
                 {metadata.taalam && (
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <Clock className="w-3 h-3 text-blue-400" />
                    {metadata.taalam}
                  </span>
                )}
                {metadata.structure && (
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <ListMusic className="w-3 h-3 text-green-400" />
                    {metadata.structure}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Lyrics Content */}
          <div className="space-y-1 pl-1">
            {lyricsLines.map((line, i) => {
              const trimmed = line.trim();
              
              // Section Header (Strictly English tags now)
              // Logic: Starts/Ends with brackets, contains specific English keywords, and IS NOT just a voice tag
              const isSectionHeader = trimmed.startsWith('[') && trimmed.endsWith(']') 
                && (trimmed.includes("Verse") || trimmed.includes("Chorus") || trimmed.includes("Bridge") || trimmed.includes("Intro") || trimmed.includes("Outro") || trimmed.includes("Hook"));

              if (isSectionHeader) {
                return (
                  <h4 key={i} className="text-amber-500 font-cinema text-xs uppercase tracking-[0.2em] mt-6 mb-3 border-b border-amber-500/20 pb-1 w-max">
                    {trimmed.replace(/[\[\]]/g, '')}
                  </h4>
                );
              }
              
              // Empty Line
              if (!trimmed) return <div key={i} className="h-2" />;
              
              // Lyrics Line with Tags
              return (
                <p key={i} className="text-lg text-slate-200 leading-relaxed hover:text-white transition-colors cursor-text selection:bg-amber-500/30">
                  {renderStyledLine(line)}
                </p>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="font-mono text-sm">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-inner">
            <pre className="whitespace-pre-wrap text-slate-300 selection:bg-cyan-900/50">
              {sunoContent}
            </pre>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
             <FileCode className="w-3 h-3" /> Optimized for Suno.com v3.5 generation. No metadata, pure tags.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-8 pt-4 border-t border-slate-800">
        <ActionButton icon={<Copy />} label={viewMode === 'SUNO' ? "Copy Suno Format" : "Copy Lyrics"} onClick={copyToClipboard} />
        <ActionButton icon={<Play />} label="Listen" onClick={() => alert("Melody generation coming soon!")} />
        <ActionButton icon={<RefreshCw />} label="Re-compose" />
      </div>
    </div>
  );
};
