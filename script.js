/**
 * Prof-alytics - Video Upload Version
 * This script loads a video file, runs face and expression detection,
 * and counts the number of smiles.
 */

// Get references to our HTML elements
const videoUpload = document.getElementById('video-upload');
const videoPlayer = document.getElementById('video-player');
const smileCountElement = document.getElementById('smile-count');

let smileCount = 0;
// This "state" variable is crucial. It prevents us from counting
// one long smile as hundreds of individual smiles.
let isSmiling = false; 

// --- 1. Load the AI Models ---
// We need to load the pre-trained models before we can do any detection.
// --- EDIT: Changed '/models' to '/weights' to match the downloaded folder ---
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/weights'),
    faceapi.nets.faceExpressionNet.loadFromUri('/weights')
]).then(() => {
    console.log("AI Models Loaded Successfully!");
    // You could enable a button here to show the user it's ready.
});

// --- 2. Handle Video Upload ---
// This function runs when the user selects a video file.
videoUpload.addEventListener('change', (event) => {
    // Reset the counter for the new video
    smileCount = 0;
    smileCountElement.textContent = smileCount;

    // Get the video file and create a temporary URL for it
    const file = event.target.files[0];
    if (file) {
        const videoUrl = URL.createObjectURL(file);
        // Set the video player's source to the uploaded file
        videoPlayer.src = videoUrl;
    }
});


videoPlayer.addEventListener('play', () => {
    const detectionInterval = setInterval(async () => {
        if (videoPlayer.paused || videoPlayer.ended) {
            clearInterval(detectionInterval);
            return;
        }

        const detections = await faceapi.detectAllFaces(videoPlayer, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
        
        // --- This is the new smile-counting logic ---
        if (detections.length > 0) {
            const happiness = detections[0].expressions.happy;

            if (happiness > 0.85 && !isSmiling) {
                smileCount++;
                smileCountElement.textContent = smileCount;
                isSmiling = true;
            }

            if (happiness < 0.5 && isSmiling) {
                isSmiling = false;
            }
        }
    }, 200); 
});