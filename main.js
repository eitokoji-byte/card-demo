<script>
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

// アップロード画像を読み込み
document.getElementById("upload").addEventListener("change", (e) => {
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      uploadedImage = img;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
});

// 画像読み込み用のPromise関数
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// メイン描画関数
async function draw() {
  const message = messageEl.value || "テスト表示";
  const layout = layoutEl.value;
  const font = fontEl.value;
  const bgKey = tplEl.value;

  const bgImg = await loadImage(backgrounds[bgKey]);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  if (uploadedImage) {
    const imgWidth = canvas.width / 2;
    const imgHeight = canvas.height / 2;
    const imgX = (canvas.width - imgWidth) / 2;
    const imgY = (canvas.height - imgHeight) / 2;
    ctx.drawImage(uploadedImage, imgX, imgY, imgWidth, imgHeight);
  }

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

// プレビューボタン
document.getElementById("btn-preview").addEventListener("click", () => {
  draw();
});

// ダウンロードボタン
document.getElementById("btn-dl").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "message.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
</script>
