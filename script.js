// ========================================
// WATER DROP GAME - Simple Canvas Setup
// ========================================

// Get the canvas element and its 2D context (for drawing)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to fill most of the screen
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.9;

// ========================================
// BACKGROUND COLOR
// ========================================

const BACKGROUND_COLOR = '#87ceeb'; // Sky blue

// ========================================
// IMAGE LOADING
// ========================================

// Load the player (jerry can) image
const jerryCanImage = new Image();
jerryCanImage.src = 'img/jerry-can.png';

// Load falling object images
const waterDropImage = new Image();
waterDropImage.src = 'img/water-drop.png';

const goldWaterDropImage = new Image();
goldWaterDropImage.src = 'img/gold-water-drop.png';

const dirtBallImage = new Image();
dirtBallImage.src = 'img/dirt-ball.png';

const heartImage = new Image();
heartImage.src = 'img/heart.png';

// ========================================
// BUTTON CONSTANTS
// ========================================

const START_BUTTON = {
    width: 200,
    height: 70,
    color: '#FFD700', // Gold/yellow
    hoverColor: '#FFC700', // Darker yellow on hover
    textColor: '#000',
    get x() {
        return canvas.width / 2 - this.width / 2; // Center horizontally
    },
    get y() {
        return canvas.height / 2; // Center vertically
    }
};

const PLAY_AGAIN_BUTTON = {
    width: 260,
    height: 70,
    color: '#FFD700',
    hoverColor: '#FFC700',
    textColor: '#000',
    get x() {
        return canvas.width / 2 - this.width / 2;
    },
    get y() {
        return canvas.height / 2 + 120;
    }
};

// ========================================
// GAME VARIABLES
// ========================================

let gameRunning = true;
let mouseX = 0;
let mouseY = 0;

// Game states
const STATES = {
    START: 'start',
    COUNTDOWN: 'countdown',
    PLAYING: 'playing',
    GAMEOVER: 'gameover'
};

let gameState = STATES.START;
let countdown = 3; // Current countdown number (3, 2, 1, or 0)
let countdownTimer = 0; // Frame counter for countdown timing (1 second = ~60 frames)

// ========================================
// PLAYER OBJECT
// ========================================

const player = {
    x: 0,           // Current X position
    y: 0,           // Y position (fixed at bottom)
    width: 240,     // Player width (doubled to 240)
    height: 240,    // Player height (doubled to 240)
    hitboxScale: 0.42, // Smaller collision area to match visible can body
    targetX: 0,     // Target X position (from mouse)
    
    // Initialize player position (call after canvas size is set)
    init: function() {
        this.x = canvas.width / 2 - this.width / 2;  // Start at bottom center
        this.y = canvas.height - this.height - 10;   // Near bottom with 10px margin
        this.targetX = this.x;
    }
};

// ========================================
// FALLING OBJECTS SYSTEM
// ========================================

// Array to store all falling objects
let fallingObjects = [];

// Object types
const OBJECT_TYPES = {
    WATER_DROP: 'water-drop',
    GOLD_WATER_DROP: 'gold-water-drop',
    DIRT_BALL: 'dirt-ball',
    HEART: 'heart'
};

// Smaller hitboxes for falling objects (per type)
const OBJECT_HITBOX_SCALES = {
    'water-drop': 0.5,
    'gold-water-drop': 0.5,
    'dirt-ball': 0.6,
    'heart': 0.55
};

// Object settings
const OBJECT_SIZE = 160; // Size of each falling object (doubled again to 160)
const SPAWN_INTERVAL = 60; // Frames between spawns (60 frames = ~1 second)

// Speed for each object type (pixels per frame)
const OBJECT_SPEEDS = {
    'water-drop': 5,
    'gold-water-drop': 4,
    'dirt-ball': 7,
    'heart': 3
};

// Spawn weights (higher = more likely)
const SPAWN_WEIGHTS = {
    'water-drop': 60,        // Common
    'gold-water-drop': 15,   // Rare
    'dirt-ball': 150,        // Very common (MUCH higher)
    'heart': 5               // Very rare
};

// Spawn timer
let spawnTimer = 0;

// ========================================
// VISUAL FEEDBACK EFFECTS
// ========================================

let floatingTexts = [];      // Stores floating score/life text effects
let playerScale = 1;         // Current player scale (1 = normal)
let playerScaleTimer = 0;    // Frames left for player scale effect
let screenShakeTimer = 0;    // Frames left for screen shake effect
const SCREEN_SHAKE_STRENGTH = 8;

// ========================================
// GAME STATE: SCORE AND LIVES
// ========================================

let score = 0;        // Current score (in liters)
let lives = 3;        // Current lives (max 3)
let combo = 0;        // Current combo counter
let currentGoal = 1000; // Current level goal in liters

const GOAL_START = 1000;
const GOAL_STEP = 500;

// ========================================
// MULTIPLIER SYSTEM
// ========================================

/**
 * Calculate the current score multiplier based on combo
 * - 10 combo = 2x
 * - 25 combo = 3x
 * - 50 combo = 4x
 */
function getMultiplier() {
    if (combo >= 50) return 4;
    if (combo >= 25) return 3;
    if (combo >= 10) return 2;
    return 1; // Default multiplier
}
// UPDATE FUNCTION
// ========================================

/**
 * Update game logic based on current state
 * This runs once per frame before drawing
 */
function update() {
    switch (gameState) {
        case STATES.START:
            updateStart();
            break;
        case STATES.COUNTDOWN:
            updateCountdown();
            break;
        case STATES.PLAYING:
            updatePlaying();
            break;
        case STATES.GAMEOVER:
            updateGameOver();
            break;
    }
}

/**
 * START state: Waiting for player to begin
 */
function updateStart() {
    // TODO: Add start state logic
    // Example: Check for key press to begin
}

/**
 * COUNTDOWN state: Show 3...2...1 before the game starts
 */
function updateCountdown() {
    // Increment the timer each frame
    countdownTimer++;

    // Update countdown based on elapsed frames
    // Each second is approximately 60 frames at 60 FPS
    if (countdownTimer < 60) {
        countdown = 3;  // Frames 0-59: Show "3"
    } else if (countdownTimer < 120) {
        countdown = 2;  // Frames 60-119: Show "2"
    } else if (countdownTimer < 180) {
        countdown = 1;  // Frames 120-179: Show "1"
    } else if (countdownTimer < 240) {
        countdown = 0;  // Frames 180-239: Show "GO!"
    } else {
        // Countdown finished! Start the game
        gameState = STATES.PLAYING;
        countdownTimer = 0; // Reset timer for potential reuse
        initializeGame(); // Initialize game objects
    }
}

/**
 * PLAYING state: Main game logic
 */
function updatePlaying() {
    // Update player movement
    updatePlayer();

    // Update short-lived visual effects
    updateVisualEffects();
    
    // Spawn falling objects
    spawnFallingObject();
    
    // Update falling objects
    updateFallingObjects();

    // Increase goal when current one is reached
    updateGoalProgress();
    
    // TODO: Add additional game logic here
    // - Check for collisions
    // - Update score/lives
    // - Check win/lose conditions
}

/**
 * Update goal progression during gameplay
 */
function updateGoalProgress() {
    while (score >= currentGoal) {
        currentGoal += GOAL_STEP;
    }
}

/**
 * Update player position based on mouse movement
 * Player follows mouse horizontally (left/right only)
 */
function updatePlayer() {
    // Set target X to current mouse position
    player.targetX = mouseX - player.width / 2;  // Center player on mouse X
    
    // Move player directly to target X (matching mouse speed)
    player.x = player.targetX;
    
    // Keep player within canvas bounds
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

/**
 * Update all visual feedback effects each frame
 */
function updateVisualEffects() {
    updateFloatingTexts();
    updatePlayerScaleEffect();
    updateScreenShakeEffect();
}

/**
 * Add floating text (for score/lives feedback)
 */
function addFloatingText(text, x, y, color) {
    floatingTexts.push({
        text: text,
        x: x,
        y: y,
        color: color,
        life: 40,      // Frames before disappearing
        maxLife: 40
    });
}

/**
 * Update floating text positions and lifetime
 */
function updateFloatingTexts() {
    for (let i = 0; i < floatingTexts.length; i++) {
        const effect = floatingTexts[i];
        effect.y -= 1;    // Float upward
        effect.life -= 1;

        if (effect.life <= 0) {
            floatingTexts.splice(i, 1);
            i--;
        }
    }
}

/**
 * Trigger quick player scale effect when catching water
 */
function triggerPlayerCatchEffect() {
    playerScale = 1.08;
    playerScaleTimer = 8;
}

/**
 * Update player scale effect
 */
function updatePlayerScaleEffect() {
    if (playerScaleTimer > 0) {
        playerScaleTimer--;
    } else {
        playerScale = 1;
    }
}

/**
 * Trigger screen shake effect when hit by mud
 */
function triggerMudHitEffect() {
    screenShakeTimer = 10;
}

/**
 * Update screen shake timer
 */
function updateScreenShakeEffect() {
    if (screenShakeTimer > 0) {
        screenShakeTimer--;
    }
}

/**
 * Get random shake offset while shake is active
 */
function getScreenShakeOffset() {
    if (screenShakeTimer <= 0) {
        return { x: 0, y: 0 };
    }

    return {
        x: (Math.random() * 2 - 1) * SCREEN_SHAKE_STRENGTH,
        y: (Math.random() * 2 - 1) * SCREEN_SHAKE_STRENGTH
    };
}

/**
 * Spawn a new falling object at the top of the screen
 */
function spawnFallingObject() {
    // Increment spawn timer
    spawnTimer++;
    
    // Check if it's time to spawn a new object
    if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 0; // Reset timer
        
        // Pick a random object type based on spawn weights
        const randomType = getWeightedRandomObject();
        
        // Pick a random X position (object centered)
        const randomX = Math.random() * (canvas.width - OBJECT_SIZE);
        
        // Get randomized speed for this object (each object has slightly different speed)
        const speed = getRandomizedSpeed(randomType);
        
        // Create new falling object
        const newObject = {
            type: randomType,
            x: randomX,
            y: -OBJECT_SIZE, // Start above the screen
            width: OBJECT_SIZE,
            height: OBJECT_SIZE,
            speed: speed
        };
        
        // Add to array
        fallingObjects.push(newObject);
    }
}

/**
 * Get a randomized speed for an object type
 * Each object gets a faster random speed range (80% to 220% of base speed)
 */
function getRandomizedSpeed(objectType) {
    const baseSpeed = OBJECT_SPEEDS[objectType];
    const minFactor = 0.8;
    const maxFactor = 2.2;
    
    // Random value between minFactor and maxFactor
    const randomFactor = minFactor + Math.random() * (maxFactor - minFactor);
    
    return baseSpeed * randomFactor;
}

/**
 * Get a weighted random object type based on spawn weights
 */
function getWeightedRandomObject() {
    // Calculate total weight
    const totalWeight = Object.values(SPAWN_WEIGHTS).reduce((a, b) => a + b, 0);
    
    // Pick a random number from 0 to totalWeight
    let random = Math.random() * totalWeight;
    
    // Find which object type this falls into
    for (const [type, weight] of Object.entries(SPAWN_WEIGHTS)) {
        random -= weight;
        if (random <= 0) {
            return type;
        }
    }
    
    // Fallback (shouldn't reach here)
    return OBJECT_TYPES.WATER_DROP;
}

/**
 * Update all falling objects
 */
function updateFallingObjects() {
    // Update each falling object
    for (let i = 0; i < fallingObjects.length; i++) {
        const obj = fallingObjects[i];
        
        // Move object downward
        obj.y += obj.speed;
        
        // Check collision with player
        if (checkCollision(obj, player)) {
            handleCollision(obj);
            fallingObjects.splice(i, 1);
            i--; // Adjust index since we removed an element
            continue; // Skip to next object
        }
        
        // Check if object hit the ground
        if (obj.y + obj.height >= canvas.height) {
            handleGroundHit(obj);
            fallingObjects.splice(i, 1);
            i--; // Adjust index since we removed an element
        }
    }
}

/**
 * Check if two objects overlap (collision detection)
 */
function checkCollision(obj1, obj2) {
    const hitbox1 = getHitbox(obj1);
    const hitbox2 = getHitbox(obj2);

    return hitbox1.x < hitbox2.x + hitbox2.width &&
           hitbox1.x + hitbox1.width > hitbox2.x &&
           hitbox1.y < hitbox2.y + hitbox2.height &&
           hitbox1.y + hitbox1.height > hitbox2.y;
}

/**
 * Build a centered hitbox that is smaller than sprite size
 */
function getHitbox(obj) {
    const isPlayer = obj === player;
    const scale = isPlayer
        ? player.hitboxScale
        : (OBJECT_HITBOX_SCALES[obj.type] || 0.55);

    const hitboxWidth = obj.width * scale;
    const hitboxHeight = obj.height * scale;

    return {
        x: obj.x + (obj.width - hitboxWidth) / 2,
        y: obj.y + (obj.height - hitboxHeight) / 2,
        width: hitboxWidth,
        height: hitboxHeight
    };
}

/**
 * Handle collision between player and falling object
 */
function handleCollision(fallingObj) {
    const multiplier = getMultiplier(); // Get current multiplier before combo increases
    const centerX = fallingObj.x + fallingObj.width / 2;
    const centerY = fallingObj.y + fallingObj.height / 2;
    
    switch (fallingObj.type) {
        case OBJECT_TYPES.WATER_DROP:
            score += 10 * multiplier;
            combo++;
            addFloatingText(`+${10 * multiplier}`, centerX, centerY, '#0077ff');
            triggerPlayerCatchEffect();
            break;
            
        case OBJECT_TYPES.GOLD_WATER_DROP:
            score += 50 * multiplier;
            combo++;
            addFloatingText(`+${50 * multiplier}`, centerX, centerY, '#d4a017');
            triggerPlayerCatchEffect();
            break;
            
        case OBJECT_TYPES.DIRT_BALL:
            lives--;
            combo = 0; // Reset combo on dirt ball hit
            addFloatingText('-1 LIFE', centerX, centerY, '#8b0000');
            triggerMudHitEffect();
            
            // Check if game over
            if (lives <= 0) {
                screenShakeTimer = 0; // Stop shake immediately on game over
                gameState = STATES.GAMEOVER;
            }
            break;
            
        case OBJECT_TYPES.HEART:
            // Add life, but max out at 3
            if (lives < 3) {
                lives++;
                addFloatingText('+1 LIFE', centerX, centerY, '#2e8b57');
            } else {
                addFloatingText('MAX LIFE', centerX, centerY, '#2e8b57');
            }
            combo++;
            break;
    }
}

/**
 * Handle falling object hitting the ground
 */
function handleGroundHit(fallingObj) {
    switch (fallingObj.type) {
        case OBJECT_TYPES.WATER_DROP:
        case OBJECT_TYPES.GOLD_WATER_DROP:
            // Reset combo when water hits ground
            combo = 0;
            break;
            
        case OBJECT_TYPES.DIRT_BALL:
            // Just remove it, no penalty
            break;
            
        case OBJECT_TYPES.HEART:
            // Just remove it
            break;
    }
}

/**
 * GAMEOVER state: Handle end of game
 */
function updateGameOver() {
    // TODO: Add gameover state logic
    // Example: Check for key press to restart
}

// ========================================
// DRAW FUNCTION
// ========================================

/**
 * Draw everything based on current state
 * This runs once per frame to display what's happening
 */
function draw() {
    // Reset transform before drawing each frame
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Clear the canvas with background color
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera shake only during gameplay
    const shakeOffset = gameState === STATES.PLAYING
        ? getScreenShakeOffset()
        : { x: 0, y: 0 };
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);

    // Draw based on current game state
    switch (gameState) {
        case STATES.START:
            drawStart();
            break;
        case STATES.COUNTDOWN:
            drawCountdown();
            break;
        case STATES.PLAYING:
            drawPlaying();
            break;
        case STATES.GAMEOVER:
            drawGameOver();
            break;
    }

    ctx.restore();
}

/**
 * START state: Show welcome/instructions screen
 */
function drawStart() {
    // Draw title
    ctx.fillStyle = '#000';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Water Drop Game', canvas.width / 2, 100);

    // Draw Start button
    drawButton(START_BUTTON, 'START');
}

/**
 * Draw a button with text
 */
function drawButton(button, label) {
    // Determine button color (darker if mouse is over it)
    const isHovering = isMouseOverButton(button);
    ctx.fillStyle = isHovering ? button.hoverColor : button.color;

    // Draw button rectangle with rounded corners
    ctx.beginPath();
    ctx.moveTo(button.x + 10, button.y);
    ctx.lineTo(button.x + button.width - 10, button.y);
    ctx.quadraticCurveTo(button.x + button.width, button.y, button.x + button.width, button.y + 10);
    ctx.lineTo(button.x + button.width, button.y + button.height - 10);
    ctx.quadraticCurveTo(button.x + button.width, button.y + button.height, button.x + button.width - 10, button.y + button.height);
    ctx.lineTo(button.x + 10, button.y + button.height);
    ctx.quadraticCurveTo(button.x, button.y + button.height, button.x, button.y + button.height - 10);
    ctx.lineTo(button.x, button.y + 10);
    ctx.quadraticCurveTo(button.x, button.y, button.x + 10, button.y);
    ctx.fill();

    // Draw button text
    ctx.fillStyle = button.textColor;
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, button.x + button.width / 2, button.y + button.height / 2);
}

/**
 * Check if mouse is over a button
 */
function isMouseOverButton(button) {
    return isPointInsideButton(mouseX, mouseY, button);
}

/**
 * Check if a point is inside a button rectangle
 */
function isPointInsideButton(x, y, button) {
    return x >= button.x &&
           x <= button.x + button.width &&
           y >= button.y &&
           y <= button.y + button.height;
}

/**
 * Draw the player on screen
 */
function drawPlayer() {
    const drawWidth = player.width * playerScale;
    const drawHeight = player.height * playerScale;
    const drawX = player.x - (drawWidth - player.width) / 2;
    const drawY = player.y - (drawHeight - player.height) / 2;

    // Draw the jerry can image
    ctx.drawImage(
        jerryCanImage,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    );
}

/**
 * Draw floating text effects
 */
function drawFloatingTexts() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px Arial';

    for (let i = 0; i < floatingTexts.length; i++) {
        const effect = floatingTexts[i];
        const alpha = effect.life / effect.maxLife;

        ctx.fillStyle = effect.color;
        ctx.globalAlpha = alpha;
        ctx.fillText(effect.text, effect.x, effect.y);
    }

    // Reset alpha so other drawing is not affected
    ctx.globalAlpha = 1;
}

/**
 * Get the correct image for an object type
 */
function getObjectImage(objectType) {
    switch (objectType) {
        case OBJECT_TYPES.WATER_DROP:
            return waterDropImage;
        case OBJECT_TYPES.GOLD_WATER_DROP:
            return goldWaterDropImage;
        case OBJECT_TYPES.DIRT_BALL:
            return dirtBallImage;
        case OBJECT_TYPES.HEART:
            return heartImage;
        default:
            return waterDropImage; // Fallback
    }
}

/**
 * Draw all falling objects
 */
function drawFallingObjects() {
    for (let i = 0; i < fallingObjects.length; i++) {
        const obj = fallingObjects[i];
        const image = getObjectImage(obj.type);
        
        // Draw the object image
        ctx.drawImage(
            image,
            obj.x,
            obj.y,
            obj.width,
            obj.height
        );
    }
}

/**
 * Draw game UI (score, lives, combo, multiplier)
 */
function drawUI() {
    const padding = 20;
    const lineHeight = 35;
    let yPos = padding + lineHeight;
    
    // Get current multiplier
    const multiplier = getMultiplier();
    
    // Set text styling
    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    
    // Draw Score (liters)
    ctx.fillText(`Score: ${score} L`, canvas.width - padding, yPos);
    yPos += lineHeight;
    
    // Draw Lives
    ctx.fillText(`Lives: ${lives}`, canvas.width - padding, yPos);
    yPos += lineHeight;
    
    // Draw Combo
    ctx.fillText(`Combo: ${combo}`, canvas.width - padding, yPos);
    yPos += lineHeight;
    
    // Draw Multiplier
    if (multiplier > 1) {
        ctx.fillStyle = '#ff6600'; // Orange/gold for multiplier
    }
    ctx.fillText(`Multiplier: ${multiplier}x`, canvas.width - padding, yPos);
    yPos += lineHeight;

    // Draw current goal
    ctx.fillStyle = '#000';
    ctx.fillText(`Goal: ${currentGoal} L`, canvas.width - padding, yPos);
}

/**
 * COUNTDOWN state: Show 3...2...1 before game starts
 */
function drawCountdown() {
    // Determine what text to display
    let displayText = countdown; // Show 3, 2, 1
    
    if (countdown === 0) {
        displayText = 'GO!'; // Show GO! for the final second
    }

    // Draw countdown text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
}

/**
 * PLAYING state: Draw all game objects
 */
function drawPlaying() {
    // Draw falling objects
    drawFallingObjects();
    
    // Draw player
    drawPlayer();

    // Draw floating score/life text effects
    drawFloatingTexts();
    
    // Draw UI (score, lives, combo)
    drawUI();
}

/**
 * GAMEOVER state: Show game over screen
 */
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const helpedPeople = Number((score / 20).toFixed(1));

    // Draw game over text
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 140);

    // Draw final score
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`Final Score: ${score} L`, canvas.width / 2, canvas.height / 2 - 80);

    // Draw water impact message
    ctx.font = '22px Arial';
    ctx.fillText('In the real world, the average person needs about 20 liters a day.', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`You helped ${helpedPeople} people!`, canvas.width / 2, canvas.height / 2 + 20);

    // Draw restart instruction
    ctx.font = '20px Arial';
    ctx.fillText('Press ENTER to restart', canvas.width / 2, canvas.height / 2 + 80);

    // Draw Play Again button
    drawButton(PLAY_AGAIN_BUTTON, 'PLAY AGAIN');
}

// ========================================
// GAME LOOP
// ========================================

/**
 * The main game loop using requestAnimationFrame
 * This runs roughly 60 times per second (60 FPS)
 */
function gameLoop() {
    if (gameRunning) {
        update(); // Update game state
        draw();   // Redraw everything
    }

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// ========================================
// EVENT LISTENERS
// ========================================

/**
 * Resize canvas if window size changes
 */
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.9;
});

/**
 * Track mouse position for button hover detection and player movement
 */
document.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});

/**
 * Track touch position for mobile support
 */
document.addEventListener('touchmove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
}, { passive: true });

/**
 * Detect mouse clicks on buttons
 */
document.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Check if click was on the start button
    if (gameState === STATES.START && isPointInsideButton(clickX, clickY, START_BUTTON)) {
        // Start the countdown
        gameState = STATES.COUNTDOWN;
        countdown = 3;
    } else if (gameState === STATES.GAMEOVER && isPointInsideButton(clickX, clickY, PLAY_AGAIN_BUTTON)) {
        resetGameToStart();
    }
});

/**
 * Detect touch on buttons (mobile support)
 */
document.addEventListener('touchend', (event) => {
    const rect = canvas.getBoundingClientRect();
    const touch = event.changedTouches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    // Check if touch was on the start button
    if (gameState === STATES.START && isPointInsideButton(touchX, touchY, START_BUTTON)) {
        // Start the countdown
        gameState = STATES.COUNTDOWN;
        countdown = 3;
    } else if (gameState === STATES.GAMEOVER && isPointInsideButton(touchX, touchY, PLAY_AGAIN_BUTTON)) {
        resetGameToStart();
    }
});

/**
 * Handle keyboard input for state transitions
 */
document.addEventListener('keydown', (event) => {
    if (event.code === 'Enter') {
        handleEnterKey();
    } else if (event.code === 'Space') {
        handleSpaceKey();
    }
});

/**
 * ENTER key: Start game or restart after gameover
 */
function handleEnterKey() {
    if (gameState === STATES.START) {
        // Start the countdown
        gameState = STATES.COUNTDOWN;
        countdown = 3;
    } else if (gameState === STATES.GAMEOVER) {
        resetGameToStart();
    }
}

/**
 * Reset full run and return to start state
 */
function resetGameToStart() {
    // Reset falling objects
    fallingObjects = [];
    spawnTimer = 0;

    // Reset game stats
    score = 0;
    lives = 3;
    combo = 0;
    currentGoal = GOAL_START;

    // Reset visual effects
    floatingTexts = [];
    playerScale = 1;
    playerScaleTimer = 0;
    screenShakeTimer = 0;

    gameState = STATES.START;
}

/**
 * SPACE key: Pause/resume during gameplay
 */
function handleSpaceKey() {
    if (gameState === STATES.PLAYING) {
        gameRunning = !gameRunning;
    }
}

// ========================================
// GAME INITIALIZATION
// ========================================

/**
 * Initialize the game when it transitions to playing state
 */
function initializeGame() {
    player.init();
    
    // Reset falling objects
    fallingObjects = [];
    spawnTimer = 0;
    
    // Reset game stats
    score = 0;
    lives = 3;
    combo = 0;
    currentGoal = GOAL_START;

    // Reset visual effects
    floatingTexts = [];
    playerScale = 1;
    playerScaleTimer = 0;
    screenShakeTimer = 0;
}

// ========================================
// START THE GAME
// ========================================

// Kick off the game loop
gameLoop();
