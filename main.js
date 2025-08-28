<script>
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");

const backgrounds = {
  A: "./assets/bg-a.png",
  B: "./assets/bg-b.png",
  C: "./assets/bg-c.png"
};

const positions = {
  top: canvas.height * 0.2,
  center: canvas.height * 0.5,
  bottom: canvas.height * 0.8
};

const fonts = {
  gothic: "32px 'Noto Sans JP', sans-serif",
  handwriting: "32px 'Kiwi Maru', cursive",
  marugo: "32px 'Kosugi Maru', sans-serif"
};

function draw() {
  const bgKey = document.getElementById("background").value;
  const text = document.getElementById("text").value;
  const posKey = document.getElementById("position").value;
  const fontKey = document.getElementById("font").value;

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = backgrounds[bgKey];

  image.onload = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    ctx.font = fonts[fontKey];
    ctx.textAlign = "center";
    ctx.fillStyle = "#333";
    ctx.fillText(text, canvas.width / 2, positions[posKey]);
  };
}

document.getElementById("update").addEventListener("click", draw);
</script>
