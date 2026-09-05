import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PROFILE_SLUG = "arushi";
const ref = doc(db, "profiles", PROFILE_SLUG);
const $ = (id) => document.getElementById(id);
const value = (id) => $(id).value.trim();

function message(text, success = false) {
  $("loginMsg").textContent = text;
  $("loginMsg").className = success ? "msg success" : "msg";
}
function status(text, error = false) {
  const box = $("statusBox");
  if (!box) return;
  box.textContent = text;
  box.style.color = error ? "#d94156" : "";
}
function preview(inputId, imageId) {
  const url = value(inputId);
  const image = $(imageId);
  if (!url) { image.removeAttribute("src"); image.classList.add("hidden"); return; }
  image.src = url;
  image.classList.remove("hidden");
}
async function save(data, text) {
  try { await setDoc(ref, data, { merge: true }); alert(text); return true; }
  catch (error) { console.error(error); alert("Could not save: " + error.message); return false; }
}
function clear(element) { element.replaceChildren(); }
function empty(element, text) { const p = document.createElement("p"); p.className = "empty-note"; p.textContent = text; element.appendChild(p); }

function renderMemories(memories = []) {
  const list = $("memoriesList"); clear(list);
  if (!memories.length) return empty(list, "No memories added yet.");
  memories.forEach((memory, index) => {
    const row = document.createElement("div"); row.className = "unlocked-item";
    const main = document.createElement("div"); main.className = "item-main";
    const img = document.createElement("img"); img.className = "item-photo"; img.src = memory.url || ""; img.alt = memory.caption || "Memory";
    const caption = document.createElement("span"); caption.textContent = memory.caption || `Memory ${index + 1}`;
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "revoke-btn"; remove.textContent = "Delete";
    remove.onclick = async () => {
      if (!confirm("Delete this memory?")) return;
      const snap = await getDoc(ref); const data = snap.exists() ? snap.data() : {};
      const updated = (data.memories || []).filter((_, i) => i !== index);
      await save({ memories: updated }, "Memory deleted.");
      renderMemories(updated);
    };
    main.append(img, caption); row.append(main, remove); list.appendChild(row);
  });
}

function renderRequests(data) {
  const requests = $("requestsList"), unlocked = $("unlockedList"); clear(requests); clear(unlocked);
  const allRequests = Array.isArray(data.waRequests) ? data.waRequests : [];
  const allUnlocked = Array.isArray(data.waUnlocked) ? data.waUnlocked : [];
  const pending = allRequests.filter(r => r?.email && !allUnlocked.includes(r.email));
  if (!pending.length) empty(requests, "No pending requests.");
  pending.forEach(request => {
    const row = document.createElement("div"); row.className = "request-item";
    const details = document.createElement("span"); details.innerHTML = "";
    const email = document.createElement("strong"); email.textContent = request.email;
    const time = document.createElement("small"); time.textContent = request.time || "";
    details.append(email, document.createElement("br"), time);
    const actions = document.createElement("span");
    const approve = document.createElement("button"); approve.type = "button"; approve.className = "approve-btn"; approve.textContent = "Approve";
    approve.onclick = async () => { await save({ waUnlocked: [...new Set([...allUnlocked, request.email])] }, "User approved."); loadProfile(); };
    const deny = document.createElement("button"); deny.type = "button"; deny.className = "deny-btn"; deny.textContent = "Deny";
    deny.onclick = async () => { await save({ waRequests: allRequests.filter(r => r.email !== request.email) }, "Request denied."); loadProfile(); };
    actions.append(approve, deny); row.append(details, actions); requests.appendChild(row);
  });
  if (!allUnlocked.length) empty(unlocked, "No unlocked users yet.");
  allUnlocked.forEach(email => {
    const row = document.createElement("div"); row.className = "unlocked-item";
    const label = document.createElement("span"); label.textContent = email;
    const revoke = document.createElement("button"); revoke.type = "button"; revoke.className = "revoke-btn-wa"; revoke.textContent = "Revoke";
    revoke.onclick = async () => { await save({ waUnlocked: allUnlocked.filter(item => item !== email) }, "Access revoked."); loadProfile(); };
    row.append(label, revoke); unlocked.appendChild(row);
  });
}

async function loadProfile() {
  try {
    const snap = await getDoc(ref); const data = snap.exists() ? snap.data() : {};
    $("fName").value = data.name || ""; $("fStatus").value = data.statusText || ""; $("fOnline").value = data.onlineStatus || "online"; $("fPhotoUrl").value = data.photo || "";
    $("fQuote").value = data.quote || ""; $("fTheme").value = data.theme || "pink"; $("fAnimation").value = data.animation || "none";
    $("fSnap").value = data.snap || ""; $("fDiscord").value = data.discord || ""; $("fInsta").value = data.insta || ""; $("fWaNumber").value = data.waNumber || "";
    $("fBannerUrl").value = data.banner || ""; $("fBannerHeight").value = data.bannerHeight || "normal"; $("fPhotoShape").value = data.photoShape || "circle";
    $("fCardStyle").value = data.cardStyle || "classic"; $("fAccentColor").value = data.accentColor || "#d94b83"; $("fPageColor").value = data.pageColor || "#f5f3ee";
    $("fFooterText").value = data.footerText || data.name || ""; $("fAboutTitle").value = data.aboutTitle || ""; $("fAboutText").value = data.aboutText || "";
    $("fMemoryTitle").value = data.memoryTitle || ""; $("fMemorySubtitle").value = data.memorySubtitle || "";
    $("fShowQuote").checked = data.showQuote !== false; $("fShowSocials").checked = data.showSocials !== false; $("fShowWhatsApp").checked = data.showWhatsApp !== false; $("fShowMemories").checked = data.showMemories !== false;
    if (data.photo) preview("fPhotoUrl", "fPhotoPreview");
    if (data.banner) preview("fBannerUrl", "fBannerPreview");
    renderMemories(data.memories || []); renderRequests(data); status("Firebase connected. Profile loaded.");
  } catch (error) { console.error(error); status("Could not load profile: " + error.message, true); }
}

$("loginBtn").onclick = async () => {
  const email = value("loginEmail"), password = $("loginPass").value;
  if (!email || !password) return message("Enter both email and password.");
  $("loginBtn").disabled = true; $("loginBtn").textContent = "Logging in..."; message("");
  try { await signInWithEmailAndPassword(auth, email, password); message("Login successful.", true); }
  catch (error) {
    console.error(error); const code = error.code || "";
    message(code === "auth/invalid-credential" ? "Wrong email or password." : code === "auth/too-many-requests" ? "Too many attempts. Try again later." : error.message);
  } finally { $("loginBtn").disabled = false; $("loginBtn").textContent = "Log in securely"; }
};
$("loginPass").addEventListener("keydown", e => { if (e.key === "Enter") $("loginBtn").click(); });
$("logoutBtn").onclick = () => signOut(auth);
onAuthStateChanged(auth, user => { if (user) { $("loginScreen").classList.add("hidden"); $("dashboard").classList.remove("hidden"); loadProfile(); } else { $("loginScreen").classList.remove("hidden"); $("dashboard").classList.add("hidden"); status("Firebase connected. Please log in."); } });

document.querySelectorAll(".tab-btn").forEach(button => button.onclick = () => { document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active")); document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden")); button.classList.add("active"); $("tab-" + button.dataset.tab).classList.remove("hidden"); });
$("fPhotoUrl").oninput = () => preview("fPhotoUrl", "fPhotoPreview");
$("fBannerUrl").oninput = () => preview("fBannerUrl", "fBannerPreview");
$("fMemUrl").oninput = () => preview("fMemUrl", "fMemPreview");

$("saveProfileBtn").onclick = () => save({ name: value("fName") || "Arushi Patel", statusText: value("fStatus"), onlineStatus: $("fOnline").value, photo: value("fPhotoUrl") }, "Profile saved.");
$("saveQuoteBtn").onclick = () => save({ quote: value("fQuote") }, "Quote saved.");
$("saveThemeBtn").onclick = () => save({ theme: $("fTheme").value, animation: $("fAnimation").value }, "Theme saved.");
$("saveLinksBtn").onclick = () => save({ snap: value("fSnap"), discord: value("fDiscord"), insta: value("fInsta"), waNumber: value("fWaNumber") }, "Links saved.");
$("saveDesignBtn").onclick = () => save({ banner: value("fBannerUrl"), bannerHeight: $("fBannerHeight").value, photoShape: $("fPhotoShape").value, cardStyle: $("fCardStyle").value, accentColor: value("fAccentColor") || "#d94b83", pageColor: value("fPageColor") || "#f5f3ee", footerText: value("fFooterText"), aboutTitle: value("fAboutTitle"), aboutText: value("fAboutText"), memoryTitle: value("fMemoryTitle"), memorySubtitle: value("fMemorySubtitle"), showQuote: $("fShowQuote").checked, showSocials: $("fShowSocials").checked, showWhatsApp: $("fShowWhatsApp").checked, showMemories: $("fShowMemories").checked }, "Public design saved.");
$("addMemoryBtn").onclick = async () => {
  const url = value("fMemUrl"), caption = value("fMemCaption");
  if (!url) return alert("Paste a direct image or GIF URL first.");
  try { await setDoc(ref, { memories: arrayUnion({ url, caption }) }, { merge: true }); $("fMemUrl").value = ""; $("fMemCaption").value = ""; $("fMemPreview").classList.add("hidden"); await loadProfile(); alert("Memory added."); }
  catch (error) { console.error(error); alert("Could not add memory: " + error.message); }
};
