// admin.js — single profile admin (slug: "arushi") — no Firebase Storage needed
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const PROFILE_SLUG = "arushi";
const profileRef = doc(db, "profiles", PROFILE_SLUG);

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

  renderRequests(d);
  renderMemories(d);
}

document.getElementById("fPhotoUrl").addEventListener("input", (e) => {
  const url = e.target.value.trim();
  const preview = document.getElementById("fPhotoPreview");
  if (url) {
    preview.src = url;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }
});

document.getElementById("fMemUrl").addEventListener("input", (e) => {
  const url = e.target.value.trim();
  const preview = document.getElementById("fMemPreview");
  if (url) {
    preview.src = url;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }
});

document.getElementById("saveProfileBtn").onclick = async () => {
  await setDoc(profileRef, {
    name: document.getElementById("fName").value || "Unnamed",
    statusText: document.getElementById("fStatus").value || "",
    onlineStatus: document.getElementById("fOnline").value,
    photo: document.getElementById("fPhotoUrl").value || ""
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
    animation: document.getElementById("fAnimation").value
  }, { merge: true });
  alert("Theme saved ✅");
};

document.getElementById("saveLinksBtn").onclick = async () => {
  await setDoc(profileRef, {
    snap: document.getElementById("fSnap").value || "",
    discord: document.getElementById("fDiscord").value || "",
    insta: document.getElementById("fInsta").value || "",
    waNumber: document.getElementById("fWaNumber").value || ""
  }, { merge: true });
  alert("Links saved ✅");
};

// ===== MEMORIES =====
function renderMemories(d) {
  const list = document.getElementById("memoriesList");
  const memories = d.memories || [];
  list.innerHTML = memories.length === 0
    ? '<p class="empty-note">No memories yet.</p>'
    : memories.map((m, i) => `
        <div class="unlocked-item">
          <img src="${m.url}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;margin-right:8px;vertical-align:middle;">
          <span>${m.caption || "Untitled"}</span>
          <button data-index="${i}" class="deny revoke-btn">Delete</button>
        </div>`).join("");

  list.querySelectorAll(".revoke-btn").forEach(btn => {
    btn.onclick = async () => {
      const fresh = await getDoc(profileRef);
      const fd = fresh.data();
      const updated = (fd.memories || []).filter((_, idx) => idx !== Number(btn.dataset.index));
      await updateDoc(profileRef, { memories: updated });
      renderMemories({ memories: updated });
    };
  });
}

document.getElementById("addMemoryBtn").onclick = async () => {
  const url = document.getElementById("fMemUrl").value.trim();
  const caption = document.getElementById("fMemCaption").value.trim();
  if (!url) { alert("Please paste an image URL"); return; }

  await updateDoc(profileRef, { memories: arrayUnion({ url, caption }) });

  document.getElementById("fMemUrl").value = "";
  document.getElementById("fMemCaption").value = "";
  document.getElementById("fMemPreview").classList.add("hidden");

  const fresh = await getDoc(profileRef);
  renderMemories(fresh.data());
  alert("Memory added ✅");
};

// ===== WHATSAPP REQUESTS =====
function renderRequests(d) {
  const reqContainer = document.getElementById("requestsList");
  const unlockedContainer = document.getElementById("unlockedList");
  const waRequests = d.waRequests || [];
  const waUnlocked = d.waUnlocked || [];
  const pending = waRequests.filter(r => !waUnlocked.includes(r.email));

  reqContainer.innerHTML = pending.length === 0
    ? '<p class="empty-note">No pending requests.</p>'
    : pending.map(r => `
        <div class="request-item">
          <span>${r.email}<br><small>${r.time}</small></span>
          <span>
            <button data-email="${r.email}" class="approve-btn">Approve</button>
            <button data-email="${r.email}" class="deny deny-btn">Deny</button>
          </span>
        </div>`).join("");

  reqContainer.querySelectorAll(".approve-btn").forEach(btn => {
    btn.onclick = async () => {
      const email = btn.dataset.email;
      const fresh = await getDoc(profileRef);
      const fd = fresh.data();
      const updatedUnlocked = [...new Set([...(fd.waUnlocked || []), email])];
      await updateDoc(profileRef, { waUnlocked: updatedUnlocked });
      loadProfile();
    };
  });

  reqContainer.querySelectorAll(".deny-btn").forEach(btn => {
    btn.onclick = async () => {
      const email = btn.dataset.email;
      const fresh = await getDoc(profileRef);
      const fd = fresh.data();
      const updatedReq = (fd.waRequests || []).filter(r => r.email !== email);
      await updateDoc(profileRef, { waRequests: updatedReq });
      loadProfile();
    };
  });

  unlockedContainer.innerHTML = waUnlocked.length === 0
    ? '<p class="empty-note">No unlocked users yet.</p>'
    : waUnlocked.map(email => `
        <div class="unlocked-item">
          <span>${email}</span>
          <button data-email="${email}" class="deny revoke-btn-wa">Revoke</button>
        </div>`).join("");

  unlockedContainer.querySelectorAll(".revoke-btn-wa").forEach(btn => {
    btn.onclick = async () => {
      const email = btn.dataset.email;
      const fresh = await getDoc(profileRef);
      const fd = fresh.data();
      const updated = (fd.waUnlocked || []).filter(e => e !== email);
      await updateDoc(profileRef, { waUnlocked: updated });
      loadProfile();
    };
  });
}
