
# 🎵 SWAZ eLyrics Studio
### The AI Orchestrator for Cinematic & Fusion Music Composition

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg) ![Tech](https://img.shields.io/badge/Built%20with-Google%20Gemini-orange) ![Stack](https://img.shields.io/badge/React-TypeScript-blue)

**SWAZ eLyrics Studio** is not just a chatbot; it is a **Multi-Agent Orchestrator** designed to compose high-fidelity lyrics for Indian Cinema (Tollywood, Bollywood), Global Pop, and Fusion genres. 

It manages a team of specialized AI agents (Emotion, Research, Lyricist, Compliance) to turn a simple thought like *"A hero entry song in a dust storm"* into a production-ready lyrical composition with perfect meter, rhymes, and cultural depth.

---

## ✨ Key Features

### 🧠 The "Samskara" Context Engine
Unlike generic AI, SWAZ understands culture. It features a **Knowledge Base** of specific scenarios:
*   **💍 Wedding Rituals:** *Jeelakarra Bellam*, *Talambralu*, *Appagintalu*.
*   **🎬 Cinematic Tropes:** *Hero Intro (Mass)*, *Villain Theme*, *Item Song*, *Love Failure (Soup Song)*.
*   **🕉️ Life Milestones:** *Sasti Purthi* (60th Birthday), *Naming Ceremony*.

### 🤖 Multi-Agent Architecture
Your request is processed by a pipeline of experts:
1.  **❤️ Emotion Agent (Bhava Vignani):** Analyzes the "Navarasa" (Vibe) and intensity.
2.  **📚 Research Agent:** Google Search grounded research for trends and metaphors.
3.  **✍️ Lyricist Agent (Mahakavi):** Composes in **Native Script** (Telugu, Hindi, etc.) or European languages without transliteration errors.
4.  **🛡️ Compliance Agent:** Checks for plagiarism and originality against a vast lyric corpus.
5.  **🎵 Formatter Agent:** Prepares output specifically for AI Audio generators.

### 🎹 Suno.com & Udio Workflow
Built for the modern AI musician.
*   **Auto-Tagging:** Automatically inserts `[Verse]`, `[Chorus]`, `[Drop]`, `[Guitar Solo]` tags.
*   **Style Prompts:** Generates complex style descriptors (e.g., *"Carnatic Dubstep, 140 BPM, Male Vocals"*).
*   **One-Click Copy:** Dedicated "Suno Mode" for easy pasting into music generation tools.

### 🛠️ Studio Tools
*   **🪄 Magic Rhymes:** AI analyzes phonetics to fix weak rhymes (*Anthya Prasa*) instantly.
*   **🎨 Album Art:** Generates cinematic cover art using **Imagen 3**.
*   **🗣️ Rhythmic TTS:** Recites lyrics (doesn't sing) to help you check the meter and flow.
*   **🌍 Global Support:** Full support for European languages (French, Spanish, German) and Western styles (Jazz, Metal, EDM).

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   A **Google Gemini API Key** (Free tier available at [Google AI Studio](https://aistudio.google.com/))

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/swaz-elyrics.git
    cd swaz-elyrics
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Configure API Key**
    *   Open the app in your browser.
    *   Click the **Settings (Gear)** icon.
    *   Go to the **AI Connection** tab.
    *   Paste your Gemini API Key. (Keys are stored locally in your browser for security).

---

## 📸 Usage Guide

### 1. Set the Scene
Open the Sidebar and configure:
*   **Language Mix:** e.g., Primary: *Telugu*, Secondary: *English* (for Tanglish).
*   **Context:** Select a preset like *Wedding > Pelli Choopulu*.
*   **Fine Tuning:** Adjust Mood (*Energetic*), Style (*Folk*), and Complexity (*Poetic*).

### 2. Orchestrate
Type your prompt or use the microphone:
> "Write a romantic melody about love at first sight in a coffee shop. It should be poetic."

Watch the **Workflow Status** bar as the agents (Emotion -> Research -> Lyricist -> Review) build your song in real-time.

### 3. Refine & Export
*   Use **Magic Rhymes** to fix specific lines.
*   Switch to **Suno Mode** to see the formatted code.
*   Click **Enhance** on the music style to get a better prompt for Suno/Udio.
*   Generate **Album Art** to visualize the vibe.

---

## 🏗️ Tech Stack

*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS, Lucide React (Icons)
*   **AI Core:** `@google/genai` SDK
*   **Models:** 
    *   `gemini-3-pro-preview` (Reasoning & Composition)
    *   `gemini-2.5-flash` (Speed & Tooling)
    *   `gemini-2.5-flash-preview-tts` (Audio)
    *   `imagen-4.0-generate-001` (Album Art)

---

## 🛡️ Privacy & Security

*   **Client-Side Only:** SWAZ runs entirely in your browser.
*   **Local Storage:** Your API keys and chat history are stored in `localStorage`. They are never sent to a SWAZ backend server.
*   **Direct Connection:** The app communicates directly with Google's AI servers.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

Made with ❤️ for Cinema & Music.
