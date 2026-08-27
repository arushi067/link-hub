const XBOX_API_KEY = "da211102-d66f-47e4-b651-8ba6a040f6b1";
const XBOX_USERNAME = "Aruu079225";
const XBOX_API_BASE = "https://xbl.io/api/v2";

async function resolveXUID(gamertag, apiKey) {
  const res = await fetch(`${XBOX_API_BASE}/search/${encodeURIComponent(gamertag)}`, {
    headers: { "X-Authorization": apiKey, "Accept": "application/json" }
  });
  if (!res.ok) throw new Error("Could not resolve gamertag to XUID (status " + res.status + ")");
  const data = await res.json();
  if (!data.people || !data.people.length) throw new Error("Gamertag not found");
  return data.people[0].xuid;
}

async function fetchTitleHistory(xuid, apiKey) {
  const res = await fetch(`${XBOX_API_BASE}/player/titleHistory/${xuid}`, {
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
  loading.style.display = "none";
  grid.innerHTML = "";

  if (!titles || !titles.length) {
    grid.innerHTML = '<p style="text-align:center;opacity:0.6;">No recent games found.</p>';
    return;
  }

  titles.forEach(function (title, i) {
    const card = document.createElement("div");
    card.className = "xbox-card";
    card.style.animationDelay = (i * 0.08) + "s";

    const img = document.createElement("img");
    img.src = title.displayImage || (title.images && title.images.tile) || "";
    img.alt = title.name;
    img.onerror = function () { img.style.display = "none"; };

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
  document.getElementById("xboxLoading").style.display = "none";
  const errEl = document.getElementById("xboxError");
  errEl.style.display = "block";
  errEl.textContent = "⚠️ " + msg;
}

async function initXboxPanel() {
  try {
    const xuid = await resolveXUID(XBOX_USERNAME, XBOX_API_KEY);
    const history = await fetchTitleHistory(xuid, XBOX_API_KEY);
    const titles = history.titles || [];
    titles.sort(function (a, b) {
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