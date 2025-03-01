// Record.js
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioBlob = null;
    this.audioUrl = null;
    this.isRecording = false;
    this.isPaused = false;
  }

  // Check for browser support and request microphone access
  async startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Web Audio API not supported in this browser.");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.isPaused = false;
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }

  // Pause recording
  pauseRecording() {
    if (this.mediaRecorder && this.isRecording && !this.isPaused) {
      this.mediaRecorder.pause();
      this.isPaused = true;
    }
  }

  // Resume recording
  resumeRecording() {
    if (this.mediaRecorder && this.isRecording && this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
    }
  }

  // Stop recording and return a promise that resolves with the audio URL
  stopRecording() {
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
          this.audioUrl = URL.createObjectURL(this.audioBlob);
          this.isRecording = false;
          this.isPaused = false;
          resolve(this.audioUrl); // Resolve the promise with the audio URL
        };

        this.mediaRecorder.stop();

        // Stop all tracks in the stream
        this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      } else {
        resolve(null); // Resolve with null if recording wasn't in progress
      }
    });
  }

  // Get the recorded audio URL for playback
  getAudioUrl() {
    return this.audioUrl;
  }

  // Clear the recorded audio
  clearRecording() {
    this.audioChunks = [];
    this.audioBlob = null;
    this.audioUrl = null;
  }
}

export default AudioRecorder;
