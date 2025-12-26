const dino = document.getElementById("dino");
const obstaclesContainer = document.getElementById("obstacles");
const scoreEl = document.getElementById("score");
const hiScoreEl = document.getElementById("hi-score");
const gameOverEl = document.getElementById("game-over");
const body = document.body;

const shapes = {
  stand: document.querySelector(".stand"),
  run1: document.querySelector(".run1"),
  run2: document.querySelector(".run2"),
  duck1: document.querySelector(".duck1"),
  duck2: document.querySelector(".duck2"),
  dead: document.querySelector(".dead")
};

let isRunning = false;
let isGameOver = false;
let score = 0;
let hiScore = 0;
let speed = 7;
let frame = 0;
let gameTime = 0;

let dinoY = 0;
let dinoVel = 0;
let gravity = 0.8;
let jumpPower = 13;
let isJumping = false;
let isDucking = false;

const OBSTACLES = [
  { type: 'c1', w: 17, h: 35, y: 0, path: 'M17 35H0V0h17v35z M15 35H2V18H0v-6h2V0h4v12h2V0h4v12h2v6h-2v17z' },
  { type: 'c2', w: 34, h: 35, y: 0, path: 'M17 35H0V0h17v35z M15 35H2V18H0v-6h2V0h4v12h2V0h4v12h2v6h-2v17z', multi: 2 },
  { type: 'c3', w: 51, h: 35, y: 0, path: 'M17 35H0V0h17v35z M15 35H2V18H0v-6h2V0h4v12h2V0h4v12h2v6h-2v17z', multi: 3 },
  { type: 'cb1', w: 25, h: 50, y: 0, path: 'M25 50H0V0h25v50z M23 50H2V33H0v-7h2V13H0V0h9v13h2v23h3v14h9V39h2V26h-3V13h3V0h-4v13h-2v7h-2v30z' },
  { type: 'cb2', w: 50, h: 50, y: 0, path: 'M25 50H0V0h25v50z M23 50H2V33H0v-7h2V13H0V0h9v13h2v23h3v14h9V39h2V26h-3V13h3V0h-4v13h-2v7h-2v30z', multi: 2 },
  { type: 'bird', w: 46, h: 40, y: [10, 25, 45], isBird: true,
    path1: 'M46 22V13h-2V8h-2V4h-7V0H11v4H6v4H0v7h3v4h3v4h5v-4h3v4h5v4h10v-4h2v4h3v-4h6v-5h-2v-2h2v-3h-2z',
    path2: 'M46 22V13h-2V8h-2V4h-7V0H11v4H6v4H0v7h3v4h3v4h5v-4h3v-4h3v-4h10v4h2v-4h3v4h6v-5h-2v-2h2v-3h-2z'
  }
];

let nextSpawnTime = 0;
const keys = {};

document.addEventListener("keydown", e => {
  keys[e.code] = true;
  if (!isRunning && !isGameOver && (e.code === "Space" || e.code === "ArrowUp")) startGame();
  if (isGameOver && (e.code === "Space" || e.code === "ArrowUp")) startGame();
});
document.addEventListener("keyup", e => keys[e.code] = false);
document.addEventListener("touchstart", () => { if (!isRunning && !isGameOver) startGame(); else if(!isJumping) { isJumping = true; dinoVel = jumpPower; } });

function startGame() {
  isRunning = true;
  isGameOver = false;
  score = 0;
  speed = 7;
  gameTime = 0;
  nextSpawnTime = 0;
  dinoY = 0;
  dinoVel = 0;
  isJumping = false;
  obstaclesContainer.innerHTML = "";
  gameOverEl.classList.add("hidden");
  body.classList.remove("dark-mode");
  requestAnimationFrame(update);
}

function update() {
  if (!isRunning) return;
  gameTime++;
  frame++;
  
  if (keys["ArrowDown"]) {
    isDucking = true;
    if (isJumping) dinoVel -= 2;
  } else {
    isDucking = false;
  }

  if ((keys["Space"] || keys["ArrowUp"]) && !isJumping && !isDucking) {
    isJumping = true;
    dinoVel = jumpPower;
  }

  dinoY += dinoVel;
  dinoVel -= gravity;
  if (dinoY <= 0) { dinoY = 0; dinoVel = 0; isJumping = false; }

  if (gameTime > nextSpawnTime) {
    createObstacle();
    nextSpawnTime = gameTime + 60 + (speed * 2) + Math.random() * 50;
  }

  Array.from(obstaclesContainer.children).forEach(el => {
    let left = parseFloat(el.style.left) - speed;
    el.style.left = left + "px";
    if (el.dataset.bird === "true" && frame % 10 === 0) el.classList.toggle("flap");
    if (checkCollision(el)) gameOver();
    if (left < -100) el.remove();
  });

  score += 0.15;
  let disp = Math.floor(score);
  scoreEl.innerText = disp.toString().padStart(5, '0');
  if (disp > 0 && disp % 100 === 0) speed = Math.min(speed + 0.2, 13);
  if (Math.floor(disp / 700) % 2 === 1) body.classList.add("dark-mode"); else body.classList.remove("dark-mode");

  renderDino();
  requestAnimationFrame(update);
}

function createObstacle() {
  let list = OBSTACLES;
  if (score < 400) list = list.filter(o => !o.isBird);
  const data = list[Math.floor(Math.random() * list.length)];
  const el = document.createElement("div");
  el.className = "obstacle";
  el.style.left = "850px";
  let bottom = Array.isArray(data.y) ? data.y[Math.floor(Math.random() * data.y.length)] : data.y;
  el.style.bottom = (bottom + 10) + "px";
  
  let svg = data.isBird ? 
    `<path class="wing-up" d="${data.path1}"/><path class="wing-down" d="${data.path2}"/>` :
    `<path d="${data.path}"/>` + (data.multi >= 2 ? `<path transform="translate(${data.w/data.multi},0)" d="${data.path}"/>` : '') + (data.multi >= 3 ? `<path transform="translate(${(data.w/data.multi)*2},0)" d="${data.path}"/>` : '');
    
  el.innerHTML = `<svg width="${data.w}" height="${data.h}" viewBox="0 0 ${data.w} ${data.h}" class="obs-svg">${svg}</svg>`;
  if(data.isBird) el.dataset.bird = "true";
  obstaclesContainer.appendChild(el);
}

function checkCollision(obs) {
  const dRect = dino.getBoundingClientRect();
  const oRect = obs.getBoundingClientRect();
  const padX = 10, padY = 8, headPad = isDucking ? 15 : 0;
  return !(dRect.right - padX < oRect.left + padX || dRect.left + padX > oRect.right - padX || dRect.bottom - padY < oRect.top + padY || dRect.top + padY + headPad > oRect.bottom - padY);
}

function renderDino() {
  dino.style.bottom = (dinoY + 10) + "px";
  Object.values(shapes).forEach(s => s.classList.add("hidden"));
  if (isGameOver) { shapes.dead.classList.remove("hidden"); return; }
  if (isJumping) { shapes.stand.classList.remove("hidden"); dino.classList.remove("ducking"); }
  else {
    let runFrame = Math.floor(frame / 6) % 2 === 0;
    if (isDucking) { dino.classList.add("ducking"); shapes[runFrame ? 'duck1' : 'duck2'].classList.remove("hidden"); }
    else { dino.classList.remove("ducking"); shapes[runFrame ? 'run1' : 'run2'].classList.remove("hidden"); }
  }
}

function gameOver() {
  isRunning = false;
  isGameOver = true;
  renderDino();
  gameOverEl.classList.remove("hidden");
  if (score > hiScore) { hiScore = Math.floor(score); hiScoreEl.innerText = "HI " + hiScore.toString().padStart(5, '0'); }
}