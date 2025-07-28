const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let dragObj = null;
let lastX, lastY;

let panX = 0, panY = 0;
let zoom = 1;
let isPanning = false;
let panStartX = 0, panStartY = 0;

let isTyping = false;
let typingText = "";
let typingX = 0;
let typingY = 0;

// Object array
const objects = [
  { x: 200, y: 150, width: 200, height: 200, type: 'rect' },
  { x: 500, y: 400, text: "Move Me!", type: 'text' }
];

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Render all
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.setTransform(zoom, 0, 0, zoom, panX, panY);

  for (let obj of objects) {
    if (obj.type === 'rect') {
      ctx.fillStyle = "lightblue";
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    } else if (obj.type === 'text') {
      ctx.fillStyle = "black";
      ctx.font = "20px Arial";
      ctx.fillText(obj.text, obj.x, obj.y);
    }
  }

  if (isTyping) {
    ctx.fillStyle = "darkgreen";
    ctx.font = "24px Arial";
    ctx.fillText(typingText + "|", typingX, typingY);
  }
}

// Check if point in object
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

// Mouse down
canvas.addEventListener("mousedown", (e) => {
  const mouseX = e.clientX;
  const mouseY = e.clientY;
  canvas.style.cursor = "grabbing";

  if (e.button === 1 || (e.button === 0 && e.altKey)) {
    isPanning = true;
    panStartX = mouseX;
    panStartY = mouseY;
    return;
  }

  lastX = mouseX;
  lastY = mouseY;
  dragObj = null;

  const canvasX = (mouseX - panX) / zoom;
  const canvasY = (mouseY - panY) / zoom;

  for (let obj of objects) {
    if (isInsideObject(canvasX, canvasY, obj)) {
      dragObj = obj;
      break;
    }
  }

  if (!dragObj && e.button === 0 && !e.altKey) {
    isTyping = true;
    typingText = "";
    typingX = canvasX;
    typingY = canvasY;
    render();
  }
});

// Mouse move
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

// Mouse up & leave
canvas.addEventListener("mouseup", () => {
  isPanning = false;
  dragObj = null;
  canvas.style.cursor = "grab";
});

canvas.addEventListener("mouseleave", () => {
  isPanning = false;
  dragObj = null;
  canvas.style.cursor = "grab";
});

// Keyboard typing
window.addEventListener("keydown", (e) => {
  if (!isTyping) return;

  if (e.key === "Enter") {
    if (typingText.trim() !== "") {
      objects.push({
        type: "text",
        text: typingText,
        x: typingX,
        y: typingY
      });
    }
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

// Zoom (wheel)
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  const mouseX = e.clientX;
  const mouseY = e.clientY;
  const canvasX = (mouseX - panX) / zoom;
  const canvasY = (mouseY - panY) / zoom;

  const scaleAmount = -e.deltaY * 0.001;
  const newZoom = zoom * (1 + scaleAmount);

  panX -= (mouseX - panX) * (newZoom / zoom - 1);
  panY -= (mouseY - panY) * (newZoom / zoom - 1);

  zoom = newZoom;
  render();
}, { passive: false });

