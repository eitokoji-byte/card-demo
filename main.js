// ==== フォント設定 ====
const FONT_CSS = {
  "basic": "36px sans-serif",
  "gothic": "36px 'Yu Gothic', 'Meiryo', sans-serif",
  "mincho": "36px 'Hiragino Mincho ProN', 'Yu Mincho', serif",
  "maru": "36px 'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', sans-serif",
  "hand": "36px 'Yomogi', 'Caveat', cursive",
};

// ==== Google Fonts読み込み（手書き風含む） ====
const font1 = new FontFaceObserver("Yomogi").load();
const font2 = new FontFaceObserver("Caveat").load();
const fontsReady = Promise.all([font1, font2]);

// ==== 背景画像 ====
const backgrounds = {
  A: "./bg-a.png",
  B: "./bg-b.png",
  C: "./bg-c.png"
};

// ==== DOM取得 ====
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

// ==== 写真アップロード ====
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

// ==== プレビュー更新 ====
previewEl.addEventListener("click", () => draw());

// ==== PNG保存 ====
dlEl.addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "message_card.png";
  a.click();
});

// ==== 描画処理 ====
function draw() {
  const bgKey = tplEl.value;
  const bgImg = new Image();
  bgImg.src = backgrounds[bgKey];

  bgImg.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // ==== 写真描画 ====
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

    // ==== メッセージ描画 ====
    const fontKey = fontEl.value;
    ctx.font = FONT_CSS[fontKey] || FONT_CSS["basic"];
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

// ==== 初回描画（フォント読み込み後に） ====
fontsReady.then(() => draw());
