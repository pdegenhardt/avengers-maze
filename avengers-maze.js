// ============================================
// AVENGERS MAZE - Game Engine
// ============================================

// Game State
const game = {
    currentScreen: 'title-screen',
    hero: null,
    playerPos: { x: 1, y: 1 },
    health: 100,
    maxHealth: 100,
    enemies: [],
    revealed: new Set(),
    enemiesDefeated: 0,
    ability1Cooldown: 0,
    ability2Cooldown: 0,
    inCombat: false,
    currentEnemy: null,
    wallSmashMode: false,
    squeezeMode: false,
    glideMode: false
};

// ============================================
// HERO DEFINITIONS
// ============================================
const heroes = {
    hulk: {
        name: 'HULK',
        icon: '💚',
        color: '#4CAF50',
        health: 150,
        attack: 25,
        vision: 2,
        ability1: { name: '💥 Wall Smash', desc: 'Destroy a wall', cooldown: 3 },
        ability2: { name: '🌍 Ground Pound', desc: 'Stun nearby enemies', cooldown: 5 }
    },
    falcon: {
        name: 'FALCON',
        icon: '🦅',
        color: '#E53935',
        health: 100,
        attack: 18,
        vision: 4,
        ability1: { name: '🔭 Recon', desc: 'Reveal large area', cooldown: 4 },
        ability2: { name: '🕊️ Glide', desc: 'Fly over one wall', cooldown: 6 }
    },
    hawkeye: {
        name: 'HAWKEYE',
        icon: '🏹',
        color: '#9C27B0',
        health: 90,
        attack: 22,
        vision: 3,
        ability1: { name: '🎯 Trick Arrow', desc: 'Ranged attack', cooldown: 2 },
        ability2: { name: '👁️ Eagle Eye', desc: 'See enemies through walls', cooldown: 5 }
    },
    stretch: {
        name: 'STRETCH',
        icon: '🔵',
        color: '#2196F3',
        health: 85,
        attack: 15,
        vision: 3,
        ability1: { name: '🌀 Squeeze', desc: 'Pass through narrow gap', cooldown: 4 },
        ability2: { name: '🤚 Long Reach', desc: 'Attack from distance', cooldown: 3 }
    }
};

// ============================================
// ENEMY DEFINITIONS
// ============================================
const enemyTypes = {
    chitauri: { name: 'Chitauri Soldier', icon: '👽', health: 30, attack: 10 },
    hydra: { name: 'Hydra Agent', icon: '🐍', health: 50, attack: 15 },
    ultron: { name: 'Ultron Drone', icon: '🤖', health: 40, attack: 20 }
};

// ============================================
// MAZE LAYOUT
// 0=wall, 1=floor, 2=start, 3=exit, 4=enemy spawn
// ============================================
const mazeLayout = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 4, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 1, 4, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 4, 0, 1, 1, 1, 1, 4, 1, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const MAZE_HEIGHT = mazeLayout.length;
const MAZE_WIDTH = mazeLayout[0].length;

// ============================================
// SCREEN MANAGEMENT
// ============================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    game.currentScreen = screenId;
}

// ============================================
// HERO SELECTION
// ============================================
function selectHero(heroId) {
    game.hero = heroes[heroId];
    game.health = game.hero.health;
    game.maxHealth = game.hero.health;
    game.playerPos = { x: 1, y: 1 };
    game.enemies = [];
    game.revealed = new Set();
    game.enemiesDefeated = 0;
    game.ability1Cooldown = 0;
    game.ability2Cooldown = 0;

    initGame();
    showScreen('game-screen');
}

// ============================================
// GAME INITIALIZATION
// ============================================
function initGame() {
    // Set up UI with sprite images
    const heroSpritePath = heroSprites[game.hero.name];
    document.getElementById('player-icon-img').src = heroSpritePath;
    document.getElementById('player-name').textContent = game.hero.name;
    document.getElementById('ability1-name').textContent = game.hero.ability1.name;
    document.getElementById('ability2-name').textContent = game.hero.ability2.name;

    // Spawn enemies at marked positions
    const enemyTypeList = ['chitauri', 'hydra', 'ultron', 'chitauri'];
    let enemyIndex = 0;
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            if (mazeLayout[y][x] === 4) {
                const type = enemyTypeList[enemyIndex % enemyTypeList.length];
                game.enemies.push({
                    ...enemyTypes[type],
                    type: type,
                    x: x,
                    y: y,
                    currentHealth: enemyTypes[type].health,
                    stunned: false
                });
                enemyIndex++;
            }
        }
    }

    updateHealthBar();
    updateAbilityButtons();
    renderMaze();
    revealAround(game.playerPos.x, game.playerPos.y, game.hero.vision);
}

// ============================================
// MAZE RENDERING
// ============================================

// Hero sprite image paths
const heroSprites = {
    'HULK': 'sprites/hulk.png',
    'FALCON': 'sprites/falcon.png',
    'HAWKEYE': 'sprites/hawkeye.png',
    'STRETCH': 'sprites/stretch.png'
};

// Enemy sprite image paths
const enemySprites = {
    'chitauri': 'sprites/chitauri.png',
    'hydra': 'sprites/hydra.png',
    'ultron': 'sprites/ultron.png'
};

// Fallback icons if sprite not available
const heroFallbackIcons = {
    'HULK': '💚',
    'FALCON': '🦅',
    'HAWKEYE': '🏹',
    'STRETCH': '🔵'
};

const enemyFallbackIcons = {
    'chitauri': '👽',
    'hydra': '🐍',
    'ultron': '🤖'
};

// Get hero CSS class from name
function getHeroClass(heroName) {
    return heroName.toLowerCase();
}

// Create sprite HTML - uses image if available, falls back to icon
function createSpriteHTML(spritePath, fallbackIcon, cssClass, isPlayer) {
    const spriteClass = isPlayer ? 'player-sprite' : 'enemy-sprite';

    return `
        <div class="${spriteClass} ${cssClass}">
            <img src="${spritePath}" alt="" class="sprite-img" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <span class="sprite-fallback" style="display:none;">${fallbackIcon}</span>
        </div>
    `;
}

function renderMaze() {
    const mazeEl = document.getElementById('maze');
    mazeEl.style.gridTemplateColumns = `repeat(${MAZE_WIDTH}, 48px)`;
    mazeEl.innerHTML = '';

    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.x = x;
            tile.dataset.y = y;

            const cellType = mazeLayout[y][x];
            const isRevealed = game.revealed.has(`${x},${y}`);

            if (!isRevealed) {
                tile.classList.add('hidden');
            } else {
                if (cellType === 0) {
                    tile.classList.add('wall');
                } else if (cellType === 3) {
                    tile.classList.add('exit');
                    tile.innerHTML = '🚪';
                } else {
                    tile.classList.add('floor');
                }

                // Draw player with sprite image and health bar
                if (x === game.playerPos.x && y === game.playerPos.y) {
                    const heroClass = getHeroClass(game.hero.name);
                    const spritePath = heroSprites[game.hero.name];
                    const fallbackIcon = heroFallbackIcons[game.hero.name] || '?';
                    const healthPct = (game.health / game.maxHealth) * 100;

                    tile.innerHTML = `
                        <div class="character-sprite">
                            ${createSpriteHTML(spritePath, fallbackIcon, heroClass, true)}
                            <div class="mini-health-bar">
                                <div class="mini-health-fill player" style="width: ${healthPct}%"></div>
                            </div>
                        </div>
                    `;
                }

                // Draw enemies with sprite image and health bar
                const enemy = game.enemies.find(e => e.x === x && e.y === y);
                if (enemy && !(x === game.playerPos.x && y === game.playerPos.y)) {
                    const enemyClass = enemy.type;
                    const spritePath = enemySprites[enemy.type];
                    const fallbackIcon = enemyFallbackIcons[enemy.type] || '?';
                    const maxHealth = enemyTypes[enemy.type].health;
                    const healthPct = (enemy.currentHealth / maxHealth) * 100;

                    tile.innerHTML = `
                        <div class="character-sprite">
                            ${createSpriteHTML(spritePath, fallbackIcon, enemyClass, false)}
                            <div class="mini-health-bar">
                                <div class="mini-health-fill enemy" style="width: ${healthPct}%"></div>
                            </div>
                        </div>
                    `;
                }
            }

            mazeEl.appendChild(tile);
        }
    }
}

// ============================================
// FOG OF WAR
// ============================================
function revealAround(cx, cy, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const x = cx + dx;
            const y = cy + dy;
            if (x >= 0 && x < MAZE_WIDTH && y >= 0 && y < MAZE_HEIGHT) {
                if (Math.abs(dx) + Math.abs(dy) <= radius + 1) {
                    game.revealed.add(`${x},${y}`);
                }
            }
        }
    }
    renderMaze();
}

// ============================================
// PLAYER MOVEMENT
// ============================================
function movePlayer(dx, dy) {
    if (game.inCombat) return;

    const newX = game.playerPos.x + dx;
    const newY = game.playerPos.y + dy;

    // Boundary check
    if (newX < 0 || newX >= MAZE_WIDTH || newY < 0 || newY >= MAZE_HEIGHT) return;
    // Wall check
    if (mazeLayout[newY][newX] === 0) return;

    game.playerPos.x = newX;
    game.playerPos.y = newY;

    // Reduce cooldowns on move
    if (game.ability1Cooldown > 0) game.ability1Cooldown--;
    if (game.ability2Cooldown > 0) game.ability2Cooldown--;
    updateAbilityButtons();

    // Reveal area around new position
    revealAround(newX, newY, game.hero.vision);

    // Check for enemy encounter
    const enemy = game.enemies.find(e => e.x === newX && e.y === newY);
    if (enemy) {
        startCombat(enemy);
        return;
    }

    // Check for exit
    if (mazeLayout[newY][newX] === 3) {
        victory();
    }
}

// ============================================
// UI UPDATES
// ============================================
function updateHealthBar() {
    const pct = (game.health / game.maxHealth) * 100;
    document.getElementById('health-bar').style.width = pct + '%';
    document.getElementById('health-text').textContent = `${game.health}/${game.maxHealth}`;
}

function updateAbilityButtons() {
    const btn1 = document.getElementById('ability1-btn');
    const btn2 = document.getElementById('ability2-btn');
    const cd1 = document.getElementById('ability1-cd');
    const cd2 = document.getElementById('ability2-cd');

    btn1.disabled = game.ability1Cooldown > 0;
    btn2.disabled = game.ability2Cooldown > 0;
    cd1.textContent = game.ability1Cooldown > 0 ? `(${game.ability1Cooldown} turns)` : 'Ready';
    cd2.textContent = game.ability2Cooldown > 0 ? `(${game.ability2Cooldown} turns)` : 'Ready';
}

// ============================================
// HERO ABILITIES
// ============================================
function useAbility(num) {
    if (game.inCombat) return;

    const hero = game.hero;

    if (num === 1 && game.ability1Cooldown === 0) {
        executeAbility1(hero);
    } else if (num === 2 && game.ability2Cooldown === 0) {
        executeAbility2(hero);
    }
    updateAbilityButtons();
}

function executeAbility1(hero) {
    switch (hero.name) {
        case 'HULK':
            // Wall Smash - prompt for direction
            showNotification('Use arrow keys to smash a wall!');
            game.wallSmashMode = true;
            break;

        case 'FALCON':
            // Recon - reveal large area
            revealAround(game.playerPos.x, game.playerPos.y, 6);
            game.ability1Cooldown = hero.ability1.cooldown;
            showNotification('Area revealed!');
            break;

        case 'HAWKEYE':
            // Trick Arrow - ranged attack on visible enemy
            const hawkTarget = findNearbyEnemy(3);
            if (hawkTarget) {
                dealDamageToEnemy(hawkTarget, hero.attack);
                game.ability1Cooldown = hero.ability1.cooldown;
                showNotification(`Hit ${hawkTarget.name} for ${hero.attack} damage!`);
            } else {
                showNotification('No enemy in range!');
            }
            break;

        case 'STRETCH':
            // Squeeze - pass through one wall
            showNotification('Use arrow keys to squeeze through!');
            game.squeezeMode = true;
            break;
    }
}

function executeAbility2(hero) {
    switch (hero.name) {
        case 'HULK':
            // Ground Pound - stun nearby enemies
            let stunCount = 0;
            game.enemies.forEach(e => {
                const dist = Math.abs(e.x - game.playerPos.x) + Math.abs(e.y - game.playerPos.y);
                if (dist <= 2) {
                    e.stunned = true;
                    stunCount++;
                }
            });
            game.ability2Cooldown = hero.ability2.cooldown;
            showNotification(stunCount > 0 ? `Stunned ${stunCount} enemies!` : 'No enemies nearby!');
            break;

        case 'FALCON':
            // Glide - move over one wall
            showNotification('Use arrow keys to glide!');
            game.glideMode = true;
            break;

        case 'HAWKEYE':
            // Eagle Eye - reveal all enemies
            game.enemies.forEach(e => {
                game.revealed.add(`${e.x},${e.y}`);
            });
            game.ability2Cooldown = hero.ability2.cooldown;
            renderMaze();
            showNotification('Enemies revealed!');
            break;

        case 'STRETCH':
            // Long Reach - attack from distance
            const stretchTarget = findNearbyEnemy(2);
            if (stretchTarget) {
                dealDamageToEnemy(stretchTarget, hero.attack);
                game.ability2Cooldown = hero.ability2.cooldown;
                showNotification(`Hit ${stretchTarget.name}!`);
            } else {
                showNotification('No enemy in range!');
            }
            break;
    }
}

function findNearbyEnemy(range) {
    return game.enemies.find(e => {
        const dist = Math.abs(e.x - game.playerPos.x) + Math.abs(e.y - game.playerPos.y);
        return dist <= range && game.revealed.has(`${e.x},${e.y}`);
    });
}

function dealDamageToEnemy(enemy, damage) {
    enemy.currentHealth -= damage;
    if (enemy.currentHealth <= 0) {
        game.enemies = game.enemies.filter(e => e !== enemy);
        game.enemiesDefeated++;
    }
    renderMaze();
}

function showNotification(message) {
    // Simple notification (could be enhanced with toast UI)
    console.log(message);
    // For now, we'll create a temporary notification
    const existing = document.querySelector('.game-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'game-notification';
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        z-index: 1000;
        animation: fadeInOut 2s forwards;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
}

// ============================================
// COMBAT SYSTEM
// ============================================
function startCombat(enemy) {
    game.inCombat = true;
    game.currentEnemy = enemy;

    // Set player combat sprite
    const heroSpritePath = heroSprites[game.hero.name];
    document.getElementById('combat-player-icon-img').src = heroSpritePath;
    document.getElementById('combat-player-name').textContent = game.hero.name;

    // Set enemy combat sprite
    const enemySpritePath = enemySprites[enemy.type];
    document.getElementById('combat-enemy-icon-img').src = enemySpritePath;
    document.getElementById('combat-enemy-name').textContent = enemy.name;

    document.getElementById('combat-log').innerHTML = `<div>⚔️ You encountered a ${enemy.name}!</div>`;

    updateCombatHealth();
    document.getElementById('combat-overlay').classList.add('active');
}

function updateCombatHealth() {
    const playerPct = (game.health / game.maxHealth) * 100;
    const enemyPct = (game.currentEnemy.currentHealth / enemyTypes[game.currentEnemy.type].health) * 100;
    document.getElementById('combat-player-health').style.width = playerPct + '%';
    document.getElementById('combat-enemy-health').style.width = Math.max(0, enemyPct) + '%';
}

function addCombatLog(msg) {
    const log = document.getElementById('combat-log');
    log.innerHTML += `<div>${msg}</div>`;
    log.scrollTop = log.scrollHeight;
}

function combatAttack() {
    const enemy = game.currentEnemy;
    const damage = game.hero.attack + Math.floor(Math.random() * 5);
    enemy.currentHealth -= damage;
    addCombatLog(`💥 You deal ${damage} damage!`);

    if (enemy.currentHealth <= 0) {
        addCombatLog(`✅ ${enemy.name} defeated!`);
        setTimeout(() => endCombat(true), 800);
        updateCombatHealth();
        return;
    }

    // Enemy attacks back (unless stunned)
    if (!enemy.stunned) {
        const enemyDamage = enemy.attack + Math.floor(Math.random() * 5);
        game.health -= enemyDamage;
        addCombatLog(`🔥 ${enemy.name} deals ${enemyDamage} damage!`);
        updateHealthBar();

        if (game.health <= 0) {
            addCombatLog(`💀 You have been defeated!`);
            setTimeout(() => endCombat(false), 800);
            updateCombatHealth();
            return;
        }
    } else {
        addCombatLog(`😵 ${enemy.name} is stunned and can't attack!`);
        enemy.stunned = false;
    }

    updateCombatHealth();
}

function combatSpecial() {
    // Special attack does extra damage
    const enemy = game.currentEnemy;
    const damage = Math.floor(game.hero.attack * 1.5) + Math.floor(Math.random() * 8);
    enemy.currentHealth -= damage;
    addCombatLog(`⚡ SPECIAL ATTACK! ${damage} damage!`);

    if (enemy.currentHealth <= 0) {
        addCombatLog(`✅ ${enemy.name} defeated!`);
        setTimeout(() => endCombat(true), 800);
        updateCombatHealth();
        return;
    }

    // Enemy attacks back
    if (!enemy.stunned) {
        const enemyDamage = enemy.attack + Math.floor(Math.random() * 5);
        game.health -= enemyDamage;
        addCombatLog(`🔥 ${enemy.name} deals ${enemyDamage} damage!`);
        updateHealthBar();

        if (game.health <= 0) {
            setTimeout(() => endCombat(false), 800);
            updateCombatHealth();
            return;
        }
    } else {
        addCombatLog(`😵 ${enemy.name} is stunned!`);
        enemy.stunned = false;
    }

    updateCombatHealth();
}

function endCombat(won) {
    document.getElementById('combat-overlay').classList.remove('active');
    game.inCombat = false;

    if (won) {
        game.enemies = game.enemies.filter(e => e !== game.currentEnemy);
        game.enemiesDefeated++;
        renderMaze();
        showNotification('Enemy defeated!');
    } else {
        defeat();
    }
    game.currentEnemy = null;
}

// ============================================
// GAME END CONDITIONS
// ============================================
function victory() {
    document.getElementById('result-title').textContent = 'VICTORY!';
    document.getElementById('result-title').className = 'result-title victory';
    document.getElementById('result-stats').innerHTML = `
        <p>🦸 Hero: ${game.hero.name}</p>
        <p>💀 Enemies Defeated: ${game.enemiesDefeated}</p>
        <p>❤️ Health Remaining: ${game.health}/${game.maxHealth}</p>
    `;
    document.getElementById('result-overlay').classList.add('active');
}

function defeat() {
    document.getElementById('result-title').textContent = 'DEFEATED';
    document.getElementById('result-title').className = 'result-title defeat';
    document.getElementById('result-stats').innerHTML = `
        <p>🦸 Hero: ${game.hero.name}</p>
        <p>💀 Enemies Defeated: ${game.enemiesDefeated}</p>
        <p>💪 Better luck next time!</p>
    `;
    document.getElementById('result-overlay').classList.add('active');
}

function restartGame() {
    document.getElementById('result-overlay').classList.remove('active');
    // Reset maze layout for walls that may have been smashed
    resetMazeLayout();
    showScreen('hero-select');
}

function resetMazeLayout() {
    // Restore any smashed walls
    const originalLayout = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 2, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
        [0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 4, 0, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 1, 4, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 1, 0, 4, 0, 1, 1, 1, 1, 4, 1, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            mazeLayout[y][x] = originalLayout[y][x];
        }
    }
}

// ============================================
// KEYBOARD INPUT HANDLER
// ============================================
function handleKeyDown(e) {
    if (game.currentScreen !== 'game-screen') return;

    let dx = 0, dy = 0;

    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': dy = -1; break;
        case 'ArrowDown': case 's': case 'S': dy = 1; break;
        case 'ArrowLeft': case 'a': case 'A': dx = -1; break;
        case 'ArrowRight': case 'd': case 'D': dx = 1; break;
        case '1': useAbility(1); return;
        case '2': useAbility(2); return;
        default: return;
    }

    if (dx !== 0 || dy !== 0) {
        handleDirectionalInput(dx, dy);
    }
}

function handleDirectionalInput(dx, dy) {
    // Handle Wall Smash mode (Hulk)
    if (game.wallSmashMode) {
        const tx = game.playerPos.x + dx;
        const ty = game.playerPos.y + dy;
        if (mazeLayout[ty] && mazeLayout[ty][tx] === 0) {
            mazeLayout[ty][tx] = 1; // Convert wall to floor
            game.ability1Cooldown = game.hero.ability1.cooldown;
            updateAbilityButtons();
            revealAround(game.playerPos.x, game.playerPos.y, game.hero.vision);
            showNotification('SMASH! Wall destroyed!');
        } else {
            showNotification('No wall there!');
        }
        game.wallSmashMode = false;
        return;
    }

    // Handle Squeeze/Glide mode (Stretch/Falcon)
    if (game.squeezeMode || game.glideMode) {
        const tx = game.playerPos.x + dx * 2;
        const ty = game.playerPos.y + dy * 2;
        const midX = game.playerPos.x + dx;
        const midY = game.playerPos.y + dy;

        // Check if middle tile is a wall and destination is valid
        if (mazeLayout[midY] && mazeLayout[midY][midX] === 0 &&
            mazeLayout[ty] && mazeLayout[ty][tx] !== 0 && mazeLayout[ty][tx] !== undefined) {
            game.playerPos.x = tx;
            game.playerPos.y = ty;

            if (game.squeezeMode) {
                game.ability1Cooldown = game.hero.ability1.cooldown;
                showNotification('Squeezed through!');
            } else {
                game.ability2Cooldown = game.hero.ability2.cooldown;
                showNotification('Glided over!');
            }
            updateAbilityButtons();
            revealAround(tx, ty, game.hero.vision);

            // Check for enemy at destination
            const enemy = game.enemies.find(e => e.x === tx && e.y === ty);
            if (enemy) {
                startCombat(enemy);
            }
        } else {
            showNotification('Cannot pass there!');
        }
        game.squeezeMode = false;
        game.glideMode = false;
        return;
    }

    // Normal movement
    movePlayer(dx, dy);
}

// Initialize keyboard listener
document.addEventListener('keydown', handleKeyDown);

// Add notification animation style dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    }
`;
document.head.appendChild(style);
