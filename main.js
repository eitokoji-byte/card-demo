const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const messageEl = document.getElementById("message");
const layoutEl  = document.getElementById("layout");
const fontEl    = document.getElementById("font");
const tplEl     = document.getElementById("tpl");

// 高DPI対応
function resizeCanvasForDpi(){
  const ratio = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 800;
  const cssH = canvas.clientHeight || 800;
  canvas.width = Math.round(cssW * ratio);
  canvas.height = Math.round(cssH * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

// フォント指定はそのままでOK
const fontMap = {
  gothic: "bold 48px 'Noto Sans JP', sans-serif",
  mincho: "bold 48px 'Noto Serif JP', serif",
  maru:   "bold 48px 'Zen Maru Gothic', sans-serif",
  hand:   "bold 48px 'Yomogi', cursive"
};

const backgrounds = {
  A: "./assets/bg-a.png",
  B: "./assets/bg-b.png",
  C: "./assets/bg-c.png"
};

let uploadedImage = null;

// ファイル選択
document.getElementById("file").addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => { uploadedImage = img; draw(); };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(f);
});

// 画像読み込み（CORS配慮）
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// テキスト折り返し
function fillWrappedText(text, x, y, maxWidth, lineHeight){
  const words = text.split(/\s+/);
  let line = "", cy = y;
  for (let i=0; i<words.length; i++){
    const test = line ? line + " " + words[i] : words[i];
    const w = ctx.measureText(test).width;
    if (w > maxWidth && line){
      ctx.fillText(line, x, cy);
      line = words[i];
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

// 画像を中央に等倍フィット（contain）
function drawContain(img, dx, dy, dw, dh){
  const ir = img.width / img.height;
  const r = dw / dh;
  let w, h, x, y;
  if (ir > r){ // 横長
    w = dw; h = dw / ir;
    x = dx; y = dy + (dh - h)/2;
  } else {    // 縦長
    h = dh; w = dh * ir;
    x = dx + (dw - w)/2; y = dy;
  }
  ctx.drawImage(img, x, y, w, h);
}

// 描画
async function draw() {
  await document.fonts.ready;   // フォント読み込み待ち
  resizeCanvasForDpi();

  const message = messageEl.value || "テスト表示";
  const layout  = layoutEl.value;
  const font    = fontEl.value;
  const bgKey   = tplEl.value;

  const bgImg = await loadImage(backgrounds[bgKey]);

  // 背景
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // 写真レイヤー（キャンバスの中央にコンテインで配置）
  if (uploadedImage) {
    const boxW = canvas.width  * 0.5;
    const boxH = canvas.height * 0.5;
    const boxX = (canvas.width  - boxW) / 2;
    const boxY = (canvas.height - boxH) / 2;
    drawContain(uploadedImage, boxX, boxY, boxW, boxH);
  }

  // テキスト
  ctx.fillStyle = "#000";
  ctx.font = fontMap[font] || fontMap.gothic;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 読みやすさのため薄い縁取り（任意）
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";

  let y;
  if (layout === "top") y = canvas.height * 0.15;
  else if (layout === "middle") y = canvas.height / 2;
  else y = canvas.height * 0.85;

  const centerX = canvas.width / 2;
  const maxTextWidth = canvas.width * 0.8;
  const lineHeight = 56;

  // 縁取り＋本文
  ctx.save();
  ctx.textAlign = "center";
  // 縁取りは1行ずつだとずれるので先にパスで描くのが理想だけど、簡易で二度描き
  ctx.strokeText(message, centerX, y);
  ctx.restore();

  fillWrappedText(message, centerX, y, maxTextWidth, lineHeight);
}

// 各種イベントで再描画
tplEl.addEventListener("change", draw);
fontEl.addEventListener("change", draw);
layoutEl.addEventListener("change", draw);
messageEl.addEventListener("input", draw); // 入力即時反映を追加
document.getElementById("btn-preview").addEventListener("click", draw);

// PNG保存
document.getElementById("btn-dl").addEventListener("click", () => {
  // そのままでOK（高DPIでも実寸PNGが出る）
  const link = document.createElement("a");
  link.download = "message.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// 初期描画
window.addEventListener("load", draw);
window.addEventListener("resize", draw);
