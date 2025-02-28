import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaStop, FaPause, FaPlay, FaSave, FaDownload } from "react-icons/fa";
import {
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  saveAudioToIndexedDB,
  convertWavToMp3,
  convertRecordedAudioToMp3, 
} from "./Record.js";

const Recorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileNameInput, setFileNameInput] = useState("");
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

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
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, width, height);

        // Draw the waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#00FF00";
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
      setAudioBlob(blob);
      setIsRecording(false);
      setIsPaused(false);
      setTime(0);
    } else {
      setTime(0);
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
    if (fileNameInput) {
      await saveAudioToIndexedDB(audioBlob, fileNameInput);
      setAudioBlob(null);
      setFileNameInput("");
      setIsModalOpen(false);
  
      // Notify parent (Dashboard) to update the stored voices table
      if (onRecordingComplete) {
        onRecordingComplete();
      }
  
      alert("Recording saved successfully!");
    } else {
      alert("Filename is required to save the recording.");
    }
  };
  


//handle download click
const handleDownloadClick = async () => {
  if (!audioBlob) {
    alert("No recording available to download.");
    return;
  }

  try {
    // If MP3 conversion is needed, convert before download
    const mp3Blob = await convertRecordedAudioToMp3(audioBlob);
    
    const url = URL.createObjectURL(mp3Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileNameInput ? `${fileNameInput}.mp3` : "recording.mp3";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading audio:", error);
    alert("Failed to download the recording.");
  }
};

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg flex flex-col items-center justify-center bg-white bg-opacity-20 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-2xl transform transition hover:scale-105">
      {/* Mic Icon with Recording Indicator */}
      <div className="relative">
        <FaMicrophone className="text-black text-6xl sm:text-7xl mb-4 sm:mb-6 transform transition hover:scale-110" />
        {isRecording && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full animate-ping" />
        )}
      </div>

      {/* Timer */}
      <p className="text-xl sm:text-2xl font-semibold text-black animate-pulse">{formatTime(time)}</p>

      {/* Waveform Visualization */}
      <canvas
        ref={canvasRef}
        width="640"
        height="100"
        className="w-full max-w-xs sm:max-w-sm md:max-w-md h-16 sm:h-20 rounded-lg my-4 sm:my-6 bg-white bg-opacity-20"
      />

      {/* Buttons Container */}
      <div className="flex flex-wrap justify-center gap-4">
        {/* Record/Stop Button */}
        <button
          className={`p-3 ${
            isRecording ? "bg-rose-500" : "bg-indigo-500"
          } text-white rounded-full hover:bg-rose-600 transition shadow-lg flex items-center justify-center hover:scale-110`}
          onClick={handleRecordClick}
        >
          {isRecording ? <FaStop size={20} /> : <FaMicrophone size={20} />}
        </button>

        {/* Pause/Resume Button */}
        {isRecording && (
          <button
            className={`p-3 ${
              isPaused ? "bg-emerald-500" : "bg-amber-500"
            } text-white rounded-full transition shadow-lg flex items-center justify-center hover:scale-110`}
            onClick={handlePauseClick}
          >
            {isPaused ? <FaPlay size={18} /> : <FaPause size={18} />}
          </button>
        )}

        {/* Preview Button */}
        {audioBlob && !isRecording && (
          <button
            className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition shadow-lg flex items-center justify-center hover:scale-110"
            onClick={handlePreviewClick}
          >
            {isPlayingPreview ? <FaPause size={18} /> : <FaPlay size={18} />}
          </button>
        )}

        {/* Save Button */}
        {audioBlob && !isRecording && (
          <button
            className="p-3 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition shadow-lg flex items-center justify-center hover:scale-110"
            onClick={() => setIsModalOpen(true)}
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
            controls
            className="w-full"
          />
        </div>
      )}

      {/* Save Recording Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-black">Save Recording</h2>
            <input
              type="text"
              placeholder="Enter a name for your recording"
              value={fileNameInput}
              onChange={(e) => setFileNameInput(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-500 text-white px-2 py-0.5 rounded text-[10px] hover:bg-slate-600 transition h-6 min-w-[50px] flex items-center justify-center leading-none"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClick}
                className="bg-teal-500 text-white px-2 py-0.5 rounded text-[10px] hover:bg-teal-600 transition h-6 min-w-[50px] flex items-center justify-center leading-none"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recorder;