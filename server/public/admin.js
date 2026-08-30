const banner = document.getElementById("banner");
const whoami = document.getElementById("whoami");
const whoamiAvatar = document.getElementById("whoamiAvatar");
const whoamiText = document.getElementById("whoamiText");
const loginForm = document.getElementById("loginForm");
const memoryForm = document.getElementById("memoryForm");
const submitBtn = document.getElementById("submitBtn");
const photosInput = document.getElementById("photos");
const photoPreview = document.getElementById("photoPreview");

const AVATARS = { Lothar: "avatars/lothar.png", Charlotte: "avatars/charlotte.png" };

function showBanner(message, type) {
  banner.textContent = message;
  banner.className = `banner ${type}`;
}

function clearBanner() {
  banner.textContent = "";
  banner.className = "banner";
}

async function api(path, options) {
  let res;
  try {
    res = await fetch(path, { credentials: "same-origin", ...options });
  } catch {
    throw new Error("Kon de server niet bereiken. Check je internetverbinding en probeer opnieuw.");
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    // non-JSON response, fall through with empty data
  }
  if (!res.ok) {
    throw new Error(data.error || `Er ging iets mis (${res.status}).`);
  }
  return data;
}

function showLoggedIn(username) {
  loginForm.hidden = true;
  memoryForm.hidden = false;
  whoami.hidden = false;
  whoamiText.textContent = `ingelogd als ${username}`;
  const avatarSrc = AVATARS[username];
  if (avatarSrc) {
    whoamiAvatar.src = avatarSrc;
    whoamiAvatar.alt = username;
    whoamiAvatar.hidden = false;
  } else {
    whoamiAvatar.hidden = true;
  }
}

function showLoggedOut() {
  loginForm.hidden = false;
  memoryForm.hidden = true;
  whoami.hidden = true;
}

async function checkSession() {
  try {
    const { user } = await api("/api/me");
    if (user) showLoggedIn(user);
    else showLoggedOut();
  } catch {
    showLoggedOut();
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearBanner();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  try {
    const data = await api("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    showLoggedIn(data.username);
  } catch (err) {
    showBanner(err.message, "error");
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  clearBanner();
  try {
    await api("/api/logout", { method: "POST" });
  } catch {
    // ignore — we're logging out regardless
  }
  showLoggedOut();
});

function buildPreviewThumb(file) {
  const objectUrl = URL.createObjectURL(file);
  const revoke = () => URL.revokeObjectURL(objectUrl);
  let el;
  if (file.type.startsWith("video/")) {
    el = document.createElement("video");
    el.muted = true;
    el.autoplay = true;
    el.loop = true;
    el.playsInline = true;
    // <video> has no "load" event (that's img-only) — "loadeddata" is its equivalent.
    el.addEventListener("loadeddata", revoke);
  } else {
    el = document.createElement("img");
    el.addEventListener("load", revoke);
  }
  el.src = objectUrl;
  return el;
}

photosInput.addEventListener("change", () => {
  photoPreview.innerHTML = "";
  Array.from(photosInput.files).forEach((file) => {
    photoPreview.appendChild(buildPreviewThumb(file));
  });
});

memoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearBanner();
  submitBtn.disabled = true;
  submitBtn.textContent = "Bezig...";

  const formData = new FormData(memoryForm);

  try {
    const data = await api("/api/memories", { method: "POST", body: formData });
    const note = data.dryRun ? " (TEST-modus: niet echt opgeslagen op GitHub)" : "";
    showBanner(`Toegevoegd! Ze staat er zo bij op de site.${note}`, "success");
    memoryForm.reset();
    photoPreview.innerHTML = "";
  } catch (err) {
    showBanner(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Toevoegen";
  }
});

checkSession();
