// Record.js

let mediaRecorder;
let audioChunks = [];
let audioContext;
let analyser;
let dataArray;
let source;

// Function to initialize the audio context and analyser
const initializeAudioContext = (stream) => {
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256; // Adjust for smoother or more detailed waveforms
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
};

// Function to start recording
export const startRecording = async (onAudioData) => {
  try {
    // Request access to the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    // Initialize audio context and analyser for visualization
    initializeAudioContext(stream);

    // Collect audio data chunks
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    // Start recording
    mediaRecorder.start();
    console.log("Recording started...");

    // Pass the analyser and dataArray to the callback for visualization
    if (onAudioData) {
      onAudioData(analyser, dataArray);
    }
  } catch (error) {
    console.error("Error accessing microphone:", error);
    throw error; // Re-throw the error for handling in the calling function
  }
};

// Function to pause recording
export const pauseRecording = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.pause();
    console.log("Recording paused...");
  }
};

// Function to resume recording
export const resumeRecording = () => {
  if (mediaRecorder && mediaRecorder.state === "paused") {
    mediaRecorder.resume();
    console.log("Recording resumed...");
  }
};

// Function to stop recording
export const stopRecording = () => {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error("No active recording to stop."));
      return;
    }

    mediaRecorder.onstop = () => {
      // Combine audio chunks into a single Blob
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      audioChunks = []; // Clear chunks for the next recording
      console.log("Recording stopped.");

      // Disconnect the audio source
      if (source) {
        source.disconnect();
      }

      // Resolve with the audio blob
      resolve(audioBlob);
    };

    mediaRecorder.stop();
  });
};

// Function to save audio Blob to IndexedDB (optional, can be called manually)
export const saveAudioToIndexedDB = (audioBlob) => {
  return new Promise((resolve, reject) => {
    const dbName = "VoiceRecorderDB";
    const storeName = "Recordings";

    // Open or create IndexedDB database
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      // Add the audio Blob to the store
      const addRequest = store.add({ audio: audioBlob, timestamp: new Date() });

      addRequest.onsuccess = () => {
        console.log("Audio saved to IndexedDB.");
        resolve();
      };

      addRequest.onerror = (error) => {
        console.error("Error saving audio to IndexedDB:", error);
        reject(error);
      };
    };

    request.onerror = (error) => {
      console.error("Error opening IndexedDB:", error);
      reject(error);
    };
  });
};
