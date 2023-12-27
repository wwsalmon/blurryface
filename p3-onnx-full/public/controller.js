// MODEL
// MODEL
// MODEL

let blur = 10;
let padding = 10;
let sensitivity = 50;
let file = "";

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


// sliders
const blurSlider = document.getElementById("blurSlider");
const blurReadout = document.getElementById("blurReadout");
const paddingSlider = document.getElementById("paddingSlider");
const paddingReadout = document.getElementById("paddingReadout");
const sensitivitySlider = document.getElementById("sensitivitySlider");
const sensitivityReadout = document.getElementById("sensitivityReadout");

// CONTROLLER
// CONTROLLER
// CONTROLLER

photoIn.onchange = e => {
    if (e.target.files[0]) file = e.target.files[0]; else return;
    const src = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.setAttribute("src", src);
    inputPreview.appendChild(img);
    updateBlurClick();
}

function updateBlurClick() {
    if (file) triggerBlur.disabled = false;
}

// sliders
blurSlider.onchange = e => {
    blur = e.target.value;
    blurReadout.textContent = blur + "%";
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