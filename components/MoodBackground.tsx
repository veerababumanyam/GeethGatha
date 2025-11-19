
import React, { useEffect, useState } from "react";
import { MOOD_GRADIENTS } from "../config";

interface MoodBackgroundProps {
  mood: string;
}

export const MoodBackground = ({ mood }: MoodBackgroundProps) => {
  const [gradientClass, setGradientClass] = useState(MOOD_GRADIENTS["Custom"]);
  
  useEffect(() => {
    // Match mood to gradient or fallback
    let matched = MOOD_GRADIENTS[mood];
    if (!matched) {
      // Try partial match
      const key = Object.keys(MOOD_GRADIENTS).find(k => k.includes(mood));
      matched = key ? MOOD_GRADIENTS[key] : MOOD_GRADIENTS["Custom"];
    }
    setGradientClass(matched);
  }, [mood]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Primary Animated Gradient */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-30 transition-all duration-[2000ms] ease-in-out`}
      />
      
      {/* Secondary Ambient Pulses */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000" />
      
      {/* Noise Texture for Film Grain Effect */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
      }} />
    </div>
  );
};
