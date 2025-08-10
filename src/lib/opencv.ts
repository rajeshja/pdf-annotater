// This declaration is needed to use the `cv` object from the global scope.
declare const cv: any;

// A type guard to check if OpenCV is loaded and ready.
function isOpenCvReady(): boolean {
  return typeof cv !== 'undefined' && cv.Mat;
}

// A simple promise-based utility to wait for OpenCV to be ready.
const onOpenCvReady = new Promise<void>((resolve) => {
    // If it's already ready, resolve immediately.
    if (isOpenCvReady()) {
      return resolve();
    }
    // Otherwise, wait for the `onRuntimeInitialized` callback from OpenCV.js
    if (typeof (globalThis as any).Module === 'undefined') {
        (globalThis as any).Module = {};
    }
    (globalThis as any).Module.onRuntimeInitialized = resolve;
});

// A helper function to load an image from a data URI into an OpenCV Mat object.
function imageToMat(dataUri: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Could not get canvas context"));
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const mat = cv.imread(canvas);
      resolve(mat);
    };
    img.onerror = (err) => reject(err);
    img.src = dataUri;
  });
}

function mergeOverlappingRects(rects: any[], padding = 10) {
    if (rects.length === 0) return [];
    
    let merged = true;
    while (merged) {
        merged = false;
        for (let i = 0; i < rects.length; i++) {
            for (let j = i + 1; j < rects.length; j++) {
                const rect1 = rects[i];
                const rect2 = rects[j];

                const r1 = { x1: rect1.x - padding, y1: rect1.y - padding, x2: rect1.x + rect1.width + padding, y2: rect1.y + rect1.height + padding };
                const r2 = { x1: rect2.x, y1: rect2.y, x2: rect2.x + rect2.width, y2: rect2.y + rect2.height };

                // Check for intersection
                if (!(r1.x2 < r2.x1 || r1.x1 > r2.x2 || r1.y2 < r2.y1 || r1.y1 > r2.y2)) {
                    const mergedRect = {
                        x: Math.min(rect1.x, rect2.x),
                        y: Math.min(rect1.y, rect2.y),
                        width: Math.max(rect1.x + rect1.width, rect2.x + rect2.width) - Math.min(rect1.x, rect2.x),
                        height: Math.max(rect1.y + rect1.height, rect2.y + rect2.height) - Math.min(rect1.y, rect2.y),
                    };
                    rects.splice(j, 1);
                    rects[i] = mergedRect;
                    merged = true;
                    break;
                }
            }
            if (merged) break;
        }
    }
    return rects;
}


/**
 * Detects panels in a comic page image using OpenCV.js.
 * This function runs entirely in the browser.
 * 
 * @param pageDataUri The data URI of the page image to process.
 * @returns A promise that resolves to an array of detected panel bounding boxes.
 */
export async function detectPanelsWithOpencv(pageDataUri: string) {
  // First, ensure the OpenCV library is loaded.
  await onOpenCvReady;
  
  const src = await imageToMat(pageDataUri);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

  // Apply a series of image processing operations to isolate the panels.
  const thresh = new cv.Mat();
  cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 11, 5);

  // Use a larger kernel to merge text blocks and title letters
  const kernel = cv.Mat.ones(15, 15, cv.CV_8U);
  const dilated = new cv.Mat();
  cv.dilate(thresh, dilated, kernel, new cv.Point(-1, -1), 1);

  // Find the contours of the potential panels.
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let panels = [];
  const minArea = 500; // Adjusted min area

  // Iterate over the contours and filter them to find the panels.
  for (let i = 0; i < contours.size(); ++i) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    if (area > minArea) {
      const rect = cv.boundingRect(contour);
      // Filter out contours that are too wide or too tall relative to the page size.
      if (rect.width / src.cols < 0.98 && rect.height / src.rows < 0.98) {
        panels.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }
    }
    contour.delete();
  }

  // Clean up the memory used by the OpenCV Mats.
  src.delete();
  gray.delete();
  thresh.delete();
  dilated.delete();
  contours.delete();
  hierarchy.delete();
  
  // Merge overlapping rectangles to consolidate fragmented text blocks
  panels = mergeOverlappingRects(panels, 15);

  return panels;
}
