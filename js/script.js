// The browser's own scroll-restoration-on-reload otherwise fights with our
// deliberate jump to memory lane below, sometimes winning and resetting the
// scroll back to the top after we've already positioned it.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

// ============ Backend (update after deploying it — see server/) ============
const BACKEND_URL = "https://liefje.onrender.com";
const ADMIN_PANEL_URL = `${BACKEND_URL}/admin.html`;
const adminGear = document.getElementById("adminGear");
// The href still points at the full admin page (works with JS off, or a
// deliberate "open in new tab") — a normal click opens the inline modal below.
if (adminGear) adminGear.href = ADMIN_PANEL_URL;

// Auth for the public site talking to the backend cross-origin. Safari (and
// to a lesser extent Firefox) blocks cross-site cookies by default even with
// SameSite=None; Secure, so login instead also returns a token that we keep
// in localStorage and send as an Authorization header — not a cookie, so
// none of that cross-site blocking applies to it.
const AUTH_TOKEN_KEY = "liefje_auth_token";
const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const setAuthToken = (token) => localStorage.setItem(AUTH_TOKEN_KEY, token);
const clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

async function backendApi(path, options) {
  const token = getAuthToken();
  const headers = { ...(options && options.headers) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(BACKEND_URL + path, { credentials: "include", ...options, headers });
  } catch {
    throw new Error("Kon de server niet bereiken. Check je internetverbinding en probeer opnieuw.");
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    // non-JSON response — fall through with empty data
  }
  if (!res.ok) throw new Error(data.error || `Er ging iets mis (${res.status}).`);
  return data;
}

// ============ Floating background hearts ============
const heartsBg = document.getElementById("hearts-bg");
const HEART_CHARS = ["💗", "💕", "💖", "🌸", "♥"];

function spawnFloatingHeart() {
  const el = document.createElement("span");
  el.className = "floating-heart";
  el.textContent = HEART_CHARS[Math.floor(Math.random() * HEART_CHARS.length)];
  const size = 14 + Math.random() * 22;
  el.style.left = Math.random() * 100 + "vw";
  el.style.fontSize = size + "px";
  el.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
  const duration = 8 + Math.random() * 8;
  el.style.animationDuration = duration + "s";
  heartsBg.appendChild(el);
  setTimeout(() => el.remove(), duration * 1000);
}

setInterval(spawnFloatingHeart, 500);
for (let i = 0; i < 10; i++) setTimeout(spawnFloatingHeart, i * 200);

// ============ Confetti burst ============
const canvas = document.getElementById("confetti-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
let confettiPieces = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
if (canvas) {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

const CONFETTI_COLORS = ["#ff9dc5", "#ffd1e3", "#f783ac", "#d6336c", "#fff5f8", "#ffe08a"];

function burstConfetti(originX, originY, count = 120) {
  if (!canvas) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 7;
    confettiPieces.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 5 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      life: 0,
      shape: Math.random() > 0.5 ? "heart" : "square",
    });
  }
  if (!animating) {
    animating = true;
    requestAnimationFrame(animateConfetti);
  }
}

let animating = false;

function drawHeartShape(size) {
  ctx.beginPath();
  const s = size / 2;
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(0, -s * 0.3, -s, -s * 0.3, -s, s * 0.3);
  ctx.bezierCurveTo(-s, s * 0.9, 0, s * 1.1, 0, s * 1.6);
  ctx.bezierCurveTo(0, s * 1.1, s, s * 0.9, s, s * 0.3);
  ctx.bezierCurveTo(s, -s * 0.3, 0, -s * 0.3, 0, s * 0.3);
  ctx.closePath();
  ctx.fill();
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiPieces.forEach((p) => {
    p.vy += 0.15;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotSpeed;
    p.life += 1;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, 1 - p.life / 150);
    if (p.shape === "heart") {
      drawHeartShape(p.size);
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    }
    ctx.restore();
  });

  confettiPieces = confettiPieces.filter((p) => p.life < 150 && p.y < canvas.height + 50);

  if (confettiPieces.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    animating = false;
  }
}

// ============ Timelines: each spring to life as you scroll to it (there can be more than one) ============
const timelines = document.querySelectorAll(".timeline");
if (timelines.length) {
  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          timelineObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  const itemObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          itemObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );

  timelines.forEach((timeline) => {
    timelineObserver.observe(timeline);
    timeline.querySelectorAll(".timeline-item").forEach((item) => itemObserver.observe(item));
  });
}

// ============ Remembering progress across visits (puzzle solved / candles blown) ============
const PUZZLE_SOLVED_KEY = "liefje_puzzle_solved";
const CANDLES_BLOWN_KEY = "liefje_candles_blown";

// Un-hides everything with `className` (removing it triggers the fade-in),
// and optionally scrolls to `scrollTarget` after `delay` ms once revealed.
function revealLocked(className, scrollTarget, delay) {
  document.querySelectorAll(`.${className}`).forEach((el) => {
    el.classList.remove(className);
    el.classList.add("reveal-fade");
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("shown")));
  });
  if (scrollTarget) {
    setTimeout(() => {
      const target = document.querySelector(scrollTarget);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }, delay || 0);
  }
}

// Same, but skips the fade-in animation entirely — for content that was
// already unlocked on a previous visit, where there's nothing to "reveal".
// (The animated version depends on two requestAnimationFrame ticks, which
// browsers can throttle unpredictably right at page load, sometimes leaving
// content invisible for seconds — not worth the risk for a no-op skip.)
function revealLockedInstant(className) {
  document.querySelectorAll(`.${className}`).forEach((el) => el.classList.remove(className));
}

// ============ Puzzle gate: solve the picture to unlock the memories below ============
// Easy mode: click any two tiles to swap them (no sliding, no blank tile) —
// any shuffle is reachable this way, so it's always solvable.
const puzzleBoard = document.getElementById("puzzleBoard");
if (puzzleBoard) {
  const GRID = 3;
  const imageUrl = puzzleBoard.dataset.image;
  let tiles = [];
  let selectedIndex = null;
  let solved = localStorage.getItem(PUZZLE_SOLVED_KEY) === "1";
  let imageAvailable = false;

  function shuffledTiles() {
    const arr = [];
    for (let i = 0; i < GRID * GRID; i++) arr.push(i);
    // Fisher-Yates, then guarantee it isn't already solved
    do {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    } while (arr.every((v, i) => v === i));
    return arr;
  }

  function render() {
    puzzleBoard.innerHTML = "";
    tiles.forEach((value, idx) => {
      const tile = document.createElement("div");
      tile.className = "puzzle-tile";
      if (idx === selectedIndex) tile.classList.add("selected");
      if (imageAvailable) {
        tile.style.backgroundImage = `url('${imageUrl}')`;
        const row = Math.floor(value / GRID);
        const col = value % GRID;
        tile.style.backgroundPosition = `${(col / (GRID - 1)) * 100}% ${(row / (GRID - 1)) * 100}%`;
      } else {
        tile.style.background = "var(--pink-100)";
        tile.style.color = "var(--pink-deep)";
        tile.style.display = "flex";
        tile.style.alignItems = "center";
        tile.style.justifyContent = "center";
        tile.style.fontFamily = "var(--font-display)";
        tile.style.fontSize = "2rem";
        tile.textContent = value + 1;
      }
      tile.addEventListener("click", () => selectTile(idx));
      puzzleBoard.appendChild(tile);
    });
  }

  function selectTile(idx) {
    if (solved) return;
    if (selectedIndex === null) {
      selectedIndex = idx;
      render();
      return;
    }
    if (selectedIndex === idx) {
      selectedIndex = null;
      render();
      return;
    }
    [tiles[idx], tiles[selectedIndex]] = [tiles[selectedIndex], tiles[idx]];
    selectedIndex = null;
    render();
    checkSolved();
  }

  function checkSolved() {
    const isSolved = tiles.every((v, i) => v === i);
    if (!isSolved) return;
    solved = true;
    localStorage.setItem(PUZZLE_SOLVED_KEY, "1");
    puzzleBoard.classList.add("solved");
    const msg = document.getElementById("puzzleMsg");
    if (msg) msg.textContent = "Opgelost! 🎉";
    const rect = puzzleBoard.getBoundingClientRect();
    burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 220);
    revealLocked("locked-content", "#cakeReveal", 900);
  }

  const probe = new Image();
  probe.onload = () => {
    imageAvailable = true;
    render();
  };
  probe.onerror = () => {
    imageAvailable = false;
    render();
  };
  probe.src = imageUrl;

  // Already solved on a previous visit (remembered on this device) — show the
  // completed picture straight away instead of making her solve it again.
  tiles = solved ? Array.from({ length: GRID * GRID }, (_, i) => i) : shuffledTiles();
  render();

  if (solved) {
    puzzleBoard.classList.add("solved");
    revealLockedInstant("locked-content");
  }
}

// ============ 21 candles: the final wish before the memories unlock ============
const candlesRow = document.getElementById("candlesRow");
const blowBigBtn = document.getElementById("blowBigBtn");
const cakeRevealSection = document.getElementById("cakeReveal");
if (candlesRow && blowBigBtn) {
  let bigCakeBlown = localStorage.getItem(CANDLES_BLOWN_KEY) === "1";

  const CANDLE_COUNT = 21;
  for (let i = 0; i < CANDLE_COUNT; i++) {
    const candle = document.createElement("div");
    candle.className = bigCakeBlown ? "candle-mini blown" : "candle-mini";
    const flame = document.createElement("div");
    flame.className = "flame-mini";
    candle.appendChild(flame);
    candlesRow.appendChild(candle);
  }

  // takes a few puffs to get all 21 out — the button text escalates each time
  const BLOW_MESSAGES = ["Blaas nog eens", "Blaas harder", "Bijna..."];
  const TOTAL_BLOWS = BLOW_MESSAGES.length + 1;
  const bigCakeMsg = document.getElementById("bigCakeMsg");
  let blowCount = 0;

  // Already blown out on a previous visit — show the cake already done
  // instead of making her blow them out again.
  if (bigCakeBlown) {
    blowBigBtn.hidden = true;
    if (bigCakeMsg) bigCakeMsg.textContent = "Wensjes al gedaan! welkom terug bij onze herinneringen... 💗";
    if (cakeRevealSection) cakeRevealSection.classList.add("candles-out");
    revealLockedInstant("locked-content-final");
  }

  blowBigBtn.addEventListener("click", () => {
    if (bigCakeBlown) return;
    blowCount++;
    const isFinal = blowCount >= TOTAL_BLOWS;

    const remaining = Array.from(candlesRow.querySelectorAll(".candle-mini:not(.blown)"));
    const perBlow = Math.ceil(21 / TOTAL_BLOWS);
    const toBlow = isFinal ? remaining : remaining.slice(0, perBlow);
    toBlow.forEach((candle, i) => {
      setTimeout(() => candle.classList.add("blown"), i * 60);
    });

    const rect = candlesRow.getBoundingClientRect();
    burstConfetti(rect.left + rect.width / 2, rect.top, isFinal ? 260 : 90);

    blowBigBtn.classList.remove("btn-pulse");
    void blowBigBtn.offsetWidth;
    blowBigBtn.classList.add("btn-pulse");

    if (!isFinal) {
      blowBigBtn.textContent = BLOW_MESSAGES[blowCount - 1];
      return;
    }

    bigCakeBlown = true;
    localStorage.setItem(CANDLES_BLOWN_KEY, "1");
    blowBigBtn.disabled = true;
    if (bigCakeMsg) bigCakeMsg.textContent = "21 wensjes gedaan! welkom bij onze herinneringen... 💗";
    if (cakeRevealSection) cakeRevealSection.classList.add("candles-out");

    revealLocked("locked-content-final", ".memory-lane-section", toBlow.length * 60 + 900);
  });
}

// ============ Already done both steps before — skip straight to memory lane ============
(function skipToMemoryLaneIfAlreadyDone() {
  const alreadyDone =
    localStorage.getItem(PUZZLE_SOLVED_KEY) === "1" && localStorage.getItem(CANDLES_BLOWN_KEY) === "1";
  if (!alreadyDone) return;

  function jump() {
    const target = document.querySelector(".memory-lane-section");
    // "instant" (not "auto") is required here — the site sets a global
    // `scroll-behavior: smooth`, which "auto" would defer to, turning this
    // into a multi-second crawl down a ~2000px page on every single visit.
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
  }
  if (document.readyState === "complete") {
    setTimeout(jump, 50);
  } else {
    window.addEventListener("load", () => setTimeout(jump, 50));
  }
})();

// ============ Timeline helpers shared by the initial loader and the inline "add memory" modal ============
// Weaves .timeline-item elements into the right chronological spot among the
// existing (static) ones, based on each item's dd/mm date — not just tacked
// onto the end. Left/right sides are recomputed by final position so the
// zigzag stays clean regardless of where something got inserted.
const timelineEl = document.querySelector(".memory-lane-section .timeline");
const timelineContinueBadge = document.querySelector(".timeline-continue");
const ROT_CLASSES = ["rot-1", "rot-2", "rot-3", "rot-4"];
const AUTHORS = {
  Lothar: { name: "Lothar", avatar: "assets/avatars/lothar.png" },
  Charlotte: { name: "Charlotte", avatar: "assets/avatars/charlotte.png" },
};

// Dates are dd/mm with no year, so this sorts within a single calendar year
// (true for everything so far) — unparseable dates sort last instead of
// breaking the page.
function dateSortKey(dateStr) {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec((dateStr || "").trim());
  if (!m) return Number.MAX_SAFE_INTEGER;
  return parseInt(m[2], 10) * 100 + parseInt(m[1], 10);
}

// Cloudinary serves video under /video/upload/ regardless of extension;
// local/static paths are told apart by their extension instead.
function isVideoUrl(url) {
  return /\/video\/upload\//.test(url) || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

// Small preview thumbnail for a freshly-picked File, before it's uploaded —
// used by the add-card and the edit modal alike.
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

function buildTimelineItem(memory) {
  const item = document.createElement("div");
  item.className = "timeline-item";
  item.dataset.sortKey = String(dateSortKey(memory.date));
  if (memory.id) item.dataset.memoryId = memory.id;

  const photoWrap = document.createElement("div");
  photoWrap.className = "timeline-photo";
  const photos = Array.isArray(memory.photos) ? memory.photos.filter(Boolean) : [];
  const photoAlts = Array.isArray(memory.photoAlts) ? memory.photoAlts : [];
  const isGroup = photos.length > 1;
  const photoContainer = isGroup ? document.createElement("div") : photoWrap;
  if (isGroup) photoContainer.className = "timeline-photo-group";
  photos.forEach((src, i) => {
    const figure = document.createElement("figure");
    figure.className = `polaroid ${ROT_CLASSES[i % ROT_CLASSES.length]}`;
    let media;
    if (isVideoUrl(src)) {
      figure.classList.add("has-video");
      media = document.createElement("video");
      media.src = src;
      media.muted = true;
      media.autoplay = true;
      media.loop = true;
      media.playsInline = true;
      media.controls = true;
    } else {
      media = document.createElement("img");
      media.src = src;
      media.alt = photoAlts[i] || memory.title || "Herinnering";
    }
    media.addEventListener("error", () => figure.classList.add("img-missing"));
    figure.appendChild(media);
    photoContainer.appendChild(figure);
  });
  if (isGroup) photoWrap.appendChild(photoContainer);

  const node = document.createElement("div");
  node.className = "timeline-node";

  const text = document.createElement("div");
  text.className = "timeline-text";
  const dateP = document.createElement("p");
  dateP.className = "timeline-date";
  const placeSpan = document.createElement("span");
  placeSpan.textContent = memory.place ? `📍 ${memory.place}` : "📍";
  const daySpan = document.createElement("span");
  daySpan.className = "timeline-day";
  daySpan.textContent = memory.date || "";
  dateP.appendChild(placeSpan);
  dateP.appendChild(daySpan);
  const h3 = document.createElement("h3");
  h3.textContent = memory.title || "";
  text.appendChild(dateP);
  text.appendChild(h3);

  const author = AUTHORS[memory.addedBy];
  if (author) {
    const authorRow = document.createElement("div");
    authorRow.className = "memory-author";
    const avatar = document.createElement("img");
    avatar.className = "memory-author-avatar";
    avatar.src = author.avatar;
    avatar.alt = author.name;
    avatar.addEventListener("error", () => avatar.remove());
    const name = document.createElement("span");
    name.className = "memory-author-name";
    name.textContent = `toegevoegd door ${author.name}`;
    authorRow.appendChild(avatar);
    authorRow.appendChild(name);
    text.appendChild(authorRow);
  }

  const controls = document.createElement("div");
  controls.className = "timeline-edit-controls";
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "timeline-edit-btn";
  editBtn.title = "Bewerken";
  editBtn.setAttribute("aria-label", "Herinnering bewerken");
  editBtn.textContent = "✏️";
  editBtn.addEventListener("click", () => MemoryEditor.openEdit(memory, item));
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "timeline-delete-btn";
  deleteBtn.title = "Verwijderen";
  deleteBtn.setAttribute("aria-label", "Herinnering verwijderen");
  deleteBtn.textContent = "🗑️";
  deleteBtn.addEventListener("click", () => MemoryEditor.deleteMemory(memory, item));
  controls.appendChild(editBtn);
  controls.appendChild(deleteBtn);

  item.appendChild(controls);
  item.appendChild(photoWrap);
  item.appendChild(node);
  item.appendChild(text);
  return item;
}

// The compose card at the end isn't a memory, so it's excluded from every
// selector below via :not(.timeline-add-card).
const REAL_TIMELINE_ITEM = ".timeline-item:not(.timeline-add-card)";

// Keeps the add-card and the "more to come" badge pinned as the last two
// children, continuing the left/right zigzag from wherever the real items
// left off — called after any insert/sort so they never end up stranded
// in the middle of the timeline.
function pinTimelineFooter(realItemCount) {
  const addCard = document.getElementById("timelineAddCard");
  if (addCard) {
    addCard.classList.remove("side-left", "side-right");
    addCard.classList.add(realItemCount % 2 === 0 ? "side-left" : "side-right");
    timelineEl.appendChild(addCard);
  }
  if (timelineContinueBadge) timelineEl.appendChild(timelineContinueBadge);
}

function reorderTimelineByDate() {
  if (!timelineEl || !timelineContinueBadge) return;
  const items = Array.from(timelineEl.querySelectorAll(REAL_TIMELINE_ITEM));
  items.sort((a, b) => Number(a.dataset.sortKey) - Number(b.dataset.sortKey));
  items.forEach((item, i) => {
    item.classList.remove("side-left", "side-right");
    item.classList.add(i % 2 === 0 ? "side-left" : "side-right");
    timelineEl.insertBefore(item, timelineContinueBadge);
  });
  pinTimelineFooter(items.length);
}

const timelineRevealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        timelineRevealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.25 }
);

// Builds, inserts, sorts, and reveal-observes one memory — used both for
// memories.json on load and for a memory just submitted through the add-card.
function insertMemoryIntoTimeline(memory) {
  if (!timelineEl || !timelineContinueBadge) return null;
  const item = buildTimelineItem(memory);
  timelineEl.insertBefore(item, timelineContinueBadge);
  reorderTimelineByDate();
  timelineRevealObserver.observe(item);
  return item;
}

// ============ Memories ============
// Every event (the original ones included) lives in assets/data/memories.json,
// not in this HTML — fetched and rendered here. If the file is empty/missing/
// unreachable, the page still works, it's just an empty timeline.
(function loadMemories() {
  if (!timelineEl || !timelineContinueBadge) return;
  // Gives the add-card its side class and correct position immediately,
  // even before the fetch below resolves (or if it fails).
  pinTimelineFooter(0);

  fetch("assets/data/memories.json", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : []))
    .then((memories) => {
      if (!Array.isArray(memories) || memories.length === 0) return;
      memories.forEach((memory) => insertMemoryIntoTimeline(memory));
    })
    .catch(() => {
      // couldn't load memories.json — the page still works, just with an empty timeline
    });
})();

// ============ Inline "add memory" modal (opens from the ⚙️ instead of navigating away) ============
// Login/logout only — adding a memory happens inline in the timeline itself
// (see the add-card further down), not in this modal.
const MemoryAuth = (function setupMemoryModal() {
  const modal = document.getElementById("memoryModal");
  if (!modal) return { openModal() {}, isLoggedIn: () => false };

  const backdrop = document.getElementById("memoryModalBackdrop");
  const closeBtn = document.getElementById("memoryModalClose");
  const banner = document.getElementById("memoryModalBanner");
  const whoami = document.getElementById("memoryModalWhoami");
  const whoamiAvatar = document.getElementById("memoryModalAvatar");
  const whoamiText = document.getElementById("memoryModalWhoamiText");
  const loginForm = document.getElementById("memoryModalLoginForm");
  const loggedInPanel = document.getElementById("memoryModalLoggedIn");
  const logoutBtn = document.getElementById("memoryModalLogout");

  let currentUsername = null;

  function showBanner(message, type) {
    banner.textContent = message;
    banner.className = `memory-modal-banner ${type}`;
  }
  function clearBanner() {
    banner.textContent = "";
    banner.className = "memory-modal-banner";
  }

  function showLoggedIn(username) {
    currentUsername = username;
    loginForm.hidden = true;
    loggedInPanel.hidden = false;
    whoami.hidden = false;
    whoamiText.textContent = `ingelogd als ${username}`;
    const author = AUTHORS[username];
    if (author) {
      whoamiAvatar.src = author.avatar;
      whoamiAvatar.alt = username;
      whoamiAvatar.hidden = false;
    } else {
      whoamiAvatar.hidden = true;
    }
  }
  function showLoggedOut() {
    currentUsername = null;
    loginForm.hidden = false;
    loggedInPanel.hidden = true;
    whoami.hidden = true;
  }

  async function checkSession() {
    try {
      const { user } = await backendApi("/api/me");
      if (user) showLoggedIn(user);
      else showLoggedOut();
    } catch {
      showLoggedOut();
    }
  }
  // Runs once on page load so the inline add-card knows the login state
  // without needing the modal to have been opened first.
  const sessionReady = checkSession();

  function openModal() {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    clearBanner();
    checkSession();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  if (adminGear) {
    adminGear.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  }
  if (backdrop) backdrop.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearBanner();
    const username = document.getElementById("memoryModalUsername").value.trim();
    const password = document.getElementById("memoryModalPassword").value;
    try {
      const data = await backendApi("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (data.token) setAuthToken(data.token);
      showLoggedIn(data.username);
      document.dispatchEvent(new CustomEvent("liefje:login", { detail: { username: data.username } }));
      setTimeout(closeModal, 900);
    } catch (err) {
      showBanner(err.message, "error");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    clearBanner();
    clearAuthToken();
    try {
      await backendApi("/api/logout", { method: "POST" });
    } catch {
      // logging out regardless
    }
    showLoggedOut();
    document.dispatchEvent(new CustomEvent("liefje:logout"));
  });

  return {
    openModal,
    isLoggedIn: () => !!currentUsername,
    getUsername: () => currentUsername,
    ready: sessionReady,
  };
})();

// ============ Editing/deleting an existing event (✏️ / 🗑️ on hover) ============
const MemoryEditor = (function setupMemoryEditor() {
  const modal = document.getElementById("editMemoryModal");
  if (!modal) return { openEdit() {}, deleteMemory() {} };

  const backdrop = document.getElementById("editMemoryModalBackdrop");
  const closeBtn = document.getElementById("editMemoryModalClose");
  const cancelBtn = document.getElementById("editMemoryCancel");
  const form = document.getElementById("editMemoryForm");
  const banner = document.getElementById("editMemoryBanner");
  const titleInput = document.getElementById("editMemoryTitle");
  const placeInput = document.getElementById("editMemoryPlace");
  const dateInput = document.getElementById("editMemoryDate");
  const photosContainer = document.getElementById("editMemoryPhotos");
  const newPhotosInput = document.getElementById("editMemoryNewPhotos");
  const newPreview = document.getElementById("editMemoryNewPreview");
  const saveBtn = document.getElementById("editMemorySave");
  const DATE_RE = /^\d{1,2}\/\d{1,2}$/;

  let currentMemory = null;
  let currentItemEl = null;
  let removedPhotos = new Set();

  function showBanner(message, type) {
    banner.textContent = message;
    banner.className = `memory-modal-banner ${type}`;
  }
  function clearBanner() {
    banner.textContent = "";
    banner.className = "memory-modal-banner";
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function renderExistingPhotos() {
    photosContainer.innerHTML = "";
    (currentMemory.photos || []).forEach((src) => {
      const wrap = document.createElement("div");
      wrap.className = "edit-memory-photo";
      if (removedPhotos.has(src)) wrap.classList.add("marked-remove");
      const media = isVideoUrl(src) ? document.createElement("video") : document.createElement("img");
      if (media.tagName === "VIDEO") {
        // Deliberately no autoplay/controls/loop — this is just a small
        // static first-frame preview so it doesn't blow up the modal or
        // hide the buttons below it (see .edit-memory-photo video sizing).
        media.muted = true;
        media.playsInline = true;
        media.preload = "metadata";
        // Neither preload="metadata" nor seeking currentTime reliably forces
        // a frame to actually get decoded and painted across browsers — a
        // brief muted play-then-pause does, and is the standard trick for a
        // static video "poster" thumbnail with no <video controls>. Calling
        // .play() itself makes the browser load whatever data it needs.
        media.addEventListener("loadedmetadata", () => {
          media.play()
            .then(() => media.pause())
            .catch(() => {});
        });
      } else {
        media.alt = "";
      }
      media.src = src;
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "edit-memory-photo-remove";
      removeBtn.title = removedPhotos.has(src) ? "Terugzetten" : "Verwijderen";
      removeBtn.textContent = removedPhotos.has(src) ? "↺" : "×";
      removeBtn.addEventListener("click", () => {
        if (removedPhotos.has(src)) removedPhotos.delete(src);
        else removedPhotos.add(src);
        renderExistingPhotos();
      });
      wrap.appendChild(media);
      wrap.appendChild(removeBtn);
      photosContainer.appendChild(wrap);
    });
  }

  newPhotosInput.addEventListener("change", () => {
    newPreview.innerHTML = "";
    Array.from(newPhotosInput.files).forEach((file) => {
      newPreview.appendChild(buildPreviewThumb(file));
    });
  });

  function openEdit(memory, itemEl) {
    currentMemory = memory;
    currentItemEl = itemEl;
    removedPhotos = new Set();
    clearBanner();
    titleInput.value = memory.title || "";
    placeInput.value = memory.place || "";
    dateInput.value = memory.date || "";
    newPhotosInput.value = "";
    newPreview.innerHTML = "";
    renderExistingPhotos();
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  if (backdrop) backdrop.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearBanner();
    const title = titleInput.value.trim();
    const place = placeInput.value.trim();
    const date = dateInput.value.trim();
    if (!title) return showBanner("Titel mag niet leeg zijn.", "error");
    if (!place) return showBanner("Plaats mag niet leeg zijn.", "error");
    if (!DATE_RE.test(date)) return showBanner("Datum moet dd/mm zijn.", "error");

    const remainingCount = (currentMemory.photos || []).length - removedPhotos.size + newPhotosInput.files.length;
    if (remainingCount <= 0) return showBanner("Er moet minstens 1 foto overblijven.", "error");

    saveBtn.disabled = true;
    saveBtn.textContent = "Bezig...";

    const formData = new FormData();
    formData.append("title", title);
    formData.append("place", place);
    formData.append("date", date);
    formData.append("photosToRemove", JSON.stringify(Array.from(removedPhotos)));
    Array.from(newPhotosInput.files).forEach((file) => formData.append("photos", file));

    try {
      const data = await backendApi(`/api/memories/${encodeURIComponent(currentMemory.id)}`, {
        method: "PATCH",
        body: formData,
      });
      if (!data.dryRun && data.memory) {
        currentItemEl.remove();
        const item = insertMemoryIntoTimeline(data.memory);
        if (item) item.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      showBanner("Opgeslagen! 💗", "success");
      setTimeout(closeModal, 900);
    } catch (err) {
      if (/niet ingelogd/i.test(err.message)) {
        showBanner("Log eerst in via het tandwiel-icoon.", "error");
        MemoryAuth.openModal();
      } else {
        showBanner(err.message, "error");
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Opslaan";
    }
  });

  async function deleteMemory(memory, itemEl) {
    if (!confirm(`"${memory.title}" verwijderen? Dit kan niet ongedaan gemaakt worden.`)) return;
    try {
      const data = await backendApi(`/api/memories/${encodeURIComponent(memory.id)}`, { method: "DELETE" });
      if (!data.dryRun) {
        itemEl.remove();
        pinTimelineFooter(timelineEl.querySelectorAll(REAL_TIMELINE_ITEM).length);
      }
    } catch (err) {
      if (/niet ingelogd/i.test(err.message)) {
        MemoryAuth.openModal();
      } else {
        alert(err.message);
      }
    }
  }

  return { openEdit, deleteMemory };
})();

// ============ Inline "add memory" card, always last in the timeline ============
(function setupTimelineAddCard() {
  const form = document.getElementById("timelineAddForm");
  if (!form) return;

  const photoInput = document.getElementById("timelineAddPhotoInput");
  const preview = document.getElementById("timelineAddPreview");
  const placeInput = document.getElementById("timelineAddPlace");
  const dateInput = document.getElementById("timelineAddDate");
  const titleInput = document.getElementById("timelineAddTitle");
  const banner = document.getElementById("timelineAddBanner");
  const submitBtn = document.getElementById("timelineAddSubmit");
  const DATE_RE = /^\d{1,2}\/\d{1,2}$/;

  function showBanner(message, type) {
    banner.textContent = message;
    banner.className = `memory-modal-banner ${type}`;
  }
  function clearBanner() {
    banner.textContent = "";
    banner.className = "memory-modal-banner";
  }

  photoInput.addEventListener("change", () => {
    preview.innerHTML = "";
    Array.from(photoInput.files).forEach((file) => {
      preview.appendChild(buildPreviewThumb(file));
    });
  });

  function resetCard() {
    form.reset();
    preview.innerHTML = "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearBanner();

    const title = titleInput.value.trim();
    const place = placeInput.value.trim();
    const date = dateInput.value.trim();
    if (!title) return showBanner("Vertel iets over dit moment.", "error");
    if (!place) return showBanner("Plaats is verplicht.", "error");
    if (!DATE_RE.test(date)) return showBanner("Datum moet dd/mm zijn, bv. 05/08.", "error");
    if (!photoInput.files || photoInput.files.length === 0) {
      return showBanner("Voeg minstens 1 foto toe.", "error");
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Bezig...";

    const formData = new FormData();
    formData.append("title", title);
    formData.append("place", place);
    formData.append("date", date);
    Array.from(photoInput.files).forEach((file) => formData.append("photos", file));

    try {
      const data = await backendApi("/api/memories", { method: "POST", body: formData });
      if (!data.dryRun) {
        const item = insertMemoryIntoTimeline(data.memory);
        if (item) {
          item.scrollIntoView({ behavior: "smooth", block: "center" });
          const rect = item.getBoundingClientRect();
          burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 160);
        }
      }
      showBanner("Toegevoegd! 💗", "success");
      resetCard();
    } catch (err) {
      if (/niet ingelogd/i.test(err.message)) {
        showBanner("Log eerst in via het tandwiel-icoon hierboven.", "error");
        MemoryAuth.openModal();
      } else {
        showBanner(err.message, "error");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Toevoegen";
    }
  });
})();

// ============ Editable site text (✏️ next to headings/paragraphs) ============
// Every [data-editable] element keeps its default text right in the HTML —
// assets/data/site-text.json only ever stores the ones actually edited
// (sparse overrides), so nothing needs migrating and a missing/empty file
// just means "nothing's been customized yet".
(function setupEditableText() {
  const targets = Array.from(document.querySelectorAll("[data-editable]"));
  const modal = document.getElementById("editTextModal");
  if (!targets.length || !modal) return;

  // textContent can't recover a manually-placed <br> position, so the one
  // heading that has one keeps its real multi-line default here instead.
  const MULTILINE_DEFAULTS = {
    "memory-lane-title": "Let's take a trip\nthrough memory lane",
  };

  const currentValues = new Map();
  targets.forEach((el) => {
    const key = el.dataset.editable;
    currentValues.set(key, MULTILINE_DEFAULTS[key] || el.textContent.trim());
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Re-renders as HTML (not just textContent) so a saved multi-line edit
  // shows as actual line breaks, then re-attaches the pencil button that
  // setting innerHTML would otherwise wipe out along with the old text.
  function renderElement(el, text) {
    const btn = el.querySelector(".text-edit-btn");
    el.innerHTML = text.split("\n").map(escapeHtml).join("<br>");
    if (btn) el.appendChild(btn);
  }

  const backdrop = document.getElementById("editTextBackdrop");
  const closeBtn = document.getElementById("editTextClose");
  const cancelBtn = document.getElementById("editTextCancel");
  const form = document.getElementById("editTextForm");
  const textarea = document.getElementById("editTextValue");
  const banner = document.getElementById("editTextBanner");
  const saveBtn = document.getElementById("editTextSave");

  let currentKey = null;
  let currentEl = null;

  function showBanner(message, type) {
    banner.textContent = message;
    banner.className = `memory-modal-banner ${type}`;
  }
  function clearBanner() {
    banner.textContent = "";
    banner.className = "memory-modal-banner";
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openEditor(key, el) {
    currentKey = key;
    currentEl = el;
    clearBanner();
    textarea.value = currentValues.get(key) || "";
    modal.hidden = false;
    document.body.classList.add("modal-open");
    textarea.focus();
  }

  if (backdrop) backdrop.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearBanner();
    const text = textarea.value.trim();
    if (!text) return showBanner("Tekst mag niet leeg zijn.", "error");

    saveBtn.disabled = true;
    saveBtn.textContent = "Bezig...";
    try {
      const data = await backendApi(`/api/site-text/${encodeURIComponent(currentKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!data.dryRun) {
        currentValues.set(currentKey, text);
        renderElement(currentEl, text);
      }
      showBanner("Opgeslagen! 💗", "success");
      setTimeout(closeModal, 800);
    } catch (err) {
      if (/niet ingelogd/i.test(err.message)) {
        showBanner("Log eerst in via het tandwiel-icoon.", "error");
        MemoryAuth.openModal();
      } else {
        showBanner(err.message, "error");
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Opslaan";
    }
  });

  targets.forEach((el) => {
    const key = el.dataset.editable;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "text-edit-btn";
    btn.title = "Tekst bewerken";
    btn.setAttribute("aria-label", "Tekst bewerken");
    btn.textContent = "✏️";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditor(key, el);
    });
    el.appendChild(btn);
  });

  fetch("assets/data/site-text.json", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : {}))
    .then((overrides) => {
      if (!overrides || typeof overrides !== "object") return;
      Object.keys(overrides).forEach((key) => {
        const el = targets.find((t) => t.dataset.editable === key);
        if (!el) return;
        currentValues.set(key, overrides[key]);
        renderElement(el, overrides[key]);
      });
    })
    .catch(() => {
      // no overrides yet, or offline — the defaults already in the HTML stand
    });
})();
