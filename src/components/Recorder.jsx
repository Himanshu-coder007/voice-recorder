import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaStop, FaPause, FaPlay, FaSave } from "react-icons/fa";
import { startRecording, stopRecording, pauseRecording, resumeRecording, saveAudioToIndexedDB } from "./Record.js";

const Recorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // Track if recording is paused
  const [time, setTime] = useState(0); // Store time in seconds
  const [audioBlob, setAudioBlob] = useState(null); // Store the recorded audio blob
  const [isPlayingPreview, setIsPlayingPreview] = useState(false); // Track if preview is playing
  const audioRef = useRef(null); // Reference to the audio element for preview
  const canvasRef = useRef(null); // Reference to the canvas for waveform visualization

  // Effect to update the timer
  useEffect(() => {
    let timer;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRecording, isPaused]);

  // Effect for waveform visualization
  useEffect(() => {
    let animationFrameId;

    const drawWaveform = (analyser, dataArray) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;

      const draw = () => {
        animationFrameId = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        // Clear the canvas with a semi-transparent background
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)"; // Dark background for contrast
        ctx.fillRect(0, 0, width, height);

        // Draw the waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#00FF00"; // Bright green color for visibility
        ctx.beginPath();

        const sliceWidth = (width * 1.0) / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      };

      draw();
    };

    if (isRecording) {
      startRecording(drawWaveform);
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRecording]);

  // Format time to MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Handle record button click
  const handleRecordClick = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      setAudioBlob(blob); // Store the recorded audio blob
      setIsRecording(false);
      setIsPaused(false); // Reset pause state
      setTime(0); // Reset timer
    } else {
      setTime(0); // Reset timer when starting a new recording
      setIsRecording(true);
    }
  };

  // Handle pause/resume button click
  const handlePauseClick = () => {
    if (isRecording && !isPaused) {
      pauseRecording();
      setIsPaused(true);
    } else if (isRecording && isPaused) {
      resumeRecording();
      setIsPaused(false);
    }
  };

  // Handle preview play/pause
  const handlePreviewClick = () => {
    if (audioRef.current) {
      if (isPlayingPreview) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingPreview(!isPlayingPreview);
    }
  };

  // Handle save button click
  const handleSaveClick = async () => {
    if (audioBlob) {
      await saveAudioToIndexedDB(audioBlob);
      setAudioBlob(null); // Clear the audio blob after saving
      alert("Recording saved successfully!");
    }
  };

  return (
    <div className="w-full max-w-lg flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 p-8 rounded-2xl shadow-2xl transform transition hover:scale-105">
      {/* Mic Icon with Recording Indicator */}
      <div className="relative">
        <FaMicrophone className="text-white text-7xl mb-6 transform transition hover:scale-110" />
        {isRecording && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
      </div>

      {/* Timer */}
      <p className="text-2xl font-semibold text-white animate-pulse">{formatTime(time)}</p>

      {/* Waveform Visualization */}
      <canvas
        ref={canvasRef}
        width="640"
        height="100"
        className="w-80 h-20 rounded-lg my-6 bg-black bg-opacity-20"
      />

      {/* Buttons Container */}
      <div className="flex space-x-4">
        {/* Record/Stop Button */}
        <button
          className={`p-3 ${
            isRecording ? "bg-red-500" : "bg-white"
          } text-white rounded-full hover:bg-red-600 transition shadow-lg flex items-center justify-center hover:scale-110`}
          onClick={handleRecordClick}
        >
          {isRecording ? <FaStop size={20} /> : <FaMicrophone size={20} />}
        </button>

        {/* Pause/Resume Button */}
        {isRecording && (
          <button
            className={`p-3 ${
              isPaused ? "bg-green-500" : "bg-yellow-500"
            } text-white rounded-full hover:${
              isPaused ? "bg-green-600" : "bg-yellow-600"
            } transition shadow-lg flex items-center justify-center hover:scale-110`}
            onClick={handlePauseClick}
          >
            {isPaused ? <FaPlay size={18} /> : <FaPause size={18} />}
          </button>
        )}

        {/* Preview Button */}
        {audioBlob && !isRecording && (
          <button
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition shadow-lg flex items-center justify-center hover:scale-110"
            onClick={handlePreviewClick}
          >
            {isPlayingPreview ? <FaPause size={18} /> : <FaPlay size={18} />}
          </button>
        )}

        {/* Save Button */}
        {audioBlob && !isRecording && (
          <button
            className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition shadow-lg flex items-center justify-center hover:scale-110"
            onClick={handleSaveClick}
          >
            <FaSave size={18} />
          </button>
        )}
      </div>

      {/* Audio Preview Box */}
      {audioBlob && !isRecording && (
        <div className="mt-6 w-full flex flex-col items-center animate-fade-in">
          <audio
            ref={audioRef}
            src={URL.createObjectURL(audioBlob)}
            controls // Show default audio controls
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

export default Recorder;