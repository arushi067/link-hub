import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const PROFILE_SLUG = "arushi";
const profileRef = doc(db, "profiles", PROFILE_SLUG);

const THEMES = {
  pink:   { bg: "#ffeef5", card: "#fff0f6", accent: "#ff5fa2", secondary: "#7f5fff", text:"#2b2b2b" },
  dark:   { bg: "#0d0d1a", card: "#1a1a2e", accent: "#ff5fa2", secondary: "#7f5fff", text:"#f5f5f5" },
  purple: { bg: "#1a0d2e", card: "#2d1b4e", accent: "#c792ff", secondary: "#ff8fd6", text:"#f5f5f5" },
  ocean:  { bg: "#e8f7fb", card: "#f0fbfd", accent: "#2196f3", secondary: "#00bcd4", text:"#123" },
  sunset: { bg: "#fff3e0", card: "#fff8ee", accent: "#ff7043", secondary: "#ffb300", text:"#3a1f0d" },
  midnight:{ bg: "#05050f", card: "#12122a", accent: "#7f5fff", secondary: "#00e0ff", text:"#eee" }
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

function applyCustomLink(idx, label, url) {
  const link = document.getElementById("customLink" + idx);
  const text = document.getElementById("customLink" + idx + "Text");
  if (label && url) {
    link.href = url; text.textContent = label; link.classList.remove("hidden");
  } else { link.classList.add("hidden"); }
}

function applyBackgroundVideo(url) {
  const video = document.getElementById("bgVideo");
  const overlay = document.getElementById("videoOverlay");
  if (url) {
    video.innerHTML = '<source src="' + url + '" type="video/mp4">';
    video.style.display = "block"; overlay.style.display = "block";
    video.play().catch(()=>{});
  } else {
    video.style.display = "none"; overlay.style.display = "none";
  }
}

function clearBgLayer() {
  const layer = document.getElementById("bgLayer");
  layer.className = "";
  layer.innerHTML = "";
  const particles = document.getElementById("particles");
  particles.innerHTML = "";
}

function buildAurora() {
  document.getElementById("bgLayer").className = "bg-aurora";
}

function buildWave() {
  document.getElementById("bgLayer").className = "bg-wave";
}

function buildBlobs() {
  const layer = document.getElementById("bgLayer");
  layer.className = "bg-blobs";
  ["blob1","blob2","blob3","blob4"].forEach(cls => {
    const div = document.createElement("div");
    div.className = "blob " + cls;
    layer.appendChild(div);
  });
}

function buildStars() {
  const layer = document.getElementById("bgLayer");
  layer.className = "bg-stars";
  for (let i=0;i<80;i++){
    const s = document.createElement("div");
    s.className="star";
    const size = Math.random()*2+1;
    s.style.width=size+"px"; s.style.height=size+"px";
    s.style.top=Math.random()*100+"%"; s.style.left=Math.random()*100+"%";
    s.style.animationDelay=(Math.random()*3)+"s";
    layer.appendChild(s);
  }
  for (let i=0;i<3;i++){
    const sh = document.createElement("div");
    sh.className="shoot";
    sh.style.top=(Math.random()*40)+"%";
    sh.style.left=(50+Math.random()*40)+"%";
    sh.style.animationDelay=(i*2.5)+"s";
    layer.appendChild(sh);
  }
}

function buildBubbles() {
  const layer = document.getElementById("bgLayer");
  layer.className = "bg-bubbles";
  for (let i=0;i<25;i++){
    const b = document.createElement("div");
    b.className="bubble";
    const size = Math.random()*30+10;
    b.style.width=size+"px"; b.style.height=size+"px";
    b.style.left=Math.random()*100+"%";
    b.style.animationDuration=(Math.random()*6+6)+"s";
    b.style.animationDelay=(Math.random()*6)+"s";
    layer.appendChild(b);
  }
}

function buildParticlesOverlay() {
  const particles = document.getElementById("particles");
  for (let i=0;i<30;i++){
    const p = document.createElement("div");
    p.className="particle";
    const size = Math.random()*3+1;
    p.style.width=size+"px"; p.style.height=size+"px";
    p.style.top=Math.random()*100+"%"; p.style.left=Math.random()*100+"%";
    p.style.animationDuration=(Math.random()*4+4)+"s";
    p.style.animationDelay=(Math.random()*4)+"s";
    particles.appendChild(p);
  }
}

function applyAnimation(type, particlesOn) {
  clearBgLayer();
  document.getElementById("bgVideo").style.display = "none";
  document.getElementById("videoOverlay").style.display = "none";

  switch (type) {
    case "aurora": buildAurora(); break;
    case "blobs": buildBlobs(); break;
    case "stars": buildStars(); break;
    case "bubbles": buildBubbles(); break;
    case "wave": buildWave(); break;
    case "none": document.getElementById("bgLayer").className = "bg-none"; break;
    default: buildAurora();
  }
  if (particlesOn !== false) buildParticlesOverlay();
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

  const theme = THEMES[d.theme] || THEMES.pink;
  const root = document.documentElement;
  root.style.setProperty("--accent", d.accentColor || theme.accent);
  root.style.setProperty("--secondary", d.secondColor || theme.secondary);
  root.style.setProperty("--card-color", theme.card);
  document.body.style.background = theme.bg;
  document.body.style.color = theme.text;

  document.body.style.fontFamily = FONT_MAP[d.font] || FONT_MAP.poppins;

  const card = document.getElementById("mainCard");
  card.style.opacity = ((d.cardOpacity ?? 100) / 100);

  if (d.animation === "video" && d.bgVideo) {
    applyBackgroundVideo(d.bgVideo);
    clearBgLayer();
  } else {
    applyBackgroundVideo("");
    applyAnimation(d.animation || "aurora", d.particles);
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
      btn.addEventListener("click", () => { clickSound.currentTime = 0; clickSound.play().catch(()=>{}); });
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

  waBtn.addEventListener("click", () => waForm.classList.toggle("hidden"));

  waSubmit.addEventListener("click", async () => {
    const email = waGmail.value.trim();
    if (!email || !email.includes("@")) {
      waMsg.textContent = "Please enter a valid email."; waMsg.style.color = "#e74c3c"; return;
    }
    try {
      const snap = await getDoc(profileRef);
      const data = snap.exists() ? snap.data() : {};
      const requests = data.waRequests || [];
      const unlocked = data.waUnlocked || [];
      if (unlocked.includes(email)) {
        waMsg.textContent = "You're already approved! WhatsApp: " + (d.waNumber || "");
        waMsg.style.color = "#27ae60"; return;
      }
      if (!requests.find((r) => r.email === email)) {
        requests.push({ email, requestedAt: new Date().toISOString() });
        await updateDoc(profileRef, { waRequests: requests });
      }
      waMsg.textContent = "Request sent! Waiting for approval 💌";
      waMsg.style.color = "#27ae60";
    } catch (err) {
      waMsg.textContent = "Something went wrong. Try again."; waMsg.style.color = "#e74c3c";
    }
  });
}

applyProfile();

if (window.matchMedia("(min-width: 769px)").matches) {
  const card = document.getElementById("mainCard");
  document.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = Math.max(-12, Math.min(12, (x / rect.width) * 20));
    const rotateX = Math.max(-12, Math.min(12, (-y / rect.height) * 20));
    if (Math.abs(x) < rect.width && Math.abs(y) < rect.height) {
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    } else {
      card.style.transform = "rotateX(0deg) rotateY(0deg)";
    }
  });
  document.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0deg) rotateY(0deg)";
  });
}
