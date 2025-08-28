const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let img = null;

// ===== 背景テンプレ =====
const TEMPLATE = {
  A: "./assets/bg-a.png",
  B: "./assets/bg-b.png",
  C: "./assets/bg-c.png",
};

// ===== フォント定義（Google Fontsを使用） =====
// Yomogi は Regular(400)のみ。その他は 700 を使う。
const FONT_CSS = {
  basic: "700 40px 'Noto Sans JP', system-ui, sans-serif",         // ベーシック（ゴシック）
  hand:  "400 40px 'Yomogi', 'Hiragino Maru Gothic Pro', sans-serif", // 手書き風
  cute:  "700 40px 'Zen Maru Gothic', 'Kosugi Maru', sans-serif",  // まるっこい
};

// Webフォント読み込み完了を待つ
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

// ===== イベント登録 =====
document.getElementById("file").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  img = await loadImage(URL.createObjectURL(f));
  draw();
});

document.getElementById("btn-preview").addEventListener("click", draw);

document.getElementById("btn-dl").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "card.png";
  a.click();
});

document.getElementById("tpl").addEventListener("change", draw);
document.getElementById("layout").addEventListener("change", draw);
document.getElementById("font").addEventListener("change", draw);

// ===== 描画処理 =====
async function draw() {
  await fontsReady; // フォント読み込みを待つ

  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // 背景
  const tplKey = document.getElementById("tpl").value;
  const bgUrl = TEMPLATE[tplKey];
  if (bgUrl) {
    const bg = await loadImage(bgUrl);
    ctx.drawImage(bg, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
  }

  // 写真（中央寄せ）
  if (img) {
    const fit = contain(img.width, img.height, Math.floor(W * 0.9), Math.floor(H * 0.6));
    const x = (W - fit.w) / 2, y = Math.floor(H * 0.1);
    ctx.drawImage(img, x, y, fit.w, fit.h);
  }

  // メッセージ
  const msg = document.getElementById("message").value || "";
  if (msg) {
    const fontSel = document.getElementById("font")?.value || "basic";
    ctx.font = FONT_CSS[fontSel] || FONT_CSS.basic;
    ctx.fillStyle = "#222";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const layout = document.getElementById("layout").value; // top/middle/bottom
    const yBase =
      layout === "top" ? Math.floor(H * 0.1) :
      layout === "middle" ? Math.floor(H * 0.5) :
      Math.floor(H * 0.9);

    // 改行対応
    const lines = msg.split("\n");
    const lineHeight = 44;
    const startY = yBase - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, startY + i * lineHeight);
    });
  }
}

// ===== ユーティリティ =====
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
  if (sr > dr) return { w: dw, h: Math.round(dw / sr) };
  return { h: dh, w: Math.round(dh * sr) };
}

// 初期描画
draw();
