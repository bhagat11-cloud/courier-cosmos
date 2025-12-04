/* Courier Chaos - Human Player Version
   Adds:
   ✔ Human character
   ✔ Running, jumping animation
   ✔ Shadow
   ✔ Difficulty scaling every 500m
*/

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const coinVal = document.getElementById("coinVal");
const distVal = document.getElementById("distVal");
const scoreVal = document.getElementById("scoreVal");
const levelVal = document.getElementById("levelVal");
const rageFill = document.getElementById("rageFill");
const progressFill = document.getElementById("progressFill");

const overlay = document.getElementById("overlay");
const overMsg = document.getElementById("overMsg");

let running = true;
let gameOver = false;

let score = 0;
let coins = 0;
let coinProg = 0;
let rage = 0;
let distance = 0;
let speed = 4;
let level = 1;

// Background themes
const bgs = [
  ["#7ed7ff", "#c2f0ff"],
  ["#ffc796", "#ff9a76"],
  ["#0d2345", "#091425"],
  ["#96c0d6", "#6a91a3"]
];
let bgIndex = 0;

// --------------------------------------------
// PLAYER (Cartoon Man)
// --------------------------------------------
let player = {
  x: 100,
  y: 380,
  w: 35,
  h: 60,
  vy: 0,
  onGround: true,
  frame: 0,
  jumpFrame: 0,
  legsOpen: false,
};

// --------------------------------------------
// SPAWN OBJECTS
// --------------------------------------------
let objects = [];
let warnings = [];

// --------------------------------------------
// BASIC SOUND
// --------------------------------------------
function beep(freq = 400, time = 0.1) {
  const a = new AudioContext();
  const o = a.createOscillator();
  const g = a.createGain();
  o.frequency.value = freq;
  g.gain.value = 0.06;
  o.connect(g);
  g.connect(a.destination);
  o.start();
  o.stop(a.currentTime + time);
}

// --------------------------------------------
// DRAW PLAYER (Human stick-style character)
// --------------------------------------------
function drawPlayer() {
  const p = player;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(p.x + p.w/2, p.y + p.h + 5, 20, 6, 0, 0, Math.PI*2);
  ctx.fill();

  // Body
  ctx.fillStyle = "#ffcc99";
  ctx.fillRect(p.x + 10, p.y + 5, 12, 25);  // torso

  // Head
  ctx.beginPath();
  ctx.arc(p.x + 16, p.y - 5, 12, 0, Math.PI * 2);
  ctx.fillStyle = "#ffe2c6";
  ctx.fill();

  // Arms
  ctx.strokeStyle = "#ffcc99";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p.x + 10, p.y + 15);
  ctx.lineTo(p.x, p.y + 30);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(p.x + 22, p.y + 15);
  ctx.lineTo(p.x + 35, p.y + 30);
  ctx.stroke();

  // Legs (running animation)
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 5;

  ctx.beginPath();
  ctx.moveTo(p.x + 12, p.y + 30);
  ctx.lineTo(p.x + (p.legsOpen ? 0 : 10), p.y + 55);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(p.x + 20, p.y + 30);
  ctx.lineTo(p.x + (p.legsOpen ? 30 : 20), p.y + 55);
  ctx.stroke();

  // running animation toggle
  if (p.onGround) {
    p.frame++;
    if (p.frame % 10 === 0) p.legsOpen = !p.legsOpen;
  }
}

// --------------------------------------------
// BACKGROUND
// --------------------------------------------
function drawBackground() {
  let grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grd.addColorStop(0, bgs[bgIndex][0]);
  grd.addColorStop(1, bgs[bgIndex][1]);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --------------------------------------------
// SPAWN OBJECT FUNCTIONS
// --------------------------------------------
function spawnCoin() {
  objects.push({
    type: "coin",
    x: 920,
    y: 300 + Math.random() * 80,
    r: 10
  });
}

function spawnStone() {
  warnings.push({ x: 700, y: 250, time: 800 });

  setTimeout(() => {
    objects.push({
      type: "stone",
      x: 900,
      y: 360,
      w: 60,
      h: 60
    });
  }, 800);
}

// --------------------------------------------
// COLLISION
// --------------------------------------------
function coll(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// --------------------------------------------
// UPDATE GAME LOGIC
// --------------------------------------------
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function update() {
  if (!running || gameOver) return;

  score++;
  distance += speed * 0.1;

  // Difficulty increase every 500m
  if (Math.floor(distance) % 500 === 0 && distance > 10) {
    speed += 0.4;
    bgIndex = (bgIndex + 1) % bgs.length;
    level++;
  }

  // Jump
  if (keys["ArrowUp"] && player.onGround) {
    player.vy = -12;
    player.onGround = false;
    beep(700, 0.08);
  }

  // Gravity
  player.vy += 0.5;
  player.y += player.vy;

  if (player.y >= 380) {
    player.y = 380;
    player.vy = 0;
    player.onGround = true;
  }

  // Move objects
  objects.forEach((o, i) => {
    o.x -= speed;

    // Coin
    if (o.type === "coin") {
      if (Math.abs(player.x - o.x) < 40 && Math.abs(player.y - o.y) < 40) {
        coins++;
        coinProg++;
        beep(900, 0.05);
        objects.splice(i, 1);
      }
    }

    // Stone
    if (o.type === "stone") {
      if (coll(player, o)) {
        rage += 20;
        beep(200, 0.1);
        if (rage >= 100) endGame();
        objects.splice(i, 1);
      }
    }

    // remove off screen
    if (o.x < -100) objects.splice(i, 1);
  });

  // Remove warnings
  warnings = warnings.filter(w => (w.time -= 16) > 0);

  // Update UI
  coinVal.textContent = coins;
  distVal.textContent = Math.floor(distance);
  scoreVal.textContent = score;
  levelVal.textContent = level;
  rageFill.style.width = rage + "%";
  progressFill.style.width = (coinProg * 2) + "%";
}

// --------------------------------------------
// DRAW ENTITIES
// --------------------------------------------
function drawObjects() {
  objects.forEach(o => {
    if (o.type === "coin") {
      ctx.fillStyle = "gold";
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (o.type === "stone") {
      ctx.fillStyle = "#666";
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  });

  warnings.forEach(w => {
    ctx.fillStyle = "yellow";
    ctx.font = "30px Arial";
    ctx.fillText("⚠", w.x, w.y);
  });
}

// --------------------------------------------
// GAME OVER
// --------------------------------------------
function endGame() {
  running = false;
  gameOver = true;
  beep(150, 0.2);

  overMsg.innerHTML = `
    <h2>GAME OVER</h2>
    <p>You fell like a true courier 😂</p>
    <p>Score: ${score} | Coins: ${coins} | Distance: ${Math.floor(distance)}m</p>
  `;

  overlay.classList.remove("hidden");
}

document.getElementById("restart").onclick = () => location.reload();

// --------------------------------------------
// MAIN LOOP
// --------------------------------------------
function loop() {
  if (!running) return;

  update();

  drawBackground();
  drawObjects();
  drawPlayer();

  requestAnimationFrame(loop);
}

// --------------------------------------------
// START GAME
// --------------------------------------------
setInterval(spawnCoin, 900);
setInterval(spawnStone, 3500);
loop();
