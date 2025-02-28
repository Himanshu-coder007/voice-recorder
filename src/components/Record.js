import lamejs from "lamejs";

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
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
};

// Function to start recording
export const startRecording = async (onAudioData) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    initializeAudioContext(stream);

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.start();
    console.log("Recording started...");

    if (onAudioData) {
      onAudioData(analyser, dataArray);
    }
  } catch (error) {
    console.error("Error accessing microphone:", error);
    throw error;
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
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      audioChunks = [];
      console.log("Recording stopped.");

      if (source) {
        source.disconnect();
      }

      resolve(audioBlob);
    };

    mediaRecorder.stop();
  });
};

// Function to save audio Blob to IndexedDB
export const saveAudioToIndexedDB = (audioBlob, fileName) => {
  return new Promise((resolve, reject) => {
    const dbName = "VoiceRecorderDB";
    const storeName = "Recordings";

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

      const addRequest = store.add({
        audio: audioBlob,
        fileName: fileName,
        timestamp: new Date(),
      });

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

// Function to convert WebM to WAV
const convertToWav = async (blob) => {
  const audioContext = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return encodeAudioBufferToWav(audioBuffer);
};

// Function to encode AudioBuffer to WAV format
const encodeAudioBufferToWav = (audioBuffer) => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  const buffer = new ArrayBuffer(44 + length * numChannels * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + length * numChannels * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, length * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(
        -1,
        Math.min(1, audioBuffer.getChannelData(channel)[i])
      );
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  return new Blob([view], { type: "audio/wav" });
};

// Helper function to write strings to DataView
const writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Function to convert WAV to MP3
export const convertWavToMp3 = async (wavBlob) => {
  const wavArrayBuffer = await wavBlob.arrayBuffer();
  const wavArray = new Uint8Array(wavArrayBuffer);
  const wav = lamejs.WavHeader.readHeader(wavArray);

  if (!wav || !wav.dataLen) {
    throw new Error("Invalid WAV file format.");
  }

  const samples = new Int16Array(
    wavArrayBuffer,
    wav.dataOffset,
    wav.dataLen / 2
  );
  const mp3Encoder = new lamejs.Mp3Encoder(wav.channels, wav.sampleRate, 128);
  const mp3Data = [];

  const sampleBlockSize = 1152;
  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const mp3Buffer = mp3Encoder.encodeBuffer(sampleChunk);
    if (mp3Buffer.length > 0) mp3Data.push(mp3Buffer);
  }

  const finalMp3Buffer = mp3Encoder.flush();
  if (finalMp3Buffer.length > 0) mp3Data.push(finalMp3Buffer);

  return new Blob(mp3Data, { type: "audio/mp3" });
};

// Function to convert recorded audio to MP3
export const convertRecordedAudioToMp3 = async (blob) => {
  const wavBlob = await convertToWav(blob);
  return await convertWavToMp3(wavBlob);
};
