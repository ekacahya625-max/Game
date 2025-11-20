// Canvas Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Tombol start
document.getElementById("startBtn").onclick = () => {
    document.getElementById("startScreen").style.display = "none";
    canvas.style.display = "block";
    startGame();
};

// Player
let player = {
    x: 100,
    y: 350,
    w: 60,
    h: 80,
    vy: 0,
    gravity: 1,
    onGround: false,
    img: new Image()
};
player.img.src = "assets/player.png";

// Platform
let platformImg = new Image();
platformImg.src = "assets/platform.png";

// Enemy
let enemy = {
    x: 600,
    y: 360,
    w: 60,
    h: 80,
    dir: 1,
    img: new Image()
};
enemy.img.src = "assets/enemy.png";

// Key
let key = {
    x: 400,
    y: 330,
    w: 40,
    h: 40,
    taken: false,
    img: new Image()
};
key.img.src = "assets/key.png";

// Door
let door = {
    x: 800,
    y: 320,
    w: 60,
    h: 100,
    img: new Image()
};
door.img.src = "assets/door.png";

// Soal
const questions = [
    { q: "Ibukota Indonesia?", a: "jakarta" },
    { q: "Planet terbesar?", a: "jupiter" },
    { q: "Gunung tertinggi?", a: "everest" }
];

// Keyboard control
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Pertanyaan Modal
function askQuestion(callback) {
    const q = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById("questionText").textContent = q.q;
    document.getElementById("questionBox").style.display = "flex";

    document.getElementById("answerBtn").onclick = () => {
        let input = document.getElementById("answerInput").value.toLowerCase();
        if (input === q.a) callback(true);
        else callback(false);

        document.getElementById("questionBox").style.display = "none";
        document.getElementById("answerInput").value = "";
    };
}

// Game Loop
function startGame() {
    function update() {

        // Gerakan player
        if (keys["ArrowRight"]) player.x += 5;
        if (keys["ArrowLeft"]) player.x -= 5;

        if (keys[" "] && player.onGround) {
            player.vy = -15;
            player.onGround = false;
        }

        player.vy += player.gravity;
        player.y += player.vy;

        if (player.y + player.h >= 430) {
            player.y = 430 - player.h;
            player.onGround = true;
        }

        // Enemy movement
        enemy.x += enemy.dir * 2;
        if (enemy.x <= 500 || enemy.x >= 700) enemy.dir *= -1;

        // Ambil kunci
        if (!key.taken &&
            player.x < key.x + key.w &&
            player.x + player.w > key.x &&
            player.y < key.y + key.h &&
            player.y + player.h > key.y
        ) {
            askQuestion(correct => {
                if (correct) key.taken = true;
                else alert("Jawaban salah!");
            });
        }

        // Buka pintu
        if (key.taken &&
            player.x < door.x + door.w &&
            player.x + player.w > door.x
        ) {
            alert("Level Selesai!");
        }

        draw();
        requestAnimationFrame(update);
    }
    update();
}

// Draw
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(player.img, player.x, player.y, player.w, player.h);
    ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.w, enemy.h);
    ctx.drawImage(platformImg, 0, 430, 900, 80);
    if (!key.taken) ctx.drawImage(key.img, key.x, key.y, key.w, key.h);
    ctx.drawImage(door.img, door.x, door.y, door.w, door.h);
}
