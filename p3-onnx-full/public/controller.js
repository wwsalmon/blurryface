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
let outputPreviewImg = null;
let boundingBoxes = [];
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;
let newBox = null;
let draggedBox = null;
let initialLeft = 0;
let initialTop = 0;

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
const errorMessage = document.getElementById("errorMessage");
const mainButtonRow = document.getElementById("mainButtonRow")
const downloadButton = document.getElementById("downloadButton");
const editButton = document.getElementById("editButton");
const editingButtonRow = document.getElementById("editingButtonRow");
const cancelButton = document.getElementById("cancelButton");
const saveEditsButton = document.getElementById("saveEditsButton");

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
        errorMessage.innerHTML = "";

        // enter loading state
        triggerBlur.disabled = true;
        outputLoading.classList.remove("hidden");

        try {
            const imageBuffer = await file.arrayBuffer();
            const imageJimp = await Jimp.read(imageBuffer);
            boundingBoxes = await detectFaces(imageJimp, (100 - sensitivity) / 100);
            blurredPhoto = await blurFaces(imageJimp, boundingBoxes, blurAmount / 100, padding / 100);
        
            // update view
            outputPreviewImg = document.createElement("img");
            const buffer = await blurredPhoto.getBufferAsync(Jimp.MIME_JPEG);
            const dataURL = "data:image/jpeg;base64," + buffer.toString("base64");
            outputPreviewImg.src = dataURL;
            outputPreviewImg.setAttribute("draggable", false);
            outputPreviewImg.classList.add("select-none");
            outputPreview.appendChild(outputPreviewImg);

            // update download button
            downloadButton.disabled = false;
            editButton.disabled = false;

            downloadButton.onclick = async () => {
                const {save} = window.__TAURI__.dialog;
                const {writeBinaryFile} = window.__TAURI__.fs;
                const defaultName = fileName + "_blurryface.jpg";
                const filePath = await save({defaultPath: defaultName, filters: [{extensions: ["jpg"], name: "JPEG image"}]});
                await writeBinaryFile(filePath, buffer);
            }
        } catch (e) {
            errorMessage.innerHTML = e;
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

function getPosWithinElement(element, event) {
    const rect = element.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top]  // [x, y]
}

function mouseDownHandler (event) {
    // prepare to move existing box
    if (event.target.className == "box"){
        draggedBox = event.target
        const clickPos = getPosWithinElement(event.currentTarget, event);
        startX = clickPos[0]; 
        startY = clickPos[1];
        initialLeft = parseInt(draggedBox.style.left.substring(0, draggedBox.style.left.length - 2));
        initialTop = parseInt(draggedBox.style.top.substring(0, draggedBox.style.left.length - 2));
        return;
    }
    // creating new box
    newBox = document.createElement("div");
    newBox.classList.add("box");
    newBox.setAttribute("tabindex", 0) // make focusable
    newBox.style.width = '0px';
    newBox.style.height = '0px';

    const clickPos = getPosWithinElement(event.currentTarget, event);
    startX = clickPos[0];
    startY = clickPos[1];

    event.currentTarget.appendChild(newBox);
}

function mouseMoveHandler(event) {
    if (!newBox && !draggedBox) return;

    const mousePos = getPosWithinElement(event.currentTarget, event);
    endX = mousePos[0];
    endY = mousePos[1];

    if (draggedBox){
        // the min & max functions make sure boxes stay within bounds of image
        draggedBox.style.left = Math.min(Math.max(0, (initialLeft + endX - startX)), outputPreviewImg.width - convertPxStringToInt(draggedBox.style.width)) + "px";
        draggedBox.style.top = Math.min(Math.max(0, (initialTop + endY - startY)), outputPreviewImg.height - convertPxStringToInt(draggedBox.style.height)) + "px";
        return;
    }

    newBox.style.width = Math.abs(endX - startX) + 'px';
    newBox.style.height = Math.abs(endY - startY) + 'px';
    newBox.style.left = (endX - startX < 0) ? endX + 'px' : startX + 'px';
    newBox.style.top = (endY - startY < 0) ? endY + 'px' : startY + 'px';
}


function mouseUpHandler(event) {
    if (!newBox && !draggedBox) return;

    newBox = null;
    draggedBox = null;
    startX = 0;
    startY = 0;
    endX = 0;
    endY = 0;
}

function drawBoxesOnDetectedFaces() {
    for (let box of boundingBoxes) {
        const x1 = box[0] * outputPreviewImg.width;
        const x2 = box[2] * outputPreviewImg.width;
        const w = x2 - x1;
        const y1 = box[1] * outputPreviewImg.height;
        const y2 = box[3] * outputPreviewImg.height;
        const h = y2 - y1;

        // add in padding
        const ax1 = Math.max(0, x1 - (padding/100) * w);
        const aw = Math.min(outputPreviewImg.width, w * (1 + 2 * (padding/100)));
        const ay1 = Math.max(0, y1 - (padding/100) * h);
        const ah = Math.min(outputPreviewImg.height, h * (1 + 2 * (padding/100)));

        newBox = document.createElement("div");
        newBox.classList.add("box");
        newBox.setAttribute("tabindex", 0);

        newBox.style.width = aw + 'px';
        newBox.style.height = ah + 'px';
        newBox.style.left = ax1 + "px";
        newBox.style.top = ay1 + "px";
        outputPreview.appendChild(newBox);
        newBox = null;
    }
}

editButton.onclick = async () => {
    mainButtonRow.classList.add("hidden")
    editingButtonRow.classList.remove("hidden")

    outputPreviewImg.src = URL.createObjectURL(file);
    outputPreviewImg.onload = () => {drawBoxesOnDetectedFaces();}
    
    outputPreview.style.cursor = "crosshair";
    outputPreview.addEventListener("keydown", keyDownHandler);
    outputPreview.addEventListener("mousedown", mouseDownHandler);
    outputPreview.addEventListener("mousemove", mouseMoveHandler);
    outputPreview.addEventListener("mouseup", mouseUpHandler);
}

cancelButton.onclick = async () => {
    outputPreview.innerHTML=""
    outputPreviewImg = document.createElement("img");
    const buffer = await blurredPhoto.getBufferAsync(Jimp.MIME_JPEG);
    const dataURL = "data:image/jpeg;base64," + buffer.toString("base64");
    outputPreviewImg.src = dataURL;
    
    outputPreviewImg.setAttribute("draggable", false);
    outputPreviewImg.classList.add("select-none");
    outputPreviewImg.onload = function () {
        outputLoading.classList.add("hidden");
        outputPreview.appendChild(outputPreviewImg);
    }

    outputPreview.style.cursor = "default";
    outputPreview.removeEventListener("mousedown", mouseDownHandler);
    outputPreview.removeEventListener("mousemove", mouseMoveHandler);
    outputPreview.removeEventListener("mouseup", mouseUpHandler);
    outputPreview.removeEventListener("mouseup", mouseUpHandler);
    outputPreview.removeEventListener("keydown", keyDownHandler);

    editingButtonRow.classList.add("hidden");
    mainButtonRow.classList.remove("hidden");
}

saveEditsButton.onclick = async () => {
    saveBoxPositions();
    outputPreview.innerHTML=""
    outputLoading.classList.remove("hidden");
    outputPreview.style.cursor = "default";
    outputPreview.removeEventListener("mousedown", mouseDownHandler);
    outputPreview.removeEventListener("mousemove", mouseMoveHandler);
    outputPreview.removeEventListener("mouseup", mouseUpHandler);
    outputPreview.removeEventListener("mouseup", mouseUpHandler);
    outputPreview.removeEventListener("keydown", keyDownHandler);

    try {
        const imageBuffer = await file.arrayBuffer();
        const imageJimp = await Jimp.read(imageBuffer);
        blurredPhoto = await blurFaces(imageJimp, boundingBoxes, blurAmount/100, padding/100);
    
        outputPreviewImg = document.createElement("img");
        const buffer = await blurredPhoto.getBufferAsync(Jimp.MIME_JPEG);
        const dataURL = "data:image/jpeg;base64," + buffer.toString("base64");
        outputPreviewImg.src = dataURL
        
        outputPreviewImg.setAttribute("draggable", false);
        outputPreviewImg.classList.add("select-none");
        outputPreviewImg.onload = function () {
            outputPreview.appendChild(outputPreviewImg);
        }
        downloadButton.onclick = async () => {
            const {save} = window.__TAURI__.dialog;
            const {writeBinaryFile} = window.__TAURI__.fs;
            const defaultName = fileName + "_blurryface.jpg";
            const filePath = await save({defaultPath: defaultName, filters: [{extensions: ["jpg"], name: "JPEG image"}]});
            await writeBinaryFile(filePath, buffer);
        }
        editingButtonRow.classList.add("hidden");
        mainButtonRow.classList.remove("hidden");
    }
    catch (e) {
        errorMessage.innerHTML = e;
        console.log(e);
    }
    outputLoading.classList.add("hidden");
}

function keyDownHandler(event) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
        if (document.activeElement.className === 'box'){
            document.activeElement.remove();
        }
    }
}

function saveBoxPositions() {
    boundingBoxes = []
    const boxes = document.getElementsByClassName("box");
    for (let box of boxes){
        const width = convertPxStringToInt(box.style.width);
        const height = convertPxStringToInt(box.style.height);
        const left = convertPxStringToInt(box.style.left);
        const right = convertPxStringToInt(box.style.left) + width;
        const top = convertPxStringToInt(box.style.top);
        const bottom= convertPxStringToInt(box.style.top) + height;
        boundingBoxes.push([left / outputPreviewImg.width, top / outputPreviewImg.height, right / outputPreviewImg.width, bottom / outputPreviewImg.height]);
    }
}

function convertPxStringToInt (str) {
    return parseInt(str.substring(0, str.length - 2));
}