import React, { useState, useEffect, useRef } from "react";
import AudioRecorder from "./context/Record.js";
import SaveAudio from "./context/Saveaudio.js";
import Library from "./Library.jsx";
import { FaMoon, FaSun } from "react-icons/fa"; // Import dark/light mode icons

const MicrophoneDashboard = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [filename, setFilename] = useState("");
  const [showFilenameInput, setShowFilenameInput] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // State for dark/light mode
  const audioRecorderRef = useRef(new AudioRecorder());
  const saveAudioRef = useRef(new SaveAudio());

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Handle start/stop recording
  const handleRecording = async () => {
    if (!isRecording) {
      await audioRecorderRef.current.startRecording();
      setIsRecording(true);
    } else {
      const url = await audioRecorderRef.current.stopRecording();
      setAudioUrl(url);
      setAudioBlob(audioRecorderRef.current.audioBlob);
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  // Handle pause/resume recording
  const handlePauseResume = () => {
    if (isPaused) {
      audioRecorderRef.current.resumeRecording();
      setIsPaused(false);
    } else {
      audioRecorderRef.current.pauseRecording();
      setIsPaused(true);
    }
  };

  // Handle saving audio to IndexedDB
  const handleSaveAudio = async () => {
    if (!filename.trim()) {
      alert("Please enter a filename.");
      return;
    }

    if (audioBlob) {
      try {
        await saveAudioRef.current.saveAudio(audioBlob, filename);
        alert("Audio saved successfully!");

        // Reset states to go back to the "Start Recording" state
        setAudioUrl(null);
        setAudioBlob(null);
        setFilename("");
        setShowFilenameInput(false);
        setTime(0); // Reset the timer
      } catch (error) {
        console.error("Error saving audio:", error);
        alert("Failed to save audio.");
      }
    } else {
      alert("No audio to save.");
    }
  };

  // Timer logic
  useEffect(() => {
    let interval;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Format time into MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center h-screen w-full ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } relative overflow-hidden transition-colors duration-300`}
    >
      {/* Dark/Light Mode Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300 ease-in-out transform hover:scale-105 z-20"
      >
        {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
      </button>

      {/* Library Button in Top-Left Corner */}
      <button
        onClick={() => setShowLibrary(true)} // Show Library popup
        className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 z-20"
      >
        Library
      </button>

      {/* Library Popup */}
      {showLibrary && <Library onClose={() => setShowLibrary(false)} />}

      {/* Microphone Image with Animation */}
      <div className="mb-8 md:mb-16 relative">
        {isRecording && !isPaused && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-ping absolute w-24 h-24 md:w-32 md:h-32 bg-pink-500 rounded-full opacity-75"></div>
          </div>
        )}
        <img
          src="https://cdn-icons-png.flaticon.com/512/11372/11372592.png"
          alt="Microphone"
          className="w-16 h-16 md:w-24 md:h-24 relative z-10"
        />
      </div>

      {/* Timer Display */}
      <div className="mb-8 md:mb-12 text-3xl md:text-4xl font-bold">{formatTime(time)}</div>

      {/* Conditional Rendering for Buttons */}
      {isRecording ? (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Pause/Resume Button */}
          <button
            onClick={handlePauseResume}
            className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-teal-500 hover:to-blue-600 text-white font-semibold py-2 px-4 md:py-3 md:px-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 z-20"
          >
            {isPaused ? "Resume Recording" : "Pause Recording"}
          </button>

          {/* Stop Recording Button */}
          <button
            onClick={handleRecording}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-orange-500 hover:to-red-600 text-white font-semibold py-2 px-4 md:py-3 md:px-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 z-20"
          >
            Stop Recording
          </button>
        </div>
      ) : (
        // Start Recording Button
        <button
          onClick={handleRecording}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-600 text-white font-semibold py-2 px-4 md:py-3 md:px-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 z-20"
        >
          Start Recording
        </button>
      )}

      {/* Audio Playback and Save Button (only visible after recording) */}
      {audioUrl && !isRecording && (
        <div className="mt-8 w-full max-w-lg flex flex-col items-center">
          {/* Audio Player - Centered */}
          <div className="flex justify-center w-full">
            <audio
              controls
              src={audioUrl}
              className="w-full md:w-3/4 max-w-md h-10 bg-gray-800 rounded-lg shadow-md"
            />
          </div>

          <p className="mt-2 text-sm text-gray-400 text-center">
            Preview your recording:
          </p>

          {/* Save Button and Filename Input */}
          <div className="flex flex-col items-center mt-4 w-full max-w-xs">
            {showFilenameInput ? (
              <>
                <input
                  type="text"
                  placeholder="Enter filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full p-2 mb-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSaveAudio}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 w-full md:w-2/4"
                >
                  Save Recording
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowFilenameInput(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 w-full md:w-2/4"
              >
                Save Recording
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MicrophoneDashboard;