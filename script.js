const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Variables for dragging objects
let isDragging = false;
let lastX, lastY;
let dragObj = null; // Currently dragged object

// Variables for panning and zooming
let panX = 0, panY = 0;
let zoom = 1;
let isPanning = false;
let panStartX = 0, panStartY = 0;

// Variables for typing text
let isTyping = false;
let typingText = "";
let typingX = 0;
let typingY = 0;

// Objects array with updated positions
const objects = [
    { x: 200, y: 150, width: 200, height: 200, type: 'rect', isDragging: false },
    { x: 500, y: 400, text: "Move Me!", type: 'text', isDragging: false }
];

// Set initial canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);
// Initialize canvas size on load
resizeCanvas();

// Render the canvas
function render() {
    ctx.setTransform(zoom, 0, 0, zoom, panX, panY);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Now apply zoom/pan transform
    ctx.setTransform(zoom, 0, 0, zoom, panX, panY);

    // Draw objects
    for (let obj of objects) {
        if (obj.type === 'rect') {
            ctx.fillStyle = "lightblue";
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'text') {
            ctx.fillStyle = "black";
            ctx.font = "20px Arial";
            ctx.fillText(obj.text, obj.x, obj.y);
        } else if (obj.type === 'description') {
            // same logic as before
        }
    }

    // Draw typing text if in typing mode
    if (isTyping) {
        ctx.fillStyle = "darkgreen";
        ctx.font = "24px Arial";
        ctx.fillText(typingText + "|", typingX, typingY);
    }

}


// Detect if a point is inside an object
function isInsideObject(x, y, obj) {
    if (obj.type === 'rect') {
        return x >= obj.x && x <= obj.x + obj.width &&
            y >= obj.y && y <= obj.y + obj.height;
    } else if (obj.type === 'text') {
        const textWidth = ctx.measureText(obj.text).width;
        const textHeight = 20;
        return x >= obj.x && x <= obj.x + textWidth &&
            y >= obj.y - textHeight && y <= obj.y;
    }
    return false;
}

// Event listeners for mouse events

canvas.addEventListener("mousedown", (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    canvas.style.cursor = "grabbing";

    // Alt + left click OR middle click => PAN MODE
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning = true;
        panStartX = mouseX;
        panStartY = mouseY;
        return; // No interaction with objects during panning
    }

    // Alt + right click → canvas/panning settings

    // Left click (not on object) → start typing
    if (e.button === 0 && !e.altKey && !dragObj) {
        const canvasX = (mouseX - panX) / zoom;
        const canvasY = (mouseY - panY) / zoom;

        let clickedOnObject = false;
        for (let obj of objects) {
            if (isInsideObject(canvasX, canvasY, obj)) {
                clickedOnObject = true;
                break;
            }
        }

        if (!clickedOnObject) {
            isTyping = true;
            typingText = "";
            typingX = canvasX;
            typingY = canvasY;
            render();
        }
    }

    // Left click (on object) → object dragging
    lastX = mouseX;
    lastY = mouseY;
    dragObj = null;

    for (let obj of objects) {
        if (isInsideObject((mouseX - panX) / zoom, (mouseY - panY) / zoom, obj)) {
            dragObj = obj;
            obj.isDragging = true;
            break;
        }
    }

    // Right click → context menu
    if (e.button === 2 && dragObj) {
        e.preventDefault(); // Prevent default context menu
        // Show custom context menu logic here
        console.log("Context menu for", dragObj);
        return;
    }
});

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
        render(); // use your renamed draw function
        return;
    }

    if (dragObj) {
        const dx = (mouseX - lastX) / zoom;
        const dy = (mouseY - lastY) / zoom;

        dragObj.x += dx;
        dragObj.y += dy;

        lastX = mouseX;
        lastY = mouseY;

        render();
    }
});


canvas.addEventListener("mouseup", () => {
    isPanning = false;
    if (dragObj) {
        // Reset the dragged object
        dragObj.isDragging = false;
        dragObj = null;
    }
    canvas.style.cursor = "grab";
});

canvas.addEventListener("mouseleave", () => {
    isPanning = false;
    if (dragObj) {
        // Reset the dragged object
        dragObj.isDragging = false;
        dragObj = null;
    }
    canvas.style.cursor = "grab";
});

window.addEventListener("keydown", (e) => {
    if (!isTyping) return;

    if (e.key === "Enter") {
        // Finalize the word as a text object
        objects.push({
            type: "text",
            text: typingText,
            x: typingX,
            y: typingY,
            isDragging: false
        });
        isTyping = false;
        typingText = "";
        render();
    } else if (e.key === "Backspace") {
        typingText = typingText.slice(0, -1);
        render();
    } else if (e.key.length === 1) {
        typingText += e.key;
        render();
    }
});


// To move the entire canvas (i.e., viewport)
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const canvasX = (mouseX - panX) / zoom;
    const canvasY = (mouseY - panY) / zoom;

    // If mouse is over a scrollable object → scroll inside it
    for (let obj of objects) {
        if (obj.scrollable) {
            if (
                canvasX >= obj.x && canvasX <= obj.x + obj.width &&
                canvasY >= obj.y && canvasY <= obj.y + obj.height
            ) {
                obj.scrollY += e.deltaY * 0.5;
                obj.scrollY = Math.max(0, obj.scrollY); // clamp to top
                render();
                return;
            }
        }
    }

    // Otherwise zoom canvas
    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = zoom * (1 + scaleAmount);

    // Zoom centered on mouse position
    panX -= (mouseX - panX) * (newZoom / zoom - 1);
    panY -= (mouseY - panY) * (newZoom / zoom - 1);

    zoom = newZoom;
    render();
}, { passive: false });


// Initialize objects on the canvas 
render();
