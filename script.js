import { db } from "./firebase-config.js";

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PROFILE_SLUG = "arushi";

const $ = (id) => document.getElementById(id);

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeUrl(value) {
  const url = safeText(value);

  if (!url) return "";

  try {
    const parsed = new URL(url, window.location.href);

    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.href;
    }

    return "";
  } catch {
    return "";
  }
}

function isHexColor(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(safeText(value));
}

function setVisible(id, visible) {
  const element = $(id);

  if (!element) return;

  element.style.display = visible ? "" : "none";
}

function showPage() {
  $("app").classList.remove("is-loading");
  $("app").classList.add("is-ready");

  $("loadingScreen").classList.add("hide");
}

function showError() {
  $("loadingScreen").textContent = "Could not load profile.";

  setTimeout(() => {
    showPage();
  }, 500);
}

function setImage(image, url) {
  if (!url) {
    image.removeAttribute("src");
    image.classList.remove("visible");
    return;
  }

  image.src = url;
  image.classList.add("visible");

  image.onerror = () => {
    image.removeAttribute("src");
    image.classList.remove("visible");
  };
}

function applyPublicDesign(data) {
  const accent = isHexColor(data.accentColor)
    ? data.accentColor
    : "#b85a7d";

  const pageColor = isHexColor(data.pageColor)
    ? data.pageColor
    : "#f5f3ee";

  document.body.style.background = pageColor;

  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--pink", accent);

  const banner = $("profileBanner");
  const bannerUrl = safeUrl(data.banner);

  if (bannerUrl) {
    const escapedUrl = bannerUrl.replace(/"/g, "%22");

    banner.style.backgroundImage =
      `linear-gradient(rgba(0,0,0,.10), rgba(0,0,0,.16)), url("${escapedUrl}")`;
  }

  const bannerHeightMap = {
    compact: "155px",
    normal: "205px",
    large: "270px"
  };

  banner.style.height =
    bannerHeightMap[data.bannerHeight] || "205px";

  const photoShapeMap = {
    circle: "50%",
    rounded: "18px",
    square: "0"
  };

  const shape = photoShapeMap[data.photoShape] || "50%";

  $("profilePhoto").style.borderRadius = shape;
  document.querySelector(".ring-wrap").style.borderRadius = shape;

  const card = $("mainCard");

  card.style.background = "";
  card.style.borderColor = "";
  card.style.boxShadow = "";

  if (data.cardStyle === "soft") {
    card.style.background = "#fff6f8";
  }

  if (data.cardStyle === "minimal") {
    card.style.borderColor = "transparent";
    card.style.boxShadow = "none";
  }

  setVisible("quoteBox", data.showQuote !== false);
  setVisible("socialSection", data.showSocials !== false);
  setVisible("whatsappSection", data.showWhatsApp !== false);
  setVisible("memorySection", data.showMemories !== false);
}

function setupWhatsApp(data, profileRef) {
  const waButton = $("waBtn");
  const waForm = $("waRequestForm");
  const emailInput = $("waGmail");
  const submitButton = $("waSubmit");
  const message = $("waMsg");

  const savedEmail = (
    localStorage.getItem(`myWaEmail_${PROFILE_SLUG}`) || ""
  ).toLowerCase();

  const unlockedEmails = Array.isArray(data.waUnlocked)
    ? data.waUnlocked
    : [];

  const isUnlocked = unlockedEmails.includes(savedEmail);

  const phoneNumber = safeText(data.waNumber).replace(/\D/g, "");

  if (isUnlocked && phoneNumber) {
    waButton.classList.remove("locked");
    waButton.classList.add("whatsapp");

    waButton.lastElementChild.textContent = "Chat on WhatsApp";

    waButton.onclick = () => {
      window.open(
        `https://wa.me/${phoneNumber}`,
        "_blank",
        "noopener"
      );
    };

    return;
  }

  waButton.classList.add("locked");
  waButton.classList.remove("whatsapp");
  waButton.lastElementChild.textContent = "WhatsApp Locked";

  waButton.onclick = () => {
    waForm.classList.toggle("hidden");
  };

  submitButton.onclick = async () => {
    const email = emailInput.value.trim().toLowerCase();

    if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
      message.textContent = "Enter a valid Gmail address.";
      message.style.color = "#d94658";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
      await updateDoc(profileRef, {
        waRequests: arrayUnion({
          email,
          time: new Date().toLocaleString()
        })
      });

      localStorage.setItem(`myWaEmail_${PROFILE_SLUG}`, email);

      message.textContent = "Request sent. Please wait for approval.";
      message.style.color = "#24945f";
    } catch (error) {
      console.error("WhatsApp request error:", error);

      message.textContent = "Could not send request.";
      message.style.color = "#d94658";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send Request";
    }
  };
}

async function renderProfile() {
  try {
    const profileRef = doc(db, "profiles", PROFILE_SLUG);

    const snapshot = await getDoc(profileRef);

    if (!snapshot.exists()) {
      throw new Error(`Profile not found: profiles/${PROFILE_SLUG}`);
    }

    const data = snapshot.data();

    const name = safeText(data.name);
    const status = safeText(data.statusText);
    const quote = safeText(data.quote);

    document.title = name || "Profile";
    $("pageTitle").textContent = name || "Profile";

    $("userName").textContent = name;
    $("statusText").textContent = status;

    $("aboutTitle").textContent = safeText(data.aboutTitle);
    $("aboutText").textContent = safeText(data.aboutText);

    $("memoryTitle").textContent = safeText(data.memoryTitle);
    $("memorySubtitle").textContent = safeText(data.memorySubtitle);

    $("dailyQuote").textContent = quote;

    $("footerName").textContent =
      safeText(data.footerText) || name;

    setImage(
      $("profilePhoto"),
      safeUrl(data.photo)
    );

    const statusDot = $("statusDot");

    statusDot.className = "status-dot";

    if (data.onlineStatus === "away") {
      statusDot.classList.add("away");
    }

    if (data.onlineStatus === "offline") {
      statusDot.classList.add("offline");
    }

    statusDot.classList.add("visible");

    $("snapLink").href = safeUrl(data.snap) || "#";
    $("discordLink").href = safeUrl(data.discord) || "#";
    $("instaLink").href = safeUrl(data.insta) || "#";

    applyPublicDesign(data);
    setupWhatsApp(data, profileRef);

    showPage();
  } catch (error) {
    console.error("Error loading profile:", error);

    $("userName").textContent = "Profile unavailable";
    $("aboutTitle").textContent = "";
    $("aboutText").textContent = "";

    showError();
  }
}

document.addEventListener("DOMContentLoaded", renderProfile);
