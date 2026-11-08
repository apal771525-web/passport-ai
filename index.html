
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#101827">
<title>Passport AI | Photo Maker</title>

<style>
*{box-sizing:border-box}
body{
 margin:0;
 font-family:Arial,sans-serif;
 background:#f5f7fb;
 color:#172033;
}
header{
 background:#101827;
 color:white;
 padding:20px;
 display:flex;
 justify-content:space-between;
 align-items:center;
}
.logo{font-size:23px;font-weight:800}
.logo span{color:#76a9ff}
header small{color:#b9c5d7}
main{max-width:850px;margin:auto;padding:22px 16px}
.hero{text-align:center;padding:28px 5px}
.hero h1{font-size:34px;margin:5px}
.hero p{color:#667085;line-height:1.6}
.card{
 background:white;
 padding:22px;
 border-radius:18px;
 margin:18px 0;
 box-shadow:0 5px 25px #1522380c;
}
label{display:block;font-weight:600;margin:14px 0 8px}
input,select{
 width:100%;
 padding:13px;
 border:1px solid #dce2eb;
 border-radius:10px;
 background:white;
 font-size:16px;
}
.upload{
 border:2px dashed #a7b8d2;
 border-radius:15px;
 padding:35px 15px;
 text-align:center;
 background:#f8faff;
 cursor:pointer;
}
.upload strong{display:block;margin-bottom:8px}
.preview{
 width:100%;
 max-height:350px;
 object-fit:contain;
 display:none;
 margin:15px auto;
 background:#eee;
 border-radius:10px;
}
.controls{
 display:grid;
 grid-template-columns:1fr 1fr;
 gap:12px;
}
button{
 width:100%;
 border:0;
 padding:15px;
 border-radius:11px;
 font-size:16px;
 font-weight:700;
 cursor:pointer;
 margin-top:14px;
}
.primary{background:#2459d3;color:white}
.secondary{background:#eaf0fc;color:#234da6}
button:disabled{opacity:.45}
.note{
 color:#667085;
 font-size:13px;
 line-height:1.6;
}
footer{text-align:center;padding:25px;color:#667085;font-size:13px}
</style>
</head>

<body>
<header>
 <div class="logo">Passport<span>AI</span></div>
 <small>Photo Studio</small>
</header>

<main>
 <section class="hero">
  <h1>Your Photo. Perfectly Framed.</h1>
  <p>Create a precisely sized document photo using your mobile phone.</p>
 </section>

 <section class="card">
  <h2>01. Select your document</h2>

  <label>Document type</label>
  <select id="document">
   <option>Passport Photo</option>
   <option>Visa Photo</option>
   <option>ID Card Photo</option>
   <option>Custom Photo</option>
  </select>

  <label>Country / Region</label>
  <select id="country">
   <option value="">Select country</option>
   <option>India</option>
   <option>United States</option>
   <option>United Kingdom</option>
   <option>Canada</option>
   <option>Australia</option>
   <option>Other</option>
  </select>
  <p class="note">Country selection is currently informational. Official requirements will be added after verification.</p>
 </section>

 <section class="card">
  <h2>02. Upload your photo</h2>

  <label class="upload" for="photo">
   <strong>＋ Choose your selfie</strong>
   Tap here to select an image from your phone.
   <input type="file" id="photo" accept="image/jpeg,image/png,image/webp" hidden>
  </label>

  <img id="preview" class="preview" alt="Photo preview">

  <p class="note">Use a clear, front-facing photograph with good lighting.</p>
 </section>

 <section class="card">
  <h2>03. Photo dimensions</h2>

  <div class="controls">
   <div>
    <label>Width (pixels)</label>
    <input type="number" id="width" value="413" min="100" max="3000">
   </div>
   <div>
    <label>Height (pixels)</label>
    <input type="number" id="height" value="531" min="100" max="3000">
   </div>
  </div>

  <label>Background</label>
  <select id="background">
   <option value="white">White</option>
   <option value="lightgray">Light Gray</option>
   <option value="blue">Light Blue</option>
  </select>

  <button class="primary" id="process">Create Photo</button>
 </section>

 <section class="card">
  <h2>04. Final photo</h2>
  <canvas id="canvas" style="display:none;max-width:100%;height:auto"></canvas>

  <p id="status" class="note">Your processed photo will appear here.</p>

  <button class="secondary" id="download" disabled>
   Download JPG Photo
  </button>
 </section>

 <p class="note">
  This is an initial photo-sizing prototype, not an official passport compliance checker.
  It does not perform AI background removal or guarantee document acceptance.
 </p>
</main>

<footer>
 © 2026 Passport AI. All Rights Reserved.
</footer>

<script>
const photo = document.getElementById("photo");
const preview = document.getElementById("preview");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let originalImage = null;

photo.addEventListener("change", () => {
 const file = photo.files[0];
 if (!file) return;

 if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
  alert("Please select a JPG, PNG or WebP image.");
  return;
 }

 if (file.size > 15 * 1024 * 1024) {
  alert("Please select an image smaller than 15 MB.");
  return;
 }

 const reader = new FileReader();

 reader.onload = () => {
  const img = new Image();

  img.onload = () => {
   originalImage = img;
   preview.src = reader.result;
   preview.style.display = "block";
   document.getElementById("status").textContent =
    "Photo uploaded successfully. Ready to process.";
  };

  img.src = reader.result;
 };

 reader.readAsDataURL(file);
});

document.getElementById("process").addEventListener("click", () => {
 if (!originalImage) {
  alert("Please upload a photo first.");
  return;
 }

 const w = Number(document.getElementById("width").value);
 const h = Number(document.getElementById("height").value);

 if (!Number.isInteger(w) || !Number.isInteger(h) ||
     w < 100 || h < 100 || w > 3000 || h > 3000) {
  alert("Enter valid dimensions between 100 and 3000 pixels.");
  return;
 }

 canvas.width = w;
 canvas.height = h;

 const backgrounds = {
  white:"#ffffff",
  lightgray:"#eeeeee",
  blue:"#e5efff"
 };

 ctx.fillStyle = backgrounds[
  document.getElementById("background").value
 ];
 ctx.fillRect(0,0,w,h);

 const scale = Math.max(
  w / originalImage.width,
  h / originalImage.height
 );

 const sw = w / scale;
 const sh = h / scale;

 const sx = (originalImage.width - sw) / 2;
 const sy = (originalImage.height - sh) / 2;

 ctx.drawImage(
  originalImage,
  sx,sy,sw,sh,
  0,0,w,h
 );

 canvas.style.display = "block";
 document.getElementById("status").textContent =
  "Photo created: " + w + " × " + h + " pixels.";

 document.getElementById("download").disabled = false;
});

document.getElementById("download").addEventListener("click", () => {
 if (!canvas.width) return;

 canvas.toBlob(blob => {
  if (!blob) {
   alert("Unable to create JPG.");
   return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "passport-ai-photo.jpg";
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
 }, "image/jpeg", 0.95);
});
</script>
</body>
</html>
# passport-ai
Global AI Passport and Visa Photo Platform
