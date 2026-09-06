/**
 * External API Integrations Module for DevPulse AI Chatbot
 * Supports: GitHub API, Open-Meteo Dynamic Weather & Geocoding API, HackerNews Tech News API, & JS Code Sandbox
 */

// 1. GitHub REST API Integration
export async function fetchGitHubInfo(query) {
  try {
    const cleanQuery = query.toLowerCase().replace('github', '').trim();
    
    // Check if query specifies repo (e.g. "facebook/react" or "repo facebook/react")
    if (cleanQuery.includes('/') || cleanQuery.includes('repo')) {
      let repoPath = cleanQuery.replace('repo', '').trim();
      if (!repoPath.includes('/') && repoPath.split(' ').length >= 2) {
        const parts = repoPath.split(' ');
        repoPath = `${parts[0]}/${parts[1]}`;
      }
      if (!repoPath) repoPath = 'facebook/react';

      const res = await fetch(`https://api.github.com/repos/${repoPath}`);
      if (!res.ok) throw new Error(`Repository '${repoPath}' tidak ditemukan di GitHub.`);
      const data = await res.json();
      
      return {
        type: 'github_repo',
        success: true,
        data: {
          name: data.full_name,
          description: data.description || 'Tidak ada deskripsi.',
          stars: data.stargazers_count,
          forks: data.forks_count,
          open_issues: data.open_issues_count,
          language: data.language || 'N/A',
          license: data.license?.spdx_id || 'N/A',
          url: data.html_url,
          avatar: data.owner?.avatar_url
        }
      };
    } else {
      // Search GitHub user profile
      const username = cleanQuery.replace('user', '').trim() || 'torvalds';
      const res = await fetch(`https://api.github.com/users/${username}`);
      if (!res.ok) throw new Error(`User '${username}' tidak ditemukan di GitHub.`);
      const data = await res.json();

      return {
        type: 'github_user',
        success: true,
        data: {
          username: data.login,
          name: data.name || data.login,
          bio: data.bio || 'Tidak ada bio.',
          public_repos: data.public_repos,
          followers: data.followers,
          following: data.following,
          url: data.html_url,
          avatar: data.avatar_url,
          company: data.company || 'N/A',
          location: data.location || 'N/A'
        }
      };
    }
  } catch (error) {
    return {
      type: 'github',
      success: false,
      error: error.message
    };
  }
}

// 2. Dynamic Weather & Timezone API Integration (Using Open-Meteo Geocoding + Weather API)
export async function fetchWeatherInfo(query = 'Kalimantan') {
  try {
    // Extract target city/location from user input prompt
    let locationName = query
      .replace(/cek|cuaca|waktu|di|jam|berapa|suhu|hari|ini|di/gi, '')
      .trim();

    if (!locationName || locationName.length < 2) {
      locationName = 'Kalimantan';
    }

    // Step A: Geocode location name to get exact latitude & longitude
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=id`);
    let lat = -6.2088;
    let lon = 106.8456;
    let displayName = locationName;

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        const place = geoData.results[0];
        lat = place.latitude;
        lon = place.longitude;
        displayName = `${place.name}, ${place.country || 'Indonesia'}`;
      }
    }

    // Step B: Fetch real-time weather from Open-Meteo
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    if (!weatherRes.ok) throw new Error(`Gagal mengambil data cuaca untuk ${locationName}.`);
    const data = await weatherRes.json();
    const cw = data.current_weather;

    const now = new Date();

    return {
      type: 'weather',
      success: true,
      data: {
        city: displayName,
        locationQueried: locationName,
        temperature: `${cw.temperature}°C`,
        windspeed: `${cw.windspeed} km/h`,
        weathercode: cw.weathercode,
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      }
    };
  } catch (error) {
    return {
      type: 'weather',
      success: false,
      error: error.message
    };
  }
}

// 3. HackerNews Developer Tech News API Integration
export async function fetchTechNews() {
  try {
    const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty');
    if (!topRes.ok) throw new Error('Gagal mengambil berita tech.');
    const storyIds = await topRes.json();
    
    // Take top 4 stories
    const stories = await Promise.all(
      storyIds.slice(0, 4).map(async (id) => {
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return itemRes.json();
      })
    );

    return {
      type: 'tech_news',
      success: true,
      stories: stories.map(s => ({
        title: s.title,
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        score: s.score,
        by: s.by,
        comments: s.descendants || 0
      }))
    };
  } catch (error) {
    return {
      type: 'tech_news',
      success: false,
      error: error.message
    };
  }
}

// 4. Safe In-Browser JavaScript Code Runner Sandbox
export function executeJsSandbox(code) {
  const logs = [];
  const customConsole = {
    log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    warn: (...args) => logs.push('[WARN] ' + args.join(' ')),
    error: (...args) => logs.push('[ERROR] ' + args.join(' '))
  };

  try {
    const run = new Function('console', code);
    const result = run(customConsole);
    
    return {
      success: true,
      output: logs.length > 0 ? logs.join('\n') : (result !== undefined ? String(result) : 'Code executed with no output.')
    };
  } catch (err) {
    return {
      success: false,
      error: err.toString()
    };
  }
}
