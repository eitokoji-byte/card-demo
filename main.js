const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const messageEl = document.getElementById("message");
const layoutEl = document.getElementById("layout");
const fontEl = document.getElementById("font");
const tplEl = document.getElementById("tpl");

const fontMap = {
  gothic: "bold 48px 'Noto Sans JP', sans-serif",
  mincho: "bold 48px 'Noto Serif JP', serif",
  maru: "bold 48px 'Zen Maru Gothic', sans-serif",
  hand: "bold 48px 'Yomogi', cursive"
};

const backgrounds = {
  A: "./assets/bg-a.png",
  B: "./assets/bg-b.png",
  C: "./assets/bg-c.png"
};

let uploadedImage = null;

// ✅ 修正済み：inputのIDは "file"
document.getElementById("file").addEventListener("change", (e) => {
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      uploadedImage = img;
      draw(); // 読み込んだら即描画
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
});

// プレビュー描画
async function draw() {
  const message = messageEl.value || "テスト表示";
  const layout = layoutEl.value;
  const font = fontEl.value;
  const bgKey = tplEl.value;

  const bgImg = await loadImage(backgrounds[bgKey]);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // アップロード画像
  if (uploadedImage) {
    const imgWidth = canvas.width / 2;
    const imgHeight = canvas.height / 2;
    const imgX = (canvas.width - imgWidth) / 2;
    const imgY = (canvas.height - imgHeight) / 2;
    ctx.drawImage(uploadedImage, imgX, imgY, imgWidth, imgHeight);
  }

  // テキスト
  ctx.fillStyle = "#000";
  ctx.font = fontMap[font] || fontMap.gothic;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let y;
  if (layout === "top") y = canvas.height * 0.15;
  else if (layout === "middle") y = canvas.height / 2;
  else y = canvas.height * 0.85;

  ctx.fillText(message, canvas.width / 2, y);
}

// 背景切り替え・フォント・レイアウト変更時も描画
document.getElementById("tpl").addEventListener("change", draw);
document.getElementById("font").addEventListener("change", draw);
document.getElementById("layout").addEventListener("change", draw);

// プレビュー更新ボタン
document.getElementById("btn-preview").addEventListener("click", draw);

// PNG保存
document.getElementById("btn-dl").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "message.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// 画像読み込み Promise
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ============ 既存の状態オブジェクトに足す想定 ============
const state = {
  bg: 'assets/bg-a.png',   // 既存
  text: 'ありがとう',         // 既存
  textPos: 'center',       // 既存（top/center/bottom）
  fontFamily: 'Noto Sans JP', // 既存
  // 新規
  uploadBlob: null,        // 元写真
  illustratedUrl: null,    // 生成画像URL（サーバーから返却されたURL or base64）
};

// 既存の初期化のどこかでイベント紐付け
window.addEventListener('DOMContentLoaded', () => {
  const up = document.getElementById('uploadInput');
  document.getElementById('btnIllustrate').addEventListener('click', () => {
    up.click();
  });
  up.addEventListener('change', onPickFile);

  document.getElementById('btnDecide').addEventListener('click', onDecide);
});

// ファイル選択→AI変換
async function onPickFile(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  state.uploadBlob = file;
  setStatus('アップロード中…');

  try{
    // 1) 元画像をFormDataでサーバーレス関数へ
    const fd = new FormData();
    fd.append('image', file);
    // スタイル指定など任意（例: 'watercolor','pencil','flat-color'）
    fd.append('style', 'flat-color'); 
    // 顔の保持度合い・線画感などのパラメータも任意で
    fd.append('strength', '0.6'); 

    const res = await fetch('/api/illustrate', { method:'POST', body: fd });
    if(!res.ok) throw new Error('illustrate api error');
    const data = await res.json();
    // data.imageUrl は生成された画像（CDN/Storage/直接base64）のURL想定
    state.illustratedUrl = data.imageUrl;
    setStatus('イラスト化 完了');

    // 2) Canvas合成に取り込む（既存の描画ルーチン内で image 層を差し替え）
    await applyIllustrationToCanvas(state.illustratedUrl);
    // 既存の「更新」ボタン押下と同じ処理を呼んでもOK
    redraw();
  }catch(err){
    console.error(err);
    setStatus('イラスト化 失敗');
    alert('イラスト化に失敗しました。時間をおいて再試行してください。');
  }finally{
    e.target.value = '';
  }
}

async function applyIllustrationToCanvas(url){
  // 既存のレイヤー読み込みと同等の処理
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // ここは既存の合成ロジックに合わせて
      // 例: state.illustrationImage = img; redraw();
      state.illustrationImage = img;
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  });
}

function setStatus(msg){
  const el = document.getElementById('status');
  if(el) el.textContent = msg;
}

// 受注処理（PNG生成→GASへPOST）
async function onDecide(){
  try{
    setStatus('受注処理 実行中…');

    // 1) PNGを生成（既存Canvasから）
    const canvas = document.getElementById('yourCanvasId'); // ←実IDに合わせて
    const dataUrl = canvas.toDataURL('image/png'); // "data:image/png;base64,..."

    // 2) 注文メタ情報（背景・フォント・配置・文言など）
    const payload = {
      text: state.text,
      textPos: state.textPos,
      fontFamily: state.fontFamily,
      bg: state.bg,
      style: 'flat-color', // イラスト化時のスタイル指定を同期
      timestamp: Date.now(),
      imageDataUrl: dataUrl
    };

    // 3) GAS WebアプリにPOST（URLは後述のGAS公開URLに差し替え）
    const GAS_ENDPOINT = 'YOUR_GAS_WEB_APP_URL/exec';
    const res = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('order api error');
    const data = await res.json();

    // 4) 正常終了（受付番号やプレビューURLを表示）
    setStatus(`受注完了 受付番号 ${data.orderId}`);
    alert(`受注完了しました。\n受付番号: ${data.orderId}\n画像URL: ${data.fileUrl}`);
  }catch(err){
    console.error(err);
    setStatus('受注処理 失敗');
    alert('受注に失敗しました。時間をおいて再試行してください。');
  }
}

