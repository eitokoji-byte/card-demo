// フォントマップ
const FONT_CSS = {
  "basic": "36px sans-serif",
  "gothic": "36px 'Yu Gothic', 'Meiryo', sans-serif",
  "mincho": "36px 'Hiragino Mincho ProN', 'Yu Mincho', serif",
  "maru": "36px 'Hiragino Maru Gothic ProN', 'Yu Gothic', sans-serif",
  "hand": "36px 'Caveat', 'Zen Maru Gothic', cursive",
};

// Google Fonts読み込み
const fontsReady = new FontFaceObserver("Caveat").load().catch(() => {});
Promise.all([fontsReady]);

// 背景テンプレート画像
const backgrounds = {
  A: "./bg-a.png",
  B: "./bg-b.png",
  C: "./bg-c.png"
};

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const fileEl = document.getElementById("file");
const messageEl = document.getElementById("message");
const dlEl = document.getElementById("btn-dl");
const previewEl = document.getElementById("btn-preview");
const tplEl = document.getElementById("tpl");
const layoutEl = document.getElementById("layout");
const fontEl = document.getElementById("font");

let photo = null;

fileEl.addEventListener("change", () => {
  const file = fileEl.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      photo = img;
      draw();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

previewEl.addEventListener("click", () => draw());

dlEl.addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "message_card.png";
  a.click();
});

function draw() {
  const bgKey = tplEl.value;
  const bgImg = new Image();
  bgImg.src = backgrounds[bgKey];

  bgImg.onload = () => {
    // 背景描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // 写真描画
    if (photo) {
      const pw = 400, ph = 400;
      const px = (canvas.width - pw) / 2;
      const py = 80;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + ph / 2, pw / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(photo, px, py, pw, ph);
      ctx.restore();
    }

    // フォント設定
    const fontSel = fontEl && fontEl.value in FONT_CSS ? fontEl.value : "basic";
    ctx.font = FONT_CSS[fontSel];
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const text = messageEl.value;
    const lines = text.split(/\r?\n/);

    const layout = layoutEl.value;
    let y = 0;
    if (layout === "top") y = 500;
    else if (layout === "middle") y = 600 - (lines.length * 40) / 2;
    else if (layout === "bottom") y = 700 - lines.length * 40;

    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, y + i * 40);
    });
  };
}

// 初回描画
fontsReady.then(() => draw());
