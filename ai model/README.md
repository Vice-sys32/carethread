# 🌿 Bulbasaur Chat

A single-page, ChatGPT-inspired local AI chatbot web interface with an immersive Bulbasaur aesthetic. Built strictly with plain HTML, vanilla CSS, and vanilla JavaScript—no frameworks, no build step, no backend, and zero external dependencies.

---

## 🚀 How to Run in 3 Steps

1. **Start LM Studio Local Server**:
   - Open LM Studio and load any model (e.g. Qwen, DeepSeek-R1, Llama, Mistral, Gemma).
   - Go to the **Developer / Local Server** tab (`<->`), enable CORS, and click **Start Server** (default: `http://localhost:1234`).
2. **Open the App**:
   - Double-click [`index.html`](file:///c:/Users/vice/OneDrive/Desktop/ai%20model/index.html) in your browser (or serve it with `python -m http.server 8000`).
3. **Start Chatting**:
   - Pick a suggestion chip or type your prompt and press **Enter**.

---

## ⚙️ Configuration

At the top of [`script.js`](file:///c:/Users/vice/OneDrive/Desktop/ai%20model/script.js#L4-L6):

```javascript
const API_URL = "http://localhost:1234/v1/chat/completions";
const MODEL_NAME = "local-model"; // Match loaded model identifier if desired
const TEMPERATURE = 0.8;
```

---

## ✨ Upgraded Features

- **ChatGPT-Style Layout**:
  - **Left Sidebar**: Collapsible on desktop, slide-in drawer on mobile with backdrop overlay. Lists past conversations with auto-generated titles, inline renaming, and confirmation-based deletion.
  - **Empty Chat Hero**: Terrarium Pokéball hero graphic with greeting (*"What are we growing today, trainer?"*) and 3 one-click prompt suggestion chips.
  - **Centered Column Message View**: Max-width readable 760px column. Green user bubbles on the right; Bulbasaur avatar and rich responses on the left.
  - **Pill Input**: Auto-growing textarea, Enter to send, Shift+Enter for newlines, with a circular Pokéball send button that switches to a **Stop** button (`AbortController`) while generating.
- **Bulbasaur Theme & Aesthetics**:
  - **Forest Night (Dark)** & **Sunny Meadow (Light)** themes with a toggle in the sidebar footer (persists in `localStorage`).
  - Subtle blurred sleeping Bulbasaur texture behind the main chat.
  - Bulbasaur avatar cropped from `bulba-flat.jpg` (`assets/avatar.png`) that gently sways while generating.
  - Friendly rounded typography (`Nunito` with system-ui fallback).
  - Red eye accent (`#e0405a`) used on send button hover, stop button, and delete actions.
- **Safe, Rich Markdown Rendering**:
  - Safe DOM generation (no raw `innerHTML` from model outputs).
  - Preserves line breaks and paragraphs.
  - Formats `**bold**`, `` `inline code` ``, and `*asterisk actions*` (styled in italics with a soft green tint).
  - Syntax code blocks with language badge and a one-click **Copy** button.
  - Copy button on all bot messages (revealed on hover).
- **DeepSeek / Reasoning Model Cleanups**:
  - Automatically filters in-flight and completed `<think>...</think>` tags to keep the conversation clean.
- **Friendly Error Handling**:
  - Displays a themed error card with confused Bulbasaur (`assets/bulba-confused.jpg`) and a **Retry** button if LM Studio is offline or unreachable.
- **Chat Persistence**:
  - Multi-chat management saved safely to `localStorage` with `try/catch` wrappers.
