import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PROFILE_SLUG = "arushi";
const profileRef = doc(db, "profiles", PROFILE_SLUG);

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");
const statusBox = document.getElementById("statusBox");

function setStatus(message, isError = false) {
  if (!statusBox) return;

  statusBox.textContent = message;
  statusBox.style.color = isError ? "#ff8793" : "rgba(255,255,255,0.65)";
}

function setLoginMessage(message = "", success = false) {
  loginMsg.textContent = message;
  loginMsg.className = success ? "msg success" : "msg";
}

function getFriendlyAuthError(error) {
  const code = error?.code || "";

  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found"
  ) {
    return "Wrong email or password.";
  }

  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }

  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  if (code === "auth/network-request-failed") {
    return "Network error. Check your internet connection, VPN, or ad blocker.";
  }

  if (code === "auth/operation-not-allowed") {
    return "Email/password login is disabled in Firebase Authentication.";
  }

  return error?.message || "Could not log in. Please try again.";
}

function currentProfileData() {
  return {
    name: document.getElementById("fName").value.trim() || "Arushi Patel",
    statusText: document.getElementById("fStatus").value.trim(),
    onlineStatus: document.getElementById("fOnline").value,
    photo: document.getElementById("fPhotoUrl").value.trim()
  };
}

async function safeSave(data, successMessage) {
  try {
    await setDoc(profileRef, data, { merge: true });
    alert(successMessage);
    return true;
  } catch (error) {
    console.error("Save error:", error);
    alert(`Could not save: ${error.message}`);
    return false;
  }
}

function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function createButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function showEmpty(container, text) {
  const empty = document.createElement("p");
  empty.className = "empty-note";
  empty.textContent = text;
  container.appendChild(empty);
}

function showPhotoPreview(inputId, previewId) {
  const url = document.getElementById(inputId).value.trim();
  const preview = document.getElementById(previewId);

  if (!url) {
    preview.removeAttribute("src");
    preview.classList.add("hidden");
    return;
  }

  preview.src = url;
  preview.classList.remove("hidden");
}

async function loadProfile() {
  try {
    setStatus("Loading profile data...");

    const snapshot = await getDoc(profileRef);
    const data = snapshot.exists() ? snapshot.data() : {};

    document.getElementById("fName").value = data.name || "";
    document.getElementById("fStatus").value = data.statusText || "";
    document.getElementById("fOnline").value = data.onlineStatus || "online";
    document.getElementById("fPhotoUrl").value = data.photo || "";
    document.getElementById("fQuote").value = data.quote || "";
    document.getElementById("fTheme").value = data.theme || "pink";
    document.getElementById("fAnimation").value = data.animation || "blobs";
    document.getElementById("fSnap").value = data.snap || "";
    document.getElementById("fDiscord").value = data.discord || "";
    document.getElementById("fInsta").value = data.insta || "";
    document.getElementById("fWaNumber").value = data.waNumber || "";

    if (data.photo) {
      showPhotoPreview("fPhotoUrl", "fPhotoPreview");
    } else {
      document.getElementById("fPhotoPreview").classList.add("hidden");
    }

    renderMemories(data.memories || []);
    renderRequests(data);

    setStatus("Firebase connected. Profile loaded successfully.");
  } catch (error) {
    console.error("Profile loading error:", error);
    setStatus(`Could not load profile: ${error.message}`, true);
  }
}

function renderMemories(memories) {
  const list = document.getElementById("memoriesList");
  clearChildren(list);

  if (!Array.isArray(memories) || memories.length === 0) {
    showEmpty(list, "No memories added yet.");
    return;
  }

  memories.forEach((memory, index) => {
    const item = document.createElement("div");
    item.className = "unlocked-item";

    const left = document.createElement("div");
    left.className = "item-main";

    const image = document.createElement("img");
    image.className = "item-photo";
    image.src = memory.url || "";
    image.alt = memory.caption || `Memory ${index + 1}`;

    image.addEventListener("error", () => {
      image.style.opacity = "0.35";
    });

    const text = document.createElement("span");
    text.textContent = memory.caption || `Memory ${index + 1}`;

    left.append(image, text);

    const deleteButton = createButton(
      "Delete",
      "revoke-btn",
      async () => {
        const confirmed = window.confirm(
          `Delete "${memory.caption || `Memory ${index + 1}`}"?`
        );

        if (!confirmed) return;

        try {
          const freshSnapshot = await getDoc(profileRef);
          const freshData = freshSnapshot.exists() ? freshSnapshot.data() : {};
          const freshMemories = Array.isArray(freshData.memories)
            ? freshData.memories
            : [];

          const updatedMemories = freshMemories.filter(
            (_, memoryIndex) => memoryIndex !== index
          );

          await setDoc(
            profileRef,
            { memories: updatedMemories },
            { merge: true }
          );

          renderMemories(updatedMemories);
        } catch (error) {
          console.error("Memory delete error:", error);
          alert(`Could not delete memory: ${error.message}`);
        }
      }
    );

    item.append(left, deleteButton);
    list.appendChild(item);
  });
}

function renderRequests(data) {
  const requestsList = document.getElementById("requestsList");
  const unlockedList = document.getElementById("unlockedList");

  const waRequests = Array.isArray(data.waRequests) ? data.waRequests : [];
  const waUnlocked = Array.isArray(data.waUnlocked) ? data.waUnlocked : [];

  const pending = waRequests.filter(
    (request) => request?.email && !waUnlocked.includes(request.email)
  );

  clearChildren(requestsList);
  clearChildren(unlockedList);

  if (pending.length === 0) {
    showEmpty(requestsList, "No pending requests.");
  } else {
    pending.forEach((request) => {
      const item = document.createElement("div");
      item.className = "request-item";

      const details = document.createElement("span");
      const email = document.createElement("strong");
      email.textContent = request.email;

      const time = document.createElement("small");
      time.textContent = request.time || "No date recorded";

      details.append(email, document.createElement("br"), time);

      const actions = document.createElement("span");

      const approveButton = createButton(
        "Approve",
        "approve-btn",
        async () => {
          try {
            const freshSnapshot = await getDoc(profileRef);
            const freshData = freshSnapshot.exists() ? freshSnapshot.data() : {};
            const unlocked = Array.isArray(freshData.waUnlocked)
              ? freshData.waUnlocked
              : [];

            const updatedUnlocked = [...new Set([...unlocked, request.email])];

            await setDoc(
              profileRef,
              { waUnlocked: updatedUnlocked },
              { merge: true }
            );

            await loadProfile();
          } catch (error) {
            alert(`Could not approve request: ${error.message}`);
          }
        }
      );

      const denyButton = createButton(
        "Deny",
        "deny-btn",
        async () => {
          try {
            const freshSnapshot = await getDoc(profileRef);
            const freshData = freshSnapshot.exists() ? freshSnapshot.data() : {};
            const requests = Array.isArray(freshData.waRequests)
              ? freshData.waRequests
              : [];

            const updatedRequests = requests.filter(
              (itemRequest) => itemRequest.email !== request.email
            );

            await setDoc(
              profileRef,
              { waRequests: updatedRequests },
              { merge: true }
            );

            await loadProfile();
          } catch (error) {
            alert(`Could not deny request: ${error.message}`);
          }
        }
      );

      actions.append(approveButton, denyButton);
      item.append(details, actions);
      requestsList.appendChild(item);
    });
  }

  if (waUnlocked.length === 0) {
    showEmpty(unlockedList, "No unlocked users yet.");
  } else {
    waUnlocked.forEach((email) => {
      const item = document.createElement("div");
      item.className = "unlocked-item";

      const text = document.createElement("span");
      text.textContent = email;

      const revokeButton = createButton(
        "Revoke",
        "revoke-btn-wa",
        async () => {
          try {
            const freshSnapshot = await getDoc(profileRef);
            const freshData = freshSnapshot.exists() ? freshSnapshot.data() : {};
            const unlocked = Array.isArray(freshData.waUnlocked)
              ? freshData.waUnlocked
              : [];

            await setDoc(
              profileRef,
              {
                waUnlocked: unlocked.filter(
                  (unlockedEmail) => unlockedEmail !== email
                )
              },
              { merge: true }
            );

            await loadProfile();
          } catch (error) {
            alert(`Could not revoke access: ${error.message}`);
          }
        }
      );

      item.append(text, revokeButton);
      unlockedList.appendChild(item);
    });
  }
}

/* Login */

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPass").value;

  if (!email || !password) {
    setLoginMessage("Enter both your email and password.");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";
  setLoginMessage("");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    setLoginMessage("Login successful.", true);
  } catch (error) {
    console.error("Login error:", error);
    setLoginMessage(getFriendlyAuthError(error));
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Log in securely";
  }
});

document.getElementById("loginPass").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loginBtn.click();
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    alert(`Could not log out: ${error.message}`);
  }
});

/* Login state */

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    await loadProfile();
  } else {
    loginScreen.classList.remove("hidden");
    dashboard.classList.add("hidden");
    setStatus("Firebase connected. Please log in.");
  }
});

/* Tabs */

document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((tabButton) => tabButton.classList.remove("active"));

    document
      .querySelectorAll(".tab-panel")
      .forEach((panel) => panel.classList.add("hidden"));

    button.classList.add("active");

    const panel = document.getElementById(`tab-${button.dataset.tab}`);

    if (panel) {
      panel.classList.remove("hidden");
    }
  });
});

/* Image previews */

document.getElementById("fPhotoUrl").addEventListener("input", () => {
  showPhotoPreview("fPhotoUrl", "fPhotoPreview");
});

document.getElementById("fMemUrl").addEventListener("input", () => {
  showPhotoPreview("fMemUrl", "fMemPreview");
});

/* Save profile */

document.getElementById("saveProfileBtn").addEventListener("click", async () => {
  await safeSave(currentProfileData(), "Profile saved successfully.");
});

document.getElementById("saveQuoteBtn").addEventListener("click", async () => {
  await safeSave(
    {
      quote: document.getElementById("fQuote").value.trim()
    },
    "Daily quote saved successfully."
  );
});

document.getElementById("saveThemeBtn").addEventListener("click", async () => {
  await safeSave(
    {
      theme: document.getElementById("fTheme").value,
      animation: document.getElementById("fAnimation").value
    },
    "Profile appearance saved successfully."
  );
});

document.getElementById("saveLinksBtn").addEventListener("click", async () => {
  await safeSave(
    {
      snap: document.getElementById("fSnap").value.trim(),
      discord: document.getElementById("fDiscord").value.trim(),
      insta: document.getElementById("fInsta").value.trim(),
      waNumber: document.getElementById("fWaNumber").value.trim()
    },
    "Social links saved successfully."
  );
});

/* Add a memory */

document.getElementById("addMemoryBtn").addEventListener("click", async () => {
  const url = document.getElementById("fMemUrl").value.trim();
  const caption = document.getElementById("fMemCaption").value.trim();

  if (!url) {
    alert("Please paste a direct image URL first.");
    return;
  }

  try {
    await setDoc(
      profileRef,
      {
        memories: arrayUnion({
          url,
          caption
        })
      },
      { merge: true }
    );

    document.getElementById("fMemUrl").value = "";
    document.getElementById("fMemCaption").value = "";
    document.getElementById("fMemPreview").removeAttribute("src");
    document.getElementById("fMemPreview").classList.add("hidden");

    await loadProfile();
    alert("Memory added successfully.");
  } catch (error) {
    console.error("Memory add error:", error);
    alert(`Could not add memory: ${error.message}`);
  }
});
