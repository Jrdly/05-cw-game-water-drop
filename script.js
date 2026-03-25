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

const VISUAL_THEME = {
    skyTop: '#8ED8F8',
    skyBottom: '#E7F6FF',
    horizon: '#C8EBFF',
    panelFill: 'rgba(255, 255, 255, 0.78)',
    panelStroke: 'rgba(0, 0, 0, 0.15)',
    panelShadow: 'rgba(0, 0, 0, 0.18)',
    textPrimary: '#0D2333',
    textMuted: '#28465D',
    accent: '#F9A825',
    danger: '#B22222',
    success: '#2E8B57'
};

const IMPACT_FACTS = [
    'Every drop you catch represents cleaner water access.',
    'Reliable clean water helps kids stay in school.',
    'Clean water points can help protect community health.',
    'Your run represents liters that can change daily life.'
];
const IMPACT_FACT_ROTATE_FRAMES = 240;

const CANVAS_FONT_FAMILY =
    getComputedStyle(document.documentElement).getPropertyValue('--brand-font').trim() ||
    'Montserrat, sans-serif';

function brandFont(weightAndSize) {
    return `${weightAndSize} ${CANVAS_FONT_FAMILY}`;
}

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
        const panelHeight = Math.min(360, canvas.height * 0.6);
        const panelY = Math.max(36, canvas.height * 0.16);
        const bottomPadding = isMobileDevice ? 16 : 20;
        return panelY + panelHeight - this.height - bottomPadding;
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

const DIFFICULTIES = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

const DIFFICULTY_CONFIG = {
    easy: {
        label: 'EASY',
        spawnIntervalMultiplier: 1.6,
        speedMultiplier: 0.7,
        objectWeightMultipliers: {
            'water-drop': 1.2,
            'gold-water-drop': 1.35,
            'dirt-ball': 0.55,
            'heart': 1.5,
            'forcefield': 1.4
        }
    },
    medium: {
        label: 'NORMAL',
        spawnIntervalMultiplier: 1,
        speedMultiplier: 1,
        objectWeightMultipliers: {
            'water-drop': 1,
            'gold-water-drop': 1,
            'dirt-ball': 1,
            'heart': 1,
            'forcefield': 1
        }
    },
    hard: {
        label: 'HARD',
        spawnIntervalMultiplier: 0.55,
        speedMultiplier: 1.45,
        objectSpeedMultipliers: {
            'water-drop': 1.15,
            'gold-water-drop': 1.15
        },
        objectWeightMultipliers: {
            'water-drop': 0.92,
            'gold-water-drop': 0.7,
            'dirt-ball': 1.55,
            'heart': 0.6,
            'forcefield': 0.65
        }
    }
};

// ========================================
// GAME VARIABLES
// ========================================

let gameRunning = true;
let mouseX = 0;
let mouseY = 0;
let selectedDifficulty = DIFFICULTIES.MEDIUM;

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
const FORCEFIELD_DURATION_FRAMES = 900; // 15 seconds at ~60 FPS
const FORCEFIELD_FLICKER_START_FRAMES = 120; // Start warning flicker in final 2 seconds
const FORCEFIELD_FLICKER_INTERVAL_FRAMES = 6;
const HEART_REGEN_DURATION_FRAMES = 360; // 6 seconds at ~60 FPS
const HEART_REGEN_MULTIPLIER = 12;

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
let impactFactIndex = 0;
let impactFactFrameCounter = 0;
const homeFooter = document.getElementById('homeFooter');

function updateHomeFooterVisibility() {
    if (!homeFooter) {
        return;
    }
    homeFooter.classList.toggle('is-visible', gameState === STATES.START || gameState === STATES.GAMEOVER);
}

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
    'forcefield': 3.5
};

// Spawn weights (higher = more likely)
const SPAWN_WEIGHTS = {
    'water-drop': 150,       // More common
    'gold-water-drop': 25,   // Rare
    'dirt-ball': 300,        // Even more common
    'heart': 5,              // Very rare
    'forcefield': 10          // Very rare (same as heart)
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
let heartRegenTimer = 0;     // Frames left for boosted stamina regeneration

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
        ctx.font = action === 'slow' ? brandFont('bold 14px') : brandFont('bold 16px');
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

function clearKeyboardMovementStates() {
    movementKeys.left = false;
    movementKeys.right = false;
    movementKeys.boost = false;
    movementKeys.slow = false;
    shiftRegenHoldFrames = 0;
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

function getSelectedDifficultyConfig() {
    return DIFFICULTY_CONFIG[selectedDifficulty] || DIFFICULTY_CONFIG.medium;
}

function getCurrentSpawnInterval() {
    const interval = Math.round(SPAWN_INTERVAL * getSelectedDifficultyConfig().spawnIntervalMultiplier);
    return Math.max(20, interval);
}

function getStartDifficultyTitleY() {
    const panelY = Math.max(36, canvas.height * 0.16);
    const subtitleY = panelY + (isMobileDevice ? 120 : 146);
    const buttonHeight = isMobileDevice ? 44 : 52;
    const titleToButtonsGap = isMobileDevice ? 14 : 16;
    const buttonsToStartGap = isMobileDevice ? 56 : 68;

    const anchoredTitleY = START_BUTTON.y - buttonHeight - buttonsToStartGap - titleToButtonsGap;
    const minimumY = subtitleY + (isMobileDevice ? 74 : 52);

    return Math.max(minimumY, anchoredTitleY);
}

function getWrappedTextLines(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;

        if (ctx.measureText(testLine).width <= maxWidth || !currentLine) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

function drawCenteredWrappedText(lines, centerX, startY, lineHeight) {
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], centerX, startY + i * lineHeight);
    }
}

function getDifficultyButtons() {
    const width = isMobileDevice ? 88 : 124;
    const height = isMobileDevice ? 44 : 52;
    const gap = isMobileDevice ? 10 : 14;
    const difficultyTitleY = getStartDifficultyTitleY();
    const y = difficultyTitleY + (isMobileDevice ? 14 : 16);
    const totalWidth = width * 3 + gap * 2;
    const startX = canvas.width / 2 - totalWidth / 2;

    return [
        {
            key: DIFFICULTIES.EASY,
            label: DIFFICULTY_CONFIG.easy.label,
            button: { x: startX, y, width, height }
        },
        {
            key: DIFFICULTIES.MEDIUM,
            label: DIFFICULTY_CONFIG.medium.label,
            button: { x: startX + width + gap, y, width, height }
        },
        {
            key: DIFFICULTIES.HARD,
            label: DIFFICULTY_CONFIG.hard.label,
            button: { x: startX + (width + gap) * 2, y, width, height }
        }
    ];
}

function handleStartScreenInteraction(x, y) {
    if (gameState !== STATES.START) {
        return false;
    }

    const difficultyButtons = getDifficultyButtons();
    for (let i = 0; i < difficultyButtons.length; i++) {
        const entry = difficultyButtons[i];
        if (isPointInsideButton(x, y, entry.button)) {
            selectedDifficulty = entry.key;
            return true;
        }
    }

    if (isPointInsideButton(x, y, START_BUTTON)) {
        gameState = STATES.COUNTDOWN;
        countdown = 3;
        return true;
    }

    return false;
}

function tryPopDirtBallAtPoint(x, y) {
    if (gameState !== STATES.PLAYING || !gameRunning) {
        return false;
    }

    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        if (obj.type !== OBJECT_TYPES.DIRT_BALL) {
            continue;
        }

        const hitbox = getHitbox(obj);
        const clickHitboxPadding = isMobileDevice ? 24 : 16;
        const expandedHitbox = {
            x: hitbox.x - clickHitboxPadding,
            y: hitbox.y - clickHitboxPadding,
            width: hitbox.width + clickHitboxPadding * 2,
            height: hitbox.height + clickHitboxPadding * 2
        };
        const isInsideHitbox =
            x >= expandedHitbox.x &&
            x <= expandedHitbox.x + expandedHitbox.width &&
            y >= expandedHitbox.y &&
            y <= expandedHitbox.y + expandedHitbox.height;

        if (isInsideHitbox) {
            combo += 2;
            addFloatingText('+2 COMBO', obj.x + obj.width / 2, obj.y + obj.height / 2, VISUAL_THEME.textPrimary);
            fallingObjects.splice(i, 1);
            return true;
        }
    }

    return false;
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
    impactFactFrameCounter++;
    if (impactFactFrameCounter >= IMPACT_FACT_ROTATE_FRAMES) {
        impactFactFrameCounter = 0;
        impactFactIndex = (impactFactIndex + 1) % IMPACT_FACTS.length;
    }
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
    if (heartRegenTimer > 0) {
        heartRegenTimer--;
    }

    const heartRegenActive = heartRegenTimer > 0;

    if (forcefieldTimer > 0) {
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

        if (heartRegenActive) {
            regenAmount *= HEART_REGEN_MULTIPLIER;
        }

        stamina += regenAmount;
        stamina = Math.max(0, Math.min(STAMINA_MAX, stamina));
        return;
    }

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

        if (heartRegenActive) {
            regenAmount *= HEART_REGEN_MULTIPLIER;
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
    const boostActive = movementKeys.boost && (stamina > 0 || forcefieldTimer > 0);

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
    const currentSpawnInterval = getCurrentSpawnInterval();
    
    // Check if it's time to spawn a new object
    if (spawnTimer >= currentSpawnInterval) {
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
    const difficultyConfig = getSelectedDifficultyConfig();
    const difficultySpeedMultiplier =
        difficultyConfig.objectSpeedMultipliers?.[objectType] ?? difficultyConfig.speedMultiplier;
    const minFactor = 0.7;
    const maxFactor = 2.0;
    
    // Random value between minFactor and maxFactor
    const randomFactor = minFactor + Math.random() * (maxFactor - minFactor);
    
    return baseSpeed * randomFactor * difficultySpeedMultiplier;
}

/**
 * Get a weighted random object type based on spawn weights
 */
function getWeightedRandomObject() {
    const weightMultipliers = getSelectedDifficultyConfig().objectWeightMultipliers || {};

    const adjustedEntries = Object.entries(SPAWN_WEIGHTS).map(([type, weight]) => {
        const multiplier = weightMultipliers[type] ?? 1;
        const adjustedWeight = Math.max(0, weight * multiplier);
        return [type, adjustedWeight];
    });

    // Calculate total weight
    const totalWeight = adjustedEntries.reduce((sum, [, adjustedWeight]) => sum + adjustedWeight, 0);

    if (totalWeight <= 0) {
        return OBJECT_TYPES.WATER_DROP;
    }
    
    // Pick a random number from 0 to totalWeight
    let random = Math.random() * totalWeight;
    
    // Find which object type this falls into
    for (const [type, weight] of adjustedEntries) {
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
                addFloatingText('+2 COMBO', centerX, centerY, VISUAL_THEME.textPrimary);
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
            heartRegenTimer = HEART_REGEN_DURATION_FRAMES;
            addFloatingText('FAST REGEN', centerX, centerY - 28, '#2e8b57');
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

    // Draw layered background scene
    drawBackgroundScene();

    // Apply camera shake only during gameplay
    const shakeOffset = gameState === STATES.PLAYING
        ? getScreenShakeOffset()
        : { x: 0, y: 0 };
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);

    // Draw based on current game state
    updateHomeFooterVisibility();
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

function drawRoundedRectPath(x, y, width, height, radius) {
    const clampedRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
    ctx.beginPath();
    ctx.moveTo(x + clampedRadius, y);
    ctx.lineTo(x + width - clampedRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + clampedRadius);
    ctx.lineTo(x + width, y + height - clampedRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - clampedRadius, y + height);
    ctx.lineTo(x + clampedRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - clampedRadius);
    ctx.lineTo(x, y + clampedRadius);
    ctx.quadraticCurveTo(x, y, x + clampedRadius, y);
    ctx.closePath();
}

function drawPanel(x, y, width, height, radius = 14) {
    ctx.save();
    ctx.shadowColor = VISUAL_THEME.panelShadow;
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    drawRoundedRectPath(x, y, width, height, radius);
    ctx.fillStyle = VISUAL_THEME.panelFill;
    ctx.fill();
    ctx.restore();

    drawRoundedRectPath(x, y, width, height, radius);
    ctx.strokeStyle = VISUAL_THEME.panelStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawCloud(x, y, scale = 1, alpha = 0.22) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, 26 * scale, 0, Math.PI * 2);
    ctx.arc(x + 28 * scale, y - 10 * scale, 22 * scale, 0, Math.PI * 2);
    ctx.arc(x + 54 * scale, y + 2 * scale, 28 * scale, 0, Math.PI * 2);
    ctx.arc(x + 22 * scale, y + 16 * scale, 24 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawBackgroundScene() {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, VISUAL_THEME.skyTop);
    skyGradient.addColorStop(0.62, VISUAL_THEME.horizon);
    skyGradient.addColorStop(1, VISUAL_THEME.skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Soft horizon strip near the bottom
    const horizonHeight = Math.max(58, canvas.height * 0.11);
    const horizonY = canvas.height - horizonHeight;
    const horizonGradient = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
    horizonGradient.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    horizonGradient.addColorStop(1, 'rgba(255, 255, 255, 0.42)');
    ctx.fillStyle = horizonGradient;
    ctx.fillRect(0, horizonY, canvas.width, horizonHeight);

    // Subtle clouds for depth
    const cloudY = Math.max(55, canvas.height * 0.14);
    drawCloud(canvas.width * 0.08, cloudY, 1.1, 0.2);
    drawCloud(canvas.width * 0.34, cloudY + 18, 0.9, 0.16);
    drawCloud(canvas.width * 0.62, cloudY - 6, 1.25, 0.18);
    drawCloud(canvas.width * 0.84, cloudY + 16, 0.95, 0.14);
}

/**
 * Draw pause overlay with reset option
 */
function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(13, 35, 51, 0.46)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const panelWidth = Math.min(560, canvas.width * 0.82);
    const panelHeight = Math.min(420, canvas.height * 0.65);
    const panelX = canvas.width / 2 - panelWidth / 2;
    const panelY = canvas.height / 2 - panelHeight / 2;
    drawPanel(panelX, panelY, panelWidth, panelHeight, 18);

    ctx.fillStyle = VISUAL_THEME.textPrimary;
    ctx.textAlign = 'center';
    ctx.font = brandFont('bold 56px');
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 120);

    drawControlsHelp('pause');

    drawButton(PAUSE_RESUME_BUTTON, 'RESUME');
    drawButton(PAUSE_RESET_BUTTON, 'RESET');
    drawButton(PAUSE_HOME_BUTTON, 'HOME');
}

/**
 * START state: Show welcome/instructions screen
 */
function drawStart() {
    const panelWidth = Math.min(640, canvas.width * 0.88);
    const panelHeight = Math.min(360, canvas.height * 0.6);
    const panelX = canvas.width / 2 - panelWidth / 2;
    const panelY = Math.max(36, canvas.height * 0.16);
    drawPanel(panelX, panelY, panelWidth, panelHeight, 18);

    // Draw title
    const subtitleY = panelY + (isMobileDevice ? 116 : 146);
    const difficultyTitleY = getStartDifficultyTitleY();

    ctx.fillStyle = VISUAL_THEME.textPrimary;
    ctx.font = isMobileDevice ? brandFont('bold 38px') : brandFont('bold 48px');
    ctx.textAlign = 'center';
    ctx.fillText('Water Drop Game', canvas.width / 2, panelY + (isMobileDevice ? 78 : 96));

    ctx.fillStyle = VISUAL_THEME.textMuted;
    ctx.font = isMobileDevice ? brandFont('16px') : brandFont('22px');
    const subtitleText = 'Catch clean water. Avoid dirt. Support communities.';
    const subtitleMaxWidth = panelWidth - (isMobileDevice ? 48 : 28);
    const subtitleLines = getWrappedTextLines(subtitleText, subtitleMaxWidth);
    const subtitleLineHeight = isMobileDevice ? 20 : 24;
    drawCenteredWrappedText(subtitleLines, canvas.width / 2, subtitleY, subtitleLineHeight);

    const currentFact = IMPACT_FACTS[impactFactIndex];
    const subtitleBottomY = subtitleY + subtitleLineHeight * (subtitleLines.length - 1);
    const factY = subtitleBottomY + (difficultyTitleY - subtitleBottomY) / 2;
    const factAreaHeight = difficultyTitleY - subtitleBottomY;
    const factFont = isMobileDevice ? brandFont('600 14px') : brandFont('600 16px');
    const maxFactWidth = panelWidth - (isMobileDevice ? 40 : 58);
    ctx.font = factFont;
    const factLines = getWrappedTextLines(currentFact, maxFactWidth - 26);
    const factLineHeight = isMobileDevice ? 16 : 18;
    const widestFactLine = factLines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);
    const factTextWidth = Math.min(maxFactWidth, widestFactLine + 26);
    const factBoxHeight = (isMobileDevice ? 18 : 18) + factLineHeight * factLines.length;
    const factBoxX = canvas.width / 2 - factTextWidth / 2;
    const factBoxY = factY - factBoxHeight / 2;

    if (factAreaHeight >= (isMobileDevice ? 66 : 66)) {
        drawRoundedRectPath(factBoxX, factBoxY, factTextWidth, factBoxHeight, 12);
        ctx.fillStyle = 'rgba(249, 168, 37, 0.24)';
        ctx.fill();
        drawRoundedRectPath(factBoxX, factBoxY, factTextWidth, factBoxHeight, 12);
        ctx.strokeStyle = 'rgba(13, 35, 51, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = VISUAL_THEME.textPrimary;
        ctx.font = factFont;
        drawCenteredWrappedText(
            factLines,
            canvas.width / 2,
            factY - ((factLines.length - 1) * factLineHeight) / 2 + 1,
            factLineHeight
        );
    }

    ctx.fillStyle = VISUAL_THEME.textPrimary;
    ctx.font = isMobileDevice ? brandFont('bold 18px') : brandFont('bold 22px');
    ctx.fillText('Difficulty', canvas.width / 2, difficultyTitleY);

    const difficultyButtons = getDifficultyButtons();
    for (let i = 0; i < difficultyButtons.length; i++) {
        const entry = difficultyButtons[i];
        drawDifficultyButton(entry.button, entry.label, selectedDifficulty === entry.key);
    }

    drawControlsHelp('start');

    // Draw Start button
    drawButton(START_BUTTON, 'START');
}

function drawDifficultyButton(button, label, isSelected) {
    const gradient = ctx.createLinearGradient(0, button.y, 0, button.y + button.height);

    if (isSelected) {
        gradient.addColorStop(0, '#FFE182');
        gradient.addColorStop(1, '#FFC700');
    } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        gradient.addColorStop(1, 'rgba(235, 242, 248, 0.9)');
    }

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    drawRoundedRectPath(button.x, button.y, button.width, button.height, 12);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    drawRoundedRectPath(button.x, button.y, button.width, button.height, 12);
    ctx.strokeStyle = isSelected ? 'rgba(0, 0, 0, 0.28)' : 'rgba(0, 0, 0, 0.14)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = VISUAL_THEME.textPrimary;
    ctx.font = isMobileDevice ? brandFont('bold 16px') : brandFont('bold 18px');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, button.x + button.width / 2, button.y + button.height / 2);
}

/**
 * Draw a button with text
 */
function drawButton(button, label) {
    // Determine button color (darker if mouse is over it)
    const isHovering = isMouseOverButton(button);
    const yOffset = isHovering ? -1 : 0;
    const gradient = ctx.createLinearGradient(0, button.y + yOffset, 0, button.y + button.height + yOffset);
    gradient.addColorStop(0, isHovering ? '#FFE182' : '#FFE792');
    gradient.addColorStop(1, isHovering ? button.hoverColor : button.color);

    // Draw button with depth
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    drawRoundedRectPath(button.x, button.y + yOffset, button.width, button.height, 14);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    drawRoundedRectPath(button.x, button.y + yOffset, button.width, button.height, 14);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw button text
    ctx.fillStyle = button.textColor;
    ctx.font = brandFont('bold 30px');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, button.x + button.width / 2, button.y + button.height / 2 + yOffset);
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
    ctx.font = brandFont('bold 28px');

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
function getStatsPanelLayout() {
    const padding = 20;
    const panelWidth = isMobileDevice ? 246 : 320;
    const rowHeight = isMobileDevice ? 27 : 32;
    const headerHeight = isMobileDevice ? 32 : 36;
    const rowCount = forcefieldTimer > 0 ? 6 : 5;
    const panelHeight = headerHeight + rowCount * rowHeight + 18;
    const panelX = canvas.width - padding - panelWidth;
    const mobileBottomReserve = isMobileDevice ? (MOBILE_CONTROLS.buttonSize + 42) : 0;
    const panelY = canvas.height - panelHeight - padding - mobileBottomReserve;

    return {
        padding,
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        rowHeight,
        headerHeight
    };
}

function drawUI() {
    const layout = getStatsPanelLayout();
    drawPanel(layout.panelX, layout.panelY, layout.panelWidth, layout.panelHeight, 14);

    const multiplier = getMultiplier();

    const statRows = [
        { label: 'Clean Water', value: `${score} L`, color: VISUAL_THEME.textPrimary },
        { label: 'Lives', value: `${lives}`, color: VISUAL_THEME.textPrimary },
        { label: 'Momentum', value: `${combo}`, color: VISUAL_THEME.textPrimary },
        { label: 'Impact Boost', value: `${multiplier}x`, color: multiplier > 1 ? VISUAL_THEME.accent : VISUAL_THEME.textPrimary },
        { label: 'Next Goal', value: `${currentGoal} L`, color: VISUAL_THEME.textPrimary }
    ];

    if (forcefieldTimer > 0) {
        statRows.push({
            label: 'Forcefield',
            value: `${(forcefieldTimer / 60).toFixed(1)}s`,
            color: '#6a5acd'
        });
    }

    const contentLeft = layout.panelX + 14;
    const contentRight = layout.panelX + layout.panelWidth - 14;

    // Header
    ctx.fillStyle = VISUAL_THEME.textPrimary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = isMobileDevice ? brandFont('bold 19px') : brandFont('bold 22px');
    ctx.fillText('Impact Stats', contentLeft, layout.panelY + layout.headerHeight / 2 + 2);

    // Divider below header
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(contentLeft, layout.panelY + layout.headerHeight);
    ctx.lineTo(contentRight, layout.panelY + layout.headerHeight);
    ctx.stroke();

    // Rows
    for (let i = 0; i < statRows.length; i++) {
        const row = statRows[i];
        const rowCenterY = layout.panelY + layout.headerHeight + layout.rowHeight * i + layout.rowHeight / 2;

        if (i > 0) {
            const separatorY = layout.panelY + layout.headerHeight + layout.rowHeight * i;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.beginPath();
            ctx.moveTo(contentLeft, separatorY);
            ctx.lineTo(contentRight, separatorY);
            ctx.stroke();
        }

        ctx.fillStyle = VISUAL_THEME.textMuted;
        ctx.font = isMobileDevice ? brandFont('bold 16px') : brandFont('bold 18px');
        ctx.textAlign = 'left';
        ctx.fillText(row.label, contentLeft, rowCenterY);

        ctx.fillStyle = row.color;
        ctx.font = isMobileDevice ? brandFont('bold 17px') : brandFont('bold 19px');
        ctx.textAlign = 'right';
        ctx.fillText(row.value, contentRight, rowCenterY);
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
    const panelPaddingX = 14;
    const panelPaddingY = 12;
    const staminaRatio = stamina / STAMINA_MAX;

    drawPanel(
        barX - panelPaddingX,
        barY - 30,
        barWidth + panelPaddingX * 2,
        barHeight + 30 + panelPaddingY,
        12
    );

    // Label
    ctx.fillStyle = VISUAL_THEME.textPrimary;
    ctx.font = isMobileDevice ? brandFont('bold 15px') : brandFont('bold 18px');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Stamina', barX, barY - 22);

    // Bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Bar fill
    if (staminaRatio > 0.6) {
        ctx.fillStyle = VISUAL_THEME.success;
    } else if (staminaRatio > 0.3) {
        ctx.fillStyle = VISUAL_THEME.accent;
    } else {
        ctx.fillStyle = VISUAL_THEME.danger;
    }
    ctx.fillRect(barX, barY, barWidth * staminaRatio, barHeight);

    // Bar outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}

/**
 * Draw controls/instructions help panel
 */
function drawControlsHelp(screen = 'start') {
    const padding = isMobileDevice ? 12 : 20;
    const lineHeight = isMobileDevice ? 18 : 22;
    const titleFont = isMobileDevice ? brandFont('bold 16px') : brandFont('bold 20px');
    const bodyFont = isMobileDevice ? brandFont('14px') : brandFont('17px');
    const lineItems = isMobileDevice
        ? [
            'Touch A/D to move • W to boost',
            'Shift slows and rebuilds stamina',
            'Dash into dirt balls OR tap them: +2 combo',
            'Catch water drops, avoid dirt unless comboing',
            'Use Pause to reset or return home'
        ]
        : [
            'A/D move • W boost • Shift slows + regen',
            'Space dashes • Enter pauses/resumes',
            'Dash into dirt balls OR click them: +2 combo',
            'Catch water drops for liters and combo',
            'Avoid dirt balls unless using dash/combo play'
        ];

    const panelWidth = isMobileDevice ? Math.min(430, canvas.width - padding * 2) : 430;
    const panelHeight = 56 + lineItems.length * lineHeight;
    const panelX = padding;
    const panelY = screen === 'pause'
        ? canvas.height - panelHeight - padding
        : Math.min(canvas.height - panelHeight - padding, START_BUTTON.y + START_BUTTON.height + (isMobileDevice ? 10 : 16));
    let y = panelY + 12;

    drawPanel(panelX, panelY, panelWidth, panelHeight, 14);

    ctx.fillStyle = VISUAL_THEME.textPrimary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = titleFont;
    ctx.fillText('How To Play', panelX + 14, y);
    y += lineHeight + 4;

    ctx.font = bodyFont;
    ctx.fillStyle = VISUAL_THEME.textMuted;
    for (let i = 0; i < lineItems.length; i++) {
        ctx.fillText(lineItems[i], panelX + 14, y);
        y += lineHeight;
    }
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
    ctx.font = brandFont('bold 80px');
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

    // Draw on-screen touch controls for mobile
    drawMobileControls();
    
    // Draw UI (score, lives, combo)
    drawUI();
}

/**
 * GAMEOVER state: Show game over screen
 */
function drawGameOver() {
    ctx.fillStyle = 'rgba(13, 35, 51, 0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const panelWidth = Math.min(780, canvas.width * 0.88);
    const panelHeight = Math.min(520, canvas.height * 0.8);
    const panelX = canvas.width / 2 - panelWidth / 2;
    const panelY = canvas.height / 2 - panelHeight / 2;
    drawPanel(panelX, panelY, panelWidth, panelHeight, 18);

    const helpedPeople = Number((score / 20).toFixed(1));

    // Draw game over text
    ctx.fillStyle = VISUAL_THEME.textPrimary;
    ctx.font = brandFont('bold 50px');
    ctx.textAlign = 'center';
    ctx.fillText('MISSION SUMMARY', canvas.width / 2, canvas.height / 2 - 140);

    // Draw final score
    ctx.font = brandFont('bold 32px');
    ctx.fillText(`Clean Water Collected: ${score} L`, canvas.width / 2, canvas.height / 2 - 80);

    // Draw water impact message
    ctx.font = isMobileDevice ? brandFont('18px') : brandFont('22px');
    ctx.fillStyle = VISUAL_THEME.textMuted;
    ctx.fillText('In many places, reliable clean water still changes everything.', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = VISUAL_THEME.textPrimary;
    ctx.fillText(`Your run represents support for about ${helpedPeople} people.`, canvas.width / 2, canvas.height / 2 + 20);

    // Draw restart instruction
    ctx.font = brandFont('20px');
    ctx.fillText('Play again to grow your impact.', canvas.width / 2, canvas.height / 2 + 80);

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
    if (event.target && typeof event.target.closest === 'function' && event.target.closest('#homeFooter')) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    if (handleStartScreenInteraction(clickX, clickY)) {
        return;
    }

    if (tryPopDirtBallAtPoint(clickX, clickY)) {
        return;
    }

    if (gameState === STATES.GAMEOVER && isPointInsideButton(clickX, clickY, PLAY_AGAIN_BUTTON)) {
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
    if (event.target && typeof event.target.closest === 'function' && event.target.closest('#homeFooter')) {
        return;
    }

    // Always release any on-canvas control mappings for ended touches
    handleCanvasTouchEnd(event);

    const rect = canvas.getBoundingClientRect();
    const touch = event.changedTouches[0];
    if (!touch) {
        return;
    }
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    if (handleStartScreenInteraction(touchX, touchY)) {
        return;
    }

    if (tryPopDirtBallAtPoint(touchX, touchY)) {
        return;
    }

    if (gameState === STATES.GAMEOVER && isPointInsideButton(touchX, touchY, PLAY_AGAIN_BUTTON)) {
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

document.addEventListener('touchcancel', (event) => {
    // Cancelled touches should also release mapped controls (prevents stuck boost)
    handleCanvasTouchEnd(event);
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
        event.preventDefault();
        movementKeys.left = true;
        lastMoveDirection = 'left';
    } else if (event.code === 'KeyD') {
        event.preventDefault();
        movementKeys.right = true;
        lastMoveDirection = 'right';
    } else if (event.code === 'KeyW') {
        event.preventDefault();
        movementKeys.boost = true;
        if (!event.repeat) {
            speedPriorityCounter++;
            boostPriorityOrder = speedPriorityCounter;
        }
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        event.preventDefault();
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
        event.preventDefault();
        movementKeys.left = false;
    } else if (event.code === 'KeyD') {
        event.preventDefault();
        movementKeys.right = false;
    } else if (event.code === 'KeyW') {
        event.preventDefault();
        movementKeys.boost = false;
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        event.preventDefault();
        movementKeys.slow = false;
    }
});

window.addEventListener('blur', () => {
    clearKeyboardMovementStates();
    clearTouchControlStates();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearKeyboardMovementStates();
        clearTouchControlStates();
    }
});

/**
 * ENTER key: Pause/resume active gameplay
 */
function handleEnterKey() {
    if (gameState === STATES.PLAYING) {
        gameRunning = !gameRunning;

        if (!gameRunning) {
            clearKeyboardMovementStates();
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
    heartRegenTimer = 0;

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
        const hasForcefield = forcefieldTimer > 0;

        // Dash costs stamina
        if (hasForcefield || stamina >= DASH_STAMINA_COST) {
            if (!hasForcefield) {
                stamina -= DASH_STAMINA_COST;
            }
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
    heartRegenTimer = 0;

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
