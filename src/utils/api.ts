// Central API helper to avoid hardcoding localhost
// Use: api('/team/hitters') instead of fetch('http://localhost:8000/team/hitters')

const base = (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, '') || ''

export const API_BASE: string = base

export function api(path: string, init?: RequestInit): Promise<Response> {
  const url = `${base}${path}`
  return fetch(url, init)
}

