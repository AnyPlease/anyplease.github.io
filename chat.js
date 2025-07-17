// chat.js
const form  = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const box   = document.getElementById('chat-box');

/* ------------------------------------------------------------------
   Resolve the correct API URL
   – localhost / 127.0.0.1  →  talk to the dev server directly
   – anything else          →  hit your public Nginx + FastAPI instance
-------------------------------------------------------------------*/
// chat.js  – production URL
const API_URL = "https://dean-declared-requirement-hart.trycloudflare.com";


form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage('user', text);
  input.value = '';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, max_new_tokens: 128 })
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`${res.status}: ${msg}`);
    }

    const { completion } = await res.json();
    addMessage('bot', completion);
  } catch (err) {
    console.error(err);
    addMessage('bot', '⚠️ Oops, something went wrong. Check console.');
  }

  // autoscroll to newest message
  box.scrollTop = box.scrollHeight;
});

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = (role === 'user' ? 'You: ' : 'LLM: ') + text;
  box.appendChild(div);
}
