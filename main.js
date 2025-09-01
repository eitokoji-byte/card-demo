// ========================
// main.js（ガイド表示＋文字サイズ＋フォント先読み＋カラー対応）
// ========================
'use strict';

// ------------ GASエンドポイント ------------
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxaHrhLFwptAV9EEp-Njvyl9RHi4ygYXvQDGvYDG3-gTx_N-rpdhfzqisuLCLmoCcJG/exec';
if (GAS_ENDPOINT.includes('XXXXXXXX')) {
  alert('GASのURLを main.js の GAS_ENDPOINT に設定してください。');
}

// ------------ DOM参照 ------------
const canvas   = document.getElementById('c');
const ctx      = canvas.getContext('2d', { willReadFrequently: true });

const fileEl    = document.getElementById('file');
const tplEl     = document.getElementById('tpl');
const msgEl     = document.getElementById('message');
const layoutEl  = document.getElementById('layout');
const fontEl    = document.getElementById('font');
const statusEl  = document.getElementById('status');

// ボタン
const btnPreview    = document.getElementById('btn-preview');
const btnIllustrate = document.getElementById('btn-illustrate');
const btnDL         = document.getElementById('btn-dl');
const btnDecide     = document.getElementById('btn-decide');
const btnGuides     = document.getElementById('btn-toggle-guides');

// スライダー
const fontSizeEl  = document.getElementById('font-size');
const fontSizeVal = document.getElementById('font-size-val');
let fontSize = 48;

// カラー
const fontColorEl = document.getElementById('font-color');
let fontColor = '#000000'; // デフォルト黒

// ------------ ステータス表示 ------------
function setStatus(msg){
  if (statusEl) statusEl.textContent = msg || '';
  if (msg) console.log('[status]', msg);
}

// ------------ 高DPI対応 ------------
function resizeCanvasForDpi(){
  const ratio = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 800;
  const baseW = Number(canvas.getAttribute('width') || 1200);
  const baseH = Number(canvas.getAttribute('height') || 800);
  const cssH = Math.round(cssW * (baseH / baseW));
  canvas.width  = Math.round(cssW * ratio);
  canvas.height = Math.round(cssH * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

// ------------ フォント / 背景 ------------
const fontMap = {
  gothic: "700 48px 'Noto Sans JP', system-ui, -apple-system, Segoe UI, sans-serif",
  mincho: "700 48px 'Shippori Mincho', 'Noto Sans JP', serif",
  maru:   "700 48px 'Zen Maru Gothic', 'Noto Sans JP', sans-serif",
  hand:   "700 48px 'Yomogi', cursive"
};
const backgrounds = {
  A: './assets/bg-a.png',
  B: './assets/bg-b.png',
  C: './assets/bg-c.png'
};
const fontFamilyByKey = {
  gothic: 'Noto Sans JP',
  mincho: 'Shippori Mincho',
  maru:   'Zen Maru Gothic',
  hand:   'Yomogi'
};

// ------------ 状態 ------------
let uploadedImage = null;
const state = { illustrated: false, style: 'flat-color' };
const ui = { showGuides: false };

// ------------ ユーティリティ ------------
function loadImage(src){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>resolve(img);
    img.onerror = ()=>reject(new Error('image load error: '+src));
    img.src = src;
  });
}
function drawContain(img, dx, dy, dw, dh){
  const ir = img.width / img.height;
  const r  = dw / dh;
  let w,h,x,y;
  if (ir > r){ w = dw; h = dw / ir; x = dx; y = dy + (dh - h)/2; }
  else       { h = dh; w = dh * ir; x = dx + (dw - w)/2; y = dy; }
  ctx.drawImage(img, x, y, w, h);
}
function fillWrappedTextCenter(text, cx, cy, maxWidth, lineHeight){
  const lines = [];
  const rawLines = String(text || '').split(/\r?\n/);
  for(const raw of rawLines){
    if (!raw) { lines.push(''); continue; }
    const tokens = /\s/.test(raw) ? raw.split(/\s+/) : raw.split('');
    let line = '';
    for(const tk of tokens){
      const test = line ? (/\s/.test(raw) ? (line + ' ' + tk) : (line + tk)) : tk;
      const w = ctx.measureText(test).width;
      if (w > maxWidth && line){ lines.push(line); line = tk; }
      else { line = test; }
    }
    if (line) lines.push(line);
  }
  const totalH = (lines.length - 1) * lineHeight;
  let y = cy - totalH/2;
  for(const ln of lines){ ctx.fillText(ln, cx, y); y += lineHeight; }
}

// ------------ フォント先読みユーティリティ ------------
async function warmupFonts() {
  const families = [
    '700 1rem "Noto Sans JP"',
    '700 1rem "Shippori Mincho"',
    '700 1rem "Zen Maru Gothic"',
    '700 1rem "Yomogi"'
  ];
  const sample = '漢かなカナABC123';
  try {
    await Promise.all(families.map(f => document.fonts.load(f, sample)));
    await document.fonts.ready;
  } catch (_) {}
}
async function ensureFontLoaded(family) {
  const styles = ['400', '700'];
  const sample = '漢かなカナABC123';
  try {
    for (const w of styles) {
      await document.fonts.load(`${w} 1rem "${family}"`, sample);
    }
    await document.fonts.ready;
  } catch (_) {}
}
function redrawAfterFont() {
  draw();
  requestAnimationFrame(() => requestAnimationFrame(draw));
}

// ------------ ファイル入力 ------------
fileEl?.addEventListener('change', (e)=>{
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    const img = new Image();
    img.onload = ()=>{ uploadedImage = img; state.illustrated = false; draw(); };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(f);
});

// ------------ 描画本体 ------------
async function draw(){
  await document.fonts.ready;
  resizeCanvasForDpi();

  const message = msgEl?.value || '';
  const layout  = layoutEl?.value || 'bottom';
  const fontKey = fontEl?.value || 'gothic';
  const bgKey   = tplEl?.value || 'A';

  ctx.clearRect(0,0,canvas.width,canvas.height);
  try{
    const bg = await loadImage(backgrounds[bgKey] || backgrounds.A);
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  }catch{
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  if (uploadedImage){
    const boxW = canvas.width  * 0.9;
    const boxH = canvas.height * 0.56;
    const boxX = (canvas.width  - boxW) / 2;
    const boxY = (canvas.height - boxH) / 2 - 20;
    drawContain(uploadedImage, boxX, boxY, boxW, boxH);
  }

  // フォント（スライダー値を反映）
  const fontTemplate = fontMap[fontKey] || fontMap.gothic;
  ctx.font = fontTemplate.replace('48px', `${fontSize}px`);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const centerX = canvas.width / 2;
  let y;
  if (layout === 'top') y = canvas.height * 0.13;
  else if (layout === 'middle') y = canvas.height * 0.52;
  else y = canvas.height * 0.90;

  const maxTextWidth = canvas.width * 0.82;
  const lineHeight = Math.round(fontSize * 1.15);

  // 縁取り（白固定）
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeText((message.split(/\r?\n/)[0] || ''), centerX, y);

  // 本文（カラーピッカーの色）
  ctx.fillStyle = fontColor;
  fillWrappedTextCenter(message, centerX, y, maxTextWidth, lineHeight);

  // ガイド描画
  if (ui.showGuides) {
    const w = canvas.width, h = canvas.height;
    const mSafe  = Math.round(Math.min(w,h) * 0.06);
    const mBleed = Math.round(Math.min(w,h) * 0.02);
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(37,99,235,.9)'; ctx.setLineDash([10,6]);
    ctx.strokeRect(mSafe, mSafe, w - mSafe*2, h - mSafe*2);
    ctx.strokeStyle = 'rgba(220,38,38,.9)'; ctx.setLineDash([4,4]);
    ctx.strokeRect(mBleed, mBleed, w - mBleed*2, h - mBleed*2);
    ctx.font = "bold 20px 'Noto Sans JP', sans-serif";
    ctx.fillStyle = 'rgba(0,0,0,.65)';
    ctx.fillText('セーフゾーン', mSafe+100, mSafe-10);
    ctx.fillText('断ち落とし目安', mBleed+120, mBleed-10);
    ctx.restore();
  }
}

// ------------ イベント ------------
btnPreview?.addEventListener('click', draw);
tplEl?.addEventListener('change', draw);

// フォント選択：ロード保証→描画（2フレーム再描画）
fontEl?.addEventListener('change', async (e) => {
  const key = e.target.value || 'gothic';
  const family = fontFamilyByKey[key] || 'Noto Sans JP';
  setStatus(`フォント読込中… ${family}`);
  await ensureFontLoaded(family);
  setStatus('');
  redrawAfterFont();
});

layoutEl?.addEventListener('change', draw);

// カラーピッカー：色変更で即描画
fontColorEl?.addEventListener('input', ()=>{
  fontColor = fontColorEl.value || '#000000';
  draw();
});

// 入力イベント（必要に応じて draw へ）
msgEl?.addEventListener('input', ()=>{});

// 初期ロード：フォント暖機→描画（2フレーム再描画）
window.addEventListener('load', async () => {
  // 初期カラーの同期
  if (fontColorEl && fontColorEl.value) fontColor = fontColorEl.value;
  warmupFonts(); // 並行で開始
  await document.fonts.ready;
  redrawAfterFont();
});
window.addEventListener('resize', draw);

// ガイド表示トグル
btnGuides?.addEventListener('click', ()=>{
  ui.showGuides = !ui.showGuides;
  if (btnGuides) btnGuides.textContent = ui.showGuides ? 'ガイド非表示' : 'ガイド表示';
  draw();
});
if (btnGuides) btnGuides.textContent = 'ガイド表示';

// スライダー
fontSizeEl?.addEventListener('input', ()=>{
  fontSize = Number(fontSizeEl.value) || 48;
  if (fontSizeVal) fontSizeVal.textContent = fontSize + 'px';
  draw();
});
if (fontSizeVal) fontSizeVal.textContent = fontSize + 'px';

// ------------ イラスト化（ダミー） ------------
btnIllustrate?.addEventListener('click', async ()=>{
  try{
    setStatus('イラスト化（ダミー）中…');
    if (!uploadedImage){
      alert('先に写真を選択してください。');
      setStatus('画像未選択');
      return;
    }
    const illustrated = await makeIllustratedImage(uploadedImage, {
      posterizeLevels: 5, edgeStrength: 0.9, delayMs: 800
    });
    uploadedImage = illustrated;
    state.illustrated = true;
    await draw();
    setStatus('イラスト化（ダミー）完了');
  }catch(e){
    console.error(e);
    setStatus('イラスト化（ダミー）失敗');
    alert('イラスト化に失敗しました。別の画像でお試しください。');
  }
});

// 簡易ダミー加工
async function makeIllustratedImage(srcImg, {posterizeLevels=5, edgeStrength=0.9, delayMs=0} = {}){
  if (delayMs) await new Promise(r=>setTimeout(r, delayMs));
  const w = srcImg.naturalWidth || srcImg.width;
  const h = srcImg.naturalHeight || srcImg.height;
  const {canvas: off, ctx: x} = createOffscreenCanvas(w, h);

  x.drawImage(srcImg, 0, 0, w, h);
  let img = x.getImageData(0,0,w,h);
  posterize(img.data, posterizeLevels); x.putImageData(img,0,0);
  const edge = sobelEdgesFromCtx(x, w, h);
  overlayEdgesOnCtx(x, edge, edgeStrength);

  const dataUrl = off.toDataURL('image/png');
  return await loadImage(dataUrl);
}
function createOffscreenCanvas(w,h){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); return {canvas: c, ctx: x};
}
function posterize(data, levels){
  const step = 255 / Math.max(1, (levels-1));
  for (let i=0; i<data.length; i+=4){
    let r=data[i], g=data[i+1], b=data[i+2];
    r = Math.round(Math.round(r/step)*step);
    g = Math.round(Math.round(g/step)*step);
    b = Math.round(Math.round(b/step)*step);
    data[i]=clamp8(r); data[i+1]=clamp8(g); data[i+2]=clamp8(b);
  }
}
function clamp8(v){ return v<0?0: v>255?255:v; }
function sobelEdgesFromCtx(x, w, h){
  const src = x.getImageData(0,0,w,h);
  const gray = new Uint8ClampedArray(w*h);
  for(let i=0, p=0; i<src.data.length; i+=4, p++){
    const r=src.data[i], g=src.data[i+1], b=src.data[i+2];
    gray[p] = (0.299*r + 0.587*g + 0.114*b) | 0;
  }
  const Gx = [-1,0,1, -2,0,2, -1,0,1];
  const Gy = [-1,-2,-1, 0,0,0, 1,2,1];
  const out = new Uint8ClampedArray(w*h);
  for(let y=1; y<h-1; y++){
    for(let xdx=1; xdx<w-1; xdx++){
      let sx=0, sy=0, k=0;
      for(let j=-1;j<=1;j++){
        for(let i=-1;i<=1;i++){
          const val = gray[(y+j)*w + (xdx+i)];
          sx += val * Gx[k]; sy += val * Gy[k]; k++;
        }
      }
      const mag = Math.sqrt(sx*sx + sy*sy);
      out[y*w+xdx] = mag>128 ? 255 : (mag*2)|0;
    }
  }
  return {data: out, width: w, height: h};
}
function overlayEdgesOnCtx(x, edge, strength=1.0){
  const {width:w, height:h} = edge;
  const img = x.getImageData(0,0,w,h);
  for(let p=0, i=0; p<edge.data.length; p++, i+=4){
    const e = edge.data[p] / 255;
    const line = (1 - e) * strength;
    if (line <= 0) continue;
    img.data[i]   = img.data[i]   * (1 - line);
    img.data[i+1] = img.data[i+1] * (1 - line);
    img.data[i+2] = img.data[i+2] * (1 - line);
  }
  x.putImageData(img,0,0);
}

// ------------ PNG保存 ------------
btnDL?.addEventListener('click', ()=>{
  const link = document.createElement('a');
  link.download = 'message.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// ------------ 決定（受注）→ GAS送信 ------------
btnDecide?.addEventListener('click', onDecide);
async function onDecide(){
  try{
    setStatus('受注処理 実行中…');
    const dataUrl = canvas.toDataURL('image/png');
    const payload = {
      text: msgEl?.value || '',
      textPos: layoutEl?.value || 'bottom',
      fontFamily: fontEl?.value || 'gothic',
      bg: tplEl?.value || 'A',
      style: state.style,
      illustrated: state.illustrated,
      timestamp: Date.now(),
      imageDataUrl: dataUrl
    };
    const res = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const raw = await res.clone().text();
    if (!res.ok) throw new Error('order api error');
    const data = JSON.parse(raw);
    setStatus(`受注完了 受付番号 ${data.orderId || '-'}`);
    alert(`受注完了しました。\n受付番号: ${data.orderId}\n画像URL: ${data.fileUrl || '(保存先URL未返却)'}`);
  }catch(err){
    console.error(err);
    setStatus('受注処理 失敗');
    alert('受注に失敗しました。時間をおいて再試行してください。');
  }
}
