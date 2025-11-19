
export type AgentType = "CHAT" | "RESEARCH" | "LYRICIST" | "REVIEW" | "ORCHESTRATOR" | "EMOTION" | "COMPLIANCE" | "MULTIMODAL" | "FORMATTER";

export interface Message {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  senderAgent?: AgentType;
  timestamp: Date;
  lyricsData?: {
    title?: string;
    structure?: string;
    ragam?: string;
    taalam?: string;
    language?: string;
  };
  complianceReport?: ComplianceReport;
  sunoFormattedContent?: string; // Specialized format for Suno.com
}

export interface AgentStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

export interface AgentStatus {
  active: boolean;
  currentAgent: AgentType;
  message: string;
  steps: AgentStep[];
}

// --- Appearance & Theme Types ---

export interface AppTheme {
  id: string;
  name: string;
  colors: {
    bgMain: string;       // Main background
    bgSidebar: string;    // Sidebar/Card background
    textMain: string;     // Primary text
    textSecondary: string;// Secondary text/icons
    accent: string;       // Primary action color
    accentText: string;   // Text on accent color
    border: string;       // Borders
  };
}

export interface AppearanceSettings {
  fontSize: number; // Base pixel size (default 16)
  themeId: string;
  customThemes: AppTheme[];
}

// --- Lyricist Specific Types ---

export interface LanguageProfile {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface GenerationSettings {
  theme: string;
  customTheme: string;
  mood: string;
  customMood: string;
  style: string;
  customStyle: string;
  complexity: "Simple" | "Poetic" | "Complex";
  rhymeScheme: string;
  customRhymeScheme: string;
  singerConfig: string; // New field for Singer Voice Configuration
}

export interface SavedProfile {
  id: string;
  name: string;
  language: LanguageProfile;
  generation: GenerationSettings;
  timestamp: number;
}

export interface LyricLine {
  original: string; // The line in the target language (or transliterated)
  translation?: string; // English meaning
}

export interface LyricSection {
  sectionName: string; // e.g., "Pallavi", "Charanam 1"
  lines: string[];
  translation?: string[];
}

export interface GeneratedLyrics {
  title: string;
  language: string;
  ragam?: string;
  taalam?: string;
  structure?: string; // e.g., "Pallavi - Charanam - Charanam"
  context?: string;
  sections: LyricSection[];
}

// --- New Agent Output Interfaces ---

export interface EmotionAnalysis {
  sentiment: string;
  navarasa: string; // e.g., Shringara (Love), Karuna (Sadness), Veera (Heroism)
  intensity: number; // 1-10
  suggestedKeywords: string[];
  vibeDescription: string;
}

export interface ComplianceReport {
  originalityScore: number; // 0-100 (100 is fully original)
  flaggedPhrases: string[];
  similarSongs: string[];
  verdict: string; // "Safe", "Caution", "High Risk"
}

export interface UserStylePreference {
  preferredThemes: string[];
  preferredComplexity: "Simple" | "Poetic" | "Complex";
  vocabularyStyle: "Classical" | "Modern" | "Colloquial";
}