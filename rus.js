
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const startBtn = document.getElementById("startBtn");

const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("bestScore");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 55;

const bird = {
    x: 85,
    y: 270,
    radius: 15,
    velocity: 0,
    gravity: 0.38,
    jump: -6.5,
    rotation: 0
};

const pipeSettings = {
    width: 65,
    gap: 165,
    speed: 2.5,
    spacing: 230
};

let pipes = [];
let score = 0;
let bestScore = 0;
let gameState = "ready";
let animationId;
let lastTime = 0;
let spawnTimer = 0;

try {
    bestScore = Number(localStorage.getItem("flappyBest")) || 0;
} catch (error) {
    bestScore = 0;
}

bestScoreElement.textContent = bestScore;

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#70c5ce");
    sky.addColorStop(1, "#d5f6ff");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawCloud(70, 100, 1);
    drawCloud(290, 165, 0.8);
    drawCloud(180, 45, 0.65);

    ctx.fillStyle = "#a6df9b";
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT - GROUND_HEIGHT - 35);
    ctx.quadraticCurveTo(100, 350, 200, HEIGHT - GROUND_HEIGHT - 30);
    ctx.quadraticCurveTo(310, 370, WIDTH, HEIGHT - GROUND_HEIGHT - 35);
    ctx.lineTo(WIDTH, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.fill();

    
    ctx.fillStyle = "#ded895";
    ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);

    ctx.fillStyle = "#74bf40";
    ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 12);

    ctx.fillStyle = "#b6a866";

    for (let x = 0; x < WIDTH; x += 25) {
        ctx.fillRect(x, HEIGHT - 22, 12, 5);
    }
}

function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "#ffffffcc";
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.arc(22, -10, 25, 0, Math.PI * 2);
    ctx.arc(45, 0, 19, 0, Math.PI * 2);
    ctx.arc(23, 8, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawBird() {
    ctx.save();

    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    ctx.fillStyle = "#ffdc35";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#d99b16";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#f5a623";
    ctx.beginPath();
    ctx.ellipse(-5, 4, 9, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(8, -6, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(10, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff7043";
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(27, 4);
    ctx.lineTo(14, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawPipe(pipe) {
    const bottomY = pipe.topHeight + pipeSettings.gap;
    const groundY = HEIGHT - GROUND_HEIGHT;

    ctx.fillStyle = "#36c94b";
    ctx.fillRect(
        pipe.x,
        0,
        pipeSettings.width,
        pipe.topHeight
    );

    ctx.fillRect(
        pipe.x - 5,
        pipe.topHeight - 22,
        pipeSettings.width + 10,
        22
    );

    ctx.fillRect(
        pipe.x,
        bottomY,
        pipeSettings.width,
        groundY - bottomY
    );

    ctx.fillRect(
        pipe.x - 5,
        bottomY,
        pipeSettings.width + 10,
        22
    );

    ctx.fillStyle = "#91f29a";
    ctx.fillRect(pipe.x + 8, 0, 9, pipe.topHeight - 22);
    ctx.fillRect(
        pipe.x + 8,
        bottomY + 22,
        9,
        groundY - bottomY - 22
    );

    ctx.strokeStyle = "#168d35";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        pipe.x,
        0,
        pipeSettings.width,
        pipe.topHeight
    );

    ctx.strokeRect(
        pipe.x,
        bottomY,
        pipeSettings.width,
        groundY - bottomY
    );

    ctx.strokeRect(
        pipe.x - 5,
        pipe.topHeight - 22,
        pipeSettings.width + 10,
        22
    );

    ctx.strokeRect(
        pipe.x - 5,
        bottomY,
        pipeSettings.width + 10,
        22
    );
}

function createPipe() {
    const minTop = 55;
    const maxTop = HEIGHT - GROUND_HEIGHT - pipeSettings.gap - 55;

    const topHeight =
        Math.random() * (maxTop - minTop) + minTop;

    pipes.push({
        x: WIDTH + 10,
        topHeight: topHeight,
        scored: false
    });
}

function checkCollision(pipe) {
    const birdLeft = bird.x - bird.radius;
    const birdRight = bird.x + bird.radius;
    const birdTop = bird.y - bird.radius;
    const birdBottom = bird.y + bird.radius;

    const pipeLeft = pipe.x - 5;
    const pipeRight = pipe.x + pipeSettings.width + 5;

    const hitsPipeHorizontally =
        birdRight > pipeLeft && birdLeft < pipeRight;

    const bottomPipeY = pipe.topHeight + pipeSettings.gap;

    const hitsPipeVertically =
        birdTop < pipe.topHeight ||
        birdBottom > bottomPipeY;

    return hitsPipeHorizontally && hitsPipeVertically;
}

function update(deltaTime) {
    const factor = Math.min(deltaTime / 16.67, 2);

    bird.velocity += bird.gravity * factor;
    bird.y += bird.velocity * factor;

    bird.rotation = Math.min(
        Math.PI / 4,
        Math.max(-0.4, bird.velocity * 0.07)
    );

    if (
        bird.y + bird.radius >= HEIGHT - GROUND_HEIGHT ||
        bird.y - bird.radius <= 0
    ) {
        endGame();
        return;
    }

    spawnTimer += deltaTime;

    if (spawnTimer >= 1450) {
        createPipe();
        spawnTimer = 0;
    }

    for (const pipe of pipes) {
        pipe.x -= pipeSettings.speed * factor;

        if (checkCollision(pipe)) {
            endGame();
            return;
        }

        if (
            !pipe.scored &&
            pipe.x + pipeSettings.width < bird.x
        ) {
            pipe.scored = true;
            score++;

            scoreElement.textContent = score;

            if (score > bestScore) {
                bestScore = score;
                bestScoreElement.textContent = bestScore;

                try {
                    localStorage.setItem("flappyBest", bestScore);
                } catch (error) {
                }
            }
        }
    }

    pipes = pipes.filter(
        pipe => pipe.x + pipeSettings.width + 10 > 0
    );
}

function drawGame() {
    drawBackground();

    for (const pipe of pipes) {
        drawPipe(pipe);
    }

    drawBird();
}

function gameLoop(timestamp) {
    if (gameState !== "playing") return;

    const deltaTime = lastTime
        ? Math.min(timestamp - lastTime, 33)
        : 16.67;

    lastTime = timestamp;

    update(deltaTime);
    drawGame();

    if (gameState === "playing") {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    cancelAnimationFrame(animationId);

    bird.y = HEIGHT / 2;
    bird.velocity = 0;
    bird.rotation = 0;

    pipes = [];
    score = 0;
    spawnTimer = 0;
    lastTime = 0;

    scoreElement.textContent = score;

    gameState = "playing";
    overlay.style.display = "none";

    drawGame();
    animationId = requestAnimationFrame(gameLoop);
}

function flap() {
    if (gameState === "playing") {
        bird.velocity = bird.jump;
    }
}

function endGame() {
    if (gameState !== "playing") return;

    gameState = "over";

    cancelAnimationFrame(animationId);

    drawGame();

    overlayTitle.textContent = "Game Over!";
    overlayMessage.textContent =
        `Your score: ${score} | Best: ${bestScore}`;

    startBtn.textContent = "Play Again";
    overlay.style.display = "flex";
}

document.addEventListener("keydown", function (event) {
    if (
        event.code === "Space" ||
        event.code === "ArrowUp"
    ) {
        event.preventDefault();

        if (event.repeat) return;

        if (gameState === "playing") {
            flap();
        } else {
            startGame();
            flap();
        }
    }
});

canvas.addEventListener("pointerdown", function () {
    if (gameState === "playing") {
        flap();
    } else {
        startGame();
        flap();
    }
});

startBtn.addEventListener("click", startGame);

drawGame();
