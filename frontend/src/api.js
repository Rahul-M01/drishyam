const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Videos
  getVideos: () => request('/videos'),
  getVideo: (id) => request(`/videos/${id}`),
  downloadVideo: (url, extractRecipe = true) =>
    request('/videos/download', {
      method: 'POST',
      body: JSON.stringify({ url, extractRecipe: String(extractRecipe) }),
    }),
  updateVideo: (id, data) =>
    request(`/videos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: 'DELETE' }),
  videoStreamUrl: (fileName) => `${API_BASE}/videos/stream/${fileName}`,
  thumbnailUrl: (fileName) => `${API_BASE}/videos/thumbnail/${fileName}`,

  // Recipes
  getRecipes: () => request('/recipes'),
  getRecipe: (id) => request(`/recipes/${id}`),
  scrapeRecipe: (url) =>
    request('/recipes/scrape', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  createRecipe: (recipe) =>
    request('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    }),
  deleteRecipe: (id) => request(`/recipes/${id}`, { method: 'DELETE' }),
  searchRecipes: (q) => request(`/recipes/search?q=${encodeURIComponent(q)}`),
};
