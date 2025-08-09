// Get DOM Elements
const videoUpload = document.getElementById('video-upload');
const videoPlayer = document.getElementById('video-player');
const overlayCanvas = document.getElementById('overlay-canvas');
const smileCountSpan = document.getElementById('smile-count');
const loadingMessage = document.getElementById('loading-message');

// State Variables
let smileCount = 0;
let isSmiling = false; // Tracks the state to count a smile only once
const SMILE_THRESHOLD = 0.90; // Confidence threshold for a "happy" expression

/**
 * 1. Load AI Models from the /weights folder
 */
async function loadModels() {
    const MODEL_URL = './weights';
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("AI Models Loaded Successfully! ✅");
        loadingMessage.textContent = "Models loaded! Please upload a video.";
        videoUpload.disabled = false; // Enable upload button
    } catch (error) {
        console.error("Error loading models:", error);
        loadingMessage.textContent = "Error loading AI models. Please refresh the page.";
    }
}

// Load models as soon as the script runs
loadModels();

/**
 * 2. Handle the video file upload
 */
videoUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const videoUrl = URL.createObjectURL(file);
        videoPlayer.src = videoUrl;
        videoPlayer.load(); // Important to make controls visible
        resetSmileCounter();
    }
});

/**
 * Resets the counter and state for a new video
 */
function resetSmileCounter() {
    smileCount = 0;
    isSmiling = false;
    smileCountSpan.textContent = '0';
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

/**
 * 3. Start detection when the user plays the video
 */
videoPlayer.addEventListener('play', () => {
    // Match canvas dimensions to the video's display size
    const displaySize = { width: videoPlayer.clientWidth, height: videoPlayer.clientHeight };
    faceapi.matchDimensions(overlayCanvas, displaySize);

    const detectionInterval = setInterval(async () => {
        // Stop detection if video is paused or has ended
        if (videoPlayer.paused || videoPlayer.ended) {
            isSmiling = false; // Reset smiling state when paused
            return;
        }

        /**
         * 4. Core Detection Loop
         */
        const detections = await faceapi.detectAllFaces(
            videoPlayer,
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        let isAnyFaceSmiling = false;

        /**
         * 5. Visualization: Draw boxes and labels
         */
        resizedDetections.forEach(detection => {
            const box = detection.detection.box;
            const happyScore = detection.expressions.happy;
            const isCurrentlyHappy = happyScore > SMILE_THRESHOLD;

            if (isCurrentlyHappy) {
                isAnyFaceSmiling = true;
            }

            // Draw box: Green for "happy", red otherwise
            const boxColor = isCurrentlyHappy ? '#4caf50' : '#f44336';
            const label = `Happy: ${Math.round(happyScore * 100)}%`;
            const drawBox = new faceapi.draw.DrawBox(box, { label, boxColor });
            drawBox.draw(overlayCanvas);
        });

        /**
         * 6. Smile Counting Logic
         */
        // A new smile is counted ONLY on the transition from not-smiling to smiling.
        if (isAnyFaceSmiling && !isSmiling) {
            isSmiling = true; // Set state to smiling
            smileCount++;
            smileCountSpan.textContent = smileCount;
        }
        // Reset the state when no faces are smiling confidently
        else if (!isAnyFaceSmiling && isSmiling) {
            isSmiling = false;
        }

    }, 200); // Run detection every 200 milliseconds
});

// Reset smile state when video ends to be ready for replay
videoPlayer.addEventListener('ended', () => {
    isSmiling = false;
});