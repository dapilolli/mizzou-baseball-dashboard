// Central API helper for backend communication
// Use: api('/team/hitters') instead of fetch('http://localhost:8000/team/hitters')

const base = process.env.API_BASE?.replace(/\/$/, '') || ''

export const API_BASE: string = base

export function api(path: string, init?: RequestInit): Promise<Response> {
  const url = `${base}${path}`
  return fetch(url, init)
}

