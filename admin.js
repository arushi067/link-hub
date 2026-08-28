import { db } from "./firebase-config.js";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const PROFILE_SLUG = "arushi";
const profileRef = doc(db, "profiles", PROFILE_SLUG);
const memoriesCol = collection(db, "memories");

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
  document.getElementById("fSecond").value = d.secondColor || "#7f5fff";
  document.getElementById("fAnimation").value = d.animation || "aurora";
  document.getElementById("fBgVideo").value = d.bgVideo || "";
  document.getElementById("fParticles").value = String(d.particles !== false);
  document.getElementById("fCardOpacity").value = d.cardOpacity ?? 100;

  document.getElementById("fSnap").value = d.snap || "";
  document.getElementById("fDiscord").value = d.discord || "";
  document.getElementById("fInsta").value = d.insta || "";
  document.getElementById("fWaNumber").value = d.waNumber || "";
  document.getElementById("fCustom1Label").value = d.customLink1Label || "";
  document.getElementById("fCustom1Url").value = d.customLink1Url || "";
  document.getElementById("fCustom2Label").value = d.customLink2Label || "";
  document.getElementById("fCustom2Url").value = d.customLink2Url || "";
  document.getElementById("fClickSound").value = d.clickSound || "";
  document.getElementById("fXboxGamertag").value = d.xboxGamertag || "";

  renderRequests(d.waRequests || [], d.waUnlocked || []);
}
loadProfile();

document.getElementById("saveProfile").addEventListener("click", async () => {
  await setDoc(profileRef, {
    name: document.getElementById("fName").value,
    photo: document.getElementById("fPhoto").value,
    statusText: document.getElementById("fStatusText").value,
    statusEmoji: document.getElementById("fStatusEmoji").value,
    onlineStatus: document.getElementById("fOnlineStatus").value,
    quote: document.getElementById("fQuote").value,
    pronouns: document.getElementById("fPronouns").value,
    location: document.getElementById("fLocation").value,
    birthday: document.getElementById("fBirthday").value,
    mood: document.getElementById("fMood").value
  }, { merge: true });
  flashStatus("✅ Profile saved!");
});

document.getElementById("saveTheme").addEventListener("click", async () => {
  await setDoc(profileRef, {
    theme: document.getElementById("fTheme").value,
    font: document.getElementById("fFont").value,
    accentColor: document.getElementById("fAccent").value,
    secondColor: document.getElementById("fSecond").value,
    animation: document.getElementById("fAnimation").value,
    bgVideo: document.getElementById("fBgVideo").value,
    particles: document.getElementById("fParticles").value === "true",
    cardOpacity: Number(document.getElementById("fCardOpacity").value)
  }, { merge: true });
  flashStatus("✅ Theme saved! Refresh your live site to see changes.");
});

document.getElementById("saveLinks").addEventListener("click", async () => {
  await setDoc(profileRef, {
    snap: document.getElementById("fSnap").value,
    discord: document.getElementById("fDiscord").value,
    insta: document.getElementById("fInsta").value,
    waNumber: document.getElementById("fWaNumber").value,
    customLink1Label: document.getElementById("fCustom1Label").value,
    customLink1Url: document.getElementById("fCustom1Url").value,
    customLink2Label: document.getElementById("fCustom2Label").value,
    customLink2Url: document.getElementById("fCustom2Url").value,
    clickSound: document.getElementById("fClickSound").value,
    xboxGamertag: document.getElementById("fXboxGamertag").value
  }, { merge: true });
  flashStatus("✅ Links saved!");
});

document.getElementById("addMemory").addEventListener("click", async () => {
  const imageUrl = document.getElementById("memImage").value.trim();
  const caption = document.getElementById("memCaption").value.trim();
  if (!imageUrl) { flashStatus("⚠️ Add an image URL first"); return; }
  await addDoc(memoriesCol, { imageUrl, caption, createdAt: new Date().toISOString() });
  document.getElementById("memImage").value = "";
  document.getElementById("memCaption").value = "";
  flashStatus("✅ Memory added!");
});

onSnapshot(memoriesCol, (snapshot) => {
  const list = document.getElementById("memoryList");
  list.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const m = docSnap.data();
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML =
      '<img src="' + m.imageUrl + '" alt="">' +
      '<div class="memory-info"><strong>' + (m.caption || "Untitled") + '</strong><span>' + docSnap.id + '</span></div>' +
      '<button class="btn-danger" data-id="' + docSnap.id + '">Delete</button>';
    item.querySelector(".btn-danger").addEventListener("click", async () => {
      await deleteDoc(doc(db, "memories", docSnap.id));
    });
    list.appendChild(item);
  });
});

function renderRequests(requests, unlocked) {
  const list = document.getElementById("requestList");
  list.innerHTML = "";
  if (requests.length === 0) {
    list.innerHTML = '<p style="color:#8f8fbd;">No requests yet.</p>';
    return;
  }
  requests.forEach((r) => {
    const isApproved = unlocked.includes(r.email);
    const item = document.createElement("div");
    item.className = "request-item";
    const approveHtml = isApproved
      ? '<span style="color:#27ae60;font-size:12px;">✅ Approved</span>'
      : '<button class="btn-approve" data-email="' + r.email + '">Approve</button>';
    item.innerHTML =
      '<div class="request-info"><strong>' + r.email + '</strong><span>' + new Date(r.requestedAt).toLocaleString() + '</span></div>' +
      '<div class="btn-row">' + approveHtml + '</div>';
    if (!isApproved) {
      item.querySelector(".btn-approve").addEventListener("click", async () => {
        const snap = await getDoc(profileRef);
        const data = snap.exists() ? snap.data() : {};
        const newUnlocked = [...(data.waUnlocked || []), r.email];
        await updateDoc(profileRef, { waUnlocked: newUnlocked });
        flashStatus("✅ Approved " + r.email);
        loadProfile();
      });
    }
    list.appendChild(item);
  });
}
