// check for dependencies
if (typeof Jimp === "undefined") throw new Error("Jimp undefined. Make sure to import jimp.js before running ths script.");
if (typeof detectFaces === "undefined") throw new Error("detectFaces undefined. Make sure to import facedetect.js before running this script");
if (typeof blurFaces === "undefined") throw new Error("blurFaces undefined. Make sure to import facedetect.js before running this script");
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
let blurredPhotoDataUrl = null;
let outputPreviewImg = null;
let boxPositions = []; // tracks the currently drawn boxes
let confirmedBoxPositions = []; // tracks boxes that have been saved & applied
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;
let newBox = null;
let draggedBox = null;
let initialLeftOffset = 0;
let initialTopOffset = 0;

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
const triggerManual = document.getElementById("triggerManual");
const outputPreview = document.getElementById("outputPreview");
const outputLoading = document.getElementById("outputLoading");
const errorMessage = document.getElementById("errorMessage");
const mainButtonRow = document.getElementById("mainButtonRow")
const saveButton = document.getElementById("downloadButton");
const editButton = document.getElementById("editButton");
const editingButtonRow = document.getElementById("editingButtonRow");
const cancelButton = document.getElementById("cancelButton");
const saveEditsButton = document.getElementById("saveEditsButton");
const editingHelper = document.getElementById("editingHelper");

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
    if (file) triggerManual.disabled = false;

    triggerBlur.onclick = () => onBlurClick(false);
    triggerManual.onclick = () => onBlurClick(true);
}

// manual: optional boolean
async function onBlurClick(manual) {
    // clear previous photo
    blurredPhoto = null;

    // update view for loading
    enterLoadingState();

    try {
        // get new photo
        const imageBuffer = await file.arrayBuffer();
        const imageJimp = await Jimp.read(imageBuffer);
        if (manual) {
            confirmedBoxPositions = [];
            boxPositions = [];
            blurredPhoto = imageJimp.clone();
        } else {
            confirmedBoxPositions = await detectFaces(imageJimp, (100 - sensitivity) / 100);
            boxPositions = confirmedBoxPositions;
            blurredPhoto = await blurFaces(imageJimp, confirmedBoxPositions, blurAmount / 100, padding / 100);
        }
        const buffer = await blurredPhoto.getBufferAsync(Jimp.MIME_JPEG);
        blurredPhotoDataUrl = "data:image/jpeg;base64," + buffer.toString("base64");
    
        // update view
        await updateOutput();

        if (manual) {
            setTimeout(() => {
                editButton.click();
            }, 10); // it needs a timeout to work not sure why
        }
    } catch (e) {
        errorMessage.innerHTML = e;
        console.log(e);
    }

    // exit loading state
    exitLoadingState();
}

function exitLoadingState() {
    triggerBlur.disabled = false;
    triggerManual.disabled = false;
    outputLoading.classList.add("hidden");
}

function enterLoadingState() {
    outputPreview.innerHTML = "";
    errorMessage.innerHTML = "";
    saveButton.disabled = true;
    triggerBlur.disabled = true;
    triggerManual.disabled = true;
    editButton.disabled = true;
    saveEditsButton.disabled = true;
    cancelButton.disabled = true;
    outputLoading.classList.remove("hidden");
}

async function updateOutput() {
    // clear previous
    outputPreview.innerHTML = "";
    errorMessage.innerHTML = "";

    // update output preview
    outputPreviewImg = document.createElement("img");
    outputPreviewImg.src = blurredPhotoDataUrl;
    outputPreviewImg.setAttribute("draggable", false);
    outputPreviewImg.classList.add("select-none");
    outputPreviewImg.onload = function () {
        outputPreview.appendChild(outputPreviewImg);
    }

    // update buttons
    const buffer = await blurredPhoto.getBufferAsync(Jimp.MIME_JPEG);

    saveButton.onclick = async () => {
        const {save} = window.__TAURI__.dialog;
        const {writeBinaryFile} = window.__TAURI__.fs;
        const defaultName = fileName + "_blurryface.jpg";
        const filePath = await save({defaultPath: defaultName, filters: [{extensions: ["jpg"], name: "JPEG image"}]});
        await writeBinaryFile(filePath, buffer);
    }
    hideEl(editingButtonRow, editingHelper);
    showEl(mainButtonRow);

    saveButton.disabled = false;
    editButton.disabled = false;
}

// edit functionality
editButton.onclick = async () => {
    hideEl(mainButtonRow);
    showEl(editingButtonRow, editingHelper);

    // make sure editing button row buttons enabled
    saveEditsButton.disabled = false;
    cancelButton.disabled = false;

    // draw unblurred image, boxes
    outputPreviewImg.src = URL.createObjectURL(file);
    outputPreviewImg.onload = () => {drawBoxes(confirmedBoxPositions);}

    outputPreview.addEventListener("keydown", keyDownHandler);
    outputPreview.addEventListener("mousedown", mouseDownHandler);
    outputPreview.addEventListener("mousemove", mouseMoveHandler);
    // adding on window prevents unintuitive behavior when user lifts click outside outputPreview
    window.addEventListener("mouseup", mouseUpHandler);
}

cancelButton.onclick = async () => {
    // reset the stored box positions
    boxPositions = confirmedBoxPositions;
    
    updateOutput(); // update to previous output image, buttons

    // remove event listeners
    outputPreview.removeEventListener("mousedown", mouseDownHandler);
    outputPreview.removeEventListener("mousemove", mouseMoveHandler);
    outputPreview.removeEventListener("mouseup", mouseUpHandler);
    window.removeEventListener("mouseup", mouseUpHandler);
    outputPreview.removeEventListener("keydown", keyDownHandler);
}

saveEditsButton.onclick = async () => {
    enterLoadingState();

    // reset outputPreview edit-specific things
    outputPreview.removeEventListener("mousedown", mouseDownHandler);
    outputPreview.removeEventListener("mousemove", mouseMoveHandler);
    outputPreview.removeEventListener("mouseup", mouseUpHandler);
    window.removeEventListener("mouseup", mouseUpHandler);
    outputPreview.removeEventListener("keydown", keyDownHandler);

    try {
        const imageBuffer = await file.arrayBuffer();
        const imageJimp = await Jimp.read(imageBuffer);
        // fix padding
        const fixedBoxPositions = boxPositions.map(box => {
            const [ax1, ay1, ax2, ay2] = box;
            const aw = ax2 - ax1;
            const ah = ay2 - ay1;
            const w = aw / (1 + 2 * padding / 100);
            const h = ah / (1 + 2 * padding / 100);
            const x1 = ax1 + w * padding / 100;
            const y1 = ay1 + h * padding / 100;
            const x2 = ax2 - w * padding / 100;
            const y2 = ay2 - h * padding / 100;
            return [x1, y1, x2, y2];
        });
        blurredPhoto = await blurFaces(imageJimp, fixedBoxPositions, blurAmount/100, padding/100);
        const buffer = await blurredPhoto.getBufferAsync(Jimp.MIME_JPEG);
        const dataURL = "data:image/jpeg;base64," + buffer.toString("base64");
        blurredPhotoDataUrl = dataURL;
    
        // if blurring did not error, it's safe to save box positions
        confirmedBoxPositions = fixedBoxPositions;

        updateOutput();
        hideEl(editingButtonRow);
        showEl(mainButtonRow);
    } catch (e) {
        errorMessage.innerHTML = e;
        saveEditsButton.classList.add("hidden");
        console.log(e);
    }

    // exit loading state
    triggerBlur.disabled = false;
    outputLoading.classList.add("hidden");
}

// converts positions into DOM element boxes
function drawBoxes(boxPositions) {
    for (let box of boxPositions) {
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
        newBox.style.width = aw + "px";
        newBox.style.height = ah + "px";
        newBox.style.left = ax1 + "px";
        newBox.style.top = ay1 + "px";
        outputPreview.appendChild(newBox);
        newBox = null;
    }
}

// converts DOM element boxes into positions
function saveBoxPositions() {
    boxPositions = [];
    const boxes = document.getElementsByClassName("box");
    for (let box of boxes) {
        const width = convertPxStringToInt(box.style.width);
        const height = convertPxStringToInt(box.style.height);
        const left = convertPxStringToInt(box.style.left);
        const right = convertPxStringToInt(box.style.left) + width;
        const top = convertPxStringToInt(box.style.top);
        const bottom= convertPxStringToInt(box.style.top) + height;
        boxPositions.push([left / outputPreviewImg.width, top / outputPreviewImg.height, right / outputPreviewImg.width, bottom / outputPreviewImg.height]);
    }
}

function mouseDownHandler (event) {
    // prepare to move existing box
    if (event.target.className == "box") {
        draggedBox = event.target
        const clickPos = getPosWithinElement(event.currentTarget, event);
        startX = clickPos[0]; 
        startY = clickPos[1];
        initialLeftOffset = parseInt(draggedBox.style.left.substring(0, draggedBox.style.left.length - 2));
        initialTopOffset = parseInt(draggedBox.style.top.substring(0, draggedBox.style.left.length - 2));
        return;
    }
    // start drawing a new box
    const clickPos = getPosWithinElement(event.currentTarget, event);
    startX = clickPos[0];
    startY = clickPos[1];

    newBox = document.createElement("div");
    newBox.classList.add("box");
    newBox.setAttribute("tabindex", 0); // make focusable
    newBox.style.width = "0px";
    newBox.style.height = "0px";
    newBox.style.left = startX + "px";
    newBox.style.top = startY + "px";
    event.currentTarget.appendChild(newBox);
}

function mouseMoveHandler(event) {
    if (!newBox && !draggedBox) return;

    const mousePos = getPosWithinElement(event.currentTarget, event);
    endX = mousePos[0];
    endY = mousePos[1];

    if (draggedBox) {
        // the min & max functions make sure boxes stay within bounds of image
        draggedBox.style.left = Math.min(Math.max(0, (initialLeftOffset + endX - startX)), outputPreviewImg.width - convertPxStringToInt(draggedBox.style.width)) + "px";
        draggedBox.style.top = Math.min(Math.max(0, (initialTopOffset + endY - startY)), outputPreviewImg.height - convertPxStringToInt(draggedBox.style.height)) + "px";
        return;
    }

    newBox.style.width = Math.abs(endX - startX) + "px";
    newBox.style.height = Math.abs(endY - startY) + "px";
    newBox.style.left = (endX - startX < 0) ? endX + "px" : startX + "px";
    newBox.style.top = (endY - startY < 0) ? endY + "px" : startY + "px";
}

function mouseUpHandler(event) {
    if (!newBox && !draggedBox) return;
    if (newBox) newBox.focus();
    newBox = null;
    draggedBox = null;
    startX = 0;
    startY = 0;
    endX = 0;
    endY = 0;
    saveBoxPositions();
}

function keyDownHandler(event) {
    if (event.key === "Delete" || event.key === "Backspace") {
        if (document.activeElement.className === "box"){
            document.activeElement.remove();
        }
    }
    saveBoxPositions();
}

window.onresize = () => {
    boxes = document.getElementsByClassName("box");
    if (boxes.length === 0) return;

    // remove all drawn boxes
    for (let i = boxes.length; i > 0; i--) {
        boxes[i-1].remove();
    }

    // redraw according to relative positions
    drawBoxes(boxPositions);
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

// HELPER FUNCTIONS
// HELPER FUNCTIONS
// HELPER FUNCTIONS

function convertPxStringToInt (str) {
    return parseInt(str.substring(0, str.length - 2));
}

function hideEl(...els) {
    for (let el of els) {
        el.classList.add("hidden");
    }
}

function showEl(...els) {
    for (let el of els) {
        el.classList.remove("hidden");
    }
}

// returns the [x, y] of an event (in px) relative to given element
function getPosWithinElement(element, event) {
    const rect = element.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
}