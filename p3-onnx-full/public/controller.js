// check for dependencies
if (typeof Jimp === "undefined") throw new Error("Jimp undefined. Make sure to import jimp.js before running ths script.");
if (typeof detectAndBlurFaces === "undefined") throw new Error("detectAndBlurFaces undefined. Make sure to import facedetect.js before running this script");
if (typeof window.__TAURI__ === "undefined") throw new Error("window.__TAURI__ undefined. Make sure to run this app through Tauri and enable global tauri in tauri.conf.json.");

// MODEL
// MODEL
// MODEL

let blurAmount = 10;
let padding = 10;
let sensitivity = 50;
let fileName = null;
let file = null;
let blurredPhoto = null;

// VIEW
// VIEW
// VIEW

// input
const containerInput = document.getElementById("containerInput");
const photoIn = document.getElementById("photoIn");
const inputPreview = document.getElementById("inputPreview");

// output
const containerOutput = document.getElementById("containerOutput");
const triggerBlur = document.getElementById("triggerBlur");
const outputPreview = document.getElementById("outputPreview");
const outputLoading = document.getElementById("outputLoading");
const downloadButton = document.getElementById("downloadButton");


// sliders
const blurSlider = document.getElementById("blurSlider");
const blurReadout = document.getElementById("blurReadout");
const paddingSlider = document.getElementById("paddingSlider");
const paddingReadout = document.getElementById("paddingReadout");
const sensitivitySlider = document.getElementById("sensitivitySlider");
const sensitivityReadout = document.getElementById("sensitivityReadout");

// linkButton
const linkButton = document.getElementById("linkButton");

// CONTROLLER
// CONTROLLER
// CONTROLLER

// upload photo
photoIn.onchange = e => {
    if (e.target.files[0]) file = e.target.files[0]; else return;

    // get filename
    const filePath = e.target.value;
    const fullFileName = filePath.replace(/^.*?([^\\\/]*)$/, '$1');
    fileName = fullFileName.substring(0, fullFileName.lastIndexOf("."));

    // update preview
    const src = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.setAttribute("src", src);
    inputPreview.innerHTML = "";
    inputPreview.appendChild(img);

    // update blur button
    updateBlurClick();
}

function updateBlurClick() {
    if (file) triggerBlur.disabled = false;

    triggerBlur.onclick = async () => {
        // clear previous
        outputPreview.innerHTML = "";
        blurredPhoto = null;
        downloadButton.disabled = true;

        // enter loading state
        triggerBlur.disabled = true;
        outputLoading.classList.remove("hidden");

        try {
            const imageBuffer = await file.arrayBuffer();
            const imageJimp = await Jimp.read(imageBuffer);
            blurredPhoto = await detectAndBlurFaces(imageJimp, blurAmount / 100, padding / 100, (100 - sensitivity) / 100);
        
            // update view
            const outputPreviewImg = document.createElement("img");
            const buffer = await blurredPhoto.getBufferAsync(Jimp.MIME_JPEG);
            const dataURL = "data:image/jpeg;base64," + buffer.toString("base64");
            outputPreviewImg.src = dataURL;
            outputPreview.appendChild(outputPreviewImg);

            // update download button
            downloadButton.disabled = false;
            downloadButton.onclick = async () => {
                const {save} = window.__TAURI__.dialog;
                const {writeBinaryFile} = window.__TAURI__.fs;
                const defaultName = fileName + "_blurryface.jpg";
                const filePath = await save({defaultPath: defaultName, filters: [{extensions: ["jpg"], name: "JPEG image"}]});
                await writeBinaryFile(filePath, buffer);
            }
        } catch (e) {
            console.log(e);
        }

        // exit loading state
        triggerBlur.disabled = false;
        outputLoading.classList.add("hidden");
    }
}

// sliders
blurSlider.onchange = e => {
    blurAmount = e.target.value;
    blurReadout.textContent = blurAmount + "%";
    updateBlurClick();
}

paddingSlider.onchange = e => {
    padding = e.target.value;
    paddingReadout.textContent = padding + "%";
    updateBlurClick();
}

sensitivitySlider.onchange = e => {
    sensitivity = e.target.value;
    sensitivityReadout.textContent = sensitivity + "%";
    updateBlurClick();
}

// linkButton
const {open} = window.__TAURI__.shell;
linkButton.onclick = () => {
    open("https://github.com/wwsalmon/blurryface");
}