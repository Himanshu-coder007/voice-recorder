import React, { useEffect } from "react";
import { FaDownload, FaTrash } from "react-icons/fa";

const StoredVoices = ({ recordings, updateRecordings }) => {
  // Fetch updated data on mount
  useEffect(() => {
    updateRecordings();
  }, []);

  // Function to handle downloading a recording
  const handleDownload = (recording) => {
    const url = URL.createObjectURL(recording.audio);
    const a = document.createElement("a");
    a.href = url;
    a.download = recording.fileName ? `${recording.fileName}.mp3` : "recording.mp3";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Function to delete a recording
  const handleDelete = (id) => {
    const request = indexedDB.open("VoiceRecorderDB", 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("Recordings", "readwrite");
      const store = transaction.objectStore("Recordings");

      store.delete(id).onsuccess = () => {
        console.log("Recording deleted:", id);
        updateRecordings(); // Fetch updated list after deletion
      };
    };

    request.onerror = (event) => {
      console.error("Error deleting recording:", event.target.error);
    };
  };

  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-bold text-white text-center mb-4">
        Stored Voices
      </h2>
      {recordings.length === 0 ? (
        <p className="text-white text-center">No recordings found.</p>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full max-w-full border-collapse border border-gray-300 bg-white">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="border border-gray-400 p-4 text-left w-1/4">File Name</th>
                <th className="border border-gray-400 p-4 text-left w-1/4">Timestamp</th>
                <th className="border border-gray-400 p-4 text-left w-1/4">Playback</th>
                <th className="border border-gray-400 p-4 text-left w-1/4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recordings
                .slice()
                .reverse()
                .map((recording, index) => (
                  <tr key={index} className="odd:bg-gray-100 even:bg-gray-200 text-gray-900">
                    <td className="border border-gray-400 p-4 truncate">{recording.fileName}</td>
                    <td className="border border-gray-400 p-4 truncate">
                      {new Date(recording.timestamp).toLocaleString()}
                    </td>
                    <td className="border border-gray-400 p-4">
                      <audio controls className="w-40">
                        <source src={URL.createObjectURL(recording.audio)} type="audio/mp3" />
                        Your browser does not support the audio element.
                      </audio>
                    </td>
                    <td className="border border-gray-400 p-4 flex items-center gap-4">
                      {/* Download Button */}
                      <button
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        onClick={() => handleDownload(recording)}
                      >
                        <FaDownload />
                      </button>

                      {/* Delete Button */}
                      <button
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        onClick={() => handleDelete(recording.id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StoredVoices;
