const MODEL = "gemini-2.5-flash";
let API_KEY = localStorage.getItem("gemini_api_key") || "";
let conversationName = localStorage.getItem("gemini_conversation_name") || "Gemini Go";

const keyScreen = document.getElementById("keyScreen");
const chatScreen = document.getElementById("chatScreen");
const chat = document.getElementById("chat");
const greeting = document.getElementById("greeting");
const msgInput = document.getElementById("msg");
const modelName = document.getElementById("modelName");
let history = [];
let pendingFile = null;

// Atualiza nome do modelo no topbar com nome da conversa
function refreshModelName() {
  modelName.innerHTML = conversationName + ' <span class="chev"><img class="chevSvg" src="icons/chevron_right.svg"></span>';
}

function apiUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
}

function showChat() {
  keyScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  refreshModelName();
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
const accountSheet = document.getElementById("accountSheet");
const actionsSheet = document.getElementById("actionsSheet");

function openSheet(el) {
  overlay.classList.remove("hidden");
  el.classList.remove("hidden");
}
function closeSheets() {
  overlay.classList.add("hidden");
  sheet.classList.add("hidden");
  accountSheet.classList.add("hidden");
  actionsSheet.classList.add("hidden");
}

// === Attach (camera/arquivos) ===
document.getElementById("attach").addEventListener("click", () => openSheet(sheet));
overlay.addEventListener("click", closeSheets);

document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pendingFile = { mime: file.type || "application/octet-stream", data: reader.result.split(",")[1], name: file.name };
    msgInput.placeholder = "Arquivo anexado: " + file.name;
  };
  reader.readAsDataURL(file);
  closeSheets();
});

document.getElementById("sheetCamera").addEventListener("click", () => {
  // Action real: dispara intent de câmera via AndroidBridge
  if (typeof Android !== "undefined" && Android.abrirCamera) {
    Android.abrirCamera();
  } else {
    msgInput.placeholder = "Câmera indisponível neste dispositivo";
  }
  closeSheets();
});

// === Drawer ===
const navOverlay = document.getElementById("navOverlay");
const navDrawer = document.getElementById("navDrawer");
document.getElementById("menuIcon").addEventListener("click", () => {
  navOverlay.classList.remove("hidden");
  navDrawer.classList.remove("hidden");
  navDrawer.classList.add("open");
});
function closeDrawer() {
  navDrawer.classList.remove("open");
  navOverlay.classList.add("hidden");
  setTimeout(() => navDrawer.classList.add("hidden"), 220);
}
navOverlay.addEventListener("click", closeDrawer);

document.getElementById("navNewChat").addEventListener("click", () => {
  history = [];
  chat.innerHTML = "";
  greeting.classList.remove("hidden");
  conversationName = "Nova conversa";
  localStorage.setItem("gemini_conversation_name", conversationName);
  refreshModelName();
  closeDrawer();
});

document.getElementById("navGems").addEventListener("click", () => {
  // Ação real: mostra snackbar com estado honesto
  addBotBubble("Gems: funcionalidade em desenvolvimento. Gems criados na web vão aparecer aqui.");
  closeDrawer();
});

document.getElementById("navSettings").addEventListener("click", () => {
  closeDrawer();
  document.getElementById("accountKeyInput").value = "";
  document.getElementById("accountLabel").textContent = API_KEY ? ("API key ativa: " + API_KEY.slice(0,8) + "...") : "Nenhuma API key";
  openSheet(accountSheet);
});

document.getElementById("navHelp").addEventListener("click", () => {
  // Ação real: abre documentação do Gemini no navegador
  if (typeof Android !== "undefined" && Android.abrirUrl) {
    Android.abrirUrl("https://ai.google.dev/gemini-api/docs");
  } else {
    addBotBubble("Ajuda: configure sua API key em aistudio.google.com/apikey");
  }
  closeDrawer();
});

// === Account Sheet (trocar API key) ===
document.getElementById("accountIcon").addEventListener("click", () => {
  document.getElementById("accountKeyInput").value = "";
  document.getElementById("accountLabel").textContent = API_KEY ? ("API key ativa: " + API_KEY.slice(0,8) + "...") : "Nenhuma API key";
  openSheet(accountSheet);
});
document.getElementById("accountKeySave").addEventListener("click", () => {
  const val = document.getElementById("accountKeyInput").value.trim();
  if (!val) return;
  API_KEY = val;
  localStorage.setItem("gemini_api_key", val);
  closeSheets();
});

// === More (⋮) — ações da thread ===
document.getElementById("moreIcon").addEventListener("click", () => {
  openSheet(actionsSheet);
});
document.getElementById("actClose").addEventListener("click", closeSheets);

document.getElementById("actRename").addEventListener("click", () => {
  closeSheets();
  const ro = document.getElementById("renameOverlay");
  const ri = document.getElementById("renameInput");
  ri.value = conversationName;
  ro.classList.remove("hidden");
});
document.getElementById("renameCancel").addEventListener("click", () => {
  document.getElementById("renameOverlay").classList.add("hidden");
});
document.getElementById("renameOk").addEventListener("click", () => {
  const v = document.getElementById("renameInput").value.trim();
  if (v) {
    conversationName = v;
    localStorage.setItem("gemini_conversation_name", v);
    refreshModelName();
  }
  document.getElementById("renameOverlay").classList.add("hidden");
});

document.getElementById("actDelete").addEventListener("click", () => {
  if (confirm("Excluir esta conversa? O histórico local será limpo.")) {
    history = [];
    chat.innerHTML = "";
    greeting.classList.remove("hidden");
    conversationName = "Gemini Go";
    localStorage.setItem("gemini_conversation_name", conversationName);
    refreshModelName();
  }
  closeSheets();
});

// === Chat + tools ===
const TOOLS = [{
  function_declarations: [
    { name: "criar_alarme", description: "Cria um alarme no dispositivo Android",
      parameters: { type: "object", properties: {
        hora: { type: "integer", description: "hora 0-23" },
        minuto: { type: "integer", description: "minuto 0-59" },
        mensagem: { type: "string", description: "rotulo do alarme" }
      }, required: ["hora", "minuto"] } },
    { name: "criar_evento", description: "Cria um evento no calendario do sistema",
      parameters: { type: "object", properties: {
        titulo: { type: "string" },
        inicio_epoch_ms: { type: "integer", description: "epoch em milissegundos" },
        fim_epoch_ms: { type: "integer", description: "epoch em milissegundos" }
      }, required: ["titulo", "inicio_epoch_ms", "fim_epoch_ms"] } },
    { name: "criar_timer", description: "Inicia um timer (cronometro) no sistema",
      parameters: { type: "object", properties: {
        duracao_segundos: { type: "integer", description: "duracao em segundos" },
        rotulo: { type: "string" }
      }, required: ["duracao_segundos"] } },
    { name: "criar_lembrete", description: "Cria um lembrete/reminder no sistema",
      parameters: { type: "object", properties: {
        titulo: { type: "string" },
        hora_epoch_ms: { type: "integer", description: "epoch em milissegundos" }
      }, required: ["titulo"] } }
  ]
}];

function addUserBubble(text) {
  greeting.classList.add("hidden");
  const div = document.createElement("div");
  div.className = "bubble user";
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
function addBotBubble(text) {
  greeting.classList.add("hidden");
  const div = document.createElement("div");
  div.className = "bubble bot";
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function execFunction(name, args) {
  if (name === "criar_alarme" && Android) {
    Android.criarAlarme(args.hora, args.minuto, args.mensagem || "Alarme");
    return { status: "alarme criado para " + args.hora + ":" + (args.minuto<10?"0":"") + args.minuto };
  }
  if (name === "criar_evento" && Android) {
    Android.criarEvento(args.titulo, args.inicio_epoch_ms, args.fim_epoch_ms);
    return { status: "evento criado: " + args.titulo };
  }
  if (name === "criar_timer" && Android && Android.criarTimer) {
    Android.criarTimer(args.duracao_segundos, args.rotulo || "Timer");
    return { status: "timer de " + args.duracao_segundos + "s iniciado" };
  }
  if (name === "criar_lembrete" && Android && Android.criarLembrete) {
    Android.criarLembrete(args.titulo, args.hora_epoch_ms || 0);
    return { status: "lembrete criado: " + args.titulo };
  }
  return { error: "funcao " + name + " indisponivel" };
}

async function callApi() {
  const resp = await fetch(apiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: history, tools: TOOLS })
  });
  const data = await resp.json();
  if (data.error) { addBotBubble("erro API: " + data.error.message); return; }
  const cand = data.candidates[0].content;
  history.push(cand);
  for (const part of cand.parts) {
    if (part.functionCall) {
      addBotBubble("→ executando: " + part.functionCall.name);
      const result = execFunction(part.functionCall.name, part.functionCall.args || {});
      history.push({ role: "user", parts: [{ functionResponse: { name: part.functionCall.name, response: result } }] });
      await callApi();
      return;
    } else if (part.text) {
      addBotBubble(part.text);
    }
  }
}

async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text && !pendingFile) return;
  const parts = [];
  if (pendingFile) {
    parts.push({ inline_data: { mime_type: pendingFile.mime, data: pendingFile.data } });
    const label = text ? (text + " [anexo: " + pendingFile.name + "]") : "[arquivo: " + pendingFile.name + "]";
    addUserBubble(label);
    pendingFile = null;
    msgInput.placeholder = "Peça ao Gemini Go...";
  } else {
    addUserBubble(text);
    parts.push({ text });
  }
  if (text) parts.push({ text });
  msgInput.value = "";
  history.push({ role: "user", parts });
  try {
    await callApi();
  } catch (e) {
    addBotBubble("erro: " + e.message);
  }
}

document.getElementById("send").addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

// === Ripple em todos os botoes ===
function addRippleEffect(el) {
  el.classList.add("ripple");
  el.addEventListener("click", (e) => {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 450);
  });
}
document.querySelectorAll(".ripple, .sheetItem, .pillIcon, .actItem, .navItem").forEach(addRippleEffect);
