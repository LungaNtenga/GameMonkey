// This is the state of the game "An object describing the game's functionality"
let state = {};

// This is the main canvas's element and its drawing context (From the HTML)
const canvas = document.getElementById('game');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d"); 
const angleDom = document.querySelector("#info-left .angle"); // The HTML LEFT info field
const velocityDom = document.querySelector("#info-left .velocity");
const angle2Dom = document.querySelector("#info-right .angle"); // The HTML RIGHT info field
const velocity2DOM = document.querySelector("#info-right .velocity");
const bombGrabAreaDOM = document.getElementById("bomb-grab-area");
// HTML Congratulations to the winner div
const congratulationDOM = document.getElementById("congratulations");
const winnerDOM = document.getElementById("winner");
const newGameButtonDOM = document.getElementById("new-game");

// Define blast hole radius
const blastHoleRadius = 18;

// New game function (Where everything starts)
newGame();

function newGame() {
    // Reset the game state
    state = {
        phase: "aiming",
        currentPlayer: 1,
        bomb: {
            x: undefined,
            y: undefined,
            rotation: 0,
            velocity: { x: 0, y: 0 },
        },
        backgroundBuildings: [],
        buildings: [],
        blastHoles: [],

        scale: 1,
    };

    // Generate buildings
    for (let i = 0; i < 11; i++) {
        generateBackgroundBuilding(i);
    }
    for (let i = 0; i < 8; i++) {
        generateBuilding(i);
    }

    // The function to calculate the scale
    calculateScale();

    // Initialize the bomb's position
    initializeBombPosition(); // Add this line

    // Draw the scene
    draw();
    //Reset HTML elements
    congratulationDOM.style.visibility = "hidden";
    angleDom.innerHTML = 0;
    velocity2DOM.innerText = 0;
    velocityDom.innerText = 0;
    angle2Dom.innerText = 0;
}

// THE SCALE FUNCTION
function calculateScale() {
    const lastBuilding = state.buildings.at(-1);
    const totalWidthOfTheCity = lastBuilding.x + lastBuilding.width;

    state.scale = window.innerWidth / totalWidthOfTheCity;
}

function draw() {
    // Event handlers
    ctx.save(); // Fixed: added missing parentheses

    // We flip the coordinates system upside down or SCALING
    ctx.translate(0, window.innerHeight);
    ctx.scale(1, -1);
    ctx.scale(state.scale, state.scale);

    // Then we draw the scene (By calling the Functions)
    drawBackground();
    drawBackgroundBuildings(); // The 
    drawBuildingsWithBlastHoles();
    drawGorilla(1);
    drawGorilla(2);
    drawBomb();

    ctx.restore();
}

// We define the drawBackground function
function drawBackground() {
    // Base layer
    const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight / state.scale);
    gradient.addColorStop(0, '#FFC28E');

    // We draw the sky 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth / state.scale, window.innerHeight / state.scale);

    // Then we do the moon
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; 
    ctx.beginPath();
    ctx.arc(300, 350, 60, 0, 2 * Math.PI);  // For a full circle
    ctx.fill(); // Final touch
}

// Window resizing the window when the window's size changes
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight; 
    calculateScale();
    initializeBombPosition();
    draw();
});

// The action of a player "Monkey" to throw
function throwBomb() {
    state.phase = "in flight"; // Set the phase to "in flight"
    previousAnimationTimestamp = undefined;
    requestAnimationFrame(animate); // Start the animation loop
}

// Buildings functions (Background, Buildings and the Bomb locations)

// 1 (THE BACKGROUND BUILDINGS)
function generateBackgroundBuilding(index) {
    const previousBuilding = state.backgroundBuildings[index - 1];

    const x = previousBuilding
        ? previousBuilding.x + previousBuilding.width + 4
        : -30; // If there is no building we start at -30

    // Then we set the size of the buildings (To differ by using random)
    const minWidth = 60;
    const maxWidth = 110;
    const width = minWidth + Math.random() * (maxWidth - minWidth);

    const minHeight = 80;
    const maxHeight = 359;
    const height = minHeight + Math.random() * (maxHeight - minHeight);
    // Then we set the state
    state.backgroundBuildings.push({ x, width, height });
}

// Drawing a rectangle
function drawBackgroundBuildings() {
    state.backgroundBuildings.forEach((building) => { 
        ctx.fillStyle = "#947285";
        ctx.fillRect(building.x, 0, building.width, building.height);
    }); // Fixed: added closing parenthesis and semicolon
}

// 2 (The Obstacles between the Gorillas) SECONDARY BUILDINGS
function generateBuilding(index) {
    const previousBuilding = state.buildings[index - 1];

    const x = previousBuilding
        ? previousBuilding.x + previousBuilding.width + 4
        : 0;

    const minWidth = 80;
    const maxWidth = 130;
    const width = minWidth + Math.random() * (maxWidth - minWidth);

    const platformWithGorilla = index === 1 || index === 6;

    const minHeight = 40;
    const maxHeight = 300;
    // Now the Gorillas heights
    const minHeightGorilla = 30;
    const maxHeightGorilla = 150;

    const height = platformWithGorilla
        ? minHeightGorilla + Math.random() * (maxHeightGorilla - minHeightGorilla)
        : minHeight + Math.random() * (maxHeight - minHeight);

    // Now we generate an array to check if the lights are on or off (Boolean)
    const lightsOn = [];
    for (let i = 0; i < 50; i++) {
        const light = Math.random() <= 0.33 ? true : false;
        lightsOn.push(light);
    }

    state.buildings.push({ x, width, height, lightsOn });
}

// THE BOMB'S POSITION 
// Depends on the position of the gorilla
function initializeBombPosition() {
    const building =
        state.currentPlayer === 1
            ? state.buildings.at(1) // the second building
            : state.buildings.at(-2); // the second last position for 2nd PLAYER

    const gorillaX = building.x + building.width / 2;
    const gorillaY = building.height;

    const gorillaHandOffsetX = state.currentPlayer === 1 ? -28 : 28;
    const gorillaHandOffsetY = 107;

    state.bomb.x = gorillaX + gorillaHandOffsetX;
    state.bomb.y = gorillaY + gorillaHandOffsetY;
    // THE VELOCITY OF THE BOMB
    state.bomb.velocity.x = 0;
    state.bomb.velocity.y = 0;
    state.bomb.rotation = 0;

    // initialise the bomb areaRadius in HTML
    const grabAreaRadius = 15;
    const left = state.bomb.x * state.scale - grabAreaRadius;
    const bottom = state.bomb.y * state.scale - grabAreaRadius;
    bombGrabAreaDOM.style.left = `${left}px`;
    bombGrabAreaDOM.style.bottom = `${bottom}px`; 
}

// Bomb drawn
function drawBomb() {
    ctx.save();
    ctx.translate(state.bomb.x, state.bomb.y);

    if (state.phase === "aiming") {
        // Move the bomb with mouse while aiming
        ctx.translate(-state.bomb.velocity.x / 6.25, -state.bomb.velocity.y / 6.25);

        // Drawing the aiming trajectory (LINES)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)"; 
        ctx.setLineDash([3, 8]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(state.bomb.velocity.x, state.bomb.velocity.y);
        ctx.stroke();

        // Drawing a circle
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, 2 * Math.PI); 
        ctx.fill();
    } else if (state.phase === "in flight") { 
        // Rotated banana
        ctx.fillStyle = "white";
        ctx.rotate(state.bomb.rotation);
        ctx.beginPath();
        ctx.moveTo(-8, -12);
        ctx.quadraticCurveTo(0, 12, 8, -2);
        ctx.quadraticCurveTo(0, 2, -8, -2);
        ctx.fill();
    } else {
        // Default circle drawing
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, 2 * Math.PI); 
        ctx.fill();
    }

    ctx.restore();
}

// MAIN BUILDINGS
function drawBuildings() {
    state.buildings.forEach((building) => {
        // Drawing the building
        ctx.fillStyle = "#4A3C68";
        ctx.fillRect(building.x, 0, building.width, building.height);

        // Drawing the windows
        const windowWidth = 10;
        const windowHeight = 12;
        const gap = 15;

        // Now we have do the floors
        const numberOfFloors = Math.ceil(
            (building.height - gap) / (windowHeight + gap)
        );

        const numberOfRoomsPerFloor = Math.floor(
            (building.width - gap) / (windowHeight + gap)
        );
        for (let floor = 0; floor < numberOfFloors; floor++) {
            for (let room = 0; room < numberOfRoomsPerFloor; room++) {
                if (building.lightsOn[floor * numberOfRoomsPerFloor + room]) {
                    ctx.save();

                    ctx.translate(building.x + gap, building.height - gap); 
                    ctx.scale(1, -1);

                    const x = room * (windowWidth + gap);
                    const y = floor * (windowHeight + gap);

                    ctx.fillStyle = "#EBB6A2";
                    ctx.fillRect(x, y, windowWidth, windowHeight);

                    ctx.restore();
                }
            }
        }
    });
}

// Buildings with blast holes
function drawBuildingsWithBlastHoles() {
    ctx.save();
    
    state.blastHoles.forEach((blastHole) => {
        ctx.beginPath();

        // Outshape clockwise
        ctx.rect(
            0, 0, window.innerWidth / state.scale, window.innerHeight / state.scale
        );
        ctx.arc(blastHole.x, blastHole.y, blastHoleRadius, 0, 2 * Math.PI, true);
        ctx.clip();
    });
    drawBuildings();
    ctx.restore();
}

// Drawing the GORILLAS
function drawGorilla(player) {
    ctx.save();

    const building =
        player === 1
            ? state.buildings.at(1) // Second building
            : state.buildings.at(-2); // Second last building 

    ctx.translate(building.x + building.width / 2, building.height);

    drawGorillaBody();
    drawGorillaRightArm(player);
    drawGorillaLeftArm(player);
    drawGorillaFace(player);

    ctx.restore();
}

// The function of drawing the body
function drawGorillaBody() {
    ctx.fillStyle = "black";

    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-17, 18);
    ctx.lineTo(-20, 44);

    ctx.lineTo(-11, 77);
    ctx.lineTo(0, 84);
    ctx.lineTo(11, 77);

    ctx.lineTo(20, 44);
    ctx.lineTo(17, 18);
    ctx.lineTo(20, 0);
    ctx.lineTo(7, 0);
    ctx.fill();
}

// The function of drawing the arms
// The left arm
function drawGorillaLeftArm(player) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 18;

    ctx.beginPath();
    ctx.moveTo(-14, 50);

    // When the arm has to aim (AIM === Phase)
    if (state.phase === "aiming" && state.currentPlayer === 1 && player === 1) {
        ctx.quadraticCurveTo(-44, 63, -28 - state.bomb.velocity.x / 6.25, 107 - state.bomb.velocity.y / 6.25);
    } else if (state.phase === "celebrating" && state.currentPlayer === player) {
        ctx.quadraticCurveTo(-44, 63, -28, 107);
    } else {
        ctx.quadraticCurveTo(-44, 45, -28, 12);
    }
    ctx.stroke();
}

// The right arm
function drawGorillaRightArm(player) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 18;

    ctx.beginPath();
    ctx.moveTo(+14, 50);

    // When the arm has to aim (AIM: Phase)
    if (state.phase === "aiming" && state.currentPlayer === 2 && player === 2) {
        ctx.quadraticCurveTo(+44, 63, +28 - state.bomb.velocity.x / 6.25, 107 - state.bomb.velocity.y / 6.25);
    } else if (state.phase === "celebrating" && state.currentPlayer === player) {
        ctx.quadraticCurveTo(+44, 63, +28, 107);
    } else {
        ctx.quadraticCurveTo(+44, 45, +28, 12);
    }
    ctx.stroke();
}

// The function to draw the gorilla's face
function drawGorillaFace(player) {
    // Face of the GORILLA
    ctx.fillStyle = "lightgray";
    ctx.beginPath();
    ctx.arc(0, 63, 9, 0, 2 * Math.PI);
    ctx.moveTo(-3.5, 70);
    ctx.arc(-3.5, 70, 4, 0, 2 * Math.PI);
    ctx.moveTo(3.5, 70);
    ctx.arc(3.5, 70, 4, 0, 2 * Math.PI);
    ctx.fill();

    // The Eyes
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(-3.5, 70, 1.4, 0, 2 * Math.PI);
    ctx.moveTo(3.5, 70);
    ctx.arc(3.5, 70, 1.4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1.4;

    // The nose
    ctx.beginPath();
    ctx.moveTo(-3.5, 66.6);
    ctx.lineTo(-1.5, 65);
    ctx.moveTo(3.5, 66.6);
    ctx.lineTo(1.5, 65);
    ctx.stroke();

    // The mouth
    ctx.beginPath();
    if (state.phase === "celebrating" && state.currentPlayer === player) {
        ctx.moveTo(-5, 60);
        ctx.quadraticCurveTo(0, 56, 5, 60);
    } else {
        ctx.moveTo(-5, 56);
        ctx.quadraticCurveTo(0, 60, 5, 56);
    }
    ctx.stroke();
}

// When a banana hits the Gorillas body
function checkGorillaHit() {
    const enemyPlayer = state.currentPlayer === 1 ? 2 : 1;
    const enemyBuilding =
        enemyPlayer === 1
            ? state.buildings.at(1) // second building
            : state.buildings.at(-2); // second last building

    ctx.save();

    ctx.translate(
        enemyBuilding.x + enemyBuilding.width / 2, enemyBuilding.height
    );

    drawGorillaBody();
    let hit = ctx.isPointInPath(state.bomb.x, state.bomb.y);
    drawGorillaLeftArm(enemyPlayer);
    hit ||= ctx.isPointInStroke(state.bomb.x, state.bomb.y);
    drawGorillaRightArm(enemyPlayer);
    hit ||= ctx.isPointInStroke(state.bomb.x, state.bomb.y);

    ctx.restore();

    return hit;
}

// The variables for the event listeners
let isDragging = false;
let dragStartX = undefined;
let dragStartY = undefined;

// KEYBOARD/MOUSE EVENT LISTENERS

// 1. MOUSEDOWN
bombGrabAreaDOM.addEventListener("mousedown", function (e) {
    if (state.phase === "aiming") {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        document.body.style.cursor = "grabbing";
    }
});

// 2. MOUSEUP
window.addEventListener("mouseup", function () {
    if (isDragging) {
        isDragging = false;
        document.body.style.cursor = "default";

        throwBomb(); // Call throwBomb when the mouse is released
    }
});

// 3. MOUSE LEFT AND RIGHT
window.addEventListener("mousemove", function (e) {
    if (isDragging) {
        let deltaX = e.clientX - dragStartX;
        let deltaY = e.clientY - dragStartY;

        state.bomb.velocity.x = -deltaX;
        state.bomb.velocity.y = deltaY;
        setInfo(deltaX, deltaY);

        draw();
    }
});

// Set the info on the RIGHT AND LEFT INFO PANEL
function setInfo(deltaX, deltaY) {
    const hypotenuse = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const angleRadius = Math.asin(deltaY / hypotenuse);
    const angleDegrees = (angleRadius / Math.PI) * 180;

    if (state.currentPlayer === 1) {
        // Showing the degrees on the html 
        angleDom.innerText = Math.round(angleDegrees);
        // Showing the Velocity on html
        velocityDom.innerText = Math.round(hypotenuse);
    } else {
        // To the other two sides
        angle2Dom.innerText = Math.round(angleDegrees);
        velocity2DOM.innerText = Math.round(hypotenuse);
    }
}

// Declaring the timestamp variable 
let previousAnimationTimestamp = undefined;

// Then we provide the animation 
function animate(timestamp) {
    // Animation calls (Every element movement)
    if (previousAnimationTimestamp === undefined) {
        previousAnimationTimestamp = timestamp;
        requestAnimationFrame(animate);
        return;
    }

    const elapsedTime = timestamp - previousAnimationTimestamp;

    const hitDetectionPrecision = 10;
    for (let i = 0; i < hitDetectionPrecision; i++) {
        moveBomb(elapsedTime / hitDetectionPrecision);
    }

    // Check if the bomb hit a building
    const hitBuilding = checkBuilding();
    // Check if the bomb hit a gorilla
    const hitGorilla = checkGorillaHit();
    // Check if the bomb is off-screen
    const miss = checkFrame();

    if (hitBuilding || miss) {
        // Reset the game state if the bomb is off-screen or hit a building
        state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
        state.phase = "aiming";
        initializeBombPosition();
    }
    if (hitGorilla) {
        state.phase = "celebrating";
        announceWinner();

        draw();
        return;
    }

    // Redraw the scene
    draw();

    // Continue the animation loop if the bomb is still in flight
    previousAnimationTimestamp = timestamp;
    if (state.phase === "in flight") {
        previousAnimationTimestamp = timestamp;
        requestAnimationFrame(animate);
    }
}

// When the bomb moves
function moveBomb(elapsedTime) {
    const multiplier = elapsedTime / 350; // Speed of the bomb

    // Adjusting the trajectory by gravity 
    state.bomb.velocity.y -= 20 * multiplier;

    // Calculate the new position
    state.bomb.x += state.bomb.velocity.x * multiplier;
    state.bomb.y += state.bomb.velocity.y * multiplier;

    // Rotate the bomb
    const direction = state.currentPlayer === 1 ? -1 : 1;
    state.bomb.rotation += direction * 5 * multiplier;
}

// Checking the building function
function checkBuilding() {
    for (let i = 0; i < state.buildings.length; i++) {
        const building = state.buildings[i];
        if (
            state.bomb.x + 4 > building.x &&
            state.bomb.x - 4 < building.x + building.width &&
            state.bomb.y - 4 < building.height
        ) {
            // Check if the bomb is inside the blast hole of previous impact 
            for (let j = 0; j < state.blastHoles.length; j++) {
                const blastHole = state.blastHoles[j];

                // Check how far is the bomb from the center of a previous blast hole
                const horizontalDistance = state.bomb.x - blastHole.x;
                const verticalDistance = state.bomb.y - blastHole.y;
                const distance = Math.sqrt(
                    horizontalDistance ** 2 + verticalDistance ** 2
                );
                if (distance < blastHoleRadius) {
                    // The bomb is inside of the rectangle building
                    // But a previous bomb is already blew off this part of the building
                    return false;
                }
            }
            state.blastHoles.push({ x: state.bomb.x, y: state.bomb.y });
            return true; // Building hit
        }
    }
    return false; // No building hit
}

// Checking the frame
function checkFrame() {
    // Stop throw animation once the bomb is on the left side
    // bottom, or right edge of the screen
    if (
        state.bomb.y < 0 ||
        state.bomb.x < 0 ||
        state.bomb.x > window.innerWidth / state.scale
    ) {
        return true; // When the bomb is off screen
    }
    return false; // Bomb is still on screen
}

// Function to announce winner 
function announceWinner() {
    winnerDOM.innerText = `Player ${state.currentPlayer}`;
    congratulationDOM.style.visibility = "visible";
}

newGameButtonDOM.addEventListener("click", () => {
    newGame(); // Start a new game
    congratulationDOM.style.visibility = "hidden"; // Hide the congratulations message
});