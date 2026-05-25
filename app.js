const canvas = document.getElementById("hud");
const ctx = canvas.getContext("2d");

const state = {
  mode: "HMARD",
  pitch: 0,
  roll: 0,
  heading: 87,
  speed: 142,
  altitude: 4820,
  tankerBearing: 8,
  tankerRange: 0.42,
  alert: "none",
  caged: false,
  sensorStatus: "SIM DATA",
  t0: performance.now(),
};

const alerts = ["none", "tanker", "obstacle", "terrain", "traffic", "threat", "system"];
const C = {
  bg: "#020608",
  panel: "rgba(2, 12, 14, 0.86)",
  border: "rgba(88, 255, 217, 0.32)",
  cyan: "#58ffd9",
  cyanDim: "rgba(88, 255, 217, 0.48)",
  white: "#f6fff9",
  muted: "rgba(182, 209, 211, 0.78)",
  dim: "rgba(127, 159, 164, 0.68)",
  amber: "#ffd36b",
  red: "#ff5c5c",
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrap360(value) {
  return ((value % 360) + 360) % 360;
}

function signed(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function drawText(text, x, y, size, color = "#f6fff9", align = "center", weight = "700") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function panelRect() {
  return { x: 38, y: 42, w: 524, h: 476, r: 18 };
}

function drawRoundRect(x, y, w, h, r, fill, stroke, lineWidth = 1.5) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function drawLine(x1, y1, x2, y2, color = "#58ffd9", width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawPitchLadder() {
  const cx = 300;
  const cy = 266;
  const pxPerDeg = 6.2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-state.roll * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  for (let mark = -45; mark <= 45; mark += 5) {
    const y = cy + (state.pitch - mark) * pxPerDeg;
    if (y < 128 || y > 408) continue;
    const major = mark % 10 === 0;
    const zero = mark === 0;
    const half = zero ? 128 : major ? 76 : 44;
    const gap = 42;
    const color = zero ? C.white : major ? C.cyan : "rgba(182,209,211,.44)";
    const width = zero ? 3.5 : major ? 2.4 : 1.5;

    drawLine(cx - half, y, cx - gap, y, color, width);
    drawLine(cx + gap, y, cx + half, y, color, width);

    if (major && !zero) {
      drawText(String(Math.abs(mark)), cx - half - 24, y + 1, 16, color, "right", "700");
      drawText(String(Math.abs(mark)), cx + half + 24, y + 1, 16, color, "left", "700");
    }
  }

  ctx.restore();

  drawLine(214, cy, 278, cy, C.white, 4);
  drawLine(322, cy, 386, cy, C.white, 4);
  drawLine(300, cy - 15, 300, cy + 15, C.white, 3);
  drawText("W", 300, cy + 29, 13, C.dim);
}

function drawHeader() {
  const p = panelRect();
  const heading = Math.round(wrap360(state.heading)).toString().padStart(3, "0");
  drawText("HMARD DEMO", p.x + 26, p.y + 30, 17, C.cyan, "left");
  drawText("HMARD", p.x + p.w - 26, p.y + 30, 15, C.dim, "right", "600");
  drawText(`HDG ${heading}`, 300, p.y + 34, 22, C.white);
  drawLine(254, p.y + 56, 346, p.y + 56, C.cyanDim, 2);
  for (let i = -3; i <= 3; i++) {
    const x = 300 + i * 34;
    const h = i === 0 ? 16 : 9;
    drawLine(x, p.y + 56, x, p.y + 56 + h, "rgba(182,209,211,.52)", 2);
  }
}

function drawAirspeedAltitude() {
  drawRoundRect(62, 202, 108, 104, 6, "rgba(5,14,18,.72)", "rgba(88,255,217,.28)");
  drawRoundRect(430, 202, 108, 104, 6, "rgba(5,14,18,.72)", "rgba(88,255,217,.28)");
  drawText(String(Math.round(state.speed)), 116, 238, 31, C.white);
  drawText("KT", 116, 270, 15, C.muted);
  drawText(String(Math.round(state.altitude)), 484, 238, 29, C.white);
  drawText("FT", 484, 270, 15, C.muted);
  drawLine(72, 322, 528, 322, "rgba(88,255,217,.28)", 1.5);
  drawText(`TKR ${bearingLabel(Math.round(state.tankerBearing))}`, 88, 370, 25, C.cyan, "left");
  drawText(`${state.tankerRange.toFixed(1)} NM`, 512, 370, 25, C.cyan, "right");
}

function alertCopy() {
  switch (state.alert) {
    case "tanker":
      return ["TANKER CUE", `EASE ${state.tankerBearing < 0 ? "RIGHT" : "LEFT"}`, `${Math.abs(Math.round(state.tankerBearing)).toString().padStart(2, "0")} FT`, C.cyan];
    case "obstacle":
      return ["OBSTACLE", "TOWER 2 O'CLOCK", "0.8 NM   +300 FT", C.amber];
    case "terrain":
      return ["TERRAIN", "RISING AHEAD", "7.0 SEC   CHECK ALT", C.amber];
    case "traffic":
      return ["TRAFFIC", "ADS-B 10 O'CLOCK", "1.2 NM   -400 FT", C.amber];
    case "threat":
      return ["THREAT", "BREAK RIGHT", "MISSILE LAUNCH", C.red];
    case "system":
      return ["SYSTEM", "GPS STALE", "PHONE DATA LOST", C.amber];
    default:
      return null;
  }
}

function drawAlert() {
  const copy = alertCopy();
  if (!copy) return;
  const [severity, primary, secondary, color] = copy;
  drawRoundRect(112, 396, 376, 96, 8, "rgba(2,8,10,.92)", color, 3);
  drawText(severity, 300, 419, 17, color);
  drawText(primary, 300, 452, 28, C.white);
  drawText(secondary, 300, 479, 16, C.muted);
}

function drawStatus() {
  const p = signed(Math.round(state.pitch));
  const r = signed(Math.round(state.roll));
  drawText(state.caged ? "SIM CENTERED" : state.sensorStatus, 300, 532, 15, C.muted);
  drawText(`P ${p}   R ${r}`, 300, 557, 22, C.cyan);
}

function draw() {
  ctx.clearRect(0, 0, 600, 600);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, 600, 600);

  const p = panelRect();
  drawRoundRect(p.x, p.y, p.w, p.h, p.r, C.panel, C.border, 1.5);

  drawHeader();
  drawPitchLadder();
  drawAirspeedAltitude();
  drawAlert();
  drawStatus();
}

function simulate(now) {
  const t = (now - state.t0) / 1000;
  state.pitch = Math.sin(t * 0.72) * 8;
  state.roll = Math.sin(t * 0.51) * 18;
  state.heading = 87 + Math.sin(t * 0.21) * 18;
  state.speed = 142 + Math.sin(t * 0.58) * 6;
  state.altitude = 4820 + Math.sin(t * 0.31) * 120;
  state.tankerBearing = Math.sin(t * 0.34) * 18;
  state.tankerRange = clamp(0.44 + Math.sin(t * 0.3) * 0.13, 0.2, 0.8);
}

function loop(now) {
  simulate(now);
  draw();
  requestAnimationFrame(loop);
}

function cycleAlert() {
  const index = alerts.indexOf(state.alert);
  state.alert = alerts[(index + 1) % alerts.length];
}

function bearingLabel(value) {
  if (value === 0) return "000";
  const side = value > 0 ? "R" : "L";
  return `${Math.abs(value).toString().padStart(3, "0")}${side}`;
}

function cage() {
  state.t0 = performance.now();
  state.pitch = 0;
  state.roll = 0;
  state.caged = true;
  setTimeout(() => {
    state.caged = false;
  }, 1400);
}

function resetDemo() {
  state.t0 = performance.now();
  state.alert = "none";
  state.caged = false;
  state.sensorStatus = "SIM DATA";
}

document.getElementById("mode").addEventListener("click", resetDemo);
document.getElementById("cage").addEventListener("click", cage);
document.getElementById("alert").addEventListener("click", cycleAlert);

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "c") cage();
  if (event.key === " " || event.key === "Enter") cycleAlert();
});

if ("roundRect" in CanvasRenderingContext2D.prototype === false) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) {
    this.rect(x, y, w, h);
  };
}

requestAnimationFrame(loop);
