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
    btn.className = 'px-3 py-1 rounded-full bg-[#161926] hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-800 text-xs text-slate-300 transition shrink-0 flex items-center gap-1.5 font-medium cursor-pointer';
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
    item.className = `p-2.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition ${
      isSelected
        ? 'bg-indigo-600/15 text-indigo-200 font-semibold border border-indigo-500/30'
        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
    }`;
    
    item.innerHTML = `
      <div class="flex items-center gap-2 truncate">
        <i data-lucide="message-square" class="w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}"></i>
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

// Render Welcome Banner for Empty Chat (Clean 2x2 Grid)
function renderWelcomeBanner() {
  elements.chatFeed.innerHTML = `
    <div id="welcome-banner-box" class="py-12 px-4 text-center max-w-2xl mx-auto space-y-8 animate-fade-in my-auto">
      <div>
        <h2 class="text-3xl font-extrabold text-white tracking-tight">Apa yang ingin kita buat hari ini?</h2>
        <p class="text-xs text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
          Asisten AI produktivitas pengembang perangkat lunak dengan analisis kode, API lookup real-time, dan konfigutasi persona fleksibel.
        </p>
      </div>

      <!-- 4 Interactive Prompt Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        
        <div class="welcome-card p-4 rounded-xl bg-[#131622] border border-slate-800 hover:border-indigo-500/60 transition cursor-pointer group shadow-md" data-prompt="github repo facebook/react">
          <div class="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
            <i data-lucide="github" class="w-4 h-4 text-purple-400"></i>
            <span>GitHub Repository Lookup</span>
          </div>
          <p class="text-xs text-slate-400 group-hover:text-slate-200 transition">Inspeksi statistik repo publik, stars, forks, dan open issues secara instan.</p>
        </div>

        <div class="welcome-card p-4 rounded-xl bg-[#131622] border border-slate-800 hover:border-indigo-500/60 transition cursor-pointer group shadow-md" data-prompt="Tolong berikan contoh refactor kode async JavaScript dari callbacks ke Async/Await dan Promise error handling yang clean.">
          <div class="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
            <i data-lucide="code" class="w-4 h-4 text-indigo-400"></i>
            <span>Refactor &amp; Clean Code</span>
          </div>
          <p class="text-xs text-slate-400 group-hover:text-slate-200 transition">Optimasi performa, pola async/await, dan keterbacaan kode program.</p>
        </div>

        <div class="welcome-card p-4 rounded-xl bg-[#131622] border border-slate-800 hover:border-indigo-500/60 transition cursor-pointer group shadow-md" data-prompt="Cek cuaca dan waktu di Kalimantan">
          <div class="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
            <i data-lucide="cloud-sun" class="w-4 h-4 text-amber-400"></i>
            <span>Live Weather &amp; Time Hub</span>
          </div>
          <p class="text-xs text-slate-400 group-hover:text-slate-200 transition">Cek cuaca dan waktu lokal real-time di pusat teknologi dan wilayah dev hub.</p>
        </div>

        <div class="welcome-card p-4 rounded-xl bg-[#131622] border border-slate-800 hover:border-indigo-500/60 transition cursor-pointer group shadow-md" data-prompt="Tampilkan berita developer & tech populer dari HackerNews.">
          <div class="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
            <i data-lucide="newspaper" class="w-4 h-4 text-blue-400"></i>
            <span>Tech News HackerNews</span>
          </div>
          <p class="text-xs text-slate-400 group-hover:text-slate-200 transition">Pantau berita teknologi dan diskusi developer terpopuler hari ini.</p>
        </div>

      </div>
    </div>
  `;

  // Attach click events to welcome cards
  const cards = elements.chatFeed.querySelectorAll('.welcome-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const promptText = card.getAttribute('data-prompt');
      if (promptText) {
        elements.userInput.value = promptText;
        elements.chatForm.requestSubmit();
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

// Append Message Bubble to Feed
function appendMessageToFeed(role, content, toolBadge = null, shouldScroll = true) {
  const welcomeBanner = document.getElementById('welcome-banner-box');
  if (welcomeBanner) {
    welcomeBanner.remove();
  }

  const isUser = role === 'user';
  const msgDiv = document.createElement('div');
  msgDiv.className = `w-full flex ${isUser ? 'justify-end my-3' : 'justify-start my-3'} animate-fade-in`;

  if (isUser) {
    msgDiv.innerHTML = `
      <div class="flex items-start gap-2.5 max-w-xl">
        <div class="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-xs text-sm leading-relaxed whitespace-pre-wrap shadow-md font-medium">
          ${escapeHtml(content)}
        </div>
        <div class="w-7 h-7 rounded-lg bg-indigo-700 flex items-center justify-center text-white shrink-0 text-xs font-bold shadow">YOU</div>
      </div>
    `;
    lastUserMessageElement = msgDiv;
  } else {
    const parsedMarkdown = window.marked ? window.marked.parse(content) : content;
    
    msgDiv.innerHTML = `
      <div class="flex items-start gap-3 w-full">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md">
          <i data-lucide="cpu" class="w-4 h-4"></i>
        </div>
        
        <div class="flex-1 bg-[#131622] border border-slate-800 text-slate-200 p-4 sm:p-5 rounded-2xl rounded-tl-xs text-sm shadow-lg space-y-3 overflow-hidden">
          ${toolBadge ? `<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-medium">${toolBadge}</div>` : ''}
          <div class="markdown-body leading-relaxed">${parsedMarkdown}</div>
          
          <div class="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs text-slate-400">
            <span class="flex items-center gap-1.5 font-mono text-[11px]"><i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i> AI Verified</span>
            <button class="copy-msg-btn hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition text-xs" title="Salin Respons">
              <i data-lucide="copy" class="w-3 h-3"></i> Salin
            </button>
          </div>
        </div>
      </div>
    `;

    const copyBtn = msgDiv.querySelector('.copy-msg-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(content);
        copyBtn.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-400"></i> Tersalin!`;
        setTimeout(() => {
          copyBtn.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i> Salin`;
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

// Smart Scroll
function smartScrollToUserQuestion() {
  if (lastUserMessageElement) {
    lastUserMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    scrollToBottom();
  }
}

// Attach Live JS Runner Button
function setupSandboxRunners(container) {
  if (!elements.toolSandbox.checked) return;

  const jsCodeBlocks = container.querySelectorAll('pre code.language-javascript, pre code.language-js');
  jsCodeBlocks.forEach(codeEl => {
    const pre = codeEl.parentElement;
    if (pre.querySelector('.run-sandbox-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'run-sandbox-btn absolute top-2 right-2 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-medium flex items-center gap-1 shadow transition active:scale-95 z-10';
    btn.innerHTML = `<i data-lucide="play" class="w-3 h-3"></i> Run Code`;

    pre.classList.add('relative');
    pre.appendChild(btn);

    btn.addEventListener('click', () => {
      const code = codeEl.innerText;
      const res = executeJsSandbox(code);

      let outputBox = pre.parentElement.querySelector('.sandbox-output-box');
      if (!outputBox) {
        outputBox = document.createElement('div');
        outputBox.className = 'sandbox-output-box mt-3 p-3 rounded-xl bg-[#0e1017] border border-emerald-500/30 text-xs font-mono space-y-1';
        pre.after(outputBox);
      }

      outputBox.innerHTML = `
        <div class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
          <i data-lucide="terminal" class="w-3 h-3"></i> Output JS Sandbox:
        </div>
        <pre class="text-slate-200 whitespace-pre-wrap leading-relaxed">${escapeHtml(res.output || res.error)}</pre>
      `;
      if (window.lucide) window.lucide.createIcons();
    });
  });
}

// Typing Indicator
function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'ai-typing-indicator';
  indicator.className = 'w-full flex justify-start my-3 animate-fade-in';
  indicator.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md">
        <i data-lucide="cpu" class="w-4 h-4"></i>
      </div>
      <div class="bg-[#131622] border border-slate-800 p-3.5 rounded-2xl rounded-tl-xs flex items-center gap-2.5 shadow-lg">
        <span class="w-2 h-2 rounded-full bg-indigo-400 typing-dot"></span>
        <span class="w-2 h-2 rounded-full bg-indigo-400 typing-dot"></span>
        <span class="w-2 h-2 rounded-full bg-indigo-400 typing-dot"></span>
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
    elements.badgeMemoryStatus.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono';
    elements.badgeMemoryStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Memory On`;
  } else {
    elements.badgeMemoryStatus.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-400 font-mono';
    elements.badgeMemoryStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Memory Off`;
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
    elements.sidebar.classList.toggle('-ml-64');
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
