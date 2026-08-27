// admin.js — single profile admin (slug: "arushi") — no Firebase Storage needed
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const PROFILE_SLUG = "arushi";
const profileRef = doc(db, "profiles", PROFILE_SLUG);
const memoriesRef = collection(db, "memories");

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");

document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;
  const msg = document.getElementById("loginMsg");
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    msg.textContent = "Login failed: " + err.message;
    msg.style.color = "#e74c3c";
  }
};

document.getElementById("loginPass").addEventListener("keypress", (e) => {
  if (e.key === "Enter") document.getElementById("loginBtn").click();
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadProfile();
    loadMemories();
  } else {
    loginScreen.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.remove("hidden");
  };
});

async function loadProfile() {
  const snap = await getDoc(profileRef);
  const d = snap.exists() ? snap.data() : {};

  document.getElementById("fName").value = d.name || "";
  document.getElementById("fStatus").value = d.statusText || "";
  document.getElementById("fOnline").value = d.onlineStatus || "online";
  document.getElementById("fPhotoUrl").value = d.photo || "";
  if (d.photo) {
    document.getElementById("fPhotoPreview").src = d.photo;
    document.getElementById("fPhotoPreview").classList.remove("hidden");
  }
  document.getElementById("fQuote").value = d.quote || "";
  document.getElementById("fTheme").value = d.theme || "pink";
  document.getElementById("fAnimation").value = d.animation || "blobs";
  document.getElementById("fSnap").value = d.snap || "";
  document.getElementById("fDiscord").value = d.discord || "";
  document.getElementById("fInsta").value = d.insta || "";
  document.getElementById("fWaNumber").value = d.waNumber || "";

  // NEW CUSTOMIZATION FIELDS
  document.getElementById("fFont").value = d.font || "poppins";
  document.getElementById("fAccentColor").value = d.accentColor || "#ff5fa2";
  document.getElementById("fSecondColor").value = d.secondColor || "#7f5fff";
  document.getElementById("fBgVideo").value = d.bgVideo || "";
  document.getElementById("fCardOpacity").value = d.cardOpacity ?? 100;
  document.getElementById("fCardBorder").checked = d.cardBorder !== false;
  document.getElementById("fParticles").checked = d.particles !== false;
  document.getElementById("fSound").value = d.clickSound || "";
  document.getElementById("fRingStyle").value = d.ringStyle || "solid";
  document.getElementById("fStatusEmoji").value = d.statusEmoji || "🖥️👻";
  document.getElementById("fPronouns").value = d.pronouns || "";
  document.getElementById("fLocation").value = d.location || "";
  document.getElementById("fBirthday").value = d.birthday || "";
  document.getElementById("fMood").value = d.mood || "";
  document.getElementById("fCustomLink1Label").value = d.customLink1Label || "";
  document.getElementById("fCustomLink1Url").value = d.customLink1Url || "";
  document.getElementById("fCustomLink2Label").value = d.customLink2Label || "";
  document.getElementById("fCustomLink2Url").value = d.customLink2Url || "";
  document.getElementById("fXboxGamertag").value = d.xboxGamertag || "";
  document.getElementById("fVisitorCounter").checked = d.visitorCounter !== false;

  renderRequests(d);
}

document.getElementById("fPhotoUrl").addEventListener("input", (e) => {
  const url = e.target.value.trim();
  const preview = document.getElementById("fPhotoPreview");
  if (url) { preview.src = url; preview.classList.remove("hidden"); }
  else { preview.classList.add("hidden"); }
});

document.getElementById("saveProfileBtn").onclick = async () => {
  await setDoc(profileRef, {
    name: document.getElementById("fName").value || "Unnamed",
    statusText: document.getElementById("fStatus").value || "",
    onlineStatus: document.getElementById("fOnline").value,
    photo: document.getElementById("fPhotoUrl").value || "",
    pronouns: document.getElementById("fPronouns").value || "",
    location: document.getElementById("fLocation").value || "",
    birthday: document.getElementById("fBirthday").value || "",
    mood: document.getElementById("fMood").value || "",
    statusEmoji: document.getElementById("fStatusEmoji").value || ""
  }, { merge: true });
  alert("Profile saved ✅");
};

document.getElementById("saveQuoteBtn").onclick = async () => {
  await setDoc(profileRef, { quote: document.getElementById("fQuote").value || "" }, { merge: true });
  alert("Quote saved ✅");
};

document.getElementById("saveThemeBtn").onclick = async () => {
  await setDoc(profileRef, {
    theme: document.getElementById("fTheme").value,
    animation: document.getElementById("fAnimation").value,
    font: document.getElementById("fFont").value,
    accentColor: document.getElementById("fAccentColor").value,
    secondColor: document.getElementById("fSecondColor").value,
    bgVideo: document.getElementById("fBgVideo").value || "",
    cardOpacity: Number(document.getElementById("fCardOpacity").value),
    cardBorder: document.getElementById("fCardBorder").checked,
    particles: document.getElementById("fParticles").checked,
    ringStyle: document.getElementById("fRingStyle").value,
    visitorCounter: document.getElementById("fVisitorCounter").checked
  }, { merge: true });
  alert("Theme & customization saved ✅");
};

document.getElementById("saveLinksBtn").onclick = async () => {
  await setDoc(profileRef, {
    snap: document.getElementById("fSnap").value || "",
    discord: document.getElementById("fDiscord").value || "",
    insta: document.getElementById("fInsta").value || "",
    waNumber: document.getElementById("fWaNumber").value || "",
    customLink1Label: document.getElementById("fCustomLink1Label").value || "",
    customLink1Url: document.getElementById("fCustomLink1Url").value || "",
    customLink2Label: document.getElementById("fCustomLink2Label").value || "",
    customLink2Url: document.getElementById("fCustomLink2Url").value || "",
    clickSound: document.getElementById("fSound").value || "",
    xboxGamertag: document.getElementById("fXboxGamertag").value || ""
  }, { merge: true });
  alert("Links saved ✅");
};

function renderRequests(d) {
  const reqContainer = document.getElementById("requestsList");
  const unlockedContainer = document.getElementById("unlockedList");
  const waRequests = d.waRequests || [];
  const waUnlocked = d.waUnlocked || [];
  const pending = waRequests.filter(r => !waUnlocked.includes(r.email));

  reqContainer.innerHTML = pending.length === 0
    ? '<p class="empty-note">No pending requests.</p>'
    : pending.map(r => `
      <div class="req-item">
        <span>${r.email}</span>
        <button class="approve-btn" data-email="${r.email}">Approve</button>
      </div>`).join("");

  unlockedContainer.innerHTML = waUnlocked.length === 0
    ? '<p class="empty-note">No unlocked users yet.</p>'
    : waUnlocked.map(email => `
      <div class="req-item">
        <span>${email}</span>
        <button class="revoke-btn" data-email="${email}">Revoke</button>
      </div>`).join("");

  document.querySelectorAll(".approve-btn").forEach(btn => {
    btn.onclick = async () => {
      const email = btn.dataset.email;
      const newUnlocked = [...waUnlocked, email];
      await updateDoc(profileRef, { waUnlocked: newUnlocked });
      loadProfile();
    };
  });

  document.querySelectorAll(".revoke-btn").forEach(btn => {
    btn.onclick = async () => {
      const email = btn.dataset.email;
      const newUnlocked = waUnlocked.filter(e => e !== email);
      await updateDoc(profileRef, { waUnlocked: newUnlocked });
      loadProfile();
    };
  });
}

/* ===== MEMORIES MANAGER ===== */
async function loadMemories() {
  const listEl = document.getElementById("memoriesList");
  if (!listEl) return;
  listEl.innerHTML = "Loading...";

  const q = query(memoriesRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) {
    listEl.innerHTML = '<p class="empty-note">No memories added yet.</p>';
    return;
  }

  listEl.innerHTML = "";
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML = `
      <img src="${data.imageUrl}" alt="${data.caption || ''}" class="memory-thumb">
      <span class="memory-caption">${data.caption || "(no caption)"}</span>
      <button class="delete-memory-btn" data-id="${docSnap.id}">Delete</button>
    `;
    listEl.appendChild(item);
  });

  document.querySelectorAll(".delete-memory-btn").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Delete this memory?")) return;
      await deleteDoc(doc(db, "memories", btn.dataset.id));
      loadMemories();
    };
  });
}

document.getElementById("addMemoryBtn").onclick = async () => {
  const url = document.getElementById("fMemoryUrl").value.trim();
  const caption = document.getElementById("fMemoryCaption").value.trim();
  const msg = document.getElementById("memoryMsg");

  if (!url) {
    msg.textContent = "Please paste an image/GIF direct link.";
    msg.style.color = "#e74c3c";
    return;
  }

  await addDoc(memoriesRef, {
    imageUrl: url,
    caption: caption || "",
    createdAt: serverTimestamp()
  });

  document.getElementById("fMemoryUrl").value = "";
  document.getElementById("fMemoryCaption").value = "";
  msg.textContent = "Memory added ✅";
  msg.style.color = "#27ae60";
  loadMemories();
};
