import React from "react";
import Recorder from "./Recorder";

const Dashboard = () => {
  return (
    <div className="relative w-screen h-screen bg-gradient-to-b from-red-700 to-red-400 text-white flex flex-col justify-center items-center text-4xl">
      {/* Title */}
      <p className="absolute top-10 left-1/2 -translate-x-1/2 text-2xl font-bold text-white whitespace-nowrap">
        Voice Recorder
      </p>

      {/* Centered Recorder Component */}
      <div className="flex flex-col justify-center items-center">
        <Recorder />
      </div>
    </div>
  );
};

export default Dashboard;