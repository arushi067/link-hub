import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const PROFILE_SLUG = "arushi";
const profileRef = doc(db, "profiles", PROFILE_SLUG);

const THEME_COLORS = {
  pink:   { bg: "#ffeef5", card: "#fff0f6" },
  dark:   { bg: "#0d0d1a", card: "#1a1a2e" },
  purple: { bg: "#1a0d2e", card: "#2d1b4e" },
  ocean:  { bg: "#e8f7fb", card: "#f0fbfd" }
};

const FONT_MAP = {
  poppins: "'Poppins', sans-serif",
  quicksand: "'Quicksand', sans-serif",
  playfair: "'Playfair Display', serif",
  caveat: "'Caveat', cursive"
};

function applyOnlineDot(status) {
  const dot = document.getElementById("statusDot");
  const colors = { online: "#2ecc71", away: "#f1c40f", offline: "#95a5a6", dnd: "#e74c3c" };
  dot.style.background = colors[status] || colors.online;
}

function applyBackgroundVideo(url) {
  const video = document.getElementById("bgVideo");
  const overlay = document.getElementById("videoOverlay");
  if (url) {
    video.innerHTML = '<source src="' + url + '" type="video/mp4">';
    video.style.display = "block";
    overlay.style.display = "block";
    video.play().catch(() => {});
  } else {
    video.style.display = "none";
    overlay.style.display = "none";
  }
}

function applyCustomLink(idx, label, url) {
  const link = document.getElementById("customLink" + idx);
  const text = document.getElementById("customLink" + idx + "Text");
  if (label && url) {
    link.href = url;
    text.textContent = label;
    link.classList.remove("hidden");
  } else {
    link.classList.add("hidden");
  }
}

function buildMetaRow(d) {
  const row = document.getElementById("metaRow");
  row.innerHTML = "";
  const chips = [];
  if (d.pronouns) chips.push(d.pronouns);
  if (d.location) chips.push("📍 " + d.location);
  if (d.birthday) chips.push("🎂 " + d.birthday);
  if (d.mood) chips.push("💭 " + d.mood);
  chips.forEach((c) => {
    const span = document.createElement("span");
    span.className = "meta-chip";
    span.textContent = c;
    row.appendChild(span);
  });
}

async function applyProfile() {
  const snap = await getDoc(profileRef);
  const d = snap.exists() ? snap.data() : {};

  document.getElementById("pageTitle").textContent = d.name || "Arushi Patel";
  document.getElementById("userName").textContent = d.name || "Arushi Patel";
  document.getElementById("footerName").textContent = d.name || "Arushi Patel";
  document.getElementById("statusText").textContent = (d.statusText || "") + " " + (d.statusEmoji || "");
  document.getElementById("dailyQuote").textContent = d.quote || "Creativity Makes You Happier ✨";

  if (d.photo) document.getElementById("profilePhoto").src = d.photo;

  applyOnlineDot(d.onlineStatus);
  buildMetaRow(d);

  const root = document.documentElement;
  root.style.setProperty("--accent", d.accentColor || "#ff5fa2");
  root.style.setProperty("--secondary", d.secondColor || "#7f5fff");

  const theme = THEME_COLORS[d.theme] || THEME_COLORS.pink;
  root.style.setProperty("--bg-color", theme.bg);
  root.style.setProperty("--card-color", theme.card);

  document.body.style.fontFamily = FONT_MAP[d.font] || FONT_MAP.poppins;

  const card = document.getElementById("mainCard");
  card.style.opacity = ((d.cardOpacity ?? 100) / 100);
  card.style.border = d.cardBorder === false ? "none" : "";

  const particlesEl = document.getElementById("particles");
  if (particlesEl) particlesEl.style.display = d.particles === false ? "none" : "";

  if (d.animation === "video" && d.bgVideo) {
    applyBackgroundVideo(d.bgVideo);
    document.getElementById("auroraLayer").style.display = "none";
  } else {
    document.getElementById("auroraLayer").style.display = "block";
    applyBackgroundVideo("");
  }

  document.getElementById("snapLink").href = d.snap || "#";
  document.getElementById("discordLink").href = d.discord || "#";
  document.getElementById("instaLink").href = d.insta || "#";

  applyCustomLink(1, d.customLink1Label, d.customLink1Url);
  applyCustomLink(2, d.customLink2Label, d.customLink2Url);

  const clickSound = document.getElementById("clickSound");
  if (d.clickSound) {
    clickSound.src = d.clickSound;
    document.querySelectorAll(".link-btn").forEach((btn) => {
      btn.addEventListener("click", () => { clickSound.currentTime = 0; clickSound.play().catch(() => {}); });
    });
  }

  setupWhatsApp(d);
}

function setupWhatsApp(d) {
  const waBtn = document.getElementById("waBtn");
  const waForm = document.getElementById("waRequestForm");
  const waSubmit = document.getElementById("waSubmit");
  const waGmail = document.getElementById("waGmail");
  const waMsg = document.getElementById("waMsg");

  waBtn.addEventListener("click", () => {
    waForm.classList.toggle("hidden");
  });

  waSubmit.addEventListener("click", async () => {
    const email = waGmail.value.trim();
    if (!email || !email.includes("@")) {
      waMsg.textContent = "Please enter a valid email.";
      waMsg.style.color = "#e74c3c";
      return;
    }
    try {
      const snap = await getDoc(profileRef);
      const data = snap.exists() ? snap.data() : {};
      const requests = data.waRequests || [];
      const unlocked = data.waUnlocked || [];

      if (unlocked.includes(email)) {
        waMsg.textContent = "You're already approved! WhatsApp: " + (d.waNumber || "");
        waMsg.style.color = "#27ae60";
        return;
      }

      if (!requests.find((r) => r.email === email)) {
        requests.push({ email, requestedAt: new Date().toISOString() });
        await updateDoc(profileRef, { waRequests: requests });
      }
      waMsg.textContent = "Request sent! Waiting for approval 💌";
      waMsg.style.color = "#27ae60";
    } catch (err) {
      waMsg.textContent = "Something went wrong. Try again.";
      waMsg.style.color = "#e74c3c";
    }
  });
}

applyProfile();
