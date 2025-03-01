import React, { useState } from "react";
import Recorder from "./Recorder";
import StoredVoices from "./StoredVoices";
import { fetchStoredVoices } from "./FetchVoices"; 
import { FaMicrophoneAlt } from "react-icons/fa"; // Import Microphone Icon

const Dashboard = () => {
  const [recordings, setRecordings] = useState([]);

  // Function to refresh stored voices
  const updateRecordings = () => {
    fetchStoredVoices("VoiceRecorderDB", "Recordings").then(setRecordings);
  };

  return (
    <div className="relative w-screen min-h-screen bg-gradient-to-b from-blue-600 to-blue-300 text-white flex flex-col justify-start items-center p-6 gap-6 overflow-hidden">
      {/* Title with Icon */}
      <p className="text-3xl font-extrabold tracking-wide text-white flex items-center gap-3">
        <FaMicrophoneAlt className="text-4xl text-white" />
        Voice Recorder App
      </p>

      {/* Recorder Component */}
      <div className="flex flex-col justify-center items-center bg-white/20 p-6 rounded-2xl shadow-xl backdrop-blur-lg">
        <Recorder onRecordingComplete={updateRecordings} />
      </div>

      {/* Stored Voices Section */}
      <div className="w-full max-w-4xl bg-white/20 p-6 rounded-2xl shadow-lg backdrop-blur-md mx-auto">
        <StoredVoices recordings={recordings} updateRecordings={updateRecordings} />
      </div>
    </div>
  );
};

export default Dashboard;
