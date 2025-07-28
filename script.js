// canvas.js
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let isDragging = false;
let lastX, lastY;
let dragObj = null;

let panX = 0, panY = 0;
let zoom = 1;
let isPanning = false;
let panStartX = 0, panStartY = 0;

let inputActive = false;
let inputText = "";
let cursorX = 0, cursorY = 0;
let blink = true;
let inputFadeIn = 1;

const objects = [
  { x: 200, y: 150, width: 200, height: 200, type: 'rect', isDragging: false },
  { x: 500, y: 400, text: "Move Me!", type: 'text', isDragging: false }
];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function render() {
  ctx.setTransform(zoom, 0, 0, zoom, panX, panY);
  ctx.clearRect(0, 0, canvas.width / zoom, canvas.height / zoom);

  for (let obj of objects) {
    if (obj.type === 'rect') {
      ctx.fillStyle = "lightblue";
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    } else if (obj.type === 'text') {
      ctx.save();
      ctx.globalAlpha = obj.fade || 1;
      ctx.fillStyle = "black";
      ctx.font = "20px Arial";
      ctx.fillText(obj.text, obj.x, obj.y);
      ctx.restore();
    }
  }

  if (inputActive) {
    ctx.fillStyle = `rgba(0,0,0,${inputFadeIn})`;
    ctx.font = "20px Arial";
    ctx.fillText(inputText, cursorX, cursorY);
    if (blink) {
      const width = ctx.measureText(inputText).width;
      ctx.fillRect(cursorX + width + 2, cursorY - 15, 2, 20);
    }
  }
}

setInterval(() => {
  blink = !blink;
  render();
}, 500);

function isInsideObject(x, y, obj) {
  if (obj.type === 'rect') {
    return x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height;
  } else if (obj.type === 'text') {
    const textWidth = ctx.measureText(obj.text).width;
    return x >= obj.x && x <= obj.x + textWidth && y >= obj.y - 20 && y <= obj.y;
  }
  return false;
}

canvas.addEventListener("mousedown", (e) => {
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  // 🖱️ Alt+Left click or Middle click = PAN
  if (e.button === 1 || (e.button === 0 && e.altKey)) {
    isPanning = true;
    panStartX = mouseX;
    panStartY = mouseY;
    canvas.style.cursor = "all-scroll";
    inputActive = false;
    render();
    return;
  }

  // 🧠 Check if clicked on object first
  lastX = mouseX;
  lastY = mouseY;
  dragObj = null;

  const clickX = (mouseX - panX) / zoom;
  const clickY = (mouseY - panY) / zoom;

  for (let obj of objects) {
    if (isInsideObject(clickX, clickY, obj)) {
      dragObj = obj;
      obj.isDragging = true;
      inputActive = false; // 👈 Disallow typing on object
      render();
      return;
    }
  }

  // ✅ If we reach here, it's empty space → activate typing
  inputActive = true;
  cursorX = clickX;
  cursorY = clickY;
  inputText = "";
  inputFadeIn = 0;
  render();
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

canvas.addEventListener("mouseup", () => {
  isPanning = false;
  if (dragObj) {
    dragObj.isDragging = false;
    dragObj = null;
  }
  canvas.style.cursor = "grab";
});

canvas.addEventListener("mouseleave", () => {
  isPanning = false;
  if (dragObj) dragObj.isDragging = false;
  dragObj = null;
  canvas.style.cursor = "grab";
});

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

window.addEventListener("keydown", (e) => {
  if (!inputActive) return;

  if (e.key === "Enter") {
    objects.push({
      x: cursorX,
      y: cursorY,
      text: inputText,
      type: "text",
      fade: 0
    });
    inputActive = false;
    inputText = "";

    // Animate fade in
    const obj = objects[objects.length - 1];
    let alpha = 0;
    const fadeInterval = setInterval(() => {
      alpha += 0.05;
      obj.fade = alpha;
      render();
      if (alpha >= 1) clearInterval(fadeInterval);
    }, 16);
  } else if (e.key === "Backspace") {
    inputText = inputText.slice(0, -1);
  } else if (e.key.length === 1) {
    inputText += e.key;
  }
  render();
});


render();