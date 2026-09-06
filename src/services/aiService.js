/**
 * AI Service Module for DevPulse AI Chatbot
 * Configurable parameters: Persona, Tone, Domain Knowledge, Temperature, Memory
 * Integrates with Google Gemini API & Built-in Smart Fallback Engine
 */

export class AIService {
  constructor() {
    // Read API key from localStorage only — NEVER hardcode API keys in source files
    this.apiKey = localStorage.getItem('devpulse_gemini_key') || '';
    this.config = {
      persona: 'tech_lead',
      domain: 'webdev',
      temperature: 0.7,
      memoryEnabled: true,
      tools: {
        github: true,
        weather: true,
        news: true,
        sandbox: true
      }
    };
    this.memoryHistory = [];
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('devpulse_gemini_key', key);
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  clearMemory() {
    this.memoryHistory = [];
  }

  getSystemPrompt() {
    const personas = {
      tech_lead: "Kamu adalah 'DevPulse Tech Lead', seorang Senior Developer & Tech Lead berpengalaman. Gaya bahasamu profesional, terstruktur, mendalam, dan selalu mempromosikan best practices software engineering.",
      santai: "Kamu adalah 'DevPulse Peer Dev', rekan coding yang santai, ramah, solutif, dan suka menggunakan istilah-istilah gaul developer (seperti 'gas', 'mantap', 'sat set', 'clean code').",
      code_optimizer: "Kamu adalah 'DevPulse Code Optimizer', spesialis performa kode. Kamu memberikan jawaban ringkas, to-the-point, fokus pada efisiensi algoritma (Big-O), refactoring, dan langsung menyajikan snippet kode yang optimal.",
      formal: "Kamu adalah 'DevPulse Assistant', asisten AI formal. Gunakan Bahasa Indonesia baku, penyampaian yang sopan, terstruktur dengan poin-poin yang sangat sistematis dan dokumentasi lengkap.",
      eli5: "Kamu adalah 'DevPulse ELI5 Mentor'. Jelaskan konsep teknis yang rumit dengan analogi dunia nyata yang sangat mudah dipahami oleh pemula, tanpa kehilangan esensi utamanya."
    };

    const domains = {
      webdev: "Fokus Domain: Web Development & Full-Stack (JavaScript, TypeScript, React, Vue, Node.js, HTML/CSS, Web Performance, REST/GraphQL API).",
      datascience: "Fokus Domain: Data Science, Machine Learning & AI (Python, pandas, PyTorch, Scikit-Learn, SQL, Data Pipeline, Prompt Engineering).",
      devops: "Fokus Domain: DevOps, Cloud Architecture & Infrastructure (Docker, Kubernetes, CI/CD pipelines, AWS/GCP, Nginx, Shell Scripting, Security).",
      system_design: "Fokus Domain: System Design & Microservices (Scalability, Database Sharding, Caching/Redis, Message Queues, Load Balancing, Security).",
      career: "Fokus Domain: Developer Productivity & Career (Code Review, Portfolio, Workflow Optimization, Git, Agile/Scrum, Resume)."
    };

    return `${personas[this.config.persona] || personas.tech_lead}\n${domains[this.config.domain] || domains.webdev}\n\nPetunjuk Respons:\n- Gunakan format Markdown yang rapi.\n- Setiap ada snippet kode, selalu sertakan tag bahasa (misal \`\`\`javascript atau \`\`\`python).\n- Jika user menanyakan data eksternal (misal repo github, berita tech, cuaca), manfaatkan info dari data tool yang diberikan.`;
  }

  async generateResponse(userMessage, toolData = null) {
    if (this.config.memoryEnabled) {
      this.memoryHistory.push({ role: 'user', content: userMessage });
    }

    let responseText = '';

    // Check if API key is present in configuration or input
    if (this.apiKey && this.apiKey.trim().length > 5) {
      try {
        responseText = await this.callGeminiAPI(userMessage, toolData);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to smart engine:', err);
        responseText = await this.generateSmartFallback(userMessage, toolData);
      }
    } else {
      responseText = await this.generateSmartFallback(userMessage, toolData);
    }

    if (this.config.memoryEnabled) {
      this.memoryHistory.push({ role: 'assistant', content: responseText });
      if (this.memoryHistory.length > 10) {
        this.memoryHistory = this.memoryHistory.slice(-10);
      }
    }

    return {
      text: responseText,
      persona: this.config.persona,
      domain: this.config.domain,
      memoryCount: this.memoryHistory.length
    };
  }

  async callGeminiAPI(userMessage, toolData) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${this.apiKey.trim()}`;
    
    let userPrompt = "";
    
    if (toolData) {
      userPrompt += `[DATA INTEGRASI API EKSTERNAL TERSEDIA]:\n${JSON.stringify(toolData, null, 2)}\n\n`;
    }

    if (this.config.memoryEnabled && this.memoryHistory.length > 1) {
      userPrompt += `[RIWAYAT MEMORI PERCAKAPAN SEBELUMNYA]:\n`;
      this.memoryHistory.slice(-6, -1).forEach(m => {
        userPrompt += `${m.role.toUpperCase()}: ${m.content}\n`;
      });
      userPrompt += `\n`;
    }

    userPrompt += userMessage;

    const body = {
      systemInstruction: {
        parts: [{ text: this.getSystemPrompt() }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: parseFloat(this.config.temperature) || 0.7,
        maxOutputTokens: 1024
      }
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error?.message || 'Gagal memanggil Gemini API');
    }

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }

  async generateSmartFallback(userMessage, toolData) {
    await new Promise(r => setTimeout(r, 600));

    const msg = userMessage.toLowerCase();
    const persona = this.config.persona;

    if (toolData) {
      if (toolData.type === 'github_repo' && toolData.success) {
        const d = toolData.data;
        return `### 🐙 GitHub Repository Info: \`${d.name}\`

Berikut adalah ringkasan repositori yang ditemukan via **GitHub REST API**:

* **Deskripsi**: ${d.description}
* **Bahasa Utama**: \`${d.language}\`
* **Star Count**: ⭐ **${d.stars.toLocaleString()}** stars
* **Forks**: 🍴 **${d.forks.toLocaleString()}** forks
* **Open Issues**: 🐛 **${d.open_issues}** issues
* **Lisensi**: \`${d.license}\`

👉 [Kunjungi Repositori di GitHub](${d.url})

> **Insight DevPulse**: Repositori ini memiliki komunitas yang ${d.stars > 10000 ? 'sangat besar dan aktif!' : 'berkembang dengan baik.'} Anda dapat melakukan clone dengan perintah:
\`\`\`bash
git clone ${d.url}.git
\`\`\``;
      }

      if (toolData.type === 'github_user' && toolData.success) {
        const u = toolData.data;
        return `### 👤 GitHub Developer Profile: \`${u.username}\`

* **Nama**: ${u.name}
* **Bio**: ${u.bio}
* **Lokasi**: ${u.location} | **Perusahaan**: ${u.company}
* **Public Repos**: 📦 **${u.public_repos}** repositori
* **Followers**: 👥 **${u.followers}** followers

👉 [Lihat Profil GitHub](${u.url})`;
      }

      if (toolData.type === 'weather' && toolData.success) {
        const w = toolData.data;
        return `### 🌤️ Live Weather & Local Time (${w.city})
* **Lokasi**: ${w.city}
* **Waktu Lokal**: 🕒 ${w.time} (${w.date})
* **Temperatur Saat Ini**: 🌡️ **${w.temperature}**
* **Kecepatan Angin**: 🌬️ ${w.windspeed}

> 💡 *Developer Productivity Tip*: Jam ${w.time} di ${w.city} adalah waktu yang ${parseInt(w.time) >= 9 && parseInt(w.time) <= 17 ? 'cocok untuk Deep Work & Coding Focus block!' : 'bagus untuk istirahat atau santai sejenak dari layar monitor.'}`;
      }

      if (toolData.type === 'tech_news' && toolData.success) {
        let newsMarkdown = `### 📰 HackerNews Developer Trends & Top Stories\n\n`;
        toolData.stories.forEach((s, idx) => {
          newsMarkdown += `${idx + 1}. **[${s.title}](${s.url})**\n   *🔥 ${s.score} points by ${s.by} | 💬 ${s.comments} comments*\n\n`;
        });
        newsMarkdown += `> Data diperbarui secara real-time via HackerNews API.`;
        return newsMarkdown;
      }
    }

    if (msg.includes('refactor') || msg.includes('clean code') || msg.includes('optimasi')) {
      if (persona === 'santai') {
        return `Siap bro! Untuk urusan refactoring kode supaya makin **clean** dan **sat set**, ini tips utamanya:

1. **Gunakan Destructuring & Arrow Functions**:
\`\`\`javascript
// Clean Code
const getUserName = ({ firstName, lastName }) => \`\${firstName} \${lastName}\`;
\`\`\`

2. **Early Return Pattern**:
\`\`\`javascript
const processOrder = (order) => {
  if (!order) return { status: 'invalid' };
  if (!order.isPaid) return { status: 'unpaid' };
  
  return { status: 'success', data: order };
};
\`\`\`

Gimana, makin rapi kan? 🚀`;
      } else {
        return `### 🛠️ Code Refactoring & Best Practices Guide

Untuk meningkatkan *maintainability* dan *clean code standards*, ikuti panduan berikut:

#### 1. Avoid Nested Conditionals (Early Exit Pattern)
\`\`\`javascript
// ✅ Clean Guard Clauses
function validateUser(user) {
  if (!user || !user.isActive || !user.hasPermission) {
    return false;
  }
  return true;
}
\`\`\``;
      }
    }

    return `### 💡 DevPulse AI Response

Terima kasih atas pertanyaannya! Berdasarkan konfigurasi **Domain: ${this.config.domain.toUpperCase()}** dan **Gaya Bahasa: ${this.config.persona}**:

Berikut adalah rekomendasi langkah yang efisien:

1. **Analisis Kebutuhan**: Tentukan input, constraint, dan output spesifik dari fitur yang sedang dikembangkan.
2. **Implementasi Modular**: Pecah solusi menjadi modul-modul kecil.

\`\`\`javascript
function executeDevTask(taskName) {
  console.log(\`[DevPulse] Executing task: \${taskName}\`);
  return { status: 'COMPLETED', timestamp: new Date().toISOString() };
}
\`\`\``;
  }
}
