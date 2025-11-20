// ---------------------------
// NEblox Game - Final Script
// ---------------------------

/* ====== CONFIG & ASSETS ====== */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const BASE_W = 900, BASE_H = 500; // internal design resolution

// Images (place files under assets/)
const assets = {
  player: "assets/player.png",
  enemy: "assets/enemy.png",
  platform: "assets/platform.png",
  key: "assets/key.png",
  door: "assets/door.png",
  background: "assets/background.png"
};

let images = {};
let loaded = 0;
const assetKeys = Object.keys(assets);

function preloadAssets(done) {
  assetKeys.forEach(k => {
    const img = new Image();
    img.src = assets[k];
    img.onload = () => {
      loaded++;
      images[k] = img;
      if (loaded === assetKeys.length) done();
    };
    img.onerror = () => {
      console.warn("Gagal load asset:", assets[k]);
      loaded++;
      images[k] = img;
      if (loaded === assetKeys.length) done();
    };
  });
}

/* ====== DOM ====== */
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const questionBox = document.getElementById("questionBox");
const questionText = document.getElementById("questionText");
const answerInput = document.getElementById("answerInput");
const answerBtn = document.getElementById("answerBtn");
const cancelBtn = document.getElementById("cancelBtn");

/* ====== QUESTIONS ====== */
const questions = [
  { q: "Ibukota Indonesia?", a: "jakarta" },
  { q: "Planet terbesar?", a: "jupiter" },
  { q: "Gunung tertinggi?", a: "everest" }
];

/* ====== GAME STATE ====== */
let keys = {};
let paused = false;
let started = false;

// Player def (positions based on BASE_W/H)
let player = {
  x: 100, y: 350, w: 60, h: 80,
  vy: 0, gravity: 1.2, onGround: false,
  img: null, hp: 3, invulnerable: false
};

// Enemy def
let enemy = {
  x: 600, y: 360, w: 60, h: 80, dir: 1,
  img: null, hp: 3, dead: false
};

// Key & door & platform positions
let keyObj = { x: 400, y: 330, w:40, h:40, taken:false, asked:false };
let door = { x: 800, y: 320, w:60, h:100 };
let platformY = 430;

/* ====== INPUT HANDLING ====== */
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === " " ) e.preventDefault(); // prevent page scroll
});
document.addEventListener("keyup", e => keys[e.key] = false);

// Attack (A)
document.addEventListener("keydown", e => {
  if (!started || paused) return;
  if (e.key.toLowerCase() === "a") doAttack();
});

/* ====== Attack logic ====== */
let canAttack = true;
function doAttack(){
  if (!canAttack) return;
  canAttack = false;
  // attack cooldown
  setTimeout(()=> canAttack = true, 300);

  // simple hitbox check (player front)
  if (enemy.dead) return;
  const hit = player.x + player.w >= enemy.x &&
              player.x <= enemy.x + enemy.w &&
              Math.abs((player.y + player.h/2) - (enemy.y + enemy.h/2)) < 60;
  if (hit) {
    enemy.hp--;
    enemy.x += 25 * enemy.dir; // knockback
    // small flash handled by draw
    if (enemy.hp <= 0) {
      enemy.dead = true;
      // optional reward: open door / animate
      setTimeout(()=> {
        // enemy removed
      }, 400);
    }
  }
}

/* ====== Question modal ====== */
function askQuestion(callback) {
  paused = true;
  questionBox.style.display = "flex";
  // pick random question
  const q = questions[Math.floor(Math.random() * questions.length)];
  questionText.textContent = q.q;
  answerInput.value = "";
  answerInput.focus();

  function submit() {
    const ans = answerInput.value.toLowerCase().trim();
    questionBox.style.display = "none";
    paused = false;
    answerBtn.removeEventListener("click", submit);
    cancelBtn.removeEventListener("click", cancel);
    callback(ans === q.a);
  }
  function cancel() {
    questionBox.style.display = "none";
    paused = false;
    answerBtn.removeEventListener("click", submit);
    cancelBtn.removeEventListener("click", cancel);
    callback(false);
  }

  answerBtn.addEventListener("click", submit);
  cancelBtn.addEventListener("click", cancel);
}

/* ====== Start Game ====== */
startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  canvas.style.display = "block";
  start();
});

/* ====== Start function (after assets loaded) ====== */
function start(){
  if (started) return;
  started = true;
  // attach images
  player.img = images.player;
  enemy.img = images.enemy;
  platformImg = images.platform;
  keyObj.img = images.key;
  door.img = images.door;
  // resize & run loop
  window.addEventListener("resize", adaptCanvas);
  adaptCanvas();
  requestAnimationFrame(loop);
}

/* ====== Canvas adapt (we keep internal 900x500 but CSS scales to full screen) ====== */
function adaptCanvas(){
  // keep internal res BASE_W x BASE_H (for consistent coords)
  canvas.width = BASE_W;
  canvas.height = BASE_H;
  // CSS stretches canvas to viewport (handled by style.css width/height)
}

/* ====== GAME LOOP ====== */
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

/* ====== UPDATE ====== */
let platformImg = null;
function update(){
  if (!started || paused) return;

  // movement
  if (keys["ArrowRight"]) player.x += 5;
  if (keys["ArrowLeft"]) player.x -= 5;

  // jump
  if (keys[" "] && player.onGround) {
    player.vy = -15;
    player.onGround = false;
  }

  // gravity
  player.vy += player.gravity;
  player.y += player.vy;

  // ground collision
  if (player.y + player.h >= platformY) {
    player.y = platformY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // bounds
  player.x = Math.max(0, Math.min(BASE_W - player.w, player.x));

  // enemy movement (patrol)
  if (!enemy.dead) {
    enemy.x += enemy.dir * 2;
    if (enemy.x <= 500) enemy.dir = 1;
    if (enemy.x >= 700) enemy.dir = -1;
  }

  // enemy touches player => damage (with invuln cooldown)
  if (!enemy.dead && !player.invulnerable &&
      player.x < enemy.x + enemy.w &&
      player.x + player.w > enemy.x &&
      player.y < enemy.y + enemy.h &&
      player.y + player.h > enemy.y) {

    player.hp--;
    player.invulnerable = true;
    // knockback
    player.x -= 40;

    setTimeout(() => player.invulnerable = false, 800);

    if (player.hp <= 0) {
      paused = true;
      setTimeout(()=> alert("Kamu kalah! Refresh untuk coba lagi."), 50);
    }
  }

  // take key: only if touches and not taken
  if (!keyObj.taken && !keyObj.asked &&
      player.x < keyObj.x + keyObj.w &&
      player.x + player.w > keyObj.x &&
      player.y < keyObj.y + keyObj.h &&
      player.y + player.h > keyObj.y) {
    keyObj.asked = true;
    askQuestion(correct => {
      if (correct) {
        keyObj.taken = true;
        setTimeout(()=> alert("Benar! Kunci didapat."), 50);
      } else {
        // allow to try again later
        keyObj.asked = false;
        setTimeout(()=> alert("Jawaban salah. Coba lagi."), 50);
      }
    });
  }

  // open door (only when key taken)
  if (keyObj.taken &&
      player.x < door.x + door.w &&
      player.x + player.w > door.x &&
      player.y < door.y + door.h &&
      player.y + player.h > door.y) {
    paused = true;
    setTimeout(()=> alert("Level selesai! Selamat!"), 50);
  }
}

/* ====== DRAW ====== */
function draw(){
  // background image fill (stretch)
  if (images.background) {
    ctx.drawImage(images.background, 0, 0, BASE_W, BASE_H);
  } else {
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0,0,BASE_W,BASE_H);
  }

  // platform (ground)
  if (platformImg) {
    ctx.drawImage(platformImg, 0, platformY, BASE_W, BASE_H - platformY);
  } else {
    ctx.fillStyle = "#b8860b";
    ctx.fillRect(0, platformY, BASE_W, BASE_H - platformY);
  }

  // key
  if (!keyObj.taken && keyObj.img) {
    ctx.drawImage(keyObj.img, keyObj.x, keyObj.y, keyObj.w, keyObj.h);
  }

  // door
  if (door.img) ctx.drawImage(door.img, door.x, door.y, door.w, door.h);

  // enemy
  if (!enemy.dead) {
    // flash red when low hp
    if (enemy.hp <= 1) {
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.w, enemy.h);
      ctx.restore();
    } else {
      ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.w, enemy.h);
    }
  } else {
    // optionally draw a small 'defeated' sprite or nothing
  }

  // player
  if (player.img) {
    // flicker while invulnerable
    if (player.invulnerable && Math.floor(Date.now()/80) % 2 === 0) {
      // skip draw to create flicker
    } else {
      ctx.drawImage(player.img, player.x, player.y, player.w, player.h);
    }
  } else {
    ctx.fillStyle = "green";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // HUD: draw HP
  drawHUD();
}

function drawHUD(){
  // semi-transparent panel
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(10,10,220,70);
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText("Player HP:", 20, 34);
  // hearts
  for (let i=0;i<3;i++){
    const x = 20 + i*34;
    const y = 40;
    if (i < player.hp) {
      ctx.fillStyle = "#ff4d4d";
      roundRect(ctx, x, y, 26, 18, 4, true, false);
    } else {
      ctx.strokeStyle = "#aaa";
      roundRect(ctx, x, y, 26, 18, 4, false, true);
    }
  }

  // enemy hp on right
  ctx.fillStyle = "#fff";
  ctx.fillText("Enemy HP:", BASE_W - 120, 34);
  for (let i=0;i<3;i++){
    const x = BASE_W - 120 + i*30;
    const y = 40;
    if (i < enemy.hp && !enemy.dead) {
      ctx.fillStyle = "#ff3333";
      roundRect(ctx, x, y, 24, 16, 4, true, false);
    } else {
      ctx.strokeStyle = "#555";
      roundRect(ctx, x, y, 24, 16, 4, false, true);
    }
  }

  ctx.restore();
}

// small helper to draw rounded rect
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/* ====== INIT PRELOAD & UI ====== */
preloadAssets(()=> {
  // show start screen already visible; wait user to press start
  // But let canvas be visible behind if desired:
  // canvas.style.display = "block";
  // draw initial background to preview
  adaptCanvas();
  draw();
});

// allow answer input Enter
answerInput.addEventListener("keydown", e => {
  if (e.key === "Enter") answerBtn.click();
});
