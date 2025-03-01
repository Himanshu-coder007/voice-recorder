import React, { useEffect, useState, useRef } from "react"; // Import useRef
import FetchAudio from "./context/Fetchaudio.js"; // Import the FetchAudio class

const Library = ({ onClose }) => {
  const [recordings, setRecordings] = useState([]); // State to store fetched recordings
  const fetchAudioRef = useRef(new FetchAudio()); // Create a ref for FetchAudio instance

  // Fetch recordings when the component mounts
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const recordings = await fetchAudioRef.current.fetchRecordings();
        setRecordings(recordings);
      } catch (error) {
        console.error("Error fetching recordings:", error);
      }
    };

    fetchRecordings();
  }, []);

  // Handle download of a recording
  const handleDownload = (recording) => {
    const url = URL.createObjectURL(recording.audio);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${recording.filename || "recording"}.mp3`; // Set the filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  // Handle deletion of a recording
  const handleDelete = async (id) => {
    try {
      await fetchAudioRef.current.deleteRecording(id); // Delete from IndexedDB
      setRecordings((prevRecordings) =>
        prevRecordings.filter((recording) => recording.id !== id)
      ); // Remove from UI
      alert("Recording deleted successfully!");
    } catch (error) {
      console.error("Error deleting recording:", error);
      alert("Failed to delete recording.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Background Blur */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Box */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative z-50">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal Content */}
        <h2 className="text-2xl font-bold mb-4 text-white">Library</h2>

        {/* Display Recordings */}
        {recordings.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recordings
              .slice() // Create a copy of the array to avoid mutating the original
              .reverse() // Reverse the array to show the latest recordings first
              .map((recording) => (
                <div key={recording.id} className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-white font-semibold">{recording.filename}</p>
                  <audio
                    controls
                    src={URL.createObjectURL(recording.audio)}
                    className="w-full mt-2"
                  />
                  {/* Download and Delete Buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleDownload(recording)}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(recording.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-300">No recordings found.</p>
        )}
      </div>
    </div>
  );
};

export default Library;