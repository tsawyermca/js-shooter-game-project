const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const killsDisplay = document.getElementById('kills');
const waveDisplay = document.getElementById('wave');
const gameOverDisplay = document.getElementById('gameOver');
const pauseStatusDisplay = document.getElementById('pauseStatus');
const backgroundMusic = document.getElementById('backgroundMusic');
let waveSpawnInterval;
let score = 0;
let kills = 0;
let wave = 0;
let gameActive = true;
let isPaused = false;
let bullets = [];
let enemies = [];
let playerX = parseFloat(getComputedStyle(player).left);
let playerY = parseFloat(getComputedStyle(player).top);
let keys = {};
const basePlayerSpeed = 2.5;
const baseBulletSpeed = 5;
const baseEnemySpeed = 0.6;
const waveInterval = 10000;
let enemiesPerWave = 4;


//BGM
function initMusic() {
  if (!backgroundMusic) {
    console.warn('Background music element not found');
    return;
  }
  backgroundMusic.volume = 0.2;
  const muteButton = document.getElementById('muteButton');
  if (muteButton) {
    muteButton.addEventListener('click', () => {
      backgroundMusic.muted = !backgroundMusic.muted;
      muteButton.textContent = backgroundMusic.muted ? 'Unmute' : 'Mute';
      muteButton.blur();
    });
  } else {
    console.warn('muteButton not found');
  }
}

//Adjusts character speed based on various screen sizes
function getScaledSpeeds() {
  const gameAreaRect = gameArea.getBoundingClientRect();
  const referenceWidth = 300;
  const scale = gameAreaRect.width / referenceWidth;
  return {
    playerSpeed: basePlayerSpeed * scale,
    bulletSpeed: baseBulletSpeed * scale,
    enemySpeed: baseEnemySpeed * scale
  };
}

//Allows keyboard usage
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  keys[key] = true;
  console.log('Key down:', key, 'Keys state:', { ...keys });
  if (backgroundMusic && backgroundMusic.paused && gameActive && !isPaused) {
    backgroundMusic.play().catch(err => console.warn('Music play failed:', err));
  }
  if (e.key === ' ' && gameActive && !isPaused) {
    shoot();
  }
  if (e.key.toLowerCase() === 'r' && !gameActive) {
    restartGame();
  }
  if (e.key.toLowerCase() === 'p' && gameActive) {
    togglePause();
  }
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  keys[key] = false;
  console.log('Key up:', key, 'Keys state:', { ...keys });
});


//P is for Pause
function togglePause() {
  isPaused = !isPaused;
  pauseStatusDisplay.style.display = isPaused ? 'block' : 'none';
  if (backgroundMusic) {
    if (isPaused) {
      backgroundMusic.pause();
    } else if (!backgroundMusic.muted) {
      backgroundMusic.play().catch(err => console.log('Music play failed:', err));
    }
  }
}

//Moves Player ship
function movePlayer() {
  if (isPaused) return;
  const gameAreaRect = gameArea.getBoundingClientRect();
  const playerRect = player.getBoundingClientRect();
  const { playerSpeed } = getScaledSpeeds();
  let newX = playerX;
  let newY = playerY;
  if (keys['w']) newY -= playerSpeed;
  if (keys['s']) newY += playerSpeed;
  if (keys['a']) newX -= playerSpeed;
  if (keys['d']) newX += playerSpeed;
  newX = Math.max(0, Math.min(newX, gameAreaRect.width - playerRect.width));
  newY = Math.max(0, Math.min(newY, gameAreaRect.height - playerRect.height));
  playerX = newX;
  playerY = newY;
  player.style.left = playerX + 'px';
  player.style.top = playerY + 'px';
}

//Fire bullets
function shoot() {
  const bullet = document.createElement('div');
  bullet.className = 'bullet';
  gameArea.appendChild(bullet);
  const bulletWidth = parseFloat(getComputedStyle(bullet).width);
  const playerWidth = parseFloat(getComputedStyle(player).width);
  const bulletX = playerX + (playerWidth / 2) - (bulletWidth / 2);
  const bulletY = playerY - bulletWidth;
  bullet.style.left = bulletX + 'px';
  bullet.style.top = bulletY + 'px';
  bullets.push({ element: bullet, x: bulletX, y: bulletY });
}

//Prevents enemies spawning on top of each other
function checkOverlap(newX, newWidth, newY, newHeight, existingEnemies) {
  for (const enemy of existingEnemies) {
    const ex = enemy.x;
    const ey = enemy.y;
    const eWidth = parseFloat(getComputedStyle(enemy.element).width);
    const eHeight = eWidth;
    if (
      newX < ex + eWidth &&
      newX + newWidth > ex &&
      newY < ey + eHeight &&
      newY + newHeight > ey
    ) {
      return true;
    }
  }
  return false;
}

//Spawns a wave of enemies
function spawnWave() {
  if (!gameActive || isPaused) return;
  console.log('spawnWave called, wave:', wave);
  const enemyTypes = wave >= 25 ? ['D', 'E', 'F'] :
                    wave >= 20 ? ['D', 'E', 'C'] :
                    wave >= 15 ? ['D', 'B', 'C'] :
                    wave >= 5 ? ['A', 'B', 'C'] :
                    wave >= 3 ? ['A', 'B'] : ['A'];
  const gameAreaRect = gameArea.getBoundingClientRect();
  const newEnemies = [];
  let enemiesSpawned = false;
  for (let i = 0; i < enemiesPerWave; i++) {
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const enemy = document.createElement('div');
    enemy.className = `enemy${type}`;
    gameArea.appendChild(enemy);
    const enemyWidth = parseFloat(getComputedStyle(enemy).width);
    const enemyHeight = enemyWidth;
    let x, y;
    let attempts = 0;
    const maxAttempts = 10;
    do {
      x = Math.random() * (gameAreaRect.width - enemyWidth);
      y = -enemyWidth;
      attempts++;
    } while (
      checkOverlap(x, enemyWidth, y, enemyHeight, newEnemies) &&
      attempts < maxAttempts
    );
    if (attempts >= maxAttempts) {
      enemy.remove();
      continue;
    }
    enemy.style.left = x + 'px';
    enemy.style.top = y + 'px';
    let hitsNeeded = type === 'A' ? 1 : type === 'B' ? 5 : type === 'C' ? 3 :
                     type === 'D' ? 3 : type === 'E' ? 8 : 5;
    const newEnemy = { element: enemy, x, y, type, hits: hitsNeeded, spawnX: x };
    enemies.push(newEnemy);
    newEnemies.push(newEnemy);
    enemiesSpawned = true;
  }
  if (enemiesSpawned) {
    wave++;
    waveDisplay.textContent = wave;
    console.log('Wave incremented to:', wave);
    if (wave % 3 === 0 && enemiesPerWave < 10) {
      enemiesPerWave++;
    }
  }
}

//Keeps track of game state for pause/score/etc
function updateGame() {
  if (isPaused) return;
  const gameAreaRect = gameArea.getBoundingClientRect();
  const { bulletSpeed, enemySpeed } = getScaledSpeeds();
  bullets = bullets.filter(b => {
    b.y -= bulletSpeed;
    b.element.style.top = b.y + 'px';
    if (b.y < -parseFloat(getComputedStyle(b.element).height)) {
      b.element.remove();
      return false;
    }
    return true;
  });

  enemies.forEach(e => {
    if (e.type === 'C' || e.type === 'F') {
      const dx = playerX - e.x;
      const dy = playerY - e.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0) {
        e.x += (dx / distance) * enemySpeed;
        e.y += (dy / distance) * enemySpeed;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        e.element.style.transform = `rotate(${angle}deg)`;
      }
    } else if (e.type === 'B' || e.type === 'E') {
      e.y += enemySpeed;
      const amplitude = parseFloat(getComputedStyle(e.element).width) * 0.625;
      const frequency = 0.05;
      e.x = e.spawnX + amplitude * Math.sin(e.y * frequency);
    } else {
      e.y += enemySpeed;
    }
    e.element.style.left = e.x + 'px';
    e.element.style.top = e.y + 'px';
  });

  bullets.forEach(b => {
    const bx = b.x;
    const by = b.y;
    const bulletWidth = parseFloat(getComputedStyle(b.element).width);
    enemies.forEach(e => {
      const ex = e.x;
      const ey = e.y;
      const enemyWidth = parseFloat(getComputedStyle(e.element).width);
      const size = enemyWidth / 2;
      if (Math.abs(bx - ex) < size + bulletWidth / 2 && Math.abs(by - ey) < size + bulletWidth / 2) {
        e.hits--;
        b.element.remove();
        bullets = bullets.filter(bullet => bullet !== b);
        if (e.hits <= 0) {
          e.element.remove();
          enemies = enemies.filter(enemy => enemy !== e);
          kills++;
          score += e.type === 'A' ? 10 : e.type === 'B' ? 30 : e.type === 'C' ? 20 :
                   e.type === 'D' ? 30 : e.type === 'E' ? 45 : 70;
          scoreDisplay.textContent = score;
          killsDisplay.textContent = kills;
        }
      }
    });
  });

  enemies = enemies.filter(e => {
    if (e.y > gameAreaRect.height) {
      e.element.remove();
      return false;
    }
    const enemyWidth = parseFloat(getComputedStyle(e.element).width);
    const enemyHeight = enemyWidth;
    const playerWidth = parseFloat(getComputedStyle(player).width);
    const playerHeight = playerWidth;
    const playerLeft = playerX;
    const playerRight = playerX + playerWidth;
    const playerTop = playerY;
    const playerBottom = playerY + playerHeight;
    const enemyLeft = e.x;
    const enemyRight = e.x + enemyWidth;
    const enemyTop = e.y;
    const enemyBottom = e.y + enemyHeight;
    if (
      playerRight > enemyLeft &&
      playerLeft < enemyRight &&
      playerBottom > enemyTop &&
      playerTop < enemyBottom
    ) {
      gameOver();
      return false;
    }
    return true;
  });
}

//Game Over
function gameOver() {
  gameActive = false;
  gameOverDisplay.style.display = 'block';
  enemies.forEach(e => e.element.remove());
  bullets.forEach(b => b.element.remove());
  enemies = [];
  bullets = [];
  if (backgroundMusic) {
    backgroundMusic.pause();
  }
  clearInterval(waveSpawnInterval);
}

//Allows Restarting after Game Over
function restartGame() {
  gameActive = true;
  isPaused = false;
  pauseStatusDisplay.style.display = 'none';
  gameOverDisplay.style.display = 'none';
  score = 0;
  kills = 0;
  wave = 0;
  enemiesPerWave = 4;
  scoreDisplay.textContent = score;
  killsDisplay.textContent = kills;
  waveDisplay.textContent = wave;
  const gameAreaRect = gameArea.getBoundingClientRect();
  const playerWidth = parseFloat(getComputedStyle(player).width);
  const playerHeight = parseFloat(getComputedStyle(player).height);
  playerX = gameAreaRect.width / 2 - playerWidth / 2;
  playerY = gameAreaRect.height / 2 - playerHeight / 2;
  console.log('Restart - gameAreaRect:', gameAreaRect, 'playerWidth:', playerWidth, 'playerX:', playerX, 'playerY:', playerY);
  player.style.left = playerX + 'px';
  player.style.top = playerY + 'px';
  keys = {};
  enemies = [];
  bullets = [];
  if (backgroundMusic && !backgroundMusic.muted) {
    backgroundMusic.play().catch(err => console.log('Music play failed:', err));
  }
  clearInterval(waveSpawnInterval);
  waveSpawnInterval = setInterval(spawnWave, waveInterval);
}

//Allows Pausing
function gameLoop() {
  if (gameActive && !isPaused) {
    movePlayer();
    updateGame();
  }
  requestAnimationFrame(gameLoop);
}

initMusic();
waveSpawnInterval = setInterval(spawnWave, waveInterval);
gameLoop();