// ========================
// main.js（ダミーモード完成版）
// ※外部APIは呼ばないので課金ゼロ
// ========================

// ------------ 基本参照 ------------
const canvas   = document.getElementById("c");
const ctx      = canvas.getContext("2d");

const messageEl = document.getElementById("message");
const layoutEl  = document.getElementById("layout");
const fontEl    = document.getElementById("font");
const tplEl     = document.getElementById("tpl");

// ------------ 高DPI対応 ------------
function resizeCanvasForDpi(){
  const ratio = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth  || 800;
  const cssH = canvas.clientHeight || 800;
  canvas.width  = Math.round(cssW * ratio);
  canvas.height = Math.round(cssH * ratio);
  // 論理→CSS座標へ
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

// ------------ フォント / 背景 ------------
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

// ------------ 状態 ------------
let uploadedImage = null; // アップロード or イラスト化（ダミー）でセット
const state = {
  illustratedUrl: null,
  style: "flat-color" // 将来API化する時に使う想定
};

// ------------ ユーティリティ ------------
function setStatus(msg){
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 画像を中央にcontainで描画
function drawContain(img, dx, dy, dw, dh){
  const ir = img.width / img.height;
  const r  = dw / dh;
  let w,h,x,y;
  if (ir > r){ w = dw; h = dw / ir; x = dx; y = dy + (dh - h)/2; }
  else       { h = dh; w = dh * ir; x = dx + (dw - w)/2; y = dy; }
  ctx.drawImage(img, x, y, w, h);
}

// テキスト折返し（簡易）
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
    } else line = test;
  }
  if (line) ctx.fillText(line, x, cy);
}

// ------------ 入力: 画像ファイル ------------
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

// ------------ 描画本体 ------------
async function draw(){
  await document.fonts.ready; // Webフォント待ち
  resizeCanvasForDpi();

  const message = messageEl.value || "テスト表示";
  const layout  = layoutEl.value;
  const fontKey = fontEl.value;
  const bgKey   = tplEl.value;

  const bgImg = await loadImage(backgrounds[bgKey]);

  // 背景
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // 画像レイヤー（アップロード or ダミーイラスト）
  if (uploadedImage){
    const boxW = canvas.width  * 0.5;
    const boxH = canvas.height * 0.5;
    const boxX = (canvas.width  - boxW) / 2;
    const boxY = (canvas.height - boxH) / 2;
    drawContain(uploadedImage, boxX, boxY, boxW, boxH);
  }

  // テキスト
  ctx.fillStyle = "#000";
  ctx.font = fontMap[fontKey] || fontMap.gothic;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 白縁どり（読みやすさ向上・任意）
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";

  let y;
  if (layout === "top") y = canvas.height * 0.15;
  else if (layout === "middle") y = canvas.height / 2;
  else y = canvas.height * 0.85;

  const centerX = canvas.width / 2;
  const maxTextWidth = canvas.width * 0.8;
  const lineHeight = 56;

  // 縁取り（簡易）
  ctx.strokeText(message, centerX, y);
  // 本文（折返し）
  fillWrappedText(message, centerX, y, maxTextWidth, lineHeight);
}

// ------------ UIイベントで再描画 ------------
tplEl.addEventListener("change", draw);
fontEl.addEventListener("change", draw);
layoutEl.addEventListener("change", draw);
messageEl.addEventListener("input", draw);
document.getElementById("btn-preview").addEventListener("click", draw);

// PNG保存
document.getElementById("btn-dl").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "message.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// 初期
window.addEventListener("load", draw);
window.addEventListener("resize", draw);

// ======================
// ここから “イラスト化（ダミー）”
// ======================
const USE_DUMMY_ILLUSTRATE = true; // ←今はダミー運用（無料）

async function onIllustrateDummy(){
  try{
    setStatus("イラスト化（ダミー）中…");
    const url = "./assets/dummy-illustration.png"; // 用意してね
    const img = await loadImage(url);
    uploadedImage = img;          // 既存の画像層として扱う
    state.illustratedUrl = url;
    setStatus("イラスト化（ダミー）完了");
    draw();
    alert("ダミーモード：イラスト化しました（API未使用・無料）");
  }catch(e){
    console.error(e);
    setStatus("イラスト化（ダミー）失敗");
  }
}

// 将来の本番API（課金）用の穴。実装時は必ず事前に告知します。
// async function onIllustratePaid(file){ /* 課金API呼び出し予定 */ }

// ボタン紐付け
document.getElementById("btn-illustrate").addEventListener("click", async () => {
  if (USE_DUMMY_ILLUSTRATE){
    await onIllustrateDummy(); // 無料
  } else {
    // const file = document.getElementById("file")?.files?.[0];
    // if (!file) return alert("写真を選択してください。");
    // await onIllustratePaid(file); // ←課金APIを実装する時に切り替え
  }
});

// ======================
// “決定（受注）” GAS 送信
// ======================
async function onDecide(){
  try{
    setStatus("受注処理 実行中…");
    const dataUrl = canvas.toDataURL("image/png");

    const payload = {
      text: messageEl.value || "",
      textPos: layoutEl.value || "middle",
      fontFamily: fontEl.value || "gothic",
      bg: tplEl.value || "A",
      style: state.style,
      timestamp: Date.now(),
      imageDataUrl: dataUrl
    };

    // ★あなたのGAS公開URLに置き換え
    const GAS_ENDPOINT = "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";
    if (GAS_ENDPOINT.includes("XXXXXXXX")) {
      alert("GASのURLを main.js 内の GAS_ENDPOINT に設定してください。");
      setStatus("受注処理 待機中（GAS未設定）");
      return;
    }

    const res = await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("order api error");
    const data = await res.json();

    setStatus(`受注完了 受付番号 ${data.orderId || "-"}`);
    alert(`受注完了しました。\n受付番号: ${data.orderId}\n画像URL: ${data.fileUrl}`);
  }catch(err){
    console.error(err);
    setStatus("受注処理 失敗");
    alert("受注に失敗しました。時間をおいて再試行してください。");
  }
}

document.getElementById("btn-decide").addEventListener("click", onDecide);
