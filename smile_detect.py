# Import the necessary libraries
import cv2
import time

# --- Step 1: Load the Classifiers ---

# Load the pre-trained model for finding faces
face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
# Load the pre-trained model for finding smiles
smile_cascade = cv2.CascadeClassifier('haarcascade_smile.xml')

# This line finds the default webcam (usually camera 0).
cap = cv2.VideoCapture(0)

# Check if the webcam was opened successfully.
if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit()

# --- Step 2: Initialize Counter and Cooldown Variables ---
smile_count = 0
# The cooldown period in seconds. We won't count a new smile until this much time has passed.
SMILE_COOLDOWN = 3 
# Timestamp of when the last smile was detected. Initialize to 0.
last_smile_time = 0


# --- Step 3: Create a Loop to Detect and Count Smiles ---

while True:
    # Read one frame from the webcam.
    ret, frame = cap.read()

    if not ret:
        print("Error: Can't receive frame. Exiting ...")
        break

    # Convert the frame to grayscale for the classifiers.
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces in the grayscale frame.
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    # --- UPDATED Smile Counting Logic ---
    # We assume no smile is detected in this frame until proven otherwise.
    smile_detected_in_frame = False

    # For each detected face...
    for (x, y, w, h) in faces:
        # Draw a blue rectangle around the face
        cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
        
        # Create a "Region of Interest" (ROI) for the lower part of the face.
        roi_gray = gray[y:y+h, x:x+w]
        
        # Detect smiles within the face ROI.
        smiles = smile_cascade.detectMultiScale(roi_gray, 1.8, 20)
        
        # If any smiles are found in this face, set our flag to True
        if len(smiles) > 0:
            smile_detected_in_frame = True
            cv2.putText(frame, 'Smiling!', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    # Get the current time
    current_time = time.time()

    # If a smile was detected in this frame AND the cooldown has passed...
    if smile_detected_in_frame and (current_time - last_smile_time) > SMILE_COOLDOWN:
        smile_count += 1
        # Record the time of this new smile
        last_smile_time = current_time


    # Display the smile count on the top-left corner of the frame.
    cv2.putText(frame, f'Smile Count: {smile_count}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    # Display the resulting frame in a window named "Live Feed".
    cv2.imshow('Live Feed', frame)

    # Wait for the user to press the 'q' key to quit.
    if cv2.waitKey(1) == ord('q'):
        break

# --- Step 4: Clean Up ---

# When the loop is finished, release the webcam.
cap.release()
# Close all the OpenCV windows.
cv2.destroyAllWindows()

