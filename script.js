import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PROFILE_SLUG = "arushi";
const $ = (id) => document.getElementById(id);

const THEMES = {
  pink: { bg: "#f5f3ee", text: "#252124", accent: "#d94b83" },
  dark: { bg: "#19171b", text: "#f7f2f4", accent: "#ff72a8" },
  ocean: { bg: "#edf6f7", text: "#18363a", accent: "#318ea0" },
  sunset: { bg: "#fff2e8", text: "#43251f", accent: "#e86f4e" }
};

function setVisible(id, visible) {
  const element = $(id);
  if (element) element.style.display = visible ? "" : "none";
}
function safeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch { return ""; }
}
function applyDesign(data) {
  const theme = THEMES[data.theme] || THEMES.pink;
  const accent = /^#[0-9a-fA-F]{6}$/.test(data.accentColor || "") ? data.accentColor : theme.accent;
  const page = /^#[0-9a-fA-F]{6}$/.test(data.pageColor || "") ? data.pageColor : theme.bg;
  document.body.style.background = page;
  document.body.style.color = theme.text;
  document.documentElement.style.setProperty("--pink", accent);
  document.documentElement.style.setProperty("--pink-dark", accent);
  const banner = $("profileBanner");
  const bannerUrl = safeUrl(data.banner || "");
  if (bannerUrl) banner.style.backgroundImage = `linear-gradient(rgba(0,0,0,.10),rgba(0,0,0,.16)), url("${bannerUrl.replaceAll('"', '%22')}")`;
  const heights = { compact: "155px", normal: "205px", large: "270px" };
  if (banner) banner.style.height = heights[data.bannerHeight] || heights.normal;
  const photo = $("profilePhoto"), ring = document.querySelector(".ring-wrap");
  const radius = data.photoShape === "square" ? "0" : data.photoShape === "rounded" ? "18px" : "50%";
  if (photo) photo.style.borderRadius = radius;
  if (ring) ring.style.borderRadius = radius;
  if (data.cardStyle === "soft") $("mainCard").style.background = "#fff5f8";
  else if (data.cardStyle === "minimal") { $("mainCard").style.boxShadow = "none"; $("mainCard").style.borderColor = "transparent"; }
  setVisible("quoteBox", data.showQuote !== false);
  setVisible("socialSection", data.showSocials !== false);
  setVisible("whatsappSection", data.showWhatsApp !== false);
  setVisible("memorySection", data.showMemories !== false);
  if ($("aboutTitle") && data.aboutTitle) $("aboutTitle").textContent = data.aboutTitle;
  if ($("aboutText") && data.aboutText) $("aboutText").textContent = data.aboutText;
  if ($("memoryTitle") && data.memoryTitle) $("memoryTitle").textContent = data.memoryTitle;
  if ($("memorySubtitle") && data.memorySubtitle) $("memorySubtitle").textContent = data.memorySubtitle;
  if ($("footerName")) $("footerName").textContent = data.footerText || data.name || "Arushi Patel";
}
function setupWhatsApp(data, profileRef) {
  const button = $("waBtn"), form = $("waRequestForm"), emailInput = $("waGmail"), submit = $("waSubmit"), message = $("waMsg");
  if (!button || !form || !emailInput || !submit || !message) return;
  const saved = (localStorage.getItem("myWaEmail_" + PROFILE_SLUG) || "").toLowerCase();
  const unlocked = (data.waUnlocked || []).includes(saved);
  if (unlocked && data.waNumber) {
    button.classList.remove("locked"); button.classList.add("whatsapp"); button.lastElementChild.textContent = "Chat on WhatsApp";
    button.onclick = () => window.open(`https://wa.me/${String(data.waNumber).replace(/\D/g, "")}`, "_blank", "noopener");
    return;
  }
  button.classList.add("locked"); button.classList.remove("whatsapp"); button.lastElementChild.textContent = "WhatsApp Locked";
  button.onclick = () => form.classList.toggle("hidden");
  submit.onclick = async () => {
    const email = emailInput.value.trim().toLowerCase();
    if (!/^[^\s@]+@gmail\.com$/i.test(email)) { message.textContent = "Enter a valid Gmail address."; message.style.color = "#d94658"; return; }
    try {
      await updateDoc(profileRef, { waRequests: arrayUnion({ email, time: new Date().toLocaleString() }) });
      localStorage.setItem("myWaEmail_" + PROFILE_SLUG, email);
      message.textContent = "Request sent. Please wait for approval."; message.style.color = "#24945f";
    } catch (error) { console.error(error); message.textContent = "Could not send request."; message.style.color = "#d94658"; }
  };
}
async function renderProfile() {
  try {
    const profileRef = doc(db, "profiles", PROFILE_SLUG);
    const snap = await getDoc(profileRef);
    if (!snap.exists()) throw new Error("Profile document not found.");
    const data = snap.data();
    document.title = data.name || "Profile";
    $("pageTitle").textContent = data.name || "Profile";
    $("userName").textContent = data.name || "";
    $("statusText").textContent = data.statusText || "";
    $("dailyQuote").textContent = data.quote || "";
    $("profilePhoto").src = safeUrl(data.photo) || "https://via.placeholder.com/160";
    $("snapLink").href = safeUrl(data.snap) || "#";
    $("discordLink").href = safeUrl(data.discord) || "#";
    $("instaLink").href = safeUrl(data.insta) || "#";
    const dot = $("statusDot"); dot.className = "status-dot"; if (data.onlineStatus === "away") dot.classList.add("away"); if (data.onlineStatus === "offline") dot.classList.add("offline");
    applyDesign(data); setupWhatsApp(data, profileRef);
  } catch (error) {
    console.error("Error loading profile:", error);
    $("userName").textContent = "Error loading profile";
  }
}
document.addEventListener("DOMContentLoaded", renderProfile);
