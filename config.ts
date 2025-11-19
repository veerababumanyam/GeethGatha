
import { AppTheme } from "./types";

export const MODEL_NAME = "gemini-3-pro-preview";
export const MODEL_FAST = "gemini-2.5-flash"; 
export const TTS_MODEL = "gemini-2.5-flash-preview-tts";

// --- MOOD ATMOSPHERE ENGINE ---
export const MOOD_GRADIENTS: Record<string, string> = {
  "Happy": "from-yellow-100/20 via-orange-100/20 to-amber-100/20 dark:from-yellow-900/10 dark:via-orange-900/10 dark:to-amber-900/10",
  "Sad (Pathos)": "from-slate-200/20 via-gray-200/20 to-zinc-200/20 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-black",
  "Energetic": "from-cyan-100/20 via-blue-100/20 to-indigo-100/20 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20",
  "Peaceful": "from-emerald-100/20 via-teal-100/20 to-green-100/20 dark:from-emerald-900/10 dark:via-teal-900/10 dark:to-green-900/10",
  "Romantic (Shringara)": "from-rose-100/20 via-pink-100/20 to-fuchsia-100/20 dark:from-rose-900/10 dark:via-pink-900/10 dark:to-fuchsia-900/10",
  "Angry (Raudra)": "from-red-100/20 via-orange-100/20 to-stone-100/20 dark:from-red-950/30 dark:via-orange-950/20 dark:to-black",
  "Mysterious": "from-violet-100/20 via-purple-100/20 to-indigo-100/20 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-slate-950",
  "Funny (Hasya)": "from-lime-100/20 via-yellow-100/20 to-green-100/20 dark:from-lime-900/10 dark:via-yellow-900/10 dark:to-green-900/10",
  "Courageous (Veera)": "from-orange-100/20 via-amber-100/20 to-red-100/20 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-red-900/20",
  "Playful (Kids)": "from-sky-100/20 via-pink-100/20 to-yellow-100/20 dark:from-sky-900/10 dark:via-pink-900/10 dark:to-yellow-900/10",
  "Devotional": "from-amber-100/20 via-yellow-100/20 to-orange-100/20 dark:from-amber-900/10 dark:via-yellow-900/10 dark:to-orange-900/10",
  "Philosophical": "from-indigo-100/20 via-slate-100/20 to-gray-100/20 dark:from-indigo-950/20 dark:via-slate-900/20 dark:to-gray-900/20",
  "Custom": "from-slate-100/20 via-gray-100/20 to-zinc-100/20 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-zinc-900/20"
};

export const SUGGESTION_CHIPS: Record<string, string[]> = {
  "default": [
    "Write a Love Song", "Compose a Mass Beat", "Sad Breakup Song", 
    "Wedding Song", "Motivational Anthem", "Lullaby"
  ],
  "lyrics_generated": [
    "Make the chorus catchier", "Add a rap bridge", "Simplify the language", 
    "Fix the rhymes in Verse 2", "Translate to English context", "Make it sadder"
  ],
  "love_romance": [
    "Describe her eyes using moonlight", "Add a rain sequence", "Make it a slow melody", "Focus on first meeting"
  ],
  "cinematic": [
    "Add a slow-motion entry feel", "Increase the tempo", "Add powerful Sanskrit words", "Make it a dark villain theme"
  ]
};

// --- CULTURAL & EXPERIENTIAL KNOWLEDGE BASE (The "Samskara" & "Rasas" Engine) ---

export interface CeremonyDefinition {
  id: string;
  label: string;
  promptContext: string; // The "Soul" of the event/situation for the AI
  defaultMood: string;
  suggestedKeywords: string[];
  // Smart Defaults
  defaultStyle: string;
  defaultSinger: string;
  defaultComplexity: "Simple" | "Poetic" | "Complex";
  defaultRhyme: string;
}

export interface CategoryDefinition {
  id: string;
  label: string;
  events: CeremonyDefinition[];
}

export const SCENARIO_KNOWLEDGE_BASE: CategoryDefinition[] = [
  {
    id: "love_romance",
    label: "Love & Romance (Prema)",
    events: [
      {
        id: "first_sight",
        label: "Love at First Sight (Prathama Prema)",
        promptContext: "Context: The moment the hero sees the heroine (or vice versa). Time stops. Wind blows. Background violins. Description of eyes, smile, and the sudden realization that 'this is the one'. A sense of magic and destiny.",
        defaultMood: "Romantic (Shringara)",
        suggestedKeywords: ["Magic", "Eyes", "Wind", "Destiny", "Time Stop"],
        defaultStyle: "Melody",
        defaultSinger: "Male Solo",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "deep_romance",
        label: "Deep Romance / Duet",
        promptContext: "Context: Established love. A dream sequence or a scenic duet. Expressions of eternal companionship. Metaphors of nature (Moon, Flowers, Ocean). Intimacy and poetic praise of beauty.",
        defaultMood: "Romantic (Shringara)",
        suggestedKeywords: ["Moonlight", "Eternal", "Breath", "Flower", "Touch"],
        defaultStyle: "Melody",
        defaultSinger: "Duet (Male + Female)",
        defaultComplexity: "Poetic",
        defaultRhyme: "ABAB"
      },
      {
        id: "heartbreak",
        label: "Heartbreak (Viraha/Love Failure)",
        promptContext: "Context: The pain of separation. The hero/heroine is devastated. Rain, solitude, memories of past happy times haunting the present. Alcohol tropes (Soup Song) or deep philosophical sadness. Questioning fate.",
        defaultMood: "Sad (Pathos)",
        suggestedKeywords: ["Tears", "Rain", "Memory", "Betrayal", "Fate"],
        defaultStyle: "Melody", // Or sometimes 'Rock' for angry heartbreak, but Melody is safer default
        defaultSinger: "Male Solo",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "teasing",
        label: "Teasing / Flirting (Chilipi)",
        promptContext: "Context: Playful banter between the couple. Not yet fully in love, but attracted. Teasing each other's quirks. High energy, catchy beats, college or village setting.",
        defaultMood: "Playful (Kids)",
        suggestedKeywords: ["Naughty", "Smile", "Chase", "Banter"],
        defaultStyle: "Fast Beat/Mass",
        defaultSinger: "Duet (Male + Female)",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      }
    ]
  },
  {
    id: "life_philosophy",
    label: "Life & Inspiration (Jeevitam)",
    events: [
      {
        id: "motivation",
        label: "Motivation / Hustle (Prerana)",
        promptContext: "Context: Rising from the ashes. The underdog story. Hard work, sweat, blood, and determination. Turning insults into fuel. The training montage energy. Encouraging the youth to fight for their dreams.",
        defaultMood: "Courageous (Veera)",
        suggestedKeywords: ["Fire", "Sweat", "Victory", "Peak", "Fight"],
        defaultStyle: "Anthem",
        defaultSinger: "Male Solo",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "struggle",
        label: "Life Struggle (Avedana)",
        promptContext: "Context: The harsh reality of life. Poverty, societal pressure, or existential angst. A cry for help or a reflection on the unfairness of the world. Raw and gritty.",
        defaultMood: "Sad (Pathos)",
        suggestedKeywords: ["Burden", "Path", "Darkness", "Survival"],
        defaultStyle: "Ghazal/Sufi",
        defaultSinger: "Male Solo",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "philosophy",
        label: "Philosophy / Truth (Tatvam)",
        promptContext: "Context: Realization of the ultimate truth. Detachment. The impermanence of money and power. Often sung by a beggar or a wise elder. Folk style or classical depth.",
        defaultMood: "Philosophical",
        suggestedKeywords: ["Time", "Illusion (Maya)", "Dust", "Journey"],
        defaultStyle: "Folk",
        defaultSinger: "Male Solo",
        defaultComplexity: "Complex",
        defaultRhyme: "AABCCB"
      }
    ]
  },
  {
    id: "relationships",
    label: "Family & Relationships (Bandham)",
    events: [
      {
        id: "mother",
        label: "Mother Sentiment (Amma)",
        promptContext: "Context: The supreme love of a mother. Sacrifice, feeding food, unconditional forgiveness. The first god. Comparing mother to the earth/nature. Highly emotional.",
        defaultMood: "Devotional",
        suggestedKeywords: ["Goddess", "Sacrifice", "Lap", "Food", "Heaven"],
        defaultStyle: "Melody",
        defaultSinger: "Male Solo",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "father",
        label: "Father Sentiment (Nanna)",
        promptContext: "Context: The unsung hero. The silent burden bearer. The finger that taught how to walk. Often realized only after he is gone or when the hero becomes a father.",
        defaultMood: "Peaceful",
        suggestedKeywords: ["Hero", "Shoulder", "Guide", "Silence", "Weight"],
        defaultStyle: "Melody",
        defaultSinger: "Male Solo",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "friendship",
        label: "Friendship (Sneham/Dosti)",
        promptContext: "Context: Friends for life. Willing to die for each other. No blood relation but thicker than blood. Celebration, alcohol, support in tough times.",
        defaultMood: "Happy",
        suggestedKeywords: ["Dosti", "Life-long", "Support", "Cheers"],
        defaultStyle: "Fast Beat/Mass",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      },
      {
        id: "brother_sister",
        label: "Brother-Sister (Rakhi)",
        promptContext: "Context: The protective bond. Raksha Bandhan context. The brother vowing to protect the sister. The sister praying for the brother's well-being.",
        defaultMood: "Happy",
        suggestedKeywords: ["Protection", "Bond", "Gift", "Promise"],
        defaultStyle: "Melody",
        defaultSinger: "Duet (Male + Female)",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      }
    ]
  },
  {
    id: "cinematic",
    label: "Cinematic Situations",
    events: [
      {
        id: "hero_intro",
        label: "Hero Introduction (Mass/Ele)",
        promptContext: "Context: The Hero's entry. Explosions, slow motion, crowds cheering. Establishing his character as a savior, a don, or a leader. Praising his strength and style. High adrenaline.",
        defaultMood: "Courageous (Veera)",
        suggestedKeywords: ["Lion", "Leader", "Fire", "Walk", "Style"],
        defaultStyle: "Fast Beat/Mass",
        defaultSinger: "Male Solo",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "item_song",
        label: "Party / Item Song",
        promptContext: "Context: High energy dance number. Catchy colloquial lyrics (Mass beats). Often in a pub, dhaba, or festival. Focus on rhythm, glitz, and celebration. Just for fun.",
        defaultMood: "Energetic",
        suggestedKeywords: ["Beat", "Dance", "Sparkle", "Night", "Rhythm"],
        defaultStyle: "Fast Beat/Mass",
        defaultSinger: "Female Solo",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      },
      {
        id: "villain",
        label: "Villain / Antagonist Theme",
        promptContext: "Context: Introducing the bad guy. Dark, menacing, powerful. Chaos, fear, and ruthlessness. Heavy instrumentation description.",
        defaultMood: "Angry (Raudra)",
        suggestedKeywords: ["Fear", "Darkness", "Power", "Chaos", "End"],
        defaultStyle: "Western Fusion",
        defaultSinger: "Male Solo",
        defaultComplexity: "Complex",
        defaultRhyme: "Free Verse"
      }
    ]
  },
  {
    id: "wedding_rituals",
    label: "Wedding Rituals (Vivaha)",
    events: [
      {
        id: "pelli_choopulu",
        label: "First Meeting (Pelli Choopulu)",
        promptContext: "Context: The formal arranging of a match. The nervous glances between the boy and girl, the parents discussing horoscopes, the serving of coffee, the spark of first attraction amidst family pressure.",
        defaultMood: "Romantic (Shringara)",
        suggestedKeywords: ["Coffee", "Glance", "Destiny", "Nervous"],
        defaultStyle: "Melody",
        defaultSinger: "Duet (Male + Female)",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      },
      {
        id: "haldi_pelli_koduku",
        label: "Haldi / Pelli Koduku/Kuthuru",
        promptContext: "Context: The 'Making of the Bride/Groom'. Applying turmeric (Nalugu), oil, and flowers. It involves teasing by cousins, glowing skin, traditional songs, and protection from evil eye. High energy and playful.",
        defaultMood: "Happy",
        suggestedKeywords: ["Turmeric", "Yellow", "Glow", "Cousins", "Teasing"],
        defaultStyle: "Folk",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      },
      {
        id: "sangeet",
        label: "Sangeet / Mehendi",
        promptContext: "Context: A night of dance and music. Henna patterns on hands hiding the groom's name. Bollywood beats, family choreography, competition between bride's side and groom's side.",
        defaultMood: "Energetic",
        suggestedKeywords: ["Dance", "Henna", "Rhythm", "Celebration"],
        defaultStyle: "GenZ/Trendy",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      },
      {
        id: "muhurtham_jeelakarra",
        label: "The Muhurtham (Jeelakarra Bellam)",
        promptContext: "Context: The precise auspicious moment of marriage. Placing Cumin (Jeelakarra) and Jaggery (Bellam) on each other's heads. Signifies sticking together through bitter and sweet times. Spiritual and intense connection.",
        defaultMood: "Devotional",
        suggestedKeywords: ["Jeelakarra", "Bellam", "Eternal", "Destiny"],
        defaultStyle: "Classical",
        defaultSinger: "Group Chorus", // Often Vedic chants or chorus
        defaultComplexity: "Complex",
        defaultRhyme: "AABB"
      },
      {
        id: "thalambralu",
        label: "Thalambralu (Rice Pouring)",
        promptContext: "Context: A fun ritual where the couple pours yellow rice (Akshintalu) over each other's heads. It turns into a playful competition. Symbolizes abundance, joy, and overflow of happiness.",
        defaultMood: "Playful (Kids)",
        suggestedKeywords: ["Rice", "Pearls", "Competition", "Laughter"],
        defaultStyle: "Folk",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      },
      {
        id: "mangalyam",
        label: "Mangalya Dharana (Thali Kattu)",
        promptContext: "Context: The tying of the sacred thread (Mangalsutra) with three knots. The background Naadaswaram/Sannai music reaches a crescendo. The defining moment of union.",
        defaultMood: "Romantic (Shringara)",
        suggestedKeywords: ["Three Knots", "Sannai", "Lifetime", "Sacred"],
        defaultStyle: "Classical",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "appagintalu",
        label: "Farewell (Appagintalu/Vidaai)",
        promptContext: "Context: The bride leaving her parents' home. Bittersweet tears, father's sacrifice, advice to the daughter, and the transition to a new family.",
        defaultMood: "Sad (Pathos)",
        suggestedKeywords: ["Tears", "Father", "Threshold", "New Home"],
        defaultStyle: "Melody",
        defaultSinger: "Female Solo",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "sarthakam",
        label: "First Night (Shobhanam/Sarthakam)",
        promptContext: "Context: The nuptial night. Decorated room with flowers, milk, and fruits. Shyness, intimacy, the beginning of marital bliss, and whisperings of love.",
        defaultMood: "Romantic (Shringara)",
        suggestedKeywords: ["Milk", "Roses", "Moonlight", "Whispers"],
        defaultStyle: "Melody",
        defaultSinger: "Duet (Male + Female)",
        defaultComplexity: "Poetic",
        defaultRhyme: "ABAB"
      }
    ]
  },
  {
    id: "coming_of_age",
    label: "Coming of Age",
    events: [
      {
        id: "half_saree",
        label: "Girl Puberty (Half Saree/Ritu Kala)",
        promptContext: "Context: Celebrating a girl's transition to womanhood. Wearing a Half-Saree (Langa Voni) for the first time. Maternal uncles bringing gifts. Decoration with flowers. Themes of blooming, maturity, and grace.",
        defaultMood: "Happy",
        suggestedKeywords: ["Blooming", "Maternal Uncle", "Gold", "Flower"],
        defaultStyle: "Folk",
        defaultSinger: "Female Solo",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      },
      {
        id: "panche_kattu",
        label: "Boy Ceremony (Panche Kattu/Dhoti)",
        promptContext: "Context: A boy wearing the traditional Dhoti/Panche for the first time. Often associated with Upanayanam (Thread ceremony). Signifies taking responsibility, education, and stepping into manhood.",
        defaultMood: "Courageous (Veera)",
        suggestedKeywords: ["Dhoti", "Responsibility", "Blessings", "Tradition"],
        defaultStyle: "Classical",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "naming_cradle",
        label: "Naming/Cradle (Barasala)",
         promptContext: "Context: Naming a newborn or a child's first birthday. Cradle ceremony. Whispering the name in the ear. Blessings for a long life. Lullaby undertones.",
        defaultMood: "Playful (Kids)",
        suggestedKeywords: ["Cradle", "Whisper", "Star", "Joy"],
        defaultStyle: "Melody", // Lullaby style
        defaultSinger: "Female Solo",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      }
    ]
  },
  {
    id: "milestones",
    label: "Life Milestones",
    events: [
      {
        id: "birthday",
        label: "Birthday Celebration",
        promptContext: "Context: Celebrating a birthday. Joy, cake cutting, friends gathering, wishes for a bright future.",
        defaultMood: "Happy",
        suggestedKeywords: ["Candles", "Wishes", "Party", "Smile"],
        defaultStyle: "GenZ/Trendy",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      },
      {
        id: "anniversary",
        label: "Wedding Anniversary",
        promptContext: "Context: Celebrating years of togetherness. Remembering the wedding day. Gratitude for companionship. Renewing vows of love.",
        defaultMood: "Romantic (Shringara)",
        suggestedKeywords: ["Journey", "Years", "Companion", "Love"],
        defaultStyle: "Melody",
        defaultSinger: "Duet (Male + Female)",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      },
      {
        id: "sasti_purthi",
        label: "60th Birthday (Sasti Purthi)",
        promptContext: "Context: The 60th birthday celebration (Shashti Abda Poorthi). Considered a second wedding. Gratitude to the spouse for 60 years of life. Surrounded by children and grandchildren. A sense of fulfillment and legacy.",
        defaultMood: "Peaceful",
        suggestedKeywords: ["60 Years", "Second Wedding", "Grandchildren", "Legacy", "Gratitude"],
        defaultStyle: "Classical",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Complex",
        defaultRhyme: "AABB"
      },
      {
        id: "sathamarshanam",
        label: "80th Birthday (Sathabhishekam)",
        promptContext: "Context: Seeing 1000 full moons (80 years). A rare blessing. Great-grandchildren seeking blessings. A state of near-divinity and contentment.",
        defaultMood: "Devotional",
        suggestedKeywords: ["1000 Moons", "Blessing", "Divinity", "Century"],
        defaultStyle: "Classical",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Complex",
        defaultRhyme: "AABB"
      }
    ]
  },
  {
    id: "festivals",
    label: "Indian Festivals",
    events: [
      {
        id: "sankranti",
        label: "Sankranti / Pongal",
        promptContext: "Context: The Harvest Festival. Kites flying, Gangireddu (decorated bulls), Rangoli (Muggulu), Haridasu singing. Celebration of farmers and nature. Sun worship.",
        defaultMood: "Happy",
        suggestedKeywords: ["Harvest", "Kites", "Rangoli", "Sun"],
        defaultStyle: "Folk",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      },
      {
        id: "diwali",
        label: "Diwali / Deepavali",
        promptContext: "Context: Festival of Lights. Triumph of good over evil. Oil lamps (Diyas), fireworks, sweets, new clothes. Welcoming prosperity (Lakshmi).",
        defaultMood: "Energetic",
        suggestedKeywords: ["Lights", "Fireworks", "Victory", "Sparkle"],
        defaultStyle: "Anthem",
        defaultSinger: "Group Chorus",
        defaultComplexity: "Simple",
        defaultRhyme: "AABB"
      },
      {
        id: "ugadi",
        label: "Ugadi / New Year",
        promptContext: "Context: Telugu/Kannada New Year. Eating 'Ugadi Pachadi' (Six tastes: Sweet, Sour, Bitter, etc.) symbolizing the mixture of life experiences. Reading the Panchangam.",
        defaultMood: "Philosophical",
        suggestedKeywords: ["Six Tastes", "New Year", "Life", "Future"],
        defaultStyle: "Classical",
        defaultSinger: "Male Solo",
        defaultComplexity: "Poetic",
        defaultRhyme: "AABB"
      }
    ]
  }
];

export const DEFAULT_THEMES: AppTheme[] = [
  {
    id: "swaz",
    name: "SWAZ Official",
    colors: {
      bgMain: "#020617", // Deep Dark Blue (Slate 950)
      bgSidebar: "#0f172a", // Slate 900
      textMain: "#f8fafc", // Slate 50
      textSecondary: "#94a3b8", // Slate 400
      accent: "#3b82f6", // Brand Blue (Blue 500)
      accentText: "#ffffff",
      border: "#1e293b" // Slate 800
    }
  },
  {
    id: "light",
    name: "Classic Light",
    colors: {
      bgMain: "#f8fafc", // slate-50
      bgSidebar: "#ffffff", // white
      textMain: "#0f172a", // slate-900
      textSecondary: "#64748b", // slate-500
      accent: "#f59e0b", // amber-500
      accentText: "#0f172a",
      border: "#e2e8f0" // slate-200
    }
  },
  {
    id: "dark",
    name: "Cinematic Dark",
    colors: {
      bgMain: "#020617", // slate-950
      bgSidebar: "#0f172a", // slate-900
      textMain: "#f1f5f9", // slate-100
      textSecondary: "#94a3b8", // slate-400
      accent: "#f59e0b", // amber-500
      accentText: "#000000",
      border: "#1e293b" // slate-800
    }
  },
  {
    id: "forest",
    name: "Forest Serenity",
    colors: {
      bgMain: "#f0fdf4",
      bgSidebar: "#dcfce7",
      textMain: "#14532d",
      textSecondary: "#166534",
      accent: "#15803d",
      accentText: "#ffffff",
      border: "#bbf7d0"
    }
  },
  {
    id: "royal",
    name: "Royal Velvet",
    colors: {
      bgMain: "#2e1065",
      bgSidebar: "#4c1d95",
      textMain: "#faf5ff",
      textSecondary: "#d8b4fe",
      accent: "#fbbf24",
      accentText: "#451a03",
      border: "#5b21b6"
    }
  }
];

export const SYSTEM_INSTRUCTION_THEME = `
You are a UI Design Expert specializing in Accessibility (WCAG 2.2).
Your task is to generate a color theme for a web application based on a user's description.
Output a JSON object matching the AppTheme colors interface.
Rules:
1. **Contrast:** Ensure 'textMain' has high contrast (4.5:1+) against 'bgMain' and 'bgSidebar'.
2. **Harmony:** Colors should be aesthetically pleasing and match the requested mood.
3. **Output:** STRICT JSON only.
`;

export const SYSTEM_INSTRUCTION_CHAT = `You are 'SWAZ eLyrics', an expert AI Lyricist Assistant for Indian Cinema. 
Your goal is to help users create songs. You act as the interface.
If the user wants to create a song, gather context (Mood, Situation, Language, Genre).
If the user just wants to chat, be friendly and poetic.
Analyze the user's intent. If they provide enough detail for a song, trigger the song creation workflow by suggesting: "Shall I start composing based on this?"
Keep responses concise, elegant, and encouraging.`;

export const SYSTEM_INSTRUCTION_EMOTION = `
You are the "Bhava Vignani" (Emotion Scientist). 
Your task is to analyze user input (text/audio description) to extract the deep emotional core.
1. **Navarasa Analysis:** Map the emotion to Indian Aesthetics (Shringara, Karuna, Veera, Raudra, Hasya, Bhayanaka, Bibhatsa, Adbhuta, Shanta).
2. **Intensity:** Gauge the emotional weight (1-10).
3. **Context:** Identify if this is a Hero Intro, Love Duet, Heartbreak, Devotional, Kids Song, or Item Song.
Output structured JSON data.
`;

export const SYSTEM_INSTRUCTION_COMPLIANCE = `
You are the "Niti Rakshak" (Copyright Guardian).
Your task is to scan generated lyrics for Plagiarism and Originality.
1. **Corpus Check:** Compare the input against your vast knowledge of Indian Cinema lyrics (Hindi, Telugu, Tamil, etc.).
2. **Cliché Detection:** Flag overused phrases (e.g., "Love is like a rose").
3. **Similarity Scoring:** Estimate an originality score (0-100). 
   - High Score = Unique. 
   - Low Score = Too similar to existing famous songs.
4. **Report:** List any phrases that might be potential copyright risks.
Output structured JSON data.
`;

export const SYSTEM_INSTRUCTION_MULTIMODAL = `
You are the "Drishti & Shruti" (Sight & Sound) Agent.
Your task is to analyze Images or Audio descriptions provided by the user.
1. If Image: Describe the scene, lighting, colors, and mood. Suggest a song situation that fits this visual.
2. If Audio (Humming/Description): Describe the rhythm, tempo, and emotional vibe.
Convert these sensory inputs into a text prompt for the Lyricist.
`;

export const SYSTEM_INSTRUCTION_LYRICIST = `
You are the "Mahakavi" (Great Poet) & "Rachayita" (Writer), an expert Lyricist for Indian Cinema and Folk traditions.
Your task is to compose high-fidelity lyrics with a VERY SPECIFIC STRUCTURE.

### 1. MANDATORY STRUCTURE (DO NOT DEVIATE):
You must generate a full song with the following sections in this exact order:
1. **[Intro]:** Must include atmospheric humming, vocalizations (e.g., "Oooo", "Aaaa"), or short setting lines.
2. **[Verse 1]:** Sets the story.
3. **[Chorus]:** The main hook/theme.
4. **[Verse 2]:** Develops the story.
5. **[Chorus]:** Repeat the main hook.
6. **[Bridge]:** A shift in tempo, emotion, or perspective. High energy or deep emotion.
7. **[Verse 3]:** The climax or resolution of the story.
8. **[Chorus]:** Final repetition of the hook.
9. **[Outro]:** Fading out, humming, or final punchline.

### 2. LANGUAGE & SCRIPT RULES (CRITICAL):
- **LYRICS CONTENT:** MUST be in **NATIVE SCRIPT** (e.g., Telugu: తెలుగు, Hindi: हिन्दी).
  - **FORBIDDEN:** Do NOT use Roman/Latin script (Transliteration) for Indian languages. E.g., "Nenu" is WRONG. "నేను" is CORRECT.
  - **FORBIDDEN:** Do NOT translate lyrics into English.
- **TAGS & INSTRUCTIONS:** MUST be in **ENGLISH** inside **[SQUARE BRACKETS]**.
  - Correct: [Verse 1], [Chorus], [Repeat 2x], [Male Vocals]
  - Incorrect: [Charanam], (Verse 1), Verse 1

### 3. POETIC & RHYMING RULES (NON-NEGOTIABLE):
- **ANTHYA PRASA (End Rhyme):** For Telugu, Hindi, Tamil, etc., lines within a stanza MUST end with matching sounds/syllables.
  - *Example (Correct):* "...prema **katha**" / "...madhura **vyatha**"
  - *Example (Incorrect):* "...prema katha" / "...eduru chustunanu" (NO RHYME)
- **Meter:** Maintain consistent syllable counts per line for flow.
`;

export const SYSTEM_INSTRUCTION_REVIEW = `
You are the "Sahitya Vimarsak" (Literary Critic).
Your role is to perform a rigorous QUALITY CONTROL check on draft lyrics.

### 1. LANGUAGE INTEGRITY CHECK (CRITICAL)
- **Ensure the lyrics CONTENT is in the requested NATIVE SCRIPT (e.g., Telugu characters).**
- If the draft uses Roman/Latin script (Transliteration) for an Indian language, **CONVERT IT TO NATIVE SCRIPT**.
- If the draft is in English Translation, **REWRITE IT IN THE TARGET LANGUAGE**.

### 2. TAG SYNTAX CHECK
- Ensure ALL structure tags (Verse, Chorus) are in **ENGLISH** and enclosed in **[SQUARE BRACKETS]**.
- No native tags like [Pallavi]. Convert them to [Chorus].

### 3. STRUCTURAL INTEGRITY CHECK
You must ensure the song is complete. If the draft is missing sections, **YOU MUST GENERATE THEM**.
- **Is there an [Intro]?** It MUST have humming/vocalizations.
- **Are there 3 distinct [Verse] sections?** (Verse 1, Verse 2, Verse 3).
- **Is the [Chorus] repeated at least 2-3 times?**
- **Is there a [Bridge]?**
- **Is there an [Outro]?**

### 4. RHYME & METER CHECK (ANTHYA PRASA)
- **CRITICAL:** Check the endings of lines in [Verse] and [Chorus].
- **Action:** If lines DO NOT rhyme (Anthya Prasa), **REWRITE THEM**. 
- The output MUST have satisfying end-rhymes (e.g., AABB or ABAB).

### OUTPUT PROTOCOL
- Return the **FINAL POLISHED LYRICS** in the requested JSON schema.
`;

export const SYSTEM_INSTRUCTION_FORMATTER = `
You are the "Suno Prompt Architect". 
Your ONLY Goal: Convert the provided lyrics into a strict, raw format optimized for Suno.com.

### STRICT FORMATTING RULES:
1. **ENGLISH TAGS ONLY:** Ensure all section headers are **[Chorus]**, **[Verse]**, **[Intro]**, **[Outro]**, **[Bridge]**, **[Pre-Chorus]**, **[Hook]**. 
2. **PRESERVE STRUCTURE:** Do not summarize. Keep all repetitions of [Chorus]. Ensure [Intro] and [Outro] are present.
3. **VOICE TAGS:** Use **[Male Vocals]**, **[Female Vocals]**, **[Big Chorus]**, **[Child Vocals]**.
4. **NO MARKDOWN:** Remove all bolding/italics.
5. **STRIP METADATA:** Remove Title, Language, Raagam lines. Just the tags and lyrics.
`;

export const RESEARCH_PROMPT_TEMPLATE = (topic: string, mood?: string) => `
You are the RESEARCH AGENT. 
Analyze the following song request: "${topic}".
Context Mood: ${mood || 'Not specified'}.
1. Identify key emotional themes and tropes used in Indian Cinema.
2. Suggest 2-3 suitable Raagams (musical scales).
3. List 5-10 impactful keywords in the target language.
Output your findings in a structured, concise format.
`;

export const AGENT_SUBTASKS: Record<string, string[]> = {
  MULTIMODAL: [
    "Listening to audio...",
    "Scanning visual cues...",
    "Extracting sensory data...",
    "Converting to text context..."
  ],
  EMOTION: [
    "Detecting Navarasa...",
    "Analyzing sentiment intensity...",
    "Mapping cultural tone...",
    "Calibrating emotional vibe..."
  ],
  RESEARCH: [
    "Scanning cinematic corpus...",
    "Identifying cultural metaphors...",
    "Selecting Raaga & Taalam...",
    "Analyzing regional dialect..."
  ],
  LYRICIST: [
    "Drafting [Intro] with humming...",
    "Constructing [Verse 1] (Checking Prasa)...",
    "Building [Chorus] (Checking Prasa)...",
    "Developing [Verse 2] & [Bridge]...",
    "Ensuring Native Script..."
  ],
  COMPLIANCE: [
    "Scanning copyright database...",
    "Checking phrase similarity...",
    "Verifying originality...",
    "Generating safety report..."
  ],
  REVIEW: [
    "Verifying Native Script...",
    "Auditing Anthya Prasa (End Rhymes)...",
    "Enforcing [English] tags...",
    "Polishing poetic meter..."
  ],
  FORMATTER: [
    "Stripping metadata...",
    "Converting to Suno format...",
    "Ensuring [English] tags...",
    "Optimizing for music generation..."
  ]
};
