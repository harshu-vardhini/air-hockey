const canvas = document.getElementById('hockey');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width, HEIGHT = canvas.height;
const GOAL_WIDTH = 160, GOAL_DEPTH = 20;
const PADDLE_RADIUS = 30, PUCK_RADIUS = 18;

let playerScore = 0, aiScore = 0;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Entities
function Paddle(x, y, isAI = false) {
  this.x = x;
  this.y = y;
  this.isAI = isAI;
}

function Puck() {
  this.x = WIDTH/2;
  this.y = HEIGHT/2;
  this.vx = (Math.random() > 0.5 ? 1 : -1) * 5;
  this.vy = (Math.random() > 0.5 ? 1 : -1) * 3;
}

const player = new Paddle(WIDTH/2, HEIGHT-PADDLE_RADIUS*2),
      ai = new Paddle(WIDTH/2, PADDLE_RADIUS*2, true),
      puck = new Puck();

function resetPuck(whoScores) {
  puck.x = WIDTH/2;
  puck.y = HEIGHT/2;
  puck.vx = (whoScores === 'ai' ? -1 : 1) * (4 + Math.random() * 2);
  puck.vy = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);
}

canvas.onmousemove = function(e) {
  let rect = canvas.getBoundingClientRect();
  let mx = e.clientX - rect.left;
  // Restrict player paddle to bottom half
  player.x = clamp(mx, PADDLE_RADIUS, WIDTH - PADDLE_RADIUS);
  player.y = clamp(HEIGHT - HEIGHT/3, player.y, HEIGHT - PADDLE_RADIUS);
};

function aiMove() {
  // Follow puck, but not perfectly (easy/medium AI)
  let targetX = puck.x + (Math.random() * 36 - 18);
  let speed = 3;
  if (Math.abs(targetX - ai.x) > speed) {
    ai.x += targetX > ai.x ? speed : -speed;
    ai.x = clamp(ai.x, PADDLE_RADIUS, WIDTH-PADDLE_RADIUS);
  }
}

function drawTable() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Boards
  ctx.fillStyle = "#fff";
  ctx.fillRect((WIDTH-GOAL_WIDTH)/2, 0, GOAL_WIDTH, GOAL_DEPTH);
  ctx.fillRect((WIDTH-GOAL_WIDTH)/2, HEIGHT-GOAL_DEPTH, GOAL_WIDTH, GOAL_DEPTH);
  // Center line
  ctx.strokeStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT/2);
  ctx.lineTo(WIDTH, HEIGHT/2);
  ctx.stroke();
  // Center circle
  ctx.beginPath();
  ctx.arc(WIDTH/2, HEIGHT/2, 50, 0, Math.PI*2);
  ctx.stroke();
}

function drawPaddle(paddle, color) {
  ctx.beginPath();
  ctx.arc(paddle.x, paddle.y, PADDLE_RADIUS, 0, Math.PI*2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

function drawPuck() {
  ctx.beginPath();
  ctx.arc(puck.x, puck.y, PUCK_RADIUS, 0, Math.PI*2);
  ctx.fillStyle = "#222";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

function drawScores() {
  ctx.font = "32px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(`${playerScore}`, WIDTH/2 - 60, 45);
  ctx.fillText(`${aiScore}`, WIDTH/2 + 30, 45);
}

function collidePaddle(pad) {
  let dx = puck.x - pad.x, dy = puck.y - pad.y,
      dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < PADDLE_RADIUS + PUCK_RADIUS) {
    // Reflect puck - simple vector maths
    let angle = Math.atan2(dy, dx);
    let spd = Math.sqrt(puck.vx*puck.vx + puck.vy*puck.vy) * 1.1;
    puck.vx = Math.cos(angle) * spd;
    puck.vy = Math.sin(angle) * spd;
    // Move puck outside paddle
    puck.x = pad.x + Math.cos(angle)*(PADDLE_RADIUS + PUCK_RADIUS);
    puck.y = pad.y + Math.sin(angle)*(PADDLE_RADIUS + PUCK_RADIUS);
  }
}

function update() {
  // AI logic
  aiMove();

  // Puck movement
  puck.x += puck.vx;
  puck.y += puck.vy;

  // Collide with left/right borders
  if (puck.x < PUCK_RADIUS || puck.x > WIDTH - PUCK_RADIUS) {
    puck.vx = -puck.vx;
    puck.x = clamp(puck.x, PUCK_RADIUS, WIDTH - PUCK_RADIUS);
  }

  // Collide with player paddle
  collidePaddle(player);
  collidePaddle(ai);

  // Collide with top/bottom borders, check goal
  if (puck.y < PUCK_RADIUS) {
    // Top border/goal
    if (
      puck.x > (WIDTH-GOAL_WIDTH)/2 && puck.x < (WIDTH+GOAL_WIDTH)/2
    ) {
      playerScore++;
      resetPuck('player');
    } else {
      puck.vy = -puck.vy;
      puck.y = PUCK_RADIUS;
    }
  }
  if (puck.y > HEIGHT - PUCK_RADIUS) {
    // Bottom border/goal
    if (
      puck.x > (WIDTH-GOAL_WIDTH)/2 && puck.x < (WIDTH+GOAL_WIDTH)/2
    ) {
      aiScore++;
      resetPuck('ai');
    } else {
      puck.vy = -puck.vy;
      puck.y = HEIGHT - PUCK_RADIUS;
    }
  }
}

function render() {
  drawTable();
  drawScores();
  drawPaddle(player, "#fa2");
  drawPaddle(ai, "#08e");
  drawPuck();
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();
