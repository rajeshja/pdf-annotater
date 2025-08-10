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

  const kernel = cv.Mat.ones(5, 5, cv.CV_8U);
  const dilated = new cv.Mat();
  cv.dilate(thresh, dilated, kernel, new cv.Point(-1, -1), 1);

  // Find the contours of the potential panels.
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const panels = [];
  const minArea = 1000; // Heuristic: minimum area to be considered a panel.

  // Iterate over the contours and filter them to find the panels.
  for (let i = 0; i < contours.size(); ++i) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    if (area > minArea) {
      const rect = cv.boundingRect(contour);
      // Filter out contours that are too wide or too tall relative to the page size.
      if (rect.width / src.cols < 0.95 && rect.height / src.rows < 0.95) {
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

  return panels;
}
