// Get canvas and context
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// For dragging objects
let isDragging = false;
let lastX, lastY;
let dragObj = null;

// Pan and zoom states
let panX = 0, panY = 0;
let zoom = 1;
let isPanning = false;
let panStartX = 0, panStartY = 0;

// Typing states
let inputActive = false;
let inputText = "";
let cursorX = 0, cursorY = 0;
let blink = true;
let inputFadeIn = 1;

// Keyboard states
let ctrlHeld = false;
window.addEventListener("keydown", (e) => {
    if (e.key === "Control") ctrlHeld = true;
});

window.addEventListener("keyup", (e) => {
    if (e.key === "Control") ctrlHeld = false;
});

// Visual objects on canvas
const objects = [];

// Set canvas size to window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
canvas.style.cursor = "default";

// Main render loop
function render() {
    // Reset transform to identity
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set dark background
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply zoom/pan AFTER clearing
    ctx.setTransform(zoom, 0, 0, zoom, panX, panY);

    // Draw the dotted background grid
    drawDottedGrid();

    // Draw canvas objects
    for (let obj of objects) {
        if (obj.type === 'rect') {
            ctx.fillStyle = "lightblue";
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'text') {
            ctx.save();
            ctx.globalAlpha = obj.fade || 1;
            ctx.fillStyle = "white";  // Changed from black to white
            ctx.font = "20px Arial";
            ctx.fillText(obj.text, obj.x, obj.y);
            ctx.restore();
        }
    }

    // Input typing and blinking cursor
    if (inputActive) {
        ctx.fillStyle = `rgba(255,255,255,${inputFadeIn})`;  // White text
        ctx.font = "20px Arial";
        ctx.fillText(inputText, cursorX, cursorY);

        if (blink) {
            const width = ctx.measureText(inputText).width;
            ctx.fillRect(cursorX + width + 2, cursorY - 15, 2, 20);
        }
    }

}

// Toggle cursor blink every 500ms
setInterval(() => {
    blink = !blink;
    render();
}, 500);

// Check if mouse is inside a shape or text
function isInsideObject(x, y, obj) {
    if (obj.type === 'rect') {
        return x >= obj.x && x <= obj.x + obj.width &&
            y >= obj.y && y <= obj.y + obj.height;
    } else if (obj.type === 'text') {
        const textWidth = ctx.measureText(obj.text).width;
        return x >= obj.x && x <= obj.x + textWidth &&
            y >= obj.y - 20 && y <= obj.y;
    }
    return false;
}

// Mouse down (drag or type)
canvas.addEventListener("mousedown", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const clickX = (mouseX - panX) / zoom;
    const clickY = (mouseY - panY) / zoom;

    lastX = mouseX;
    lastY = mouseY;
    dragObj = null;

    // Ctrl + Left Click → Drag
    if (e.button === 0 && e.ctrlKey) {
        for (let obj of objects) {
            if (isInsideObject(clickX, clickY, obj)) {
                dragObj = obj;
                isDragging = true;
                inputActive = false;
                canvas.style.cursor = "grabbing";
                render();
                return;
            }
        }
    }

    // Alt + Left Click or Middle Click → Panning
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning = true;
        panStartX = mouseX;
        panStartY = mouseY;
        canvas.style.cursor = "all-scroll";
        inputActive = false;
        render();
        return;
    }

    // Clicked on canvas background → typing
    inputActive = true;
    cursorX = clickX;
    cursorY = clickY;
    inputText = "";
    inputFadeIn = 0;
    canvas.style.cursor = "text";
    render();

    // Optional: fade-in for typing
    let fadeStep = setInterval(() => {
        inputFadeIn += 0.05;
        if (inputFadeIn >= 1) {
            inputFadeIn = 1;
            clearInterval(fadeStep);
        }
        render();
    }, 16);
});


// Mouse up (release drag or pan)
canvas.addEventListener("mouseup", () => {
    isPanning = false;
    isDragging = false;
    canvas.style.cursor = "grab";

    if (dragObj) {
        dragObj.isDragging = false;
        dragObj = null;
    }
});

// Mouse move (drag or pan)
canvas.addEventListener("mousemove", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    if (isPanning) {
        const dx = mouseX - panStartX;
        const dy = mouseY - panStartY;
        panX += dx;
        panY += dy;
        panStartX = mouseX;
        panStartY = mouseY;
        render();
        return;
    }

    /*if (inputActive && inputText.length === 0) {
        cursorX = (mouseX - panX) / zoom;
        cursorY = (mouseY - panY) / zoom;
    }*/

    // If typing and dragging, stop typing
    if (inputActive && isDragging) {
        inputActive = false;
        inputText = "";
        canvas.style.cursor = "grab";
    }

    // Object drag logic
    if (dragObj) {
        const dx = (mouseX - lastX) / zoom;
        const dy = (mouseY - lastY) / zoom;
        dragObj.x += dx;
        dragObj.y += dy;
        lastX = mouseX;
        lastY = mouseY;
        render();
    }

    // Cursor hover logic
    if (!isDragging) {
        const canvasX = (mouseX - panX) / zoom;
        const canvasY = (mouseY - panY) / zoom;

        let hovering = false;
        for (let obj of objects) {
            if (isInsideObject(canvasX, canvasY, obj)) {
                hovering = true;
                break;
            }
        }

        if (ctrlHeld && hovering) {
            canvas.style.cursor = "grab";
        } else {
            canvas.style.cursor = "default";
        }
    }

});

// Leave canvas area
canvas.addEventListener("mouseleave", () => {
    isDragging = false;
    dragObj = null;
    canvas.style.cursor = "default";
});


// Zoom with scroll wheel
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const canvasX = (mouseX - panX) / zoom;
    const canvasY = (mouseY - panY) / zoom;

    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = zoom * (1 + scaleAmount);

    // Adjust pan to zoom centered on mouse
    panX -= (mouseX - panX) * (newZoom / zoom - 1);
    panY -= (mouseY - panY) * (newZoom / zoom - 1);
    zoom = newZoom;

    render();
}, { passive: false });

// Handle keyboard typing for input
window.addEventListener("keydown", (e) => {
    if (!inputActive) return;

    if (e.key === "Escape") {
        inputActive = false;
        inputText = "";
        canvas.style.cursor = "grab";
        render();
        return;
    }

    if (e.key === "Enter") {
        // Add new word object
        objects.push({
            x: cursorX,
            y: cursorY,
            text: inputText,
            type: "text",
            fade: 0
        });

        inputActive = false;
        inputText = "";

        // Animate fade-in
        const obj = objects[objects.length - 1];
        let alpha = 0;
        const fadeInterval = setInterval(() => {
            alpha += 0.05;
            obj.fade = alpha;
            render();
            if (alpha >= 1) clearInterval(fadeInterval);
        }, 16);

        // Show floating context menu
        const canvasRect = canvas.getBoundingClientRect();
        const screenX = canvasRect.left + (obj.x * zoom + panX);
        const screenY = canvasRect.top + (obj.y * zoom + panY) + 10;

        const menu = document.getElementById("contextMenu");
        menu.style.left = `${screenX}px`;
        menu.style.top = `${screenY}px`;
        menu.style.display = "block";



    } else if (e.key === "Backspace") {
        inputText = inputText.slice(0, -1);
    } else if (e.key.length === 1) {
        inputText += e.key;
    }

    render();
});

window.addEventListener("click", (e) => {
    const menu = document.getElementById("contextMenu");
    if (!menu.contains(e.target) && !canvas.contains(e.target)) {
        menu.style.display = "none";
    }
});

// Draw a dotted grid background
function drawDottedGrid(spacing = 40, dotRadius = 1.5, dotColor = "#666") {
    const width = canvas.width / zoom;
    const height = canvas.height / zoom;

    const startX = -panX / zoom;
    const startY = -panY / zoom;

    const endX = startX + width;
    const endY = startY + height;

    ctx.fillStyle = dotColor;

    for (let x = Math.floor(startX / spacing) * spacing; x < endX; x += spacing) {
        for (let y = Math.floor(startY / spacing) * spacing; y < endY; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

// Initial render
render();