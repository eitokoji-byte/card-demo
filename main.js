const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

document.getElementById("btn-preview").addEventListener("click", () => {
  const msg = document.getElementById("message").value || "テスト表示";
  const layout = document.getElementById("layout").value;
  const font = document.getElementById("font").value;

  // キャンバス初期化
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 白背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // フォント設定
  const fontMap = {
    basic: "bold 48px sans-serif",
    gothic: "bold 48px 'Noto Sans JP', sans-serif",
    mincho: "bold 48px 'Noto Serif JP', serif",
    maru: "bold 48px 'Zen Maru Gothic', sans-serif",
    hand: "bold 48px 'Yomogi', cursive"
  };
  ctx.font = fontMap[font] || fontMap.basic;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Y座標計算
  let y = 100;
  if (layout === "middle") y = canvas.height / 2 - 24;
  if (layout === "bottom") y = canvas.height - 150;

  // 描画
  ctx.fillText(msg, canvas.width / 2, y);
});

document.getElementById("btn-dl").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "message.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
