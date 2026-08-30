// The browser's own scroll-restoration-on-reload otherwise fights with our
// deliberate jump to memory lane below, sometimes winning and resetting the
// scroll back to the top after we've already positioned it.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

// ============ Backend (update after deploying it — see server/) ============
const BACKEND_URL = "https://YOUR-RENDER-URL.onrender.com";
const ADMIN_PANEL_URL = `${BACKEND_URL}/admin.html`;
const adminGear = document.getElementById("adminGear");
// The href still points at the full admin page (works with JS off, or a
// deliberate "open in new tab") — a normal click opens the inline modal below.
if (adminGear) adminGear.href = ADMIN_PANEL_URL;

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
    const msg = document.getElementById("puzzleMsg");
    if (msg) msg.textContent = "Alweer opgelost! 💗";
    revealLockedInstant("locked-content");
  }
}

// ============ 21 candles: the final wish before the memories unlock ============
const candlesRow = document.getElementById("candlesRow");
const blowBigBtn = document.getElementById("blowBigBtn");
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
    blowBigBtn.disabled = true;
    blowBigBtn.textContent = "Al gedaan 💗";
    if (bigCakeMsg) bigCakeMsg.textContent = "Wensjes al gedaan! welkom terug bij onze herinneringen... 💗";
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

function buildTimelineItem(memory) {
  const item = document.createElement("div");
  item.className = "timeline-item";
  item.dataset.sortKey = String(dateSortKey(memory.date));

  const photoWrap = document.createElement("div");
  photoWrap.className = "timeline-photo";
  const photos = Array.isArray(memory.photos) ? memory.photos.filter(Boolean) : [];
  const isGroup = photos.length > 1;
  const photoContainer = isGroup ? document.createElement("div") : photoWrap;
  if (isGroup) photoContainer.className = "timeline-photo-group";
  photos.forEach((src, i) => {
    const figure = document.createElement("figure");
    figure.className = `polaroid ${ROT_CLASSES[i % ROT_CLASSES.length]}`;
    const img = document.createElement("img");
    img.src = src;
    img.alt = memory.title || "Herinnering";
    img.addEventListener("error", () => figure.classList.add("img-missing"));
    figure.appendChild(img);
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

  item.appendChild(photoWrap);
  item.appendChild(node);
  item.appendChild(text);
  return item;
}

function tagStaticTimelineItems() {
  if (!timelineEl) return;
  timelineEl.querySelectorAll(".timeline-item").forEach((item) => {
    if (item.dataset.sortKey === undefined) item.dataset.sortKey = String(dateSortKey(item.dataset.date));
  });
}

function reorderTimelineByDate() {
  if (!timelineEl || !timelineContinueBadge) return;
  const items = Array.from(timelineEl.querySelectorAll(".timeline-item"));
  items.sort((a, b) => Number(a.dataset.sortKey) - Number(b.dataset.sortKey));
  items.forEach((item, i) => {
    item.classList.remove("side-left", "side-right");
    item.classList.add(i % 2 === 0 ? "side-left" : "side-right");
    timelineEl.insertBefore(item, timelineContinueBadge);
  });
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
// memories.json on load and for a memory just submitted through the modal.
function insertMemoryIntoTimeline(memory) {
  if (!timelineEl || !timelineContinueBadge) return null;
  tagStaticTimelineItems();
  const item = buildTimelineItem(memory);
  timelineEl.insertBefore(item, timelineContinueBadge);
  reorderTimelineByDate();
  timelineRevealObserver.observe(item);
  return item;
}

// ============ Dynamically added memories (posted through the admin panel) ============
// Reads assets/data/memories.json on load. If the file is empty/missing/
// unreachable this quietly does nothing, so the static timeline still works.
(function loadDynamicMemories() {
  if (!timelineEl || !timelineContinueBadge) return;
  tagStaticTimelineItems();

  fetch("assets/data/memories.json", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : []))
    .then((memories) => {
      if (!Array.isArray(memories) || memories.length === 0) return;
      memories.forEach((memory) => insertMemoryIntoTimeline(memory));
    })
    .catch(() => {
      // no dynamic memories yet, or offline — the static timeline above still works fine
    });
})();

// ============ Inline "add memory" modal (opens from the ⚙️ instead of navigating away) ============
(function setupMemoryModal() {
  const modal = document.getElementById("memoryModal");
  if (!modal) return;

  const backdrop = document.getElementById("memoryModalBackdrop");
  const closeBtn = document.getElementById("memoryModalClose");
  const banner = document.getElementById("memoryModalBanner");
  const whoami = document.getElementById("memoryModalWhoami");
  const whoamiAvatar = document.getElementById("memoryModalAvatar");
  const whoamiText = document.getElementById("memoryModalWhoamiText");
  const loginForm = document.getElementById("memoryModalLoginForm");
  const uploadForm = document.getElementById("memoryModalUploadForm");
  const submitBtn = document.getElementById("memoryModalSubmit");
  const logoutBtn = document.getElementById("memoryModalLogout");
  const photosInput = document.getElementById("memoryModalPhotos");
  const preview = document.getElementById("memoryModalPreview");

  function showBanner(message, type) {
    banner.textContent = message;
    banner.className = `memory-modal-banner ${type}`;
  }
  function clearBanner() {
    banner.textContent = "";
    banner.className = "memory-modal-banner";
  }

  async function api(path, options) {
    let res;
    try {
      res = await fetch(BACKEND_URL + path, { credentials: "include", ...options });
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

  function showLoggedIn(username) {
    loginForm.hidden = true;
    uploadForm.hidden = false;
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
    loginForm.hidden = false;
    uploadForm.hidden = true;
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

  logoutBtn.addEventListener("click", async () => {
    clearBanner();
    try {
      await api("/api/logout", { method: "POST" });
    } catch {
      // logging out regardless
    }
    showLoggedOut();
  });

  photosInput.addEventListener("change", () => {
    preview.innerHTML = "";
    Array.from(photosInput.files).forEach((file) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.addEventListener("load", () => URL.revokeObjectURL(img.src));
      preview.appendChild(img);
    });
  });

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearBanner();
    submitBtn.disabled = true;
    submitBtn.textContent = "Bezig...";

    try {
      const data = await api("/api/memories", { method: "POST", body: new FormData(uploadForm) });
      if (!data.dryRun) {
        const item = insertMemoryIntoTimeline(data.memory);
        if (item) {
          item.scrollIntoView({ behavior: "smooth", block: "center" });
          const rect = item.getBoundingClientRect();
          burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 160);
        }
      }
      showBanner("Toegevoegd! Ze staat er meteen bij op de site.", "success");
      uploadForm.reset();
      preview.innerHTML = "";
      setTimeout(closeModal, 1400);
    } catch (err) {
      showBanner(err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Toevoegen";
    }
  });
})();
