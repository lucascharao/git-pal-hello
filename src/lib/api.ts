const API_URL = import.meta.env.VITE_API_URL || '';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('ai_provider');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    saveTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let token = getToken();

  const doFetch = (t: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    });

  let res = await doFetch(token);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  return res;
}

export const api = {
  async signup(data: { email: string; password: string; fullName: string; whatsapp: string }) {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async me() {
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) return null;
    return res.json();
  },

  async saveApiKey(apiKey: string) {
    const res = await apiFetch('/api/auth/api-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
    return res.json();
  },

  async generateQuote(projectData: any, aiProvider: string) {
    const res = await apiFetch('/api/quotes/generate', {
      method: 'POST',
      body: JSON.stringify({ projectData, aiProvider }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao gerar orçamento');
    }
    return res.json();
  },

  async listQuotes() {
    const res = await apiFetch('/api/quotes');
    if (!res.ok) throw new Error('Erro ao buscar orçamentos');
    return res.json();
  },

  async analyzeCounterOffer(quoteId: string, data: any) {
    const res = await apiFetch(`/api/quotes/${quoteId}/counter-offer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao analisar contraproposta');
    }
    return res.json();
  },

  chatUrl() {
    return `${API_URL}/api/chat`;
  },
};
