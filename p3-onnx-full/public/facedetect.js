// check for dependencies
if (!ort) throw new Error("No ONNX runtime found. Make sure to import ort.js before running this script.");
if (!Jimp) throw new Error("No JIMP found. Make sure to import jimp.js before running ths script.");

ort.env.wasm.wasmPaths = {
    "ort-wasm.wasm": "/ort-wasm.wasm",
    "ort-wasm-threaded.wasm": "/ort-wasm.wasm",
    "ort-wasm-simd.wasm": "/ort-wasm-simd.wasm",
    "ort-wasm-simd-threaded.wasm": "/ort-wasm-simd-threaded.wasm",
};

// takes in JIMP image object, returns a JIMP image object
async function detectAndBlurFaces(image, blur = 0.1, padding = 0.1, threshold = 0.5) {
    console.log("1. Pre-processing image...");
    const originalImage = image.clone(); // save for blurring later
    image.resize(640, 480);
    const imageData = image.bitmap.data; // rgba array
    const imageTensor = imageToTensor(imageData);

    console.log("2. Initializing session...");
    const session = await ort.InferenceSession.create("/ultraface-fixed.onnx");

    console.log("3. Running inference...");
    const output = await session.run({input: imageTensor});

    console.log("4. Processing output...");
    const allScores = output.scores.data;
    const allBoxes = output.boxes.data;
    let results = [];
    for (let i = 0; i < allScores.length / 2; i ++) {
        const scoreIndex = 2 * i + 1;
        const thisScore = allScores[scoreIndex];
        if (thisScore > threshold) {
            const thisBox = [allBoxes[4 * i], allBoxes[4 * i + 1], allBoxes[4 * i + 2], allBoxes[4 * i + 3]];
            const thisResult = {score: thisScore, box: thisBox};
            results.push(thisResult);
        }
    }
    results = nms(results);

    console.log("5. Blurring image...");
    const originalWidth = originalImage.bitmap.width;
    const originalHeight = originalImage.bitmap.height;
    
    for (let result of results) {        
        // scale model output coordinates, get width and height
        const x1 = result.box[0] * originalWidth;
        const x2 = result.box[2] * originalWidth;
        const w = x2 - x1;
        const y1 = result.box[1] * originalHeight;
        const y2 = result.box[3] * originalHeight;
        const h = y2 - y1;

        // add in padding
        const ax1 = Math.max(0, x1 - padding * w);
        const aw = Math.min(originalWidth, w * (1 + 2 * padding));
        const ay1 = Math.max(0, y1 - padding * h);
        const ah = Math.min(originalHeight, h * (1 + 2 * padding));

        // blur
        const maxDim = Math.max(aw, ah);
        const blurRadius = maxDim * blur;

        const blurredSection = originalImage.clone()
        blurredSection.crop(ax1, ay1, aw, ah).blur(Math.floor(blurRadius));
        originalImage.composite(blurredSection, ax1, ay1);
    }

    console.log("6. Done!");

    return originalImage;
}

// utils
// adapted from https://onnxruntime.ai/docs/tutorials/web/classify-images-nextjs-github-template.html
// dims: number[] => Tensor
function imageToTensor(imageData) {
    const [redArray, greenArray, blueArray] = new Array(new Array(), new Array(), new Array());

    for (let i = 0; i < imageData.length; i += 4) {
        redArray.push(imageData[i]);
        greenArray.push(imageData[i + 1]);
        blueArray.push(imageData[i + 2]);
        // skip data[i + 3] to filter out the alpha channel
    }

    const transposedData = redArray.concat(greenArray).concat(blueArray);

    let i, l = transposedData.length;

    const float32Data = new Float32Array(3 * 640 * 480);
    for (i = 0; i < l; i++) {
        float32Data[i] = (transposedData[i] - 127) / 128.0; // normalize to between -1 and 1
    }

    const inputTensor = new ort.Tensor("float32", float32Data, [1, 3, 480, 640]);
    return inputTensor;
}

// adapted from https://github.com/onnx/models/blob/main/validated/vision/body_analysis/ultraface/dependencies/box_utils.py
// rect: array [x1, y1, x2, y2]
const areaOf = (rect) => ((rect[2] - rect[0]) * (rect[3] - rect[1]));

// rect1, rect2: [x1, y1, x2, y2] assuming x1 < x2, y1 < y2
function iouOf(rect1, rect2) {
    // if no intersection return 0
    if (rect1[0] > rect2[2] ||
        rect1[2] < rect2[0] ||
        rect1[1] > rect2[3] ||
        rect1[3] < rect2[1]) return 0;

    const x1 = Math.max(rect1[0], rect2[0]);
    const y1 = Math.max(rect1[1], rect2[1]);
    const x2 = Math.min(rect1[2], rect2[2]);
    const y2 = Math.min(rect1[3], rect2[3]);

    const intersectArea = (x2 - x1) * (y2 - y1);
    const unionArea = areaOf(rect1) + areaOf(rect2) - intersectArea + 0.000001; // add small const to prevent div by 0
    const iou = intersectArea / unionArea;
    return iou;
}

// based off of https://learnopencv.com/non-maximum-suppression-theory-and-implementation-in-pytorch/
// results: {score: number, box: [x1, y1, x2, y2]}[]
// iouThreshold: number
function nms(results, iouThreshold = 0.3) {
    let candidates = [...results];
    let keep = [];

    candidates.sort((a, b) => b.score - a.score);

    while (candidates.length) {
        const thisCandidate = candidates[0];
        keep.push(thisCandidate);
        candidates.shift();
        if (candidates.length) candidates = candidates.filter(candidate => iouOf(candidate.box, thisCandidate.box) < iouThreshold);
    }

    return keep;
}