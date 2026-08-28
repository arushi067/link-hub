import { db } from "./firebase-config.js";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const PROFILE_SLUG = "arushi";
const profileRef = doc(db, "profiles", PROFILE_SLUG);
const memoriesCol = collection(db, "memories");

/* ============ TAB SWITCHING ============ */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

function flashStatus(msg) {
  const el = document.getElementById("saveStatus");
  el.textContent = msg;
  setTimeout(() => { el.textContent = ""; }, 2500);
}

/* ============ LOAD EXISTING DATA ============ */
async function loadProfile() {
  const snap = await getDoc(profileRef);
  const d = snap.exists() ? snap.data() : {};

  document.getElementById("fName").value = d.name || "";
  document.getElementById("fPhoto").value = d.photo || "";
  document.getElementById("fStatusText").value = d.statusText || "";
  document.getElementById("fStatusEmoji").value = d.statusEmoji || "";
  document.getElementById("fOnlineStatus").value = d.onlineStatus || "online";
  document.getElementById("fQuote").value = d.quote || "";
  document.getElementById("fPronouns").value = d.pronouns || "";
  document.getElementById("fLocation").value = d.location || "";
  document.getElementById("fBirthday").value = d.birthday || "";
  document.getElementById("fMood").value = d.mood || "";

  document.getElementById("fTheme").value = d.theme || "pink";
  document.getElementById("fFont").value = d.font || "poppins";
  document.getElementById("fAccent").value = d.accentColor || "#ff5fa2";
  document.getElementById("fSecond").value = d.sec
