const MODEL = "gemini-2.5-flash";
let API_KEY = localStorage.getItem("gemini_api_key") || "";

const keyScreen = document.getElementById("keyScreen");
const chatScreen = document.getElementById("chatScreen");
const chat = document.getElementById("chat");
const greeting = document.getElementById("greeting");
const msgInput = document.getElementById("msg");
let history = [];
let pendingFile = null;

function apiUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
}

function showChat() {
  keyScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
}
if (API_KEY) showChat();

document.getElementById("keySave").addEventListener("click", () => {
  const val = document.getElementById("keyInput").value.trim();
  if (!val) return;
  API_KEY = val;
  localStorage.setItem("gemini_api_key", val);
  showChat();
});

const overlay = document.getElementById("sheetOverlay");
const sheet = document.getElementById("attachSheet");
document.getElementById("attach").addEventListener("click", () => {
  overlay.classList.remove("hidden");
  sheet.classList.remove("hidden");
});
overlay.addEventListener("click", () => {
  overlay.classList.add("hidden");
  sheet.classList.add("hidden");
});

document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pendingFile = { mime: file.type || "application/octet-stream", data: reader.result.split(",")[1] };
    msgInput.placeholder = "Arquivo anexado: " + file.name;
  };
  reader.readAsDataURL(file);
  overlay.classList.add("hidden");
  sheet.classList.add("hidden");
});

const TOOLS = [{
  function_declarations: [
    { name: "criar_alarme", description: "Cria um alarme no dispositivo",
      parameters: { type: "object", properties: {
        hora: { type: "integer" }, minuto: { type: "integer" }, mensagem: { type: "string" }
      }, required: ["hora", "minuto"] } },
    { name: "criar_evento", description: "Cria um evento no calendario",
      parameters: { type: "object", properties: {
        titulo: { type: "string" }, inicio_epoch_ms: { type: "integer" }, fim_epoch_ms: { type: "integer" }
      }, required: ["titulo", "inicio_epoch_ms", "fim_epoch_ms"] } }
  ]
}];

function addBubble(text, isUser) {
  greeting.classList.add("hidden");
  const div = document.createElement("div");
  div.className = "bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function execFunction(name, args) {
  if (name === "criar_alarme") {
    Android.criarAlarme(args.hora, args.minuto, args.mensagem || "Alarme");
    return { status: "alarme criado" };
  }
  if (name === "criar_evento") {
    Android.criarEvento(args.titulo, args.inicio_epoch_ms, args.fim_epoch_ms);
    return { status: "evento criado" };
  }
  return { error: "funcao desconhecida" };
}

async function callApi() {
  const resp = await fetch(apiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: history, tools: TOOLS })
  });
  const data = await resp.json();
  if (data.error) { addBubble("erro API: " + data.error.message, false); return; }
  const cand = data.candidates[0].content;
  history.push(cand);
  for (const part of cand.parts) {
    if (part.functionCall) {
      const result = execFunction(part.functionCall.name, part.functionCall.args || {});
      history.push({ role: "user", parts: [{ function_response: { name: part.functionCall.name, response: result } }] });
      await callApi();
      return;
    } else if (part.text) {
      addBubble(part.text, false);
    }
  }
}

async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text && !pendingFile) return;
  const parts = [];
  if (pendingFile) {
    parts.push({ inline_data: { mime_type: pendingFile.mime, data: pendingFile.data } });
    pendingFile = null;
    msgInput.placeholder = "Peça ao Gemini Go...";
  }
  if (text) parts.push({ text });
  msgInput.value = "";
  addBubble(text || "[arquivo enviado]", true);
  history.push({ role: "user", parts });
  try {
    await callApi();
  } catch (e) {
    addBubble("erro: " + e.message, false);
  }
}

document.getElementById("send").addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
