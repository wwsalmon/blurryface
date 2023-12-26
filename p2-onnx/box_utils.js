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