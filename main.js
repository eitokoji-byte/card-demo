'use strict';
// ------------ GASエンドポイント ------------
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzpk_9BerB5zhhHvHPQEKB-xzaMp1acbRonDOpK_P7oiKmnmf9XKaB1plP2_KjdLxPjOA/exec';
const CLIENT_TOKEN = 'sk_test_dummy123'; // ←テスト用なのでなんでもOK
const USER_ID = 'eitou';

if (GAS_ENDPOINT.includes('XXXXXXXX')) {
  alert('GASのURLを main.js の GAS_ENDPOINT に設定してください。');
}

// DOM取得
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const messageInput = document.getElementById('messageInput');
const fontSizeInput = document.getElementById('fontSize');
const templateSelect = document.getElementById('templateSelect');
const fontColorInput = document.getElementById('fontColor');
const fontFamilyInput = document.getElementById('fontFamily');
const textAlignInput = document.getElementById('textAlign');
const photoInput = document.getElementById('photoInput');
const saveBtn = document.getElementById('saveBtn');
let uploadedImage = null;

// 初期設定
canvas.width = 480;
canvas.height = 640;

// 背景画像マップ
const backgroundImages = {
  classic: 'assets/bg-a.png',
  modern: 'assets/bg-b.png',
  cute: 'assets/bg-c.png',
};

// 画像アップロード
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    uploadedImage = new Image();
    uploadedImage.src = e.target.result;
    uploadedImage.onload = drawCanvas;
  };
  reader.readAsDataURL(file);
}

// フォント名マップ
const fontMap = {
  noto: "'Noto Sans JP', sans-serif",
  shippori: "'Shippori Mincho B1', serif",
  zenmaru: "'Zen Maru Gothic', sans-serif",
  yomogi: "'Yomogi', cursive",
};

// フォントの読み込み待ち関数
function ensureFontLoaded(family) {
  return document.fonts.load(`16px ${family}`);
}

// キャンバス描画
function drawCanvas() {
  const selectedTemplate = templateSelect.value;
  const bgImage = new Image();
  bgImage.src = backgroundImages[selectedTemplate];

  bgImage.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // アップロード画像
    if (uploadedImage) {
      const maxWidth = canvas.width * 0.8;
      const maxHeight = canvas.height * 0.8;
      const imgRatio = uploadedImage.width / uploadedImage.height;
      const canvasRatio = maxWidth / maxHeight;

      let drawWidth, drawHeight;
      if (imgRatio > canvasRatio) {
        drawWidth = maxWidth;
        drawHeight = maxWidth / imgRatio;
      } else {
        drawHeight = maxHeight;
        drawWidth = maxHeight * imgRatio;
      }

      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      ctx.drawImage(uploadedImage, offsetX, offsetY, drawWidth, drawHeight);
    }

    // テキスト描画
    const text = messageInput.value || 'いつもありがとう！';
    const fontSize = fontSizeInput.value;
    const fontColor = fontColorInput.value;
    const fontKey = fontFamilyInput.value;
    const textAlign = textAlignInput.value;
    const fontFamily = fontMap[fontKey] || fontMap.noto;

    ctx.fillStyle = fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let y;
    switch (textAlign) {
      case 'top':
        y = canvas.height * 0.2;
        break;
      case 'middle':
        y = canvas.height / 2;
        break;
      case 'bottom':
        y = canvas.height * 0.8;
        break;
      default:
        y = canvas.height / 2;
    }

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillText(text, canvas.width / 2, y);

     if (document.getElementById('showGuides')?.checked) {
        drawGuides(ctx, canvas);}
  };
}

function drawGuides(ctx, canvas) {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // 薄いグレー
  ctx.lineWidth = 1;

  const positions = [0.2, 0.5, 0.8]; // 上・中央・下
  for (const p of positions) {
    const y = canvas.height * p;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// PNG保存（保存時だけ SAMPLE 透かしを描画）
saveBtn.addEventListener('click', () => {
  // キャンバスの現在の状態をバックアップ
  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = canvas.width;
  originalCanvas.height = canvas.height;
  const originalCtx = originalCanvas.getContext('2d');
  originalCtx.drawImage(canvas, 0, 0);

  // SAMPLEの透かしを描画（中央・斜め・薄め）
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 6); // 斜めにする（-30度）
  ctx.fillStyle = 'rgba(189, 189, 189, 0.3)'; // 薄い赤
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAMPLE', 0, 0);
  ctx.restore();

  // PNG保存処理
  const imageData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imageData;
  link.download = 'message-card-sample.png';
  link.click();

  // 元のキャンバスに戻す
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(originalCanvas, 0, 0);
});


// イベント登録
messageInput.addEventListener('input', drawCanvas);
fontSizeInput.addEventListener('input', drawCanvas);
fontColorInput.addEventListener('input', drawCanvas);
templateSelect.addEventListener('change', drawCanvas);
textAlignInput.addEventListener('change', drawCanvas);
photoInput.addEventListener('change', handlePhotoUpload);
document.getElementById('showGuides').addEventListener('change', drawCanvas);

// フォント選択時に強制ロード→描画
fontFamilyInput.addEventListener('change', async (e) => {
  const fontKey = e.target.value;
  const fontFamily = fontMap[fontKey] || fontMap.noto;
  await ensureFontLoaded(fontFamily);
  drawCanvas();
});

// 初期ロード時：全フォント先に読み込み
window.addEventListener('load', async () => {
  await Promise.all(Object.values(fontMap).map(ensureFontLoaded));
  drawCanvas();
});

const completeBtn = document.getElementById('completeBtn');
const completeMessage = document.getElementById('completeMessage');

completeBtn.addEventListener('click', async () => {
  completeBtn.disabled = true;
  completeBtn.textContent = '送信中...';

  const imageData = canvas.toDataURL('image/png');

  try {
    const res = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'order',
        image: imageData,
        clientToken: CLIENT_TOKEN, // 任意（GASで検証したければ）
        userId: USER_ID            // 任意（ログに記録したければ）
      })
    });

    const result = await res.json();
    console.log(result);

    if (result.orderId && result.fileUrl) {
      completeMessage.innerHTML = `
        ✅ ご注文が完了しました！<br>
        注文ID：<b>${result.orderId}</b><br>
        <a href="${result.fileUrl}" target="_blank">画像を確認する</a>
      `;
      completeMessage.style.color = 'green';
    } else {
      throw new Error('orderId または fileUrl がありません');
    }
  } catch (err) {
    console.error(err);
    completeMessage.innerHTML = '⚠️ 注文に失敗しました。もう一度お試しください。';
    completeMessage.style.color = 'red';
  }

  completeMessage.style.display = 'block';
  completeBtn.disabled = false;
  completeBtn.textContent = '✅ この内容で注文を完了する';
});
