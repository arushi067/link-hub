import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PROFILE_SLUG = "arushi";

const THEMES = {
  pink:   { bg: "linear-gradient(135deg,#ffdeeb,#ffc2d9,#ffe4ef,#ffb6d1)", text: "#5c2a3d", accent1: "#ff6fa3", accent2: "#ff3d80", cardBg: "rgba(255,255,255,0.75)" },
  dark:   { bg: "#0d0d1a", text: "#eee", accent1: "#ff5fa2", accent2: "#7f5fff", cardBg: "rgba(20,20,35,0.65)" },
  ocean:  { bg: "linear-gradient(135deg,#d0f0ff,#a0d8ff,#c2eaff)", text: "#0a2540", accent1: "#2196f3", accent2: "#00bcd4", cardBg: "rgba(255,255,255,0.8)" },
  sunset: { bg: "linear-gradient(135deg,#ffdca8,#ff9a76,#ff6f61)", text: "#4a1e1e", accent1: "#ff7e5f", accent2: "#feb47b", cardBg: "rgba(255,255,255,0.78)" }
};

function applyTheme(themeName) {
  const t = THEMES[themeName] || THEMES.pink;
  document.body.style.background = t.bg;
  document.body.style.color = t.text;
  document.documentElement.style.setProperty("--accent1", t.accent1);
  document.documentElement.style.setProperty("--accent2", t.accent2);
  document.documentElement.style.setProperty("--card-bg", t.cardBg);
  document.documentElement.style.setProperty("--text-color", t.text);
}

function applyAnimation(anim) {
  const particles = document.getElementById("particles");
  particles.innerHTML = "";
  if (anim === "none") return;
  const count = window.innerWidth < 500 ? 25 : 45;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = anim === "hearts" ? "particle heart" : anim === "stars" ? "particle star" : "particle bubble";
    el.style.left = Math.random() * 100 + "%";
    el.style.animationDelay = (Math.random() * 5) + "s";
    el.style.animationDuration = (4 + Math.random() * 6) + "s";
    if (anim === "hearts") el.textContent = "💗";
    particles.appendChild(el);
  }
}

async function renderProfile() {
  try {
    const ref = doc(db, "profiles", PROFILE_SLUG);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      document.getElementById("userName").textContent = "Profile not found";
      console.warn("No document at profiles/" + PROFILE_SLUG);
      return;
    }

    const d = snap.data();
    console.log("Profile data loaded:", d);

    document.getElementById("pageTitle").textContent = d.name || "Profile";
    document.getElementById("userName").textContent = d.name || "";
    document.getElementById("footerName").textContent = d.name || "";
    document.getElementById("statusText").textContent = d.statusText || "";
    document.getElementById("profilePhoto").src = d.photo || "https://via.placeholder.com/160";
    document.getElementById("dailyQuote").textContent = d.quote || "";
    document.getElementById("snapLink").href = d.snap || "#";
    document.getElementById("discordLink").href = d.discord || "#";
    document.getElementById("instaLink").href = d.insta || "#";

    const dot = document.getElementById("statusDot");
    dot.className = "status-dot";
    if (d.onlineStatus === "away") dot.classList.add("away");
    if (d.onlineStatus === "offline") dot.classList.add("offline");

    applyTheme(d.theme || "pink");
    applyAnimation(d.animation || "blobs");
    setupWhatsApp(d, ref);
  } catch (error) {
    console.error("Error loading profile:", error.message);
    document.getElementById("userName").textContent = "Error loading profile";
  }
}

function setupWhatsApp(data, ref) {
  const waBtn = document.getElementById("waBtn");
  const waForm = document.getElementById("waRequestForm");
  const waGmail = document.getElementById("waGmail");
  const waSubmit = document.getElementById("waSubmit");
  const waMsg = document.getElementById("waMsg");

  const savedEmail = localStorage.getItem("myWaEmail_" + PROFILE_SLUG);
  const unlocked = (data.waUnlocked || []).includes((savedEmail || "").toLowerCase());

  if (unlocked) {
    waBtn.innerHTML = '<span>✅ Chat on WhatsApp</span>';
    waBtn.classList.remove("locked");
    waBtn.classList.add("whatsapp");
    waBtn.onclick = () => window.open(`https://wa.me/${data.waNumber}`, "_blank");
    return;
  }

  waBtn.onclick = () => waForm.classList.toggle("hidden");

  waSubmit.onclick = async () => {
    const email = waGmail.value.trim().toLowerCase();
    if (!email || !email.includes("@gmail.com")) {
      waMsg.textContent = "Please enter a valid Gmail address.";
      waMsg.style.color = "#e74c3c";
      return;
    }
    try {
      await updateDoc(ref, {
        waRequests: arrayUnion({ email, time: new Date().toLocaleString() })
      });
      localStorage.setItem("myWaEmail_" + PROFILE_SLUG, email);
      waMsg.textContent = "Request sent! Approval coming soon 💌";
      waMsg.style.color = "#25D366";
    } catch (error) {
      console.error("Request error:", error.message);
      waMsg.textContent = "Error sending request: " + error.message;
      waMsg.style.color = "#e74c3c";
    }
  };
}

document.addEventListener("DOMContentLoaded", renderProfile);
