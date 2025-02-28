import React, { useState } from "react";
import Recorder from "./Recorder";
import StoredVoices from "./StoredVoices";
import { fetchStoredVoices } from "./FetchVoices"; // Import fetching function

const Dashboard = () => {
  const [recordings, setRecordings] = useState([]);

  // Function to refresh stored voices
  const updateRecordings = () => {
    fetchStoredVoices("VoiceRecorderDB", "Recordings").then(setRecordings);
  };

  return (
    <div className="relative w-screen min-h-screen bg-gradient-to-b from-blue-600 to-blue-300 text-white flex flex-col justify-start items-center p-6 gap-6 overflow-auto">
      {/* Title */}
      <p className="text-3xl font-extrabold tracking-wide text-white">
        Voice Recorder
      </p>

      {/* Recorder Component with Callback */}
      <div className="flex flex-col justify-center items-center bg-white/20 p-6 rounded-2xl shadow-xl backdrop-blur-lg">
        <Recorder onRecordingComplete={updateRecordings} />
      </div>

      {/* Stored Voices Section - Pass recordings and updater */}
      <div className="w-full max-w-4xl bg-white/20 p-6 rounded-2xl shadow-lg backdrop-blur-md">
        <StoredVoices recordings={recordings} updateRecordings={updateRecordings} />
      </div>
    </div>
  );
};

export default Dashboard;
