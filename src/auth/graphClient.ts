import { getAccessToken } from './msalClient';

const G = 'https://graph.microsoft.com/v1.0';

export async function graphGet(path: string, params: Record<string, string> = {}) {
  const token = await getAccessToken();
  const url = new URL(G + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Graph ${path} ${res.status}`);
  return res.json();
}

// Get latest emails with attachments
export async function listMailsWithAttachments(top = '50') {
  return graphGet('/me/messages', {
    '$top': top,
    '$select': 'id,subject,from,receivedDateTime,hasAttachments',
    '$orderby': 'receivedDateTime desc',
    '$filter': 'hasAttachments eq true'
  });
}

// Get attachments for one email
export async function listAttachments(messageId: string) {
  return graphGet(`/me/messages/${messageId}/attachments`, { '$top': '50' });
}