export const config = { runtime: 'edge' };

export default async function handler(req) {
  const API_KEY = process.env.AIRTABLE_API_KEY;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!API_KEY || !BASE_ID) {
    return new Response(JSON.stringify({ error: 'Server configuration missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  // ── CORS headers so the browser can call this from the same domain ──
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  const airtableBase = `https://api.airtable.com/v0/${BASE_ID}`;
  const headers = { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };

  try {
    // ── GET campuses ──
    if (action === 'campuses') {
      const res = await fetch(
        `${airtableBase}/Campuses?fields[]=Campus+Name&fields[]=Shipping+address&fields[]=School+Phone&sort[0][field]=Campus+Name&sort[0][direction]=asc`,
        { headers }
      );
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: cors });
    }

    // ── GET device models ──
    if (action === 'devices') {
      const res = await fetch(
        `${airtableBase}/Device+Models?fields[]=Device+Name&fields[]=Notes&fields[]=Active&sort[0][field]=Device+Name&sort[0][direction]=asc`,
        { headers }
      );
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: cors });
    }

    // ── POST submission ──
    if (action === 'submit' && req.method === 'POST') {
      const body = await req.json();
      const res = await fetch(`${airtableBase}/Device+Requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.ok ? 200 : 400,
        headers: cors
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: cors });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', detail: err.message }), {
      status: 500,
      headers: cors
    });
  }
}
