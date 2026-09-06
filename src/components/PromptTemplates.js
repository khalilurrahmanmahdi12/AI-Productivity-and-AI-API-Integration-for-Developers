/**
 * Quick Action Prompt Presets for Developers
 */

export const PROMPT_TEMPLATES = [
  {
    id: 'github_search',
    label: '🐙 GitHub Repo Lookup',
    prompt: 'github repo facebook/react',
    category: 'api'
  },
  {
    id: 'refactor_code',
    label: '⚡ Refactor Async JS',
    prompt: 'Tolong berikan contoh refactor kode asynchronous JavaScript dari callbacks ke Async/Await dan Promise error handling yang clean.',
    category: 'code'
  },
  {
    id: 'weather_hub',
    label: '🌤️ Weather Dev Hub',
    prompt: 'Cek cuaca dan waktu di Tokyo',
    category: 'api'
  },
  {
    id: 'tech_news',
    label: '📰 Tech News Update',
    prompt: 'Tampilkan berita developer & tech populer dari HackerNews.',
    category: 'news'
  },
  {
    id: 'react_hooks',
    label: '⚛️ Custom React Hook',
    prompt: 'Buatkan custom hook React untuk handle API fetching dengan error handling dan loading state.',
    category: 'code'
  },
  {
    id: 'sandbox_js',
    label: '🧪 Jalankan JS Sandbox',
    prompt: 'Jalankan kode JS berikut di sandbox: const arr = [1,2,3,4,5]; console.log("Total:", arr.reduce((a,b)=>a+b, 0));',
    category: 'sandbox'
  }
];
