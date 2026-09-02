import { db } from "./firebase-config.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PROFILE_SLUG = "arushi";

const board = document.getElementById("board");
const boardLoading = document.getElementById("boardLoading");
const boardEmpty = document.getElementById("boardEmpty");
const boardError = document.getElementById("boardError");

const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbCaption = document.getElementById("lbCaption");
const lbClose = document.getElementById("lbClose");
const lbPrev = document.getElementById("lbPrev");
const lbNext = document.getElementById("lbNext");

let memories = [];
let activeMemoryIndex = 0;

function showOnlyMessage(messageElement) {
  boardLoading.style.display = "none";
  boardEmpty.style.display = "none";
  boardError.style.display = "none";

  if (messageElement) {
    messageElement.style.display = "block";
  }
}

function makeMemoryCard(memory, index) {
  const card = document.createElement("article");
  card.className = `polaroid ${index % 2 === 0 ? "tilt-l" : "tilt-r"}`;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open memory: ${memory.caption || `Memory ${index + 1}`}`);

  const tape = document.createElement("div");
  tape.className = "tape";

  const image = document.createElement("img");
  image.src = memory.url;
  image.alt = memory.caption || `Memory ${index + 1}`;
  image.loading = "lazy";

  image.addEventListener("error", () => {
    image.alt = "This memory image could not be loaded";
    image.style.opacity = "0.35";
  });

  const caption = document.createElement("p");
  caption.className = "cap";
  caption.textContent = memory.caption || `Memory ${index + 1}`;

  const openCard = () => openLightbox(index);

  card.addEventListener("click", openCard);

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCard();
    }
  });

  card.append(tape, image, caption);
  return card;
}

function renderMemories() {
  board.querySelectorAll(".polaroid").forEach((card) => card.remove());

  if (!memories.length) {
    showOnlyMessage(boardEmpty);
    return;
  }

  showOnlyMessage(null);

  memories.forEach((memory, index) => {
    board.appendChild(makeMemoryCard(memory, index));
  });
}

function openLightbox(index) {
  if (!memories.length) return;

  activeMemoryIndex = index;
  const memory = memories[activeMemoryIndex];

  lbImg.src = memory.url;
  lbImg.alt = memory.caption || `Memory ${activeMemoryIndex + 1}`;
  lbCaption.textContent = memory.caption || "";

  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";

  const multipleMemories = memories.length > 1;
  lbPrev.style.display = multipleMemories ? "flex" : "none";
  lbNext.style.display = multipleMemories ? "flex" : "none";
}

function closeLightbox() {
  lightbox.classList.remove("active");
  lbImg.src = "";
  document.body.style.overflow = "";
}

function showPreviousMemory() {
  if (!memories.length) return;
  const previous = (activeMemoryIndex - 1 + memories.length) % memories.length;
  openLightbox(previous);
}

function showNextMemory() {
  if (!memories.length) return;
  const next = (activeMemoryIndex + 1) % memories.length;
  openLightbox(next);
}

async function loadMemories() {
  try {
    showOnlyMessage(boardLoading);

    const profileRef = doc(db, "profiles", PROFILE_SLUG);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      console.warn(`Profile document not found: profiles/${PROFILE_SLUG}`);
      memories = [];
      renderMemories();
      return;
    }

    const profileData = profileSnapshot.data();

    memories = Array.isArray(profileData.memories)
      ? profileData.memories.filter((memory) => memory && typeof memory.url === "string" && memory.url.trim())
      : [];

    renderMemories();
  } catch (error) {
    console.error("Error loading memories:", error);
    showOnlyMessage(boardError);
  }
}

lbClose.addEventListener("click", closeLightbox);
lbPrev.addEventListener("click", showPreviousMemory);
lbNext.addEventListener("click", showNextMemory);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("active")) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showPreviousMemory();
  if (event.key === "ArrowRight") showNextMemory();
});

loadMemories();
