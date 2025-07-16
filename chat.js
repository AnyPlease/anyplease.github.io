// chat.js
const form  = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const box   = document.getElementById('chat-box');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addMessage('user', text);
  input.value = '';

  try {
    // hit your FastAPI endpoint
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, max_new_tokens: 128 })
    });
    if (!res.ok) throw new Error(await res.text());
    const { completion } = await res.json();
    addMessage('bot', completion);
  } catch (err) {
    console.error(err);
    addMessage('bot', '⚠️ Oops, I hit an error. Check console.');
  }
  box.scrollTop = box.scrollHeight;  // autoscroll
});

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = (role === 'user' ? 'You: ' : 'LLM: ') + text;
  box.appendChild(div);
}
