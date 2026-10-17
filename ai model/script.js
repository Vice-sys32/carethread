// ========================================================
// Configuration (LM Studio Local Server)
// ========================================================
const API_URL = "http://localhost:1234/v1/chat/completions";
const MODEL_NAME = "local-model"; // Change to your LM Studio loaded model identifier if desired
const TEMPERATURE = 0.8;

// ========================================================
// Storage Keys
// ========================================================
const STORAGE_KEY_CHATS = "bulbasaur_chats";
const STORAGE_KEY_ACTIVE = "bulbasaur_active_chat";
const STORAGE_KEY_THEME = "bulbasaur_theme";

// ========================================================
// State
// ========================================================
let chats = [];
let activeChatId = null;
let isGenerating = false;
let currentAbortController = null;
let lastFailedPrompt = null;

// ========================================================
// DOM Elements
// ========================================================
const appLayout = document.getElementById("app-layout");
const sidebar = document.getElementById("sidebar");
const sidebarCollapseBtn = document.getElementById("sidebar-collapse-btn");
const sidebarExpandBtn = document.getElementById("sidebar-expand-btn");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileOverlay = document.getElementById("mobile-overlay");
const newChatBtn = document.getElementById("new-chat-btn");
const chatList = document.getElementById("chat-list");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeIcon = document.getElementById("theme-icon");
const themeLabel = document.getElementById("theme-label");

const topBarTitle = document.querySelector(".top-bar-title");
const modelBadge = document.getElementById("model-badge");

const chatViewport = document.getElementById("chat-viewport");
const heroContainer = document.getElementById("hero-container");
const suggestionChips = document.getElementById("suggestion-chips");
const messagesFeed = document.getElementById("messages-feed");

const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendStopBtn = document.getElementById("send-stop-btn");

// Set Model Badge
if (modelBadge) {
  modelBadge.textContent = MODEL_NAME;
}

// ========================================================
// LocalStorage Persistence Helpers (with try/catch)
// ========================================================
function loadChatsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHATS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load chats from localStorage:", err);
    return [];
  }
}

function saveChatsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
  } catch (err) {
    console.error("Failed to save chats to localStorage:", err);
  }
}

function loadActiveChatIdFromStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE);
  } catch (err) {
    console.error("Failed to load active chat ID:", err);
    return null;
  }
}

function saveActiveChatIdToStorage(id) {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  } catch (err) {
    console.error("Failed to save active chat ID:", err);
  }
}

function loadThemeFromStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY_THEME) || "dark";
  } catch (err) {
    console.error("Failed to load theme:", err);
    return "dark";
  }
}

function saveThemeToStorage(theme) {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch (err) {
    console.error("Failed to save theme:", err);
  }
}

// ========================================================
// Theme Toggle
// ========================================================
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  saveThemeToStorage(theme);

  if (theme === "dark") {
    themeLabel.textContent = "Forest Night";
    themeIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
      </svg>
    `;
  } else {
    themeLabel.textContent = "Sunny Meadow";
    themeIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2"/>
        <path d="M12 20v2"/>
        <path d="m4.93 4.93 1.41 1.41"/>
        <path d="m17.66 17.66 1.41 1.41"/>
        <path d="M2 12h2"/>
        <path d="M20 12h2"/>
        <path d="m6.34 17.66-1.41 1.41"/>
        <path d="m19.07 4.93-1.41 1.41"/>
      </svg>
    `;
  }
}

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
});

// ========================================================
// Sidebar Expansion & Mobile Drawer
// ========================================================
sidebarCollapseBtn.addEventListener("click", () => {
  appLayout.classList.add("sidebar-collapsed");
  sidebarExpandBtn.style.display = "inline-flex";
});

sidebarExpandBtn.addEventListener("click", () => {
  appLayout.classList.remove("sidebar-collapsed");
  sidebarExpandBtn.style.display = "none";
});

mobileMenuBtn.addEventListener("click", () => {
  appLayout.classList.add("sidebar-mobile-open");
});

mobileOverlay.addEventListener("click", () => {
  appLayout.classList.remove("sidebar-mobile-open");
});

function closeMobileSidebar() {
  appLayout.classList.remove("sidebar-mobile-open");
}

// ========================================================
// Chat Management & List Rendering
// ========================================================
function getActiveChat() {
  return chats.find((c) => c.id === activeChatId) || null;
}

function startNewChat() {
  if (isGenerating) return;
  activeChatId = null;
  saveActiveChatIdToStorage(null);
  renderChatList();
  renderCurrentChatView();
  closeMobileSidebar();
  userInput.focus();
}

newChatBtn.addEventListener("click", startNewChat);

function selectChat(id) {
  if (isGenerating || activeChatId === id) return;
  activeChatId = id;
  saveActiveChatIdToStorage(id);
  renderChatList();
  renderCurrentChatView();
  closeMobileSidebar();
  userInput.focus();
}

function deleteChat(id, event) {
  event.stopPropagation();
  if (isGenerating) return;

  const confirmed = window.confirm("Are you sure you want to delete this chat?");
  if (!confirmed) return;

  const index = chats.findIndex((c) => c.id === id);
  if (index !== -1) {
    chats.splice(index, 1);
    saveChatsToStorage();

    if (activeChatId === id) {
      activeChatId = null;
      saveActiveChatIdToStorage(null);
    }

    renderChatList();
    renderCurrentChatView();
  }
}

function startRenameChat(id, titleSpan, event) {
  event.stopPropagation();
  const chat = chats.find((c) => c.id === id);
  if (!chat) return;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "chat-rename-input";
  input.value = chat.title;
  input.maxLength = 50;

  function finishRename() {
    const newTitle = input.value.trim() || chat.title;
    chat.title = newTitle;
    saveChatsToStorage();
    renderChatList();
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      finishRename();
    } else if (e.key === "Escape") {
      renderChatList();
    }
  });

  input.addEventListener("blur", finishRename);

  titleSpan.replaceWith(input);
  input.focus();
  input.select();
}

function renderChatList() {
  chatList.replaceChildren();

  if (chats.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-chat-list";
    emptyState.innerHTML = `
      <img src="assets/sleepy-bulba.jpg" alt="Sleepy Bulbasaur">
      <p>No past chats yet.<br>Grow a new conversation!</p>
    `;
    chatList.appendChild(emptyState);
    return;
  }

  // Chats newest first
  chats.forEach((chat) => {
    const item = document.createElement("div");
    item.className = `chat-item ${chat.id === activeChatId ? "active" : ""}`;
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.addEventListener("click", () => selectChat(chat.id));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        selectChat(chat.id);
      }
    });

    const titleSpan = document.createElement("span");
    titleSpan.className = "chat-item-title";
    titleSpan.textContent = chat.title || "New chat";
    item.appendChild(titleSpan);

    const actions = document.createElement("div");
    actions.className = "chat-item-actions";

    // Rename button
    const renameBtn = document.createElement("button");
    renameBtn.className = "chat-action-btn";
    renameBtn.type = "button";
    renameBtn.title = "Rename chat";
    renameBtn.setAttribute("aria-label", "Rename chat");
    renameBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
    `;
    renameBtn.addEventListener("click", (e) => startRenameChat(chat.id, titleSpan, e));
    actions.appendChild(renameBtn);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "chat-action-btn delete-btn";
    deleteBtn.type = "button";
    deleteBtn.title = "Delete chat";
    deleteBtn.setAttribute("aria-label", "Delete chat");
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"/>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      </svg>
    `;
    deleteBtn.addEventListener("click", (e) => deleteChat(chat.id, e));
    actions.appendChild(deleteBtn);

    item.appendChild(actions);
    chatList.appendChild(item);
  });
}

// ========================================================
// Safe Text & Markdown Rendering
// ========================================================
function cleanThinkTags(text) {
  if (!text) return "";
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<think>[\s\S]*$/gi, "");
  return cleaned.trimStart();
}

function renderFormattedInline(container, text) {
  // Matches `inline code`, **bold**, or *asterisk action*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      container.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      const codeEl = document.createElement("code");
      codeEl.className = "inline-code";
      codeEl.textContent = token.slice(1, -1);
      container.appendChild(codeEl);
    } else if (token.startsWith("**") && token.endsWith("**")) {
      const strongEl = document.createElement("strong");
      strongEl.textContent = token.slice(2, -2);
      container.appendChild(strongEl);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      const actionEl = document.createElement("span");
      actionEl.className = "bulba-action";
      actionEl.textContent = token;
      container.appendChild(actionEl);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    container.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

function renderMarkdownSafely(container, markdownText) {
  container.replaceChildren();

  // Split by fenced code blocks: ```lang\ncode\n```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(markdownText)) !== null) {
    const textBefore = markdownText.slice(lastIndex, match.index);
    if (textBefore) {
      appendParagraphs(container, textBefore);
    }

    const lang = match[1] || "code";
    const codeContent = match[2];

    const card = document.createElement("div");
    card.className = "code-block-card";

    const header = document.createElement("div");
    header.className = "code-block-header";

    const langSpan = document.createElement("span");
    langSpan.textContent = lang;

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-code-btn";
    copyBtn.type = "button";
    copyBtn.title = "Copy code to clipboard";
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
      </svg>
      <span>Copy</span>
    `;

    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(codeContent).then(() => {
        const span = copyBtn.querySelector("span");
        if (span) span.textContent = "Copied!";
        setTimeout(() => {
          if (span) span.textContent = "Copy";
        }, 2000);
      });
    });

    header.appendChild(langSpan);
    header.appendChild(copyBtn);

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = codeContent;
    pre.appendChild(code);

    card.appendChild(header);
    card.appendChild(pre);
    container.appendChild(card);

    lastIndex = match.index + match[0].length;
  }

  const remaining = markdownText.slice(lastIndex);
  if (remaining) {
    appendParagraphs(container, remaining);
  }
}

function appendParagraphs(container, text) {
  const paragraphs = text.split(/\n\s*\n/);
  paragraphs.forEach((pText) => {
    const trimmed = pText.trim();
    if (!trimmed) return;

    const p = document.createElement("p");
    const lines = trimmed.split("\n");
    lines.forEach((line, i) => {
      if (i > 0) p.appendChild(document.createElement("br"));
      renderFormattedInline(p, line);
    });
    container.appendChild(p);
  });
}

// ========================================================
// Viewport Scrolling Helpers
// ========================================================
function isUserScrolledUp() {
  const threshold = 100;
  return chatViewport.scrollHeight - chatViewport.scrollTop - chatViewport.clientHeight > threshold;
}

function scrollToBottom(force = false) {
  if (force || !isUserScrolledUp()) {
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }
}

// ========================================================
// Render Current Chat View
// ========================================================
function renderCurrentChatView() {
  const activeChat = getActiveChat();

  if (!activeChat || activeChat.messages.length === 0) {
    heroContainer.style.display = "block";
    messagesFeed.replaceChildren();
  } else {
    heroContainer.style.display = "none";
    messagesFeed.replaceChildren();

    activeChat.messages.forEach((msg) => {
      if (msg.role === "user") {
        appendUserMessageToDOM(msg.content);
      } else {
        appendBotMessageToDOM(msg.content);
      }
    });
  }

  scrollToBottom(true);
}

function appendUserMessageToDOM(text) {
  const row = document.createElement("div");
  row.className = "message-row user";

  const bubble = document.createElement("div");
  bubble.className = "user-bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  messagesFeed.appendChild(row);
  return bubble;
}

function appendBotMessageToDOM(text, isGeneratingRow = false) {
  const row = document.createElement("div");
  row.className = `message-row bot ${isGeneratingRow ? "generating" : ""}`;

  const avatarContainer = document.createElement("div");
  avatarContainer.className = "bot-avatar-container";
  const avatarImg = document.createElement("img");
  avatarImg.src = "assets/avatar.png";
  avatarImg.alt = "Bulbasaur avatar";
  avatarImg.className = "bot-avatar";
  avatarContainer.appendChild(avatarImg);

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "bot-content-wrapper";

  const bubble = document.createElement("div");
  bubble.className = "bot-bubble";
  renderMarkdownSafely(bubble, text);

  // Message hover actions (Copy message)
  const msgActions = document.createElement("div");
  msgActions.className = "bot-msg-actions";

  const copyMsgBtn = document.createElement("button");
  copyMsgBtn.className = "copy-msg-btn";
  copyMsgBtn.type = "button";
  copyMsgBtn.title = "Copy message";
  copyMsgBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
    <span>Copy</span>
  `;

  copyMsgBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(bubble.textContent).then(() => {
      const span = copyMsgBtn.querySelector("span");
      if (span) span.textContent = "Copied!";
      setTimeout(() => {
        if (span) span.textContent = "Copy";
      }, 2000);
    });
  });

  msgActions.appendChild(copyMsgBtn);

  contentWrapper.appendChild(bubble);
  contentWrapper.appendChild(msgActions);

  row.appendChild(avatarContainer);
  row.appendChild(contentWrapper);
  messagesFeed.appendChild(row);

  return { row, bubble };
}

// ========================================================
// Typing Indicator & Error Card
// ========================================================
function showTypingIndicator() {
  hideTypingIndicator();

  const row = document.createElement("div");
  row.className = "typing-indicator-row";
  row.id = "typing-indicator";

  const avatarContainer = document.createElement("div");
  avatarContainer.className = "bot-avatar-container";
  const avatarImg = document.createElement("img");
  avatarImg.src = "assets/avatar.png";
  avatarImg.alt = "Bulbasaur avatar";
  avatarImg.className = "bot-avatar";
  avatarContainer.appendChild(avatarImg);

  const leaves = document.createElement("div");
  leaves.className = "bouncing-leaves";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "bounce-dot";
    leaves.appendChild(dot);
  }

  row.appendChild(avatarContainer);
  row.appendChild(leaves);
  messagesFeed.appendChild(row);
  scrollToBottom();
}

function hideTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) indicator.remove();
}

function showErrorCard(errorMessage, onRetry) {
  const card = document.createElement("div");
  card.className = "error-card";

  const img = document.createElement("img");
  img.src = "assets/bulba-confused.jpg";
  img.alt = "Confused Bulbasaur";
  img.className = "error-img";

  const body = document.createElement("div");
  body.className = "error-body";

  const title = document.createElement("div");
  title.className = "error-title";
  title.textContent = "Connection Error";

  const desc = document.createElement("div");
  desc.className = "error-desc";
  desc.textContent = errorMessage || "Couldn't reach LM Studio. Is the server running?";

  const retryBtn = document.createElement("button");
  retryBtn.className = "retry-btn";
  retryBtn.type = "button";
  retryBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
      <path d="M3 21v-5h5"/>
    </svg>
    <span>Retry</span>
  `;

  retryBtn.addEventListener("click", () => {
    card.remove();
    if (onRetry) onRetry();
  });

  body.appendChild(title);
  body.appendChild(desc);
  body.appendChild(retryBtn);

  card.appendChild(img);
  card.appendChild(body);
  messagesFeed.appendChild(card);
  scrollToBottom(true);
}

// ========================================================
// Generating & Stop Control
// ========================================================
function setGeneratingState(generating) {
  isGenerating = generating;
  userInput.disabled = generating;

  if (generating) {
    sendStopBtn.classList.add("generating");
    sendStopBtn.title = "Stop generating";
    sendStopBtn.setAttribute("aria-label", "Stop generating");
  } else {
    sendStopBtn.classList.remove("generating");
    sendStopBtn.title = "Send message";
    sendStopBtn.setAttribute("aria-label", "Send message");
    userInput.focus();
  }
}

function abortGeneration() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

// ========================================================
// Send Message & LM Studio Streaming
// ========================================================
async function handleSendPrompt(promptText) {
  const content = (promptText || userInput.value).trim();
  if (!content) return;

  lastFailedPrompt = content;

  // 1. If no active chat, create one now with first message auto-title
  if (!activeChatId) {
    const rawTitle = content.replace(/\s+/g, " ").trim();
    const title = rawTitle.slice(0, 30) + (rawTitle.length > 30 ? "..." : "");
    const newChat = {
      id: "chat_" + Date.now(),
      title: title || "New chat",
      messages: [],
      createdAt: Date.now()
    };
    chats.unshift(newChat);
    activeChatId = newChat.id;
    saveChatsToStorage();
    saveActiveChatIdToStorage(activeChatId);
    renderChatList();
  }

  const activeChat = getActiveChat();
  if (!activeChat) return;

  // 2. Hide hero, append user message to chat data and DOM
  heroContainer.style.display = "none";
  activeChat.messages.push({ role: "user", content });
  saveChatsToStorage();
  appendUserMessageToDOM(content);

  // 3. Reset input UI
  userInput.value = "";
  userInput.style.height = "auto";
  setGeneratingState(true);

  // 4. Show typing indicator
  showTypingIndicator();

  // 5. Setup AbortController
  currentAbortController = new AbortController();

  let botBubble = null;
  let botRow = null;
  let rawBotText = "";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: activeChat.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: TEMPERATURE,
        stream: true
      }),
      signal: currentAbortController.signal
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Streaming not supported on this response.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep incomplete trailing chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") {
          break;
        }

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            rawBotText += delta;
            const cleanedText = cleanThinkTags(rawBotText);

            if (cleanedText) {
              hideTypingIndicator();
              if (!botBubble) {
                const elements = appendBotMessageToDOM("", true);
                botRow = elements.row;
                botBubble = elements.bubble;
              }
              renderMarkdownSafely(botBubble, cleanedText);
              scrollToBottom();
            }
          }
        } catch (jsonErr) {
          // Ignore partial JSON chunk errors
        }
      }
    }

    hideTypingIndicator();

    const finalText = cleanThinkTags(rawBotText);
    if (finalText) {
      if (!botBubble) {
        const elements = appendBotMessageToDOM(finalText, false);
        botBubble = elements.bubble;
      } else {
        renderMarkdownSafely(botBubble, finalText);
      }
      activeChat.messages.push({ role: "assistant", content: finalText });
      saveChatsToStorage();
    } else if (!botBubble) {
      appendBotMessageToDOM("(No output received from model)", false);
    }
  } catch (err) {
    hideTypingIndicator();

    if (err.name === "AbortError") {
      // Stopped by user: save what we have so far if any
      const partialText = cleanThinkTags(rawBotText);
      if (partialText) {
        activeChat.messages.push({ role: "assistant", content: partialText });
        saveChatsToStorage();
      }
    } else {
      console.error("LM Studio error:", err);
      showErrorCard("Couldn't reach LM Studio. Is the server running?", () => {
        if (lastFailedPrompt) {
          handleSendPrompt(lastFailedPrompt);
        }
      });
    }
  } finally {
    if (botRow) {
      botRow.classList.remove("generating");
    }
    currentAbortController = null;
    setGeneratingState(false);
    scrollToBottom();
  }
}

// ========================================================
// Event Listeners: Input, Send, Stop, Suggestions
// ========================================================

// Auto-expand textarea
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  const newHeight = Math.min(userInput.scrollHeight, 160);
  userInput.style.height = `${newHeight}px`;
});

// Keydown: Enter sends, Shift+Enter new line
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (isGenerating) {
      abortGeneration();
    } else {
      handleSendPrompt();
    }
  }
});

// Form submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (isGenerating) {
    abortGeneration();
  } else {
    handleSendPrompt();
  }
});

// Clickable suggestion chips
suggestionChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".suggestion-chip");
  if (!chip) return;
  const prompt = chip.getAttribute("data-prompt");
  if (prompt) {
    handleSendPrompt(prompt);
  }
});

// ========================================================
// Initialization on Page Load
// ========================================================
function init() {
  // 1. Initialize Theme
  const savedTheme = loadThemeFromStorage();
  applyTheme(savedTheme);

  // 2. Load Chats
  chats = loadChatsFromStorage();
  const savedActiveId = loadActiveChatIdFromStorage();

  if (savedActiveId && chats.some((c) => c.id === savedActiveId)) {
    activeChatId = savedActiveId;
  } else if (chats.length > 0) {
    activeChatId = chats[0].id;
    saveActiveChatIdToStorage(activeChatId);
  } else {
    activeChatId = null;
  }

  // 3. Render
  renderChatList();
  renderCurrentChatView();
  userInput.focus();
}

window.addEventListener("DOMContentLoaded", init);
