// ============ Security PIN gate ============
const gateOverlay = document.getElementById("gate-overlay");
if (gateOverlay) {
  const GATE_KEY = "liefje_unlocked";
  const CORRECT_PIN = "0605";

  const gateForm = document.getElementById("gateForm");
  const gateError = document.getElementById("gateError");
  const gateCard = gateOverlay.querySelector(".gate-card");
  const digits = Array.from(gateOverlay.querySelectorAll(".gate-pin-digit"));

  function currentPin() {
    return digits.map((d) => d.value).join("");
  }

  function clearPin() {
    digits.forEach((d) => {
      d.value = "";
      d.classList.remove("filled");
    });
    digits[0].focus();
  }

  function unlockGate() {
    gateOverlay.classList.add("unlocked");
    document.body.style.overflow = "";
    try {
      localStorage.setItem(GATE_KEY, "1");
    } catch (e) {}
  }

  function checkPin() {
    if (currentPin() === CORRECT_PIN) {
      unlockGate();
    } else {
      gateError.textContent = "niet helemaal... probeer nog eens 💭";
      gateCard.classList.remove("shake");
      void gateCard.offsetWidth;
      gateCard.classList.add("shake");
      clearPin();
    }
  }

  let alreadyUnlocked = false;
  try {
    alreadyUnlocked = localStorage.getItem(GATE_KEY) === "1";
  } catch (e) {}

  if (alreadyUnlocked) {
    gateOverlay.classList.add("unlocked");
  } else {
    document.body.style.overflow = "hidden";

    digits.forEach((digit, i) => {
      digit.addEventListener("input", () => {
        digit.value = digit.value.replace(/[^0-9]/g, "").slice(-1);
        digit.classList.toggle("filled", digit.value !== "");
        if (digit.value && i < digits.length - 1) {
          digits[i + 1].focus();
        }
        if (currentPin().length === digits.length) {
          checkPin();
        }
      });

      digit.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !digit.value && i > 0) {
          digits[i - 1].focus();
        }
      });

      digit.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData.getData("text") || "").replace(/[^0-9]/g, "");
        pasted
          .slice(0, digits.length)
          .split("")
          .forEach((char, j) => {
            digits[j].value = char;
            digits[j].classList.add("filled");
          });
        const next = Math.min(pasted.length, digits.length - 1);
        digits[next].focus();
        if (currentPin().length === digits.length) checkPin();
      });
    });

    gateForm.addEventListener("submit", (e) => {
      e.preventDefault();
      checkPin();
    });
  }
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

// ============ Puzzle gate: solve the picture to unlock the memories below ============
// Easy mode: click any two tiles to swap them (no sliding, no blank tile) —
// any shuffle is reachable this way, so it's always solvable.
const puzzleBoard = document.getElementById("puzzleBoard");
if (puzzleBoard) {
  const GRID = 3;
  const imageUrl = puzzleBoard.dataset.image;
  let tiles = [];
  let selectedIndex = null;
  let solved = false;
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
    puzzleBoard.classList.add("solved");
    const msg = document.getElementById("puzzleMsg");
    if (msg) msg.textContent = "Opgelost! 🎉";
    const rect = puzzleBoard.getBoundingClientRect();
    burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 220);

    document.querySelectorAll(".locked-content").forEach((el) => {
      el.classList.remove("locked-content");
      el.classList.add("reveal-fade");
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("shown")));
    });

    setTimeout(() => {
      const target = document.getElementById("cakeReveal");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }, 900);
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

  tiles = shuffledTiles();
  render();
}

// ============ 21 candles: the final wish before the memories unlock ============
const candlesRow = document.getElementById("candlesRow");
const blowBigBtn = document.getElementById("blowBigBtn");
if (candlesRow && blowBigBtn) {
  const CANDLE_COUNT = 21;
  for (let i = 0; i < CANDLE_COUNT; i++) {
    const candle = document.createElement("div");
    candle.className = "candle-mini";
    const flame = document.createElement("div");
    flame.className = "flame-mini";
    candle.appendChild(flame);
    candlesRow.appendChild(candle);
  }

  let bigCakeBlown = false;
  blowBigBtn.addEventListener("click", () => {
    if (bigCakeBlown) return;
    bigCakeBlown = true;
    blowBigBtn.disabled = true;

    const candles = Array.from(candlesRow.querySelectorAll(".candle-mini"));
    candles.forEach((candle, i) => {
      setTimeout(() => candle.classList.add("blown"), i * 60);
    });

    const rect = candlesRow.getBoundingClientRect();
    burstConfetti(rect.left + rect.width / 2, rect.top, 260);

    const bigCakeMsg = document.getElementById("bigCakeMsg");
    if (bigCakeMsg) bigCakeMsg.textContent = "21 wensjes gedaan! welkom bij onze herinneringen... 💗";

    setTimeout(() => {
      document.querySelectorAll(".locked-content-final").forEach((el) => {
        el.classList.remove("locked-content-final");
        el.classList.add("reveal-fade");
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("shown")));
      });
      const target = document.querySelector(".memory-lane-section");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }, candles.length * 60 + 900);
  });
}
