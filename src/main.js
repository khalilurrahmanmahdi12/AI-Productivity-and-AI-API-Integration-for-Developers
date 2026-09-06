import { AIService } from './services/aiService.js';
import { fetchGitHubInfo, fetchWeatherInfo, fetchTechNews, executeJsSandbox } from './services/externalApis.js';
import { PROMPT_TEMPLATES } from './components/PromptTemplates.js';

// Initialize AI Service
const aiService = new AIService();

// State Management
let currentSessionId = Date.now().toString();
let sessions = JSON.parse(localStorage.getItem('devpulse_sessions')) || [
  {
    id: currentSessionId,
    title: 'Sesi Baru Developer',
    messages: [],
    createdAt: new Date().toISOString()
  }
];

// DOM Element Selectors
const elements = {
  chatFeed: document.getElementById('chat-feed'),
  chatForm: document.getElementById('chat-form'),
  userInput: document.getElementById('user-input'),
  sendBtn: document.getElementById('send-btn'),
  newChatBtn: document.getElementById('new-chat-btn'),
  clearAllSessionsBtn: document.getElementById('clear-all-sessions-btn'),
  chatSessionsList: document.getElementById('chat-sessions-list'),
  openSettingsBtn: document.getElementById('open-settings-btn'),
  closeSettingsBtn: document.getElementById('close-settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  apiKeyInput: document.getElementById('api-key-input'),
  personaSelect: document.getElementById('persona-select'),
  domainSelect: document.getElementById('domain-select'),
  temperatureSlider: document.getElementById('temperature-slider'),
  tempValueDisplay: document.getElementById('temp-value-display'),
  memoryToggle: document.getElementById('memory-toggle'),
  clearMemoryBtn: document.getElementById('clear-memory-btn'),
  exportMDBtn: document.getElementById('export-md-btn'),
  exportJSONBtn: document.getElementById('export-json-btn'),
  quickPromptsContainer: document.getElementById('quick-prompts-container'),
  badgePersonaText: document.getElementById('badge-persona-text'),
  badgeDomainText: document.getElementById('badge-domain-text'),
  badgeMemoryStatus: document.getElementById('badge-memory-status'),
  voiceInputBtn: document.getElementById('voice-input-btn'),
  tokenUsageCounter: document.getElementById('token-usage-counter'),
  aiStatusIndicator: document.getElementById('ai-status-indicator'),
  toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
  sidebar: document.getElementById('sidebar'),
  toolGithub: document.getElementById('tool-github'),
  toolWeather: document.getElementById('tool-weather'),
  toolNews: document.getElementById('tool-news'),
  toolSandbox: document.getElementById('tool-sandbox')
};

// Track last user message element for smart scroll
let lastUserMessageElement = null;

// Initialize Application
function init() {
  renderQuickPrompts();
  renderSessionsList();
  loadCurrentSession();
  setupEventListeners();
  updateBadges();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Render Quick Action Prompt Tags
function renderQuickPrompts() {
  elements.quickPromptsContainer.innerHTML = '';
  PROMPT_TEMPLATES.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-800 text-xs text-slate-300 transition shrink-0 flex items-center gap-1.5 font-medium cursor-pointer';
    btn.innerHTML = item.label;
    btn.addEventListener('click', () => {
      elements.userInput.value = item.prompt;
      elements.userInput.focus();
    });
    elements.quickPromptsContainer.appendChild(btn);
  });
}

// Render Saved Sessions in Sidebar
function renderSessionsList() {
  elements.chatSessionsList.innerHTML = '';
  sessions.forEach(session => {
    const isSelected = session.id === currentSessionId;
    const item = document.createElement('div');
    item.className = `p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
      isSelected
        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-100 font-semibold shadow-md shadow-indigo-600/10'
        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`;
    
    item.innerHTML = `
      <div class="flex items-center gap-2.5 truncate">
        <i data-lucide="message-square" class="w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}"></i>
        <span class="truncate">${session.title || 'Sesi Chat'}</span>
      </div>
      <button class="delete-session-btn opacity-60 hover:opacity-100 p-1 hover:text-red-400 transition" data-id="${session.id}">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.delete-session-btn')) {
        e.stopPropagation();
        deleteSession(session.id);
      } else {
        switchSession(session.id);
      }
    });

    elements.chatSessionsList.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Switch Active Chat Session
function switchSession(id) {
  currentSessionId = id;
  renderSessionsList();
  loadCurrentSession();
}

// Create New Chat Session
function createNewSession() {
  const newId = Date.now().toString();
  const newSession = {
    id: newId,
    title: 'Sesi Baru Developer',
    messages: [],
    createdAt: new Date().toISOString()
  };
  sessions.unshift(newSession);
  saveSessions();
  currentSessionId = newId;
  aiService.clearMemory();
  renderSessionsList();
  loadCurrentSession();
}

// Delete Chat Session
function deleteSession(id) {
  sessions = sessions.filter(s => s.id !== id);
  if (sessions.length === 0) {
    createNewSession();
  } else {
    if (currentSessionId === id) {
      currentSessionId = sessions[0].id;
    }
    saveSessions();
    renderSessionsList();
    loadCurrentSession();
  }
}

// Clear All Sessions
function clearAllSessions() {
  if (confirm('Apakah Anda yakin ingin menghapus semua riwayat sesi chat?')) {
    sessions = [];
    localStorage.removeItem('devpulse_sessions');
    createNewSession();
  }
}

// Save Sessions to LocalStorage
function saveSessions() {
  localStorage.setItem('devpulse_sessions', JSON.stringify(sessions));
}

// Load Messages for Current Session
function loadCurrentSession() {
  const session = sessions.find(s => s.id === currentSessionId);
  elements.chatFeed.innerHTML = '';
  lastUserMessageElement = null;

  if (!session || session.messages.length === 0) {
    renderWelcomeBanner();
    elements.tokenUsageCounter.textContent = 'Memory Context: 0 msgs';
    return;
  }

  session.messages.forEach(msg => {
    appendMessageToFeed(msg.role, msg.content, msg.toolBadge, false);
  });

  elements.tokenUsageCounter.textContent = `Memory Context: ${session.messages.length} msgs`;
  scrollToBottom();
}

// Render Welcome Banner for Empty Chat
function renderWelcomeBanner() {
  elements.chatFeed.innerHTML = `
    <div id="welcome-banner-box" class="py-10 px-4 text-center max-w-2xl mx-auto space-y-6 animate-fade-in my-auto">
      <div class="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-2xl shadow-indigo-500/20 mx-auto">
        <div class="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
          <i data-lucide="cpu" class="w-10 h-10 text-indigo-400"></i>
        </div>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-slate-100 tracking-tight">DevPulse AI Assistant</h2>
        <p class="text-xs text-slate-400 mt-2 leading-relaxed max-w-lg mx-auto">
          AI Productivity Assistant serba guna untuk pengembang perangkat lunak. Atur gaya bahasa, domain pengetahuan, dan manfaatkan integrasi API eksternal secara langsung.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-2">
        <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition shadow-lg">
          <div class="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <i data-lucide="sliders" class="w-4 h-4"></i>
            Parameter AI Kreatif
          </div>
          <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Ubah persona (Tech Lead, Santai, Code Optimizer, ELI5) & domain pengetahuan.</p>
        </div>
        <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition shadow-lg">
          <div class="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <i data-lucide="plug" class="w-4 h-4"></i>
            Integrasi API Real-time
          </div>
          <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Panggil GitHub REST API, Live Weather, HackerNews Feed, dan Jalankan JS Sandbox.</p>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

// Append Message Bubble to Feed
function appendMessageToFeed(role, content, toolBadge = null, shouldScroll = true) {
  // Remove welcome banner ONLY if present
  const welcomeBanner = document.getElementById('welcome-banner-box');
  if (welcomeBanner) {
    welcomeBanner.remove();
  }

  const isUser = role === 'user';
  const msgDiv = document.createElement('div');
  msgDiv.className = `w-full flex ${isUser ? 'justify-end my-3' : 'justify-start my-3'} animate-fade-in`;

  if (isUser) {
    msgDiv.innerHTML = `
      <div class="flex items-start gap-2.5 max-w-2xl">
        <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3 rounded-2xl rounded-tr-xs text-sm leading-relaxed whitespace-pre-wrap shadow-lg shadow-indigo-600/20 border border-indigo-400/30">
          <div class="text-[10px] text-indigo-200 font-mono font-bold uppercase tracking-wider mb-1 flex items-center justify-end gap-1.5 border-b border-indigo-500/40 pb-1">
            <span>PERTANYAAN USER</span>
            <i data-lucide="user" class="w-3 h-3 text-indigo-200"></i>
          </div>
          <div class="text-slate-100 font-medium">${escapeHtml(content)}</div>
        </div>
        <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-md">YOU</div>
      </div>
    `;
    lastUserMessageElement = msgDiv;
  } else {
    const parsedMarkdown = window.marked ? window.marked.parse(content) : content;
    
    msgDiv.innerHTML = `
      <div class="flex items-start gap-3 w-full">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
          <i data-lucide="cpu" class="w-4 h-4"></i>
        </div>
        
        <div class="flex-1 bg-slate-900/90 border border-slate-800 text-slate-200 p-4 sm:p-5 rounded-2xl rounded-tl-xs text-sm shadow-xl space-y-3 overflow-hidden">
          ${toolBadge ? `<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium">${toolBadge}</div>` : ''}
          <div class="markdown-body leading-relaxed">${parsedMarkdown}</div>
          
          <div class="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <span class="flex items-center gap-1.5 font-mono text-[11px]"><i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i> DevPulse AI Verified (Gemini API)</span>
            <button class="copy-msg-btn hover:text-slate-200 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition text-xs" title="Salin Respons">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i> Salin
            </button>
          </div>
        </div>
      </div>
    `;

    const copyBtn = msgDiv.querySelector('.copy-msg-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(content);
        copyBtn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i> Tersalin!`;
        setTimeout(() => {
          copyBtn.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i> Salin`;
          if (window.lucide) window.lucide.createIcons();
        }, 2000);
      });
    }
  }

  elements.chatFeed.appendChild(msgDiv);

  if (window.Prism) {
    window.Prism.highlightAllUnder(msgDiv);
  }
  if (window.lucide) window.lucide.createIcons();

  setupSandboxRunners(msgDiv);

  if (shouldScroll) {
    if (isUser) {
      scrollToBottom();
    } else {
      smartScrollToUserQuestion();
    }
  }
}

// Smart Scroll to ensure User Question remains visible on screen along with AI answer
function smartScrollToUserQuestion() {
  if (lastUserMessageElement) {
    lastUserMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    scrollToBottom();
  }
}

// Attach Live JS Runner Button to JavaScript code blocks inside AI response
function setupSandboxRunners(container) {
  if (!elements.toolSandbox.checked) return;

  const jsCodeBlocks = container.querySelectorAll('pre code.language-javascript, pre code.language-js');
  jsCodeBlocks.forEach(codeEl => {
    const pre = codeEl.parentElement;
    if (pre.querySelector('.run-sandbox-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'run-sandbox-btn absolute top-2.5 right-2.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium flex items-center gap-1.5 shadow-lg transition active:scale-95 z-10';
    btn.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5"></i> Run Code`;

    pre.classList.add('relative');
    pre.appendChild(btn);

    btn.addEventListener('click', () => {
      const code = codeEl.innerText;
      const res = executeJsSandbox(code);

      let outputBox = pre.parentElement.querySelector('.sandbox-output-box');
      if (!outputBox) {
        outputBox = document.createElement('div');
        outputBox.className = 'sandbox-output-box mt-3 p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs font-mono space-y-1.5 shadow-inner';
        pre.after(outputBox);
      }

      outputBox.innerHTML = `
        <div class="text-[11px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <i data-lucide="terminal" class="w-3.5 h-3.5"></i> Output JS Sandbox:
        </div>
        <pre class="text-slate-200 whitespace-pre-wrap leading-relaxed">${escapeHtml(res.output || res.error)}</pre>
      `;
      if (window.lucide) window.lucide.createIcons();
    });
  });
}

// Typing Indicator for AI Thinking state
function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'ai-typing-indicator';
  indicator.className = 'w-full flex justify-start my-3 animate-fade-in';
  indicator.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
        <i data-lucide="cpu" class="w-4 h-4"></i>
      </div>
      <div class="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl rounded-tl-xs flex items-center gap-2.5 shadow-xl">
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-400 typing-dot"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-400 typing-dot"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-400 typing-dot"></span>
        <span class="text-xs text-slate-400 ml-1 font-mono">DevPulse AI sedang memproses...</span>
      </div>
    </div>
  `;
  elements.chatFeed.appendChild(indicator);
  if (window.lucide) window.lucide.createIcons();
  smartScrollToUserQuestion();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('ai-typing-indicator');
  if (indicator) indicator.remove();
}

// Handle Message Submission
async function handleSubmit(e) {
  e.preventDefault();
  const input = elements.userInput.value.trim();
  if (!input) return;

  elements.userInput.value = '';
  elements.sendBtn.disabled = true;

  // Add User message
  appendMessageToFeed('user', input, null, true);

  // Save user message to current session
  const currentSession = sessions.find(s => s.id === currentSessionId);
  if (currentSession) {
    currentSession.messages.push({ role: 'user', content: input });
    if (currentSession.messages.length === 1) {
      currentSession.title = input.slice(0, 26) + (input.length > 26 ? '...' : '');
      renderSessionsList();
    }
    saveSessions();
  }

  showTypingIndicator();

  // Detect External Tool Triggers
  let toolData = null;
  let toolBadge = null;

  const lowerInput = input.toLowerCase();

  if (elements.toolGithub.checked && (lowerInput.includes('github') || lowerInput.includes('repo'))) {
    toolData = await fetchGitHubInfo(input);
    toolBadge = '🐙 GitHub REST API Integrator';
  } else if (elements.toolWeather.checked && (lowerInput.includes('cuaca') || lowerInput.includes('weather') || lowerInput.includes('waktu') || lowerInput.includes('suhu'))) {
    toolData = await fetchWeatherInfo(input);
    toolBadge = '🌤️ Live Weather & Time API';
  } else if (elements.toolNews.checked && (lowerInput.includes('berita') || lowerInput.includes('news') || lowerInput.includes('hackernews') || lowerInput.includes('trend'))) {
    toolData = await fetchTechNews();
    toolBadge = '📰 HackerNews Developer Feed';
  }

  // Generate AI Response
  const aiResult = await aiService.generateResponse(input, toolData);

  removeTypingIndicator();

  // Add AI response
  appendMessageToFeed('assistant', aiResult.text, toolBadge, true);

  // Save AI message to session
  if (currentSession) {
    currentSession.messages.push({ role: 'assistant', content: aiResult.text, toolBadge });
    saveSessions();
    elements.tokenUsageCounter.textContent = `Memory Context: ${currentSession.messages.length} msgs`;
  }

  elements.sendBtn.disabled = false;
  elements.userInput.focus();
}

// Utility Helpers
function scrollToBottom() {
  elements.chatFeed.scrollTop = elements.chatFeed.scrollHeight;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function updateBadges() {
  const personas = {
    tech_lead: 'Tech Lead / Mentor',
    santai: 'Santai / Casual Dev',
    code_optimizer: 'Code Optimizer',
    formal: 'Formal & Structured',
    eli5: 'ELI5 Concept'
  };

  const domains = {
    webdev: 'Web Development',
    datascience: 'Data Science & AI',
    devops: 'DevOps & Cloud',
    system_design: 'System Design',
    career: 'Career & Productivity'
  };

  elements.badgePersonaText.textContent = personas[aiService.config.persona] || 'Tech Lead';
  elements.badgeDomainText.textContent = domains[aiService.config.domain] || 'Web Development';
  
  if (aiService.config.memoryEnabled) {
    elements.badgeMemoryStatus.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono';
    elements.badgeMemoryStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Memory On`;
  } else {
    elements.badgeMemoryStatus.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-400 font-mono';
    elements.badgeMemoryStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-500"></span> Memory Off`;
  }
}

// Export Chat History (Markdown)
function exportChatMarkdown() {
  const currentSession = sessions.find(s => s.id === currentSessionId);
  if (!currentSession || currentSession.messages.length === 0) {
    alert('Tidak ada riwayat chat untuk diekspor.');
    return;
  }

  let md = `# DevPulse AI - Chat Export (${new Date().toLocaleDateString('id-ID')})\n\n`;
  md += `**Judul Sesi**: ${currentSession.title}\n`;
  md += `**Persona**: ${aiService.config.persona} | **Domain**: ${aiService.config.domain}\n\n---\n\n`;

  currentSession.messages.forEach(m => {
    md += `### ${m.role === 'user' ? '👤 USER' : '🤖 DEVPULSE AI'}\n${m.content}\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `devpulse-chat-${currentSession.id}.md`;
  a.click();
}

// Export Chat History (JSON)
function exportChatJSON() {
  const currentSession = sessions.find(s => s.id === currentSessionId);
  if (!currentSession || currentSession.messages.length === 0) {
    alert('Tidak ada riwayat chat untuk diekspor.');
    return;
  }

  const jsonStr = JSON.stringify(currentSession, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `devpulse-chat-${currentSession.id}.json`;
  a.click();
}

// Setup Event Listeners
function setupEventListeners() {
  elements.chatForm.addEventListener('submit', handleSubmit);
  
  elements.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      elements.chatForm.requestSubmit();
    }
  });

  elements.newChatBtn.addEventListener('click', createNewSession);
  elements.clearAllSessionsBtn.addEventListener('click', clearAllSessions);

  // Settings Drawer Toggle
  elements.openSettingsBtn.addEventListener('click', () => {
    elements.apiKeyInput.value = aiService.apiKey;
    elements.personaSelect.value = aiService.config.persona;
    elements.domainSelect.value = aiService.config.domain;
    elements.temperatureSlider.value = aiService.config.temperature;
    elements.tempValueDisplay.textContent = aiService.config.temperature;
    elements.memoryToggle.checked = aiService.config.memoryEnabled;
    elements.settingsModal.classList.remove('hidden');
  });

  elements.closeSettingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
  });

  elements.temperatureSlider.addEventListener('input', (e) => {
    elements.tempValueDisplay.textContent = e.target.value;
  });

  elements.saveSettingsBtn.addEventListener('click', () => {
    aiService.setApiKey(elements.apiKeyInput.value);
    aiService.updateConfig({
      persona: elements.personaSelect.value,
      domain: elements.domainSelect.value,
      temperature: parseFloat(elements.temperatureSlider.value),
      memoryEnabled: elements.memoryToggle.checked,
      tools: {
        github: elements.toolGithub.checked,
        weather: elements.toolWeather.checked,
        news: elements.toolNews.checked,
        sandbox: elements.toolSandbox.checked
      }
    });

    updateBadges();
    elements.settingsModal.classList.add('hidden');
  });

  elements.clearMemoryBtn.addEventListener('click', () => {
    aiService.clearMemory();
    alert('Memori percakapan aktif telah di-reset.');
  });

  elements.exportMDBtn.addEventListener('click', exportChatMarkdown);
  elements.exportJSONBtn.addEventListener('click', exportChatJSON);

  // Sidebar toggle for mobile & small screens
  elements.toggleSidebarBtn.addEventListener('click', () => {
    elements.sidebar.classList.toggle('-ml-72');
  });

  // Speech Recognition (Voice Input)
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';

    elements.voiceInputBtn.addEventListener('click', () => {
      elements.voiceInputBtn.classList.add('text-red-500', 'animate-pulse');
      recognition.start();
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      elements.userInput.value = transcript;
      elements.voiceInputBtn.classList.remove('text-red-500', 'animate-pulse');
    };

    recognition.onerror = () => {
      elements.voiceInputBtn.classList.remove('text-red-500', 'animate-pulse');
    };

    recognition.onend = () => {
      elements.voiceInputBtn.classList.remove('text-red-500', 'animate-pulse');
    };
  } else {
    elements.voiceInputBtn.style.display = 'none';
  }
}

// Launch application on DOM Content Loaded
document.addEventListener('DOMContentLoaded', init);
