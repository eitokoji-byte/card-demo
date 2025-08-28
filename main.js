const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let img = null;

// ===== 背景テンプレ定義 =====
const TEMPLATE = {
  A: "./assets/bg-a.png",
  B: "./assets/bg-b.png",
  C: "./assets/bg-c.png"
};

// ファイル読み込み
document.getElementById("file").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  img = await loadImage(URL.createObjectURL(f));
  draw();
});

// プレビュー更新
document.getElementById("btn-preview").addEventListener("click", draw);

// PNG保存
document.getElementById("btn-dl").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "card.png";
  a.click();
});

// 背景セレクト変更イベント
document.getElementById("tpl").addEventListener("change", draw);

// ===== 描画処理 =====
async function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // 背景テンプレ
  const tplKey = document.getElementById("tpl").value;
  const bgUrl = TEMPLATE[tplKey];
  if (bgUrl) {
    const bg = await loadImage(bgUrl);
    ctx.drawImage(bg, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
  }

  // アップロード画像（中央配置）
  if (img) {
    const fit = contain(img.width, img.height, W * 0.9, H * 0.6);
    const x = (W - fit.w) / 2, y = H * 0.1;
    ctx.drawImage(img, x, y, fit.w, fit.h);
  }

  // メッセージ
  const msg = document.getElementById("message").value;
  if (msg) {
    ctx.font = "700 40px sans-serif";
    ctx.fillStyle = "#222";
    ctx.textAlign = "center";
    ctx.fillText(msg, W / 2, H * 0.9);
  }
}

// ===== ユーティリティ関数 =====
function loadImage(url) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
}

function contain(sw, sh, dw, dh) {
  const sr = sw / sh, dr = dw / dh;
  if (sr > dr) {
    return { w: dw, h: Math.round(dw / sr) };
  } else {
    return { h: dh, w: Math.round(dh * sr) };
  }
}
