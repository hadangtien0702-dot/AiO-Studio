/**
 * AiO Studio — Client API Service
 * Interacts with FastAPI backend at /api
 * Strictly NO emojis.
 */

const API_BASE = '/api';

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function getOverviewStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

export async function getStatesData() {
  const res = await fetch(`${API_BASE}/states/data`);
  return res.json();
}

export async function getStatesList() {
  const res = await fetch(`${API_BASE}/states`);
  return res.json();
}

export async function getStateDetail(code) {
  const res = await fetch(`${API_BASE}/states/${encodeURIComponent(code)}`);
  return res.json();
}

export async function getInterviews(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.state) query.set('state', params.state);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  const url = qs ? `${API_BASE}/interviews?${qs}` : `${API_BASE}/interviews`;
  const res = await fetch(url);
  return res.json();
}

export async function createInterview(payload) {
  const res = await fetch(`${API_BASE}/interviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create interview');
  return res.json();
}

export async function updateInterview(id, payload) {
  const res = await fetch(`${API_BASE}/interviews/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update interview');
  return res.json();
}

export async function deleteInterview(id) {
  const res = await fetch(`${API_BASE}/interviews/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete interview');
  return res.json();
}

export function getExportUrl(format = 'json') {
  return `${API_BASE}/export/${format}`;
}
