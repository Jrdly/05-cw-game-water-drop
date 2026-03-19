// ========================================
// WATER DROP GAME - Simple Canvas Setup
// ========================================

// Get the canvas element and its 2D context (for drawing)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Mobile detection
const isMobileDevice = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);

// Set canvas size to fill most of the screen
function resizeCanvas() {
    if (isMobileDevice) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = window.innerWidth * 0.9;
        canvas.height = window.innerHeight * 0.9;
    }
}

resizeCanvas();

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

const forcefieldImage = new Image();
forcefieldImage.src = 'img/forcefield.png';

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

const PAUSE_RESET_BUTTON = {
    width: 220,
    height: 64,
    color: '#FFD700',
    hoverColor: '#FFC700',
    textColor: '#000',
    get x() {
        return canvas.width / 2 - this.width / 2;
    },
    get y() {
        return canvas.height / 2 + 40;
    }
};

const PAUSE_HOME_BUTTON = {
    width: 220,
    height: 64,
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

const PAUSE_RESUME_BUTTON = {
    width: 220,
    height: 64,
    color: '#FFD700',
    hoverColor: '#FFC700',
    textColor: '#000',
    get x() {
        return canvas.width / 2 - this.width / 2;
    },
    get y() {
        return canvas.height / 2 - 40;
    }
};

const GAMEOVER_HOME_BUTTON = {
    width: 260,
    height: 70,
    color: '#FFD700',
    hoverColor: '#FFC700',
    textColor: '#000',
    get x() {
        return canvas.width / 2 - this.width / 2;
    },
    get y() {
        return canvas.height / 2 + 210;
    }
};

// ========================================
// GAME VARIABLES
// ========================================

let gameRunning = true;
let mouseX = 0;
let mouseY = 0;

// Keyboard movement state
const movementKeys = {
    left: false,
    right: false,
    boost: false,
    slow: false
};

let speedPriorityCounter = 0; // Increments on W/Shift press to track latest input
let boostPriorityOrder = 0;
let slowPriorityOrder = 0;

let lastMoveDirection = 'right';   // Tracks last A/D direction pressed
let dashDirection = 0;             // -1 = left, 1 = right
let dashFramesLeft = 0;            // Active dash frames remaining
let dashInvincible = false;        // True only while dash is active
const DASH_SPEED = 60;             // Burst speed per frame
const DASH_DURATION_FRAMES = 8;    // Short dash duration
const FORCEFIELD_DURATION_FRAMES = 600; // 10 seconds at ~60 FPS
const FORCEFIELD_FLICKER_START_FRAMES = 120; // Start warning flicker in final 2 seconds
const FORCEFIELD_FLICKER_INTERVAL_FRAMES = 6;

// Stamina system
const STAMINA_MAX = 100;
const STAMINA_W_DRAIN_PER_FRAME = 0.35; // Hold W drains a little each frame
const STAMINA_REGEN_PER_FRAME = 0.01;   // Slow baseline regen
const STAMINA_SHIFT_REGEN_MIN_MULTIPLIER = 2;
const STAMINA_SHIFT_REGEN_MAX_MULTIPLIER = 50;
const STAMINA_SHIFT_REGEN_RAMP_FRAMES = 360;
const STAMINA_SHIFT_REGEN_SPEED_MULTIPLIER = 3;
const DASH_STAMINA_COST = 17.50;           // Space costs 20% each dash
let stamina = STAMINA_MAX;
let shiftRegenHoldFrames = 0;

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
    speed: 12,      // Horizontal speed per frame for A/D movement
    
    // Initialize player position (call after canvas size is set)
    init: function() {
        this.x = canvas.width / 2 - this.width / 2;  // Start at bottom center
        this.y = canvas.height - this.height - 10;   // Near bottom with 10px margin
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
    HEART: 'heart',
    FORCEFIELD: 'forcefield'
};

// Smaller hitboxes for falling objects (per type)
const OBJECT_HITBOX_SCALES = {
    'water-drop': 0.5,
    'gold-water-drop': 0.5,
    'dirt-ball': 0.6,
    'heart': 0.55,
    'forcefield': 0.55
};

// Object settings
let OBJECT_SIZE = 160; // Size of each falling object (responsive)
const SPAWN_INTERVAL = 60; // Frames between spawns (60 frames = ~1 second)

// Speed for each object type (pixels per frame)
const OBJECT_SPEEDS = {
    'water-drop': 5,
    'gold-water-drop': 4,
    'dirt-ball': 7,
    'heart': 3,
    'forcefield': 3
};

// Spawn weights (higher = more likely)
const SPAWN_WEIGHTS = {
    'water-drop': 120,       // More common
    'gold-water-drop': 15,   // Rare
    'dirt-ball': 220,        // Even more common
    'heart': 5,              // Very rare
    'forcefield': 5          // Very rare (same as heart)
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
let forcefieldTimer = 0;     // Frames left for dirt-ball-only invincibility

// ========================================
// GAME STATE: SCORE AND LIVES
// ========================================

let score = 0;        // Current score (in liters)
let lives = 3;        // Current lives (max 3)
let combo = 0;        // Current combo counter
let currentGoal = 1000; // Current level goal in liters

const GOAL_START = 1000;
const GOAL_MULTIPLIER = 1.5;

// ========================================
// MOBILE TOUCH CONTROLS
// ========================================

const touchAssignments = new Map(); // touch.identifier -> action name

const MOBILE_CONTROLS = {
    buttonSize: 68,
    gap: 12,
    get left() {
        const y = canvas.height - this.buttonSize - 18;
        return { x: 18, y, width: this.buttonSize, height: this.buttonSize, label: 'A' };
    },
    get right() {
        const y = canvas.height - this.buttonSize - 18;
        return { x: 18 + this.buttonSize + this.gap, y, width: this.buttonSize, height: this.buttonSize, label: 'D' };
    },
    get boost() {
        const y = canvas.height - this.buttonSize - 18;
        return { x: canvas.width - (this.buttonSize * 4 + this.gap * 3) - 18, y, width: this.buttonSize, height: this.buttonSize, label: 'W' };
    },
    get slow() {
        const y = canvas.height - this.buttonSize - 18;
        return { x: canvas.width - (this.buttonSize * 3 + this.gap * 2) - 18, y, width: this.buttonSize, height: this.buttonSize, label: 'Shift' };
    },
    get dash() {
        const y = canvas.height - this.buttonSize - 18;
        return { x: canvas.width - (this.buttonSize * 2 + this.gap) - 18, y, width: this.buttonSize, height: this.buttonSize, label: 'Dash' };
    },
    get pause() {
        const y = canvas.height - this.buttonSize - 18;
        return { x: canvas.width - this.buttonSize - 18, y, width: this.buttonSize, height: this.buttonSize, label: 'Pause' };
    }
};

function getControlEntries() {
    return [
        ['left', MOBILE_CONTROLS.left],
        ['right', MOBILE_CONTROLS.right],
        ['boost', MOBILE_CONTROLS.boost],
        ['slow', MOBILE_CONTROLS.slow],
        ['dash', MOBILE_CONTROLS.dash],
        ['pause', MOBILE_CONTROLS.pause]
    ];
}

function setActionState(action, isPressed) {
    if (action === 'left') {
        movementKeys.left = isPressed;
        if (isPressed) lastMoveDirection = 'left';
        return;
    }

    if (action === 'right') {
        movementKeys.right = isPressed;
        if (isPressed) lastMoveDirection = 'right';
        return;
    }

    if (action === 'boost') {
        movementKeys.boost = isPressed;
        if (isPressed) {
            speedPriorityCounter++;
            boostPriorityOrder = speedPriorityCounter;
        }
        return;
    }

    if (action === 'slow') {
        movementKeys.slow = isPressed;
        if (isPressed) {
            speedPriorityCounter++;
            slowPriorityOrder = speedPriorityCounter;
        }
        return;
    }

    if (action === 'dash' && isPressed) {
        handleSpaceKey();
        return;
    }

    if (action === 'pause' && isPressed) {
        handleEnterKey();
    }
}

function getActionAtPoint(x, y) {
    const entries = getControlEntries();
    for (let i = 0; i < entries.length; i++) {
        const [action, button] = entries[i];
        if (isPointInsideButton(x, y, button)) {
            return action;
        }
    }
    return null;
}

function drawMobileControls() {
    if (!isMobileDevice || gameState !== STATES.PLAYING) {
        return;
    }

    const entries = getControlEntries();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < entries.length; i++) {
        const [action, button] = entries[i];
        const active =
            (action === 'left' && movementKeys.left) ||
            (action === 'right' && movementKeys.right) ||
            (action === 'boost' && movementKeys.boost) ||
            (action === 'slow' && movementKeys.slow);

        ctx.fillStyle = active ? 'rgba(255, 199, 0, 0.92)' : 'rgba(255, 215, 0, 0.82)';
        ctx.fillRect(button.x, button.y, button.width, button.height);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(button.x, button.y, button.width, button.height);

        ctx.fillStyle = '#000';
        ctx.font = action === 'slow' ? 'bold 14px Arial' : 'bold 16px Arial';
        ctx.fillText(button.label, button.x + button.width / 2, button.y + button.height / 2);
    }
}

function clearTouchControlStates() {
    movementKeys.left = false;
    movementKeys.right = false;
    movementKeys.boost = false;
    movementKeys.slow = false;
    touchAssignments.clear();
}

function handleCanvasTouchStart(event) {
    if (!isMobileDevice || gameState !== STATES.PLAYING || !gameRunning) {
        return;
    }

    event.preventDefault();
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const action = getActionAtPoint(x, y);

        if (action) {
            touchAssignments.set(touch.identifier, action);
            setActionState(action, true);
        }
    }
}

function handleCanvasTouchMove(event) {
    if (!isMobileDevice || gameState !== STATES.PLAYING || !gameRunning) {
        return;
    }

    event.preventDefault();
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const oldAction = touchAssignments.get(touch.identifier) || null;
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const newAction = getActionAtPoint(x, y);

        if (oldAction === newAction) {
            continue;
        }

        if (oldAction) {
            setActionState(oldAction, false);
            touchAssignments.delete(touch.identifier);
        }

        if (newAction) {
            touchAssignments.set(touch.identifier, newAction);
            setActionState(newAction, true);
        }
    }
}

function handleCanvasTouchEnd(event) {
    if (!isMobileDevice) {
        return;
    }

    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const action = touchAssignments.get(touch.identifier);
        if (action) {
            setActionState(action, false);
            touchAssignments.delete(touch.identifier);
        }
    }
}

function updateResponsiveSizes() {
    if (isMobileDevice) {
        player.width = 180;
        player.height = 180;
        player.speed = 10;
        OBJECT_SIZE = 120;
    } else {
        player.width = 240;
        player.height = 240;
        player.speed = 12;
        OBJECT_SIZE = 160;
    }
}

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
    if (combo >= 1000) return 100;
    if (combo >= 500) return 50;
    if (combo >= 200) return 20;
    if (combo >= 100) return 10;
    if (combo >= 50) return 5;
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
    // Update stamina (drain/regen)
    updateStamina();

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
 * Update stamina each frame
 * - Holding W drains stamina a little
 * - Otherwise stamina regens slowly
 * - Holding Shift doubles regen speed
 */
function updateStamina() {
    if (movementKeys.boost) {
        stamina -= STAMINA_W_DRAIN_PER_FRAME;
        shiftRegenHoldFrames = 0;
    } else {
        let regenAmount = STAMINA_REGEN_PER_FRAME;
        if (movementKeys.slow) {
            shiftRegenHoldFrames++;
            const progress = Math.min(1, shiftRegenHoldFrames / STAMINA_SHIFT_REGEN_RAMP_FRAMES);
            const rampedProgress = progress * progress;
            const multiplier = STAMINA_SHIFT_REGEN_MIN_MULTIPLIER +
                (STAMINA_SHIFT_REGEN_MAX_MULTIPLIER - STAMINA_SHIFT_REGEN_MIN_MULTIPLIER) * rampedProgress;
            regenAmount *= multiplier * STAMINA_SHIFT_REGEN_SPEED_MULTIPLIER;
        } else {
            shiftRegenHoldFrames = 0;
        }
        stamina += regenAmount;
    }

    // Clamp stamina to valid range
    stamina = Math.max(0, Math.min(STAMINA_MAX, stamina));
}

/**
 * Update goal progression during gameplay
 */
function updateGoalProgress() {
    while (score >= currentGoal) {
        currentGoal = Math.floor(currentGoal * GOAL_MULTIPLIER);
    }
}

/**
 * Update player position based on A/D keyboard input
 * Player moves horizontally only (left/right)
 */
function updatePlayer() {
    // Dash invincibility is active only while dash frames remain
    dashInvincible = dashFramesLeft > 0;

    if (dashFramesLeft > 0) {
        // Apply burst movement while dash is active
        player.x += dashDirection * DASH_SPEED;
        dashFramesLeft--;
    } else {
        const speedMultiplier = getMovementSpeedMultiplier();
        const currentSpeed = player.speed * speedMultiplier;

        if (movementKeys.left) {
            player.x -= currentSpeed;
        }

        if (movementKeys.right) {
            player.x += currentSpeed;
        }
    }
    
    // Keep player within canvas bounds
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

/**
 * Get movement speed multiplier from W/Shift with last-pressed priority
 * W = 2x speed, Shift = 0.5x speed
 */
function getMovementSpeedMultiplier() {
    const boostActive = movementKeys.boost && stamina > 0;

    if (boostActive && movementKeys.slow) {
        return boostPriorityOrder > slowPriorityOrder ? 2 : 0.5;
    }

    if (boostActive) {
        return 2;
    }

    if (movementKeys.slow) {
        return 0.5;
    }

    return 1;
}

/**
 * Update all visual feedback effects each frame
 */
function updateVisualEffects() {
    updateFloatingTexts();
    updatePlayerScaleEffect();
    updateScreenShakeEffect();
    updateForcefieldTimer();
}

function updateForcefieldTimer() {
    if (forcefieldTimer > 0) {
        forcefieldTimer--;
    }
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
        
        // Pick object dimensions (forcefield keeps original image ratio)
        const dimensions = getSpawnDimensionsForType(randomType);

        // Pick a random X position (object centered)
        const randomX = Math.random() * (canvas.width - dimensions.width);
        
        // Get randomized speed for this object (each object has slightly different speed)
        const speed = getRandomizedSpeed(randomType);
        
        // Create new falling object
        const newObject = {
            type: randomType,
            x: randomX,
            y: -dimensions.height, // Start above the screen
            width: dimensions.width,
            height: dimensions.height,
            speed: speed
        };
        
        // Add to array
        fallingObjects.push(newObject);
    }
}

/**
 * Get spawn dimensions per object type
 * Forcefield keeps its natural image aspect ratio within OBJECT_SIZE bounds.
 */
function getSpawnDimensionsForType(objectType) {
    if (objectType === OBJECT_TYPES.FORCEFIELD) {
        return getAspectFitDimensions(forcefieldImage, OBJECT_SIZE, OBJECT_SIZE);
    }

    return {
        width: OBJECT_SIZE,
        height: OBJECT_SIZE
    };
}

/**
 * Fit an image into max width/height while preserving aspect ratio.
 */
function getAspectFitDimensions(image, maxWidth, maxHeight) {
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;

    if (!imageWidth || !imageHeight) {
        return { width: maxWidth, height: maxHeight };
    }

    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);

    return {
        width: imageWidth * scale,
        height: imageHeight * scale
    };
}

/**
 * Get a randomized speed for an object type
 * Each object gets a faster random speed range (70% to 200% of base speed)
 */
function getRandomizedSpeed(objectType) {
    const baseSpeed = OBJECT_SPEEDS[objectType];
    const minFactor = 0.7;
    const maxFactor = 2.0;
    
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
            combo += 3;
            addFloatingText(`+${50 * multiplier}`, centerX, centerY, '#d4a017');
            triggerPlayerCatchEffect();
            break;
            
        case OBJECT_TYPES.DIRT_BALL:
            // Ignore harmful effects while dashing or forcefield is active
            if (dashInvincible || forcefieldTimer > 0) {
                combo += 2;
                addFloatingText('INVINCIBLE', centerX, centerY, '#ffffff');
                break;
            }

            lives--;
            score = Math.max(0, score - 100);
            combo = 0; // Reset combo on dirt ball hit
            addFloatingText('-1 LIFE', centerX, centerY, '#8b0000');
            addFloatingText('-100', centerX, centerY - 30, '#8b0000');
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

        case OBJECT_TYPES.FORCEFIELD:
            forcefieldTimer = FORCEFIELD_DURATION_FRAMES;
            combo++;
            addFloatingText('FORCEFIELD!', centerX, centerY, '#6a5acd');
            break;
    }
}

/**
 * Handle falling object hitting the ground
 */
function handleGroundHit(fallingObj) {
    const centerX = fallingObj.x + fallingObj.width / 2;
    const centerY = fallingObj.y + fallingObj.height / 2;

    switch (fallingObj.type) {
        case OBJECT_TYPES.WATER_DROP:
            // Missing a regular water drop costs one life
            lives--;
            combo = 0;
            addFloatingText('-1 LIFE', centerX, centerY, '#8b0000');
            triggerMudHitEffect();

            if (lives <= 0) {
                gameState = STATES.GAMEOVER;
            }
            break;

        case OBJECT_TYPES.GOLD_WATER_DROP:
            // Missing gold water should not cost a life
            break;
            
        case OBJECT_TYPES.DIRT_BALL:
            // Just remove it, no penalty
            break;
            
        case OBJECT_TYPES.HEART:
            // Just remove it
            break;

        case OBJECT_TYPES.FORCEFIELD:
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

    // When paused during gameplay, draw pause overlay and reset button
    if (!gameRunning && gameState === STATES.PLAYING) {
        drawPauseOverlay();
    }

    ctx.restore();
}

/**
 * Draw pause overlay with reset option
 */
function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 56px Arial';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 120);

    drawButton(PAUSE_RESUME_BUTTON, 'RESUME');
    drawButton(PAUSE_RESET_BUTTON, 'RESET');
    drawButton(PAUSE_HOME_BUTTON, 'HOME');
}

/**
 * START state: Show welcome/instructions screen
 */
function drawStart() {
    // Draw title
    ctx.fillStyle = '#000';
    ctx.font = isMobileDevice ? 'bold 34px Arial' : 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Water Drop Game', canvas.width / 2, isMobileDevice ? 88 : 100);

    if (isMobileDevice) {
        ctx.font = '20px Arial';
        ctx.fillText('Tap START, then use on-screen controls', canvas.width / 2, 132);
    }

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
    const forcefieldActive = forcefieldTimer > 0;

    if (forcefieldActive) {
        drawPlayerForcefieldOverlay();
    }

    const drawWidth = player.width * playerScale;
    const drawHeight = player.height * playerScale;
    const drawX = player.x - (drawWidth - player.width) / 2;
    const drawY = player.y - (drawHeight - player.height) / 2;

    // Make player semi-transparent while dashing
    ctx.globalAlpha = dashInvincible ? 0.62 : 1;

    // Add blue tint/glow while forcefield is active
    if (forcefieldActive) {
        ctx.filter = 'hue-rotate(165deg) saturate(1.65) brightness(1.08)';
        ctx.shadowColor = 'rgba(106, 90, 205, 0.85)';
        ctx.shadowBlur = 18;
    }

    // Draw the jerry can image
    ctx.drawImage(
        jerryCanImage,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    );

    // Reset draw state for other draw calls
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

/**
 * Draw active forcefield effect around player using the same forcefield image.
 */
function drawPlayerForcefieldOverlay() {
    const overlayBoxWidth = player.width * 1.9;
    const overlayBoxHeight = player.height * 1.9;
    const overlaySize = getAspectFitDimensions(forcefieldImage, overlayBoxWidth, overlayBoxHeight);
    const overlayX = player.x + (player.width - overlaySize.width) / 2;
    const overlayY = player.y + (player.height - overlaySize.height) / 2;

    let overlayAlpha = 0.75;

    // Flicker transparency when forcefield is close to ending
    if (forcefieldTimer <= FORCEFIELD_FLICKER_START_FRAMES) {
        const flickerPhase = Math.floor(forcefieldTimer / FORCEFIELD_FLICKER_INTERVAL_FRAMES) % 2;
        overlayAlpha = flickerPhase === 0 ? 0.15 : 0.75;
    }

    ctx.globalAlpha = overlayAlpha;
    ctx.drawImage(
        forcefieldImage,
        overlayX,
        overlayY,
        overlaySize.width,
        overlaySize.height
    );
    ctx.globalAlpha = 1;
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
        case OBJECT_TYPES.FORCEFIELD:
            return forcefieldImage;
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
    const lineHeight = isMobileDevice ? 29 : 35;
    const fontSize = isMobileDevice ? 20 : 24;
    let yPos = padding + lineHeight;
    
    // Get current multiplier
    const multiplier = getMultiplier();
    
    // Set text styling
    ctx.fillStyle = '#000';
    ctx.font = `bold ${fontSize}px Arial`;
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
    yPos += lineHeight;

    // Draw forcefield status
    if (forcefieldTimer > 0) {
        const secondsLeft = (forcefieldTimer / 60).toFixed(1);
        ctx.fillStyle = '#6a5acd';
        ctx.fillText(`Forcefield: ${secondsLeft}s`, canvas.width - padding, yPos);
    }
}

/**
 * Draw stamina bar (top-left)
 */
function drawStaminaBar() {
    const barX = 20;
    const barY = 20;
    const barWidth = isMobileDevice ? 190 : 260;
    const barHeight = isMobileDevice ? 16 : 20;
    const staminaRatio = stamina / STAMINA_MAX;

    // Label
    ctx.fillStyle = '#000';
    ctx.font = isMobileDevice ? 'bold 15px Arial' : 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Stamina', barX, barY - 22);

    // Bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Bar fill
    if (staminaRatio > 0.6) {
        ctx.fillStyle = '#2e8b57';
    } else if (staminaRatio > 0.3) {
        ctx.fillStyle = '#d4a017';
    } else {
        ctx.fillStyle = '#b22222';
    }
    ctx.fillRect(barX, barY, barWidth * staminaRatio, barHeight);

    // Bar outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}

/**
 * Draw controls help text under the top-right game stats
 */
function drawControlsHelp() {
    const padding = 20;
    const lineHeight = isMobileDevice ? 22 : 26;
    let y = isMobileDevice ? 190 : 230;

    // Title
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = isMobileDevice ? 'bold 18px Arial' : 'bold 20px Arial';
    ctx.fillText('Controls', canvas.width - padding, y);
    y += lineHeight + 4;

    ctx.font = isMobileDevice ? '15px Arial' : '17px Arial';

    if (isMobileDevice) {
        ctx.fillText('A/D: Move', canvas.width - padding, y);
        y += lineHeight;
        ctx.fillText('W: Boost', canvas.width - padding, y);
        y += lineHeight;
        ctx.fillText('Shift: Slow + Regen', canvas.width - padding, y);
        y += lineHeight;
        ctx.fillText('Dash: Evade', canvas.width - padding, y);
        y += lineHeight;
        ctx.fillText('Pause: Stop/Resume', canvas.width - padding, y);
        return;
    }

    // Desktop controls list
    ctx.fillText('A/D: Move', canvas.width - padding, y);
    y += lineHeight;
    ctx.fillText('W: Boost', canvas.width - padding, y);
    y += lineHeight;
    ctx.fillText('Shift: Slow + Regen', canvas.width - padding, y);
    y += lineHeight;
    ctx.fillText('Space: Evade', canvas.width - padding, y);
    y += lineHeight;
    ctx.fillText('Enter: Stop/Resume', canvas.width - padding, y);
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

    // Draw stamina bar
    drawStaminaBar();

    // Draw controls help panel
    drawControlsHelp();

    // Draw on-screen touch controls for mobile
    drawMobileControls();
    
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
    ctx.fillText('Click PLAY AGAIN to restart', canvas.width / 2, canvas.height / 2 + 80);

    // Draw Play Again button
    drawButton(PLAY_AGAIN_BUTTON, 'PLAY AGAIN');
    drawButton(GAMEOVER_HOME_BUTTON, 'HOME');
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
    }

    // Always draw so paused overlay and buttons remain interactive
    draw();

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
    resizeCanvas();
    updateResponsiveSizes();
    if (player && typeof player.init === 'function') {
        player.init();
    }
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

canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
canvas.addEventListener('touchend', handleCanvasTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', handleCanvasTouchEnd, { passive: false });

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
        restartGameFromPause();
    } else if (gameState === STATES.GAMEOVER && isPointInsideButton(clickX, clickY, GAMEOVER_HOME_BUTTON)) {
        resetGameToStart();
    } else if (!gameRunning && gameState === STATES.PLAYING && isPointInsideButton(clickX, clickY, PAUSE_RESUME_BUTTON)) {
        gameRunning = true;
    } else if (!gameRunning && gameState === STATES.PLAYING && isPointInsideButton(clickX, clickY, PAUSE_RESET_BUTTON)) {
        restartGameFromPause();
    } else if (!gameRunning && gameState === STATES.PLAYING && isPointInsideButton(clickX, clickY, PAUSE_HOME_BUTTON)) {
        returnToHomeFromPause();
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
        restartGameFromPause();
    } else if (gameState === STATES.GAMEOVER && isPointInsideButton(touchX, touchY, GAMEOVER_HOME_BUTTON)) {
        resetGameToStart();
    } else if (!gameRunning && gameState === STATES.PLAYING && isPointInsideButton(touchX, touchY, PAUSE_RESUME_BUTTON)) {
        gameRunning = true;
    } else if (!gameRunning && gameState === STATES.PLAYING && isPointInsideButton(touchX, touchY, PAUSE_RESET_BUTTON)) {
        restartGameFromPause();
    } else if (!gameRunning && gameState === STATES.PLAYING && isPointInsideButton(touchX, touchY, PAUSE_HOME_BUTTON)) {
        returnToHomeFromPause();
    }
});

/**
 * Handle keyboard input for state transitions
 */
document.addEventListener('keydown', (event) => {
    if (event.code === 'Enter') {
        handleEnterKey();
    } else if (event.code === 'Space') {
        event.preventDefault();
        handleSpaceKey();
    } else if (event.code === 'KeyA') {
        movementKeys.left = true;
        lastMoveDirection = 'left';
    } else if (event.code === 'KeyD') {
        movementKeys.right = true;
        lastMoveDirection = 'right';
    } else if (event.code === 'KeyW') {
        movementKeys.boost = true;
        if (!event.repeat) {
            speedPriorityCounter++;
            boostPriorityOrder = speedPriorityCounter;
        }
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        movementKeys.slow = true;
        if (!event.repeat) {
            speedPriorityCounter++;
            slowPriorityOrder = speedPriorityCounter;
        }
    }
});

/**
 * Track key release for A/D movement
 */
document.addEventListener('keyup', (event) => {
    if (event.code === 'KeyA') {
        movementKeys.left = false;
    } else if (event.code === 'KeyD') {
        movementKeys.right = false;
    } else if (event.code === 'KeyW') {
        movementKeys.boost = false;
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        movementKeys.slow = false;
    }
});

/**
 * ENTER key: Pause/resume active gameplay
 */
function handleEnterKey() {
    if (gameState === STATES.PLAYING) {
        gameRunning = !gameRunning;

        if (!gameRunning) {
            clearTouchControlStates();
        }
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
    stamina = STAMINA_MAX;

    // Reset visual effects
    floatingTexts = [];
    playerScale = 1;
    playerScaleTimer = 0;
    screenShakeTimer = 0;
    forcefieldTimer = 0;

    // Reset movement key state
    movementKeys.left = false;
    movementKeys.right = false;
    movementKeys.boost = false;
    movementKeys.slow = false;
    touchAssignments.clear();
    speedPriorityCounter = 0;
    boostPriorityOrder = 0;
    slowPriorityOrder = 0;
    shiftRegenHoldFrames = 0;
    dashDirection = 0;
    dashFramesLeft = 0;
    dashInvincible = false;
    lastMoveDirection = 'right';

    gameState = STATES.START;
}

/**
 * Restart gameplay from pause without returning to home screen
 */
function restartGameFromPause() {
    resetGameToStart();
    gameRunning = true;
    countdownTimer = 0;
    countdown = 3;
    gameState = STATES.COUNTDOWN;
}

/**
 * Return to start screen from pause
 */
function returnToHomeFromPause() {
    resetGameToStart();
    gameRunning = true;
}

/**
 * SPACE key: Dash in the last held A/D direction
 */
function handleSpaceKey() {
    if (gameState === STATES.PLAYING) {
        // Dash costs stamina
        if (stamina >= DASH_STAMINA_COST) {
            stamina -= DASH_STAMINA_COST;
            dashDirection = lastMoveDirection === 'left' ? -1 : 1;
            dashFramesLeft = DASH_DURATION_FRAMES;
        }
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
    stamina = STAMINA_MAX;

    // Reset visual effects
    floatingTexts = [];
    playerScale = 1;
    playerScaleTimer = 0;
    screenShakeTimer = 0;
    forcefieldTimer = 0;

    // Reset movement key state
    movementKeys.left = false;
    movementKeys.right = false;
    movementKeys.boost = false;
    movementKeys.slow = false;
    touchAssignments.clear();
    speedPriorityCounter = 0;
    boostPriorityOrder = 0;
    slowPriorityOrder = 0;
    shiftRegenHoldFrames = 0;
    dashDirection = 0;
    dashFramesLeft = 0;
    dashInvincible = false;
    lastMoveDirection = 'right';
}

// ========================================
// START THE GAME
// ========================================

updateResponsiveSizes();

// Kick off the game loop
gameLoop();
