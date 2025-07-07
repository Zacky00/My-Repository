const URL = "./model/";
const ESP32_IP = "192.168.1.43";

let model, webcam;
const cameraButton = document.getElementById("cameraButton");
const predictButton = document.getElementById("predictButton");
const resultDiv = document.getElementById("result");
const statusDiv = document.getElementById("status");

cameraButton.addEventListener("click", async () => {
  try {
    statusDiv.innerText = "📦 Memuat model...";
    console.log("Apakah tmImage terdefinisi?", window.tmImage);
    model = await window.tmImage.load(URL + "model.json", URL + "metadata.json");

    statusDiv.innerText = "📷 Mengaktifkan kamera...";
    webcam = new tmImage.Webcam(300, 300, true);
    await webcam.setup();
    await webcam.play();
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    window.requestAnimationFrame(loop);

    statusDiv.innerText = "✅ Kamera berhasil dimuat!";
    predictButton.disabled = false;
  } catch (err) {
    console.error("Kamera gagal:", err);
    statusDiv.innerText = "❌ Kamera gagal dimuat atau model tidak tersedia.";
  }
});

async function loop() {
  webcam.update();
  window.requestAnimationFrame(loop);
}

predictButton.addEventListener("click", async () => {
  const prediction = await model.predict(webcam.canvas);
  prediction.sort((a, b) => b.probability - a.probability);
  const label = prediction[0].className;
  const confidence = prediction[0].probability;

  resultDiv.innerText = `Result: ${label} (${(confidence * 100).toFixed(1)}%)`;
  sendToESP32(label);
});

async function sendToESP32(label) {
  const url = `http://${ESP32_IP}/submit?msg=${encodeURIComponent(label)}`;
  try {
    await fetch(url);
    console.log("Sent to ESP32:", label);
  } catch (err) {
    console.error("Gagal kirim ke ESP32:", err);
  }
}
