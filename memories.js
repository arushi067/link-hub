import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadMemories() {
  const board = document.getElementById("board");
  const emptyNote = document.getElementById("boardEmpty");
  if (!board) return;

  try {
    const snap = await getDoc(doc(db, "profiles", "arushi"));
    const d = snap.exists() ? snap.data() : {};
    const memories = d.memories || [];

    board.querySelectorAll(".polaroid").forEach(el => el.remove());

    if (memories.length === 0) {
      if (emptyNote) emptyNote.style.display = "block";
      return;
    }
    if (emptyNote) emptyNote.style.display = "none";

    memories.forEach((m, i) => {
      const div = document.createElement("div");
      div.className = "polaroid " + (i % 2 === 0 ? "tilt-l" : "tilt-r");
      div.innerHTML = `
        <div class="tape"></div>
        <img src="${m.url}" alt="${m.caption || 'Memory'}">
        <p class="cap">${m.caption || 'Memory'}</p>
      `;
      board.appendChild(div);
    });

    attachPolaroidEvents();
  } catch (err) {
    console.error("Failed to load memories:", err);
    if (emptyNote) {
      emptyNote.style.display = "block";
      emptyNote.textContent = "Could not load memories.";
    }
  }
}

function attachPolaroidEvents() {
  const polaroids = document.querySelectorAll(".polaroid");
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbClose = document.getElementById("lbClose");

  polaroids.forEach(p => {
    const img = p.querySelector("img");
    p.addEventListener("click", () => {
      lbImg.src = img.src;
      lightbox.classList.add("active");
    });
  });

  lbClose.addEventListener("click", () => lightbox.classList.remove("active"));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.remove("active");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") lightbox.classList.remove("active");
  });
}

document.addEventListener("DOMContentLoaded", loadMemories);

/* ===== XBOX LIVE PANEL ===== */
const XBOX_API_KEY = "da211102-d66f-47e4-b651-8ba6a040f6b1";
const XBOX_USERNAME = "Aruu079225";
const XBOX_API_BASE = "https://xbl.io/api/v2";

async function resolveXUID(gamertag, apiKey) {
  const res = await fetch(XBOX_API_BASE + "/search/" + encodeURIComponent(gamertag), {
    headers: { "X-Authorization": apiKey, "Accept": "application/json" }
  });
  if (!res.ok) throw new Error("Could not resolve gamertag to XUID (status " + res.status + ")");
  const data = await res.json();
  if (!data.people || !data.people.length) throw new Error("Gamertag not found");
  return data.people[0].xuid;
}

async function fetchTitleHistory(xuid, apiKey) {
  const res = await fetch(XBOX_API_BASE + "/player/titleHistory/" + xuid, {
    headers: { "X-Authorization": apiKey, "Accept": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to fetch title history (status " + res.status + ")");
  return res.json();
}

function formatDate(iso) {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function renderXboxGames(titles) {
  const grid = document.getElementById("xboxGrid");
  const loading = document.getElementById("xboxLoading");
  if (!grid || !loading) return;
  loading.style.display = "none";
  grid.innerHTML = "";
  if (!titles || !titles.length) {
    grid.innerHTML = '<p>No recent games found.</p>';
    return;
  }
  titles.forEach((title, i) => {
    const card = document.createElement("div");
    card.className = "xbox-card";
    card.style.animationDelay = (i * 0.08) + "s";
    const img = document.createElement("img");
    img.src = title.displayImage || (title.images && title.images.tile) || "";
    img.alt = title.name;
    img.onerror = () => { img.style.display = "none"; };
    const body = document.createElement("div");
    body.className = "xbox-card-body";
    const name = document.createElement("div");
    name.className = "xbox-game-name";
    name.textContent = title.name;
    const played = document.createElement("div");
    played.className = "xbox-last-played";
    played.textContent = "Last played: " + formatDate(title.titleHistory && title.titleHistory.lastTimePlayed);
    body.appendChild(name);
    body.appendChild(played);
    card.appendChild(img);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function showXboxError(msg) {
  const loading = document.getElementById("xboxLoading");
  const errEl = document.getElementById("xboxError");
  if (!loading || !errEl) return;
  loading.style.display = "none";
  errEl.style.display = "block";
  errEl.textContent = "⚠️ " + msg;
}

async function initXboxPanel() {
  if (!document.getElementById("xboxGrid")) return;
  try {
    const xuid = await resolveXUID(XBOX_USERNAME, XBOX_API_KEY);
    const history = await fetchTitleHistory(xuid, XBOX_API_KEY);
    const titles = history.titles || [];
    titles.sort((a, b) => {
      const dA = new Date((a.titleHistory && a.titleHistory.lastTimePlayed) || 0);
      const dB = new Date((b.titleHistory && b.titleHistory.lastTimePlayed) || 0);
      return dB - dA;
    });
    renderXboxGames(titles.slice(0, 12));
  } catch (err) {
    showXboxError(err.message || "Could not load Xbox data. Check API key/username.");
  }
}

document.addEventListener("DOMContentLoaded", initXboxPanel);
setInterval(initXboxPanel, 5 * 60 * 1000);
