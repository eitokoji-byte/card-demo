  'use strict';

// 描画モード
const MODE = { PREVIEW: 'preview', SAMPLE: 'sample', PDF: 'pdf' };

// モードごとの表示オプションを作る
function getOptions(mode) {
  return {
    showFrame: document.getElementById('frameToggle')?.checked ?? true, // 写真の白フチ＋影
    showGuides: mode === MODE.PREVIEW && document.getElementById('showGuides')?.checked,
    showBarcode: mode === MODE.PDF,        // バーコードはPDFだけ
    showOrderId: mode === MODE.PDF,        // 注文番号テキストもPDFだけ
    showWatermark: mode === MODE.SAMPLE,   // SAMPLE透かしはサンプルPNGだけ
    showTextBand: true                     // 文字の白帯は全モード表示（好みで切替OK）
  };
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
  const photoFitSelect = document.getElementById('photoFit');
  let uploadedImage = null;

  // 初期設定
  canvas.width = 480;
  canvas.height = 640;

  // 背景画像マップ
  const backgroundImages = {
    classic: 'assets/bg-a.png',
    modern: 'assets/bg-b.png',
    cute: 'assets/bg-c.jpg',
  };

  // 画像アップロード
  function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      uploadedImage = new Image();
      uploadedImage.src = e.target.result;
      uploadedImage.onload = () => {
        state.photo = uploadedImage;  // ✅ ここが重要！
        drawCanvas();                 // 再描画
      };
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

  function ensureFontLoaded(family) {
    return document.fonts.load(`16px ${family}`);
  }

  // キャンバス描画
function drawCanvas() {
  const st = {
    ...state,
    bg: backgroundImages[templateSelect.value],
    photo: uploadedImage,
    fit: photoFitSelect.value,
    message: {
      text: messageInput.value || 'いつもありがとう！',
      pos: textAlignInput.value,
      font: (fontMap[fontFamilyInput.value] || fontMap.noto).replace(/['"]/g, ''),
      color: fontColorInput.value
    }
  };
  drawCard(ctx, canvas.width, canvas.height, st, getOptions(MODE.PREVIEW));
}

  function drawGuides(ctx, canvas) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    [0.2, 0.5, 0.8].forEach(p => {
      const y = canvas.height * p;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });
  }

  // PNG保存（保存時だけ SAMPLE 透かしを描画）
// ★差し替え：サンプル書き出しも drawCard を使う
saveBtn.addEventListener('click', async () => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const exportCtx = exportCanvas.getContext('2d');

  const fontKey = fontFamilyInput.value;
  const fontFamily = (fontMap[fontKey] || fontMap.noto).replace(/['"]/g, '');

  const st = {
    ...state,
    bg: backgroundImages[templateSelect.value],
    message: {
      text: messageInput.value || 'いつもありがとう！',
      pos: textAlignInput.value,
      font: fontFamily,
      color: fontColorInput.value
    }
  };

  // サンプルPNG用オプション
  await drawCard(exportCtx, exportCanvas.width, exportCanvas.height, st, getOptions(MODE.SAMPLE));
  const imageData = exportCanvas.toDataURL('image/png');

  // PCプレビュー用の別タブ
  const newTab = window.open();
  if (newTab) {
    newTab.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;"><img src="${imageData}" style="max-width:100%;height:auto;box-shadow:0 0 8px rgba(0,0,0,0.2)"></body></html>`);
    newTab.document.close();
  }

  // スマホ用にも表示
  const previewImage = document.getElementById('previewImage');
  const previewContainer = document.getElementById('previewContainer');
  const saveBtnMobile = document.getElementById('saveBtnMobile');
  if (previewImage && previewContainer && saveBtnMobile) {
    previewImage.src = imageData;
    previewContainer.style.display = 'block';
    previewContainer.scrollIntoView({ behavior: 'smooth' });
    saveBtnMobile.onclick = () => {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = 'message-card-sample.png';
      link.click();
    };
  }
});

  // イベント登録
  messageInput.addEventListener('input', drawCanvas);
  fontSizeInput.addEventListener('input', drawCanvas);
  fontColorInput.addEventListener('input', drawCanvas);
  templateSelect.addEventListener('change', () => {
    const selected = templateSelect.value;
    state.bg = backgroundImages[selected];
    drawCanvas();
  });
  textAlignInput.addEventListener('change', drawCanvas);
  photoInput.addEventListener('change', handlePhotoUpload);
  document.getElementById('showGuides').addEventListener('change', drawCanvas);
  document.getElementById('frameToggle')?.addEventListener('change', drawCanvas); // ✅ 枠の表示ON/OFF

  fontFamilyInput.addEventListener('change', async (e) => {
    const fontKey = e.target.value;
    const fontFamily = fontMap[fontKey] || fontMap.noto;
    await ensureFontLoaded(fontFamily);
    drawCanvas();
  });
  
  photoFitSelect.addEventListener('change', drawCanvas);

  // 初期ロード時にフォントを全部ロード
  window.addEventListener('load', async () => {
    await Promise.all(Object.values(fontMap).map(ensureFontLoaded));
    drawCanvas();
  });

  const completeBtn = document.getElementById('completeBtn');
  const completeMessage = document.getElementById('completeMessage');

  // ここをPHPアップロード用に変更
  completeBtn.addEventListener('click', async () => {
    completeBtn.disabled = true;
    completeBtn.textContent = '送信中...';

    // === 保存専用キャンバスを作成（ガイド線なし） ===
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    // 背景画像の再描画
    const selectedTemplate = templateSelect.value;
    const bgImage = new Image();
    bgImage.src = backgroundImages[selectedTemplate];

    await new Promise((resolve) => {
      bgImage.onload = () => {
        exportCtx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        // アップロード画像の再描画
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

  // 枠があるときは白いフチを描く
  const showFrame = document.getElementById('frameToggle')?.checked;
  if (showFrame) {
    exportCtx.save();
    exportCtx.shadowColor = 'rgba(0,0,0,0.2)';
    exportCtx.shadowBlur = 8;
    exportCtx.fillStyle = 'white';
    exportCtx.fillRect(offsetX - 6, offsetY - 6, drawWidth + 12, drawHeight + 12);
    exportCtx.restore();
  }


          exportCtx.drawImage(uploadedImage, offsetX, offsetY, drawWidth, drawHeight);
        }

        // テキスト再描画（ガイドなし）
        const text = messageInput.value || 'いつもありがとう！';
        const fontSize = fontSizeInput.value;
        const fontColor = fontColorInput.value;
        const fontKey = fontFamilyInput.value;
        const textAlign = textAlignInput.value;
        const fontFamily = fontMap[fontKey] || fontMap.noto;

let y;
switch (textAlign) {
  case 'top': y = canvas.height * 0.2; break;
  //case 'middle': y = canvas.height / 2; break;
  case 'bottom': y = canvas.height * 0.8; break;
  default: y = canvas.height / 2;
}
const textBoxHeight = 80;
const textBoxY = y - textBoxHeight / 2;


  exportCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  exportCtx.fillRect(0, textBoxY, canvas.width, textBoxHeight);

  exportCtx.fillStyle = fontColor;
  exportCtx.textAlign = 'center';
  exportCtx.textBaseline = 'middle';
  exportCtx.font = `${fontSize}px ${fontFamily}`;
  exportCtx.fillText(text, canvas.width / 2, textBoxY + textBoxHeight / 2);



        resolve();
      };
    });

    // === PNG変換 & 送信 ===
    const imageData = exportCanvas.toDataURL('image/png');
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");

    const orderId = `order_${Date.now()}`;
    const backgroundType = selectedTemplate;
    const messageText = messageInput.value || 'いつもありがとう！';
    const fontType = fontFamilyInput.value;
    const textAlign = textAlignInput.value;

    const formData = new FormData();
    formData.append("image", base64Data);
    formData.append("filename", `${orderId}.png`);
    formData.append("orderId", orderId);
    formData.append("backgroundType", backgroundType);
    formData.append("messageText", messageText);
    formData.append("fontType", fontType);
    formData.append("textAlign", textAlign);

    try {
      const res = await fetch("https://test2.4phy.jp/message-card/upload.php", {
        method: "POST",
        body: formData
      });

      const result = await res.json();
      console.log(result);

      if (result.status === "success") {
        completeMessage.innerHTML = `
          ✅ ご注文が完了しました！<br>
          <a href="${result.url}" target="_blank">保存された画像を確認する</a>
        `;
        completeMessage.style.color = 'green';
        // PDF＋バーコード出力を追加
        await prepareBarcode(orderId);        // ← orderIdからバーコード画像を生成
        await exportPdf({ id: orderId });     // ← PDFファイルをダウンロード

      } else {
        throw new Error(result.message || "アップロード失敗");
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

  // A6物理サイズ（mm）
  const A6_MM = { w: 105, h: 148 };
  // エクスポート用キャンバス（指定の高解像度）
  const EXPORT_PX = { w: 1447, h: 2039 }; // ≒350dpi

  // 既存の状態オブジェクトを想定（背景・写真・メッセージなど）
  let state = {
    bg: 'assets/bg-a.png',         // 背景画像パス or Image要素
    photo: null,            // <img>やImageBitmapなど
    message: { text: 'ありがとう', pos: 'center', font: 'Noto Sans JP', color: '#333' },
    orderId: '',            // 後でバーコードでも使う
    barcodeImg: null        // 生成したバーコード画像（後述）
  };

  // 角丸の矩形を描くユーティリティ
  function roundRectPath(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  // カード全体を描画する共通関数（表示・書き出し両用）
  // カード全体を描画（表示・書き出し両用）★置き換え
async function drawCard(ctx, W, H, st, opt = getOptions(MODE.PREVIEW)) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // 背景
  if (st.bg) {
    const bg = await loadImage(st.bg);
    ctx.drawImage(bg, 0, 0, W, H);
  }

// 写真ブロック
if (st.photo) {
  const targetW = W;                     // 横幅いっぱい
  const targetH = Math.round(H * 0.8);   // 縦はカードの80%くらい
  const offsetX = 0;                     
  const offsetY = Math.round(H * 0.05);  // 上に余白5%

  // アスペクト比
  const imgRatio = st.photo.width / st.photo.height;
  const boxRatio = targetW / targetH;

  let drawW, drawH, dx, dy;

  if (st.fit === "cover") {
    // --- カバー（枠いっぱいに拡大、はみ出しOK）
    if (imgRatio > boxRatio) {
      // 横長 → 高さ基準
      drawH = targetH;
      drawW = targetH * imgRatio;
    } else {
      // 縦長 → 幅基準
      drawW = targetW;
      drawH = targetW / imgRatio;
    }
  } else {
    // --- コンテイン（全部収める、余白あり）
    if (imgRatio > boxRatio) {
      // 横長 → 幅基準
      drawW = targetW;
      drawH = targetW / imgRatio;
    } else {
      // 縦長 → 高さ基準
      drawH = targetH;
      drawW = targetH * imgRatio;
    }
  }

  // 中央寄せ
  dx = offsetX + (targetW - drawW) / 2;
  dy = offsetY + (targetH - drawH) / 2;

  // 枠（白フチ）
  if (opt.showFrame) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = Math.round(W * 0.015);
    ctx.fillStyle = '#fff';
    ctx.fillRect(dx - 6, dy - 6, drawW + 12, drawH + 12);
    ctx.restore();
  }

  ctx.drawImage(st.photo, dx, dy, drawW, drawH);
}



  // メッセージ（白帯＋文字）
  if (st.message?.text) {
    const textColor = st.message.color || '#333';
    const fontSize = Math.round(W * 0.06);
    const fontFamily = st.message.font || 'sans-serif';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let textY = Math.round(H * 0.53); // デフォルト中央
    if (st.message.pos === 'top') textY = Math.round(H * 0.2);
    if (st.message.pos === 'bottom') textY = Math.round(H * 0.8);

// 白帯（プレビュー/PNG/PDFで同じ見た目に）
if (opt.showTextBand) {
  const textBoxH = Math.round(H * 0.08); // 高さを控えめに（10%）
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; // 透明度を下げて背景が少し見えるように
  ctx.fillRect(0, textY - textBoxH / 2, W, textBoxH);
}

    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.fillText(st.message.text, Math.round(W * 0.5), textY);
  }

// バーコード＋注文番号（PDFだけ）
if (opt.showBarcode && st.barcodeImg) {
  const bw = Math.round(W * 0.50);   // 幅50%
  const bh = Math.round(bw * 0.20);  // 高さ20%
  const bx = W - bw - Math.round(W * 0.05);
  const by = H - bh - Math.round(H * 0.04); // 下余白を少なめに → バーコードをさらに下へ


  // バーコード
  ctx.drawImage(st.barcodeImg, bx, by, bw, bh);

  // 注文番号（バーコードの直下）
  if (opt.showOrderId && st.orderId) {
    ctx.fillStyle = '#000';
    ctx.font = `${Math.round(W * 0.024)}px monospace`; // フォントを少し小さめ
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(st.orderId, bx + bw / 2, by + bh + Math.round(H * 0.004));
  }
}


  // ガイド線（プレビューだけ）
  if (opt.showGuides) {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    [0.2, 0.5, 0.8].forEach(p => {
      const y = H * p;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    });
  }

  // SAMPLE透かし（サンプルPNGだけ）
  if (opt.showWatermark) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillStyle = 'rgba(189,189,189,0.3)';
    ctx.font = `bold ${Math.round(W * 0.12)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SAMPLE', 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

  // 画像ローダ
  function loadImage(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // PDFへ出力（ダウンロード）
  async function exportPdf(order) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a6' });

  // 高解像度オフスクリーンCanvas
  const c = document.createElement('canvas');
  c.width = EXPORT_PX.w;
  c.height = EXPORT_PX.h;
  const ctx = c.getContext('2d');

  // 状態コピー（注文ID含む・メッセージ最新化）
  const st = {
    ...state,
    orderId: order.id,
    message: {
      text: messageInput.value || 'いつもありがとう！',
      pos: textAlignInput.value,
      font: (fontMap[fontFamilyInput.value] || fontMap.noto).replace(/['"]/g, ''),
      color: fontColorInput.value
    }
  };

  // PDFモードで描画（バーコード＆注文番号も含む）
  await drawCard(ctx, EXPORT_PX.w, EXPORT_PX.h, st, getOptions(MODE.PDF));

  // キャンバスを画像に変換してPDFへ
  const imgData = c.toDataURL('image/png');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const canvasRatio = c.width / c.height;
  const pageRatio = pageW / pageH;

  let drawW, drawH, offsetX, offsetY;
  if (canvasRatio > pageRatio) {
    drawW = pageW;
    drawH = pageW / canvasRatio;
    offsetX = 0;
    offsetY = (pageH - drawH) / 2;
  } else {
    drawH = pageH;
    drawW = pageH * canvasRatio;
    offsetX = (pageW - drawW) / 2;
    offsetY = 0;
  }

  pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);

  // 保存
  pdf.save(`order_${order.id}.pdf`);
}

  function makeBarcodeImage(orderId, heightPx = 140){
    return new Promise((resolve, reject) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      try {
        JsBarcode(svg, String(orderId), {
          format: 'code128',
          displayValue: false,
          margin: 0,
          height: heightPx
        });
      } catch (e) { reject(e); return; }

      const xml = new XMLSerializer().serializeToString(svg);
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async function prepareBarcode(orderId){
    state.orderId = orderId;
    state.barcodeImg = await makeBarcodeImage(orderId, 160);
  }



