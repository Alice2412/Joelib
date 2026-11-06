import './style.css';
import asciiArtRaw from './assets/ascii-art.txt?raw';

// ---------------------------------------------------------------------------
// 1. Dynamic ASCII Art Parser (Auto-detects Width & Height)
// ---------------------------------------------------------------------------
function parseAsciiArt(raw: string) {
  const lines = raw.split(/\r?\n/);
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

  const height = lines.length;
  let width = 0;
  for (let i = 0; i < height; i++) {
    if (lines[i].length > width) width = lines[i].length;
  }

  const grid = lines.map((line) => line.padEnd(width, ' ').split(''));
  return { grid, width, height };
}

const { grid: artGrid, width: ART_WIDTH, height: ART_HEIGHT } = parseAsciiArt(asciiArtRaw);

// Pool of random matrix characters
const MATRIX_CHARS =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>:;~^[]{}|/\\+-*=%#'.split('');
const MATRIX_COUNT = MATRIX_CHARS.length;

function randomMatrixChar(): string {
  return MATRIX_CHARS[(Math.random() * MATRIX_COUNT) | 0];
}

// ---------------------------------------------------------------------------
// 2. Cell Classification Types & Organic Margin Settings
// ---------------------------------------------------------------------------
const TYPE_RANDOM = 0; // Other place: falling random matrix characters
const TYPE_IMAGE = 1; // Inside image: falling character changes to ASCII art glyph
const TYPE_BUFFER = 2; // Clean blank buffer zone: no characters fall
const TYPE_FEATHERED = 3; // Natural feathered transition zone: density gradient

// ---------------------------------------------------------------------------
// 3. Pre-allocated Color Lookup Tables (Zero String Allocations During Render)
// ---------------------------------------------------------------------------
const MAX_TRAIL_STEPS = 50;
const TRAIL_DENSE = new Array<string>(MAX_TRAIL_STEPS);
const TRAIL_MID = new Array<string>(MAX_TRAIL_STEPS);
const TRAIL_LIGHT = new Array<string>(MAX_TRAIL_STEPS);
const TRAIL_RANDOM = new Array<string>(MAX_TRAIL_STEPS);
const TRAIL_FEATHERED = new Array<string>(MAX_TRAIL_STEPS);

for (let step = 0; step < MAX_TRAIL_STEPS; step++) {
  const ratio = step / MAX_TRAIL_STEPS;
  // Exponential falloff for long, glowing phosphor trails
  const alpha = Math.max(0.04, Math.pow(1 - ratio, 1.35));
  TRAIL_DENSE[step] = `rgba(0, 255, 102, ${alpha.toFixed(3)})`;
  TRAIL_MID[step] = `rgba(0, 220, 80, ${(alpha * 0.9).toFixed(3)})`;
  TRAIL_LIGHT[step] = `rgba(0, 180, 60, ${(alpha * 0.75).toFixed(3)})`;
  TRAIL_RANDOM[step] = `rgba(0, 204, 68, ${(alpha * 0.85).toFixed(3)})`;
  // Feathered trail colors for soft organic dissipation
  TRAIL_FEATHERED[step] = `rgba(0, 180, 60, ${(alpha * 0.55).toFixed(3)})`;
}

// ---------------------------------------------------------------------------
// 4. Flat Memory State & Drops
// ---------------------------------------------------------------------------
const canvas = document.querySelector<HTMLCanvasElement>('#rain-canvas')!;
const ctx = canvas.getContext('2d', { alpha: false })!;

let width = window.innerWidth;
let height = window.innerHeight;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

let cellHeight = 16;
let cellWidth = 10;
let cols = 0;
let rows = 0;
let artStartCol = 0;
let artStartRow = 0;

let gridTypes = new Uint8Array(0);
let gridChars: string[] = [];
let randomCharBuffer: string[] = [];
let gridDensity = new Float32Array(0);
let randomMask = new Float32Array(0);

// Drops stored in flat contiguous arrays for zero GC
const MAX_DROPS = 1200;
const dropCol = new Int16Array(MAX_DROPS);
const dropY = new Float32Array(MAX_DROPS);
const dropSpeed = new Float32Array(MAX_DROPS);
const dropLength = new Uint8Array(MAX_DROPS);
const dropHeadChar = new Array<string>(MAX_DROPS);
const dropTimer = new Float32Array(MAX_DROPS);
let totalDrops = 0;

// Pointer tracking
let mouseX = -9999;
let mouseActive = false;
let mouseTimeout = 0;

window.addEventListener('pointermove', (e) => {
  mouseX = e.clientX;
  mouseActive = true;
  clearTimeout(mouseTimeout);
  mouseTimeout = window.setTimeout(() => {
    mouseActive = false;
  }, 1800);
});

window.addEventListener('pointerleave', () => {
  mouseActive = false;
});

// ---------------------------------------------------------------------------
// 5. Grid Classification with Organic Curvature & Density Feathering
// ---------------------------------------------------------------------------
function buildGridClassification() {
  const total = cols * rows;
  gridTypes = new Uint8Array(total);
  gridTypes.fill(TYPE_RANDOM);

  gridDensity = new Float32Array(total);
  gridDensity.fill(1.0);

  randomMask = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    randomMask[i] = Math.random();
  }

  gridChars = new Array<string>(total);
  randomCharBuffer = new Array<string>(total);

  for (let i = 0; i < total; i++) {
    randomCharBuffer[i] = randomMatrixChar();
    gridChars[i] = ' ';
  }

  // 1. Mark image cells where ASCII art has visible non-space glyphs
  for (let r = 0; r < ART_HEIGHT; r++) {
    const row = artGrid[r];
    if (!row) continue;
    const gr = artStartRow + r;
    if (gr < 0 || gr >= rows) continue;
    const grOffset = gr * cols;

    for (let c = 0; c < ART_WIDTH; c++) {
      const gc = artStartCol + c;
      if (gc < 0 || gc >= cols) continue;

      const ch = row[c];
      if (ch && ch !== ' ') {
        const idx = grOffset + gc;
        gridTypes[idx] = TYPE_IMAGE;
        gridChars[idx] = ch;
        gridDensity[idx] = 1.0;
      }
    }
  }

  // 2. Compute organic Euclidean distance field around the image silhouette
  // Aspect ratio scaling (0.6) prevents horizontal stretching
  const SEARCH_R = 5;
  const SEARCH_C = 8;

  for (let r = 0; r < rows; r++) {
    const rOffset = r * cols;
    for (let c = 0; c < cols; c++) {
      const idx = rOffset + c;
      if (gridTypes[idx] === TYPE_IMAGE) continue;

      let minDist = 99;
      for (let dy = -SEARCH_R; dy <= SEARCH_R; dy++) {
        const nr = r + dy;
        if (nr < 0 || nr >= rows) continue;
        const nrOffset = nr * cols;

        for (let dx = -SEARCH_C; dx <= SEARCH_C; dx++) {
          const nc = c + dx;
          if (nc < 0 || nc >= cols) continue;

          if (gridTypes[nrOffset + nc] === TYPE_IMAGE) {
            // Euclidean distance with character aspect correction
            const d = Math.hypot(dx * 0.6, dy);
            if (d < minDist) minDist = d;
          }
        }
      }

      if (minDist <= 6.0) {
        // Add subtle harmonic wave to soften straight edges into natural contours
        const organicD =
          minDist + 0.3 * Math.sin(r * 0.45 + c * 0.3) + 0.2 * Math.cos(r * 0.3 - c * 0.35);

        if (organicD < 2.0) {
          // Clean inner buffer directly contouring the subject
          gridTypes[idx] = TYPE_BUFFER;
          gridDensity[idx] = 0;
        } else if (organicD < 4.4) {
          // Organic feathered transition zone
          gridTypes[idx] = TYPE_FEATHERED;
          gridDensity[idx] = (organicD - 2.0) / 2.4;
        } else {
          gridTypes[idx] = TYPE_RANDOM;
          gridDensity[idx] = 1.0;
        }
      }
    }
  }
}

function initDimensions() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Scale so the figure fits comfortably with generous margins
  const charAspect = 0.6; // standard monospace aspect ratio
  const scaleByH = (height * 0.90) / ART_HEIGHT;
  const scaleByW = (width * 0.90) / (ART_WIDTH * charAspect);
  cellHeight = Math.max(8, Math.min(scaleByH, scaleByW));

  // Measure exact monospace font character width
  ctx.font = `${cellHeight}px Consolas, Monaco, "Courier New", monospace`;
  const measured = ctx.measureText('M').width;
  cellWidth = measured > 0 ? measured : cellHeight * charAspect;

  cols = Math.ceil(width / cellWidth);
  rows = Math.ceil(height / cellHeight);

  artStartCol = Math.floor((cols - ART_WIDTH) / 2);
  artStartRow = Math.floor((rows - ART_HEIGHT) / 2);

  // Compute organic grid classification
  buildGridClassification();

  // Initialize rain drops across all columns
  totalDrops = 0;
  for (let c = 0; c < cols && totalDrops < MAX_DROPS - 4; c++) {
    const isImageCol = c >= artStartCol && c < artStartCol + ART_WIDTH;
    const count = isImageCol ? 3 : Math.random() < 0.5 ? 1 : 2;

    for (let d = 0; d < count && totalDrops < MAX_DROPS; d++) {
      dropCol[totalDrops] = c;
      dropY[totalDrops] = -Math.random() * (rows * 1.5);
      dropSpeed[totalDrops] = 0.35 + Math.random() * 0.55 + (isImageCol ? 0.15 : 0);
      // Long tail: 25 to 45 rows
      dropLength[totalDrops] = 25 + Math.floor(Math.random() * 20);
      dropHeadChar[totalDrops] = randomMatrixChar();
      dropTimer[totalDrops] = 0;
      totalDrops++;
    }
  }

  // Clear canvas to pitch black / dark green
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#020502';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

window.addEventListener('resize', () => {
  initDimensions();
});

initDimensions();

// ---------------------------------------------------------------------------
// 6. Zero-GC Animation Loop with Long Phosphorescent Trails
// ---------------------------------------------------------------------------
let animationId = 0;
let isPaused = false;

document.addEventListener('visibilitychange', () => {
  isPaused = document.hidden;
  if (!isPaused) {
    lastTime = performance.now();
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(render);
  }
});

let lastTime = performance.now();

function render(now: number) {
  if (isPaused) return;

  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  const dtFactor = dt * 60;

  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. Semi-transparent veil creates the long trailing phosphor decay
  ctx.fillStyle = 'rgba(2, 5, 2, 0.06)';
  ctx.fillRect(0, 0, width, height);

  ctx.font = `${cellHeight}px Consolas, Monaco, "Courier New", monospace`;
  ctx.textBaseline = 'top';

  const pointerCol = Math.floor(mouseX / cellWidth);

  // 2. Render falling streams with long tails
  for (let i = 0; i < totalDrops; i++) {
    const col = dropCol[i];
    let speed = dropSpeed[i];

    // Pointer interactive speed boost
    if (mouseActive) {
      const colDist = Math.abs(col - pointerCol);
      if (colDist < 8) {
        speed += (8 - colDist) * 0.15;
      }
    }

    let y = dropY[i] + speed * dtFactor;

    // Mutate head character periodically
    let timer = dropTimer[i] + dt;
    if (timer > 0.08) {
      timer = 0;
      dropHeadChar[i] = randomMatrixChar();
    }
    dropTimer[i] = timer;

    const tailLen = dropLength[i];

    // Reset drop when off-screen
    if (y - tailLen > rows) {
      y = -Math.random() * 20 - 5;
      const isImageCol = col >= artStartCol && col < artStartCol + ART_WIDTH;
      dropSpeed[i] = 0.35 + Math.random() * 0.55 + (isImageCol ? 0.15 : 0);
      dropLength[i] = 25 + Math.floor(Math.random() * 20);
      dropHeadChar[i] = randomMatrixChar();
    }

    dropY[i] = y;

    const headRow = Math.floor(y);
    const colX = col * cellWidth;
    const headChar = dropHeadChar[i];

    // Iterate down the long trail
    const steps = Math.min(tailLen, MAX_TRAIL_STEPS);
    for (let step = 0; step < steps; step++) {
      const r = headRow - step;
      if (r < 0 || r >= rows) continue;

      const idx = r * cols + col;
      const cellType = gridTypes[idx];

      // A. Clean buffer zone: skip drawing
      if (cellType === TYPE_BUFFER) continue;

      // B. Feathered transition zone: density-filtered dissipation
      if (cellType === TYPE_FEATHERED) {
        if (randomMask[idx] > gridDensity[idx]) continue;
      }

      const yPos = r * cellHeight;

      if (cellType === TYPE_IMAGE) {
        // C. Image cell: exact ASCII art character!
        const ch = gridChars[idx];
        if (ch === ' ') continue;

        if (step === 0) {
          // Drop head in image: Blazing white with neon bloom
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 8;
          ctx.fillText(ch, colX, yPos);
          ctx.shadowBlur = 0;
        } else if (step === 1) {
          // Luminous pale mint
          ctx.fillStyle = '#c2ffd9';
          ctx.fillText(ch, colX, yPos);
        } else {
          // Long tail: select pre-cached color based on glyph density
          let colorArr: string[];
          if (ch === '$' || ch === '&' || ch === 'X') {
            colorArr = TRAIL_DENSE;
          } else if (ch === '.' || ch === ':') {
            colorArr = TRAIL_LIGHT;
          } else {
            colorArr = TRAIL_MID;
          }
          ctx.fillStyle = colorArr[step];
          ctx.fillText(ch, colX, yPos);
        }
      } else {
        // D. Random character cell (or feathered transition cell)
        if (Math.random() < 0.03) {
          randomCharBuffer[idx] = randomMatrixChar();
        }
        const ch = step === 0 ? headChar : randomCharBuffer[idx];

        if (cellType === TYPE_FEATHERED) {
          // Softer, gently dissipated glow in the organic feathered boundary
          ctx.fillStyle = TRAIL_FEATHERED[step];
          ctx.fillText(ch, colX, yPos);
        } else {
          // Full background rain
          if (step === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00ff66';
            ctx.shadowBlur = 6;
            ctx.fillText(ch, colX, yPos);
            ctx.shadowBlur = 0;
          } else if (step === 1) {
            ctx.fillStyle = '#85ffb3';
            ctx.fillText(ch, colX, yPos);
          } else {
            ctx.fillStyle = TRAIL_RANDOM[step];
            ctx.fillText(ch, colX, yPos);
          }
        }
      }
    }
  }

  ctx.restore();

  animationId = requestAnimationFrame(render);
}

animationId = requestAnimationFrame(render);
