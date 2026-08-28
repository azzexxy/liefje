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

// ============ Surprise button: builds up over a few clicks, then leads onward ============
const surpriseBtn = document.getElementById("surpriseBtn");
if (surpriseBtn) {
  const stages = [
    { label: "Klik nog eens 🎈", burst: 150 },
    { label: "Nog eentje, beloofd 🥹", burst: 220 },
    { label: "Oké, echt de laatste... 💖", burst: 300 },
  ];
  let stageIndex = 0;

  surpriseBtn.addEventListener("click", () => {
    const rect = surpriseBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (stageIndex < stages.length) {
      const stage = stages[stageIndex];
      burstConfetti(cx, cy, stage.burst);
      surpriseBtn.textContent = stage.label;
      surpriseBtn.classList.remove("btn-pulse");
      void surpriseBtn.offsetWidth; // restart the animation
      surpriseBtn.classList.add("btn-pulse");
      stageIndex++;
      return;
    }

    // final click: one big finale, then head to the surprise page
    surpriseBtn.disabled = true;
    burstConfetti(cx, cy, 260);
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.3, 260);
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.7, 260);
    const flash = document.getElementById("flash-overlay");
    if (flash) flash.classList.add("show");
    setTimeout(() => {
      window.location.href = "surprise.html";
    }, 1300);
  });
}

// ============ Blow out the candle ============
const blowBtn = document.getElementById("blowBtn");
const cakeEl = document.getElementById("cake");
if (blowBtn && cakeEl) {
  const candle = cakeEl.querySelector(".candle");
  const wishMsg = document.getElementById("wishMsg");
  const wishes = [
    "Je wens komt al uit 💫",
    "Het universum heeft 'm net gehoord 🌙",
    "Op alles waar je op hoopt 🎀",
    "Met liefde gemaakt, met sterrenstof toegekend ✨",
  ];

  let blown = false;
  blowBtn.addEventListener("click", () => {
    if (!blown) {
      blown = true;
      candle.classList.add("blown");
      wishMsg.textContent = wishes[Math.floor(Math.random() * wishes.length)];
      blowBtn.textContent = "Nog een wens doen? 🔁";
      const rect = candle.getBoundingClientRect();
      burstConfetti(rect.left + rect.width / 2, rect.top, 100);
    } else {
      blown = false;
      candle.classList.remove("blown");
      wishMsg.textContent = "";
      blowBtn.textContent = "Blaas het kaarsje uit 🕯️";
    }
  });
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
