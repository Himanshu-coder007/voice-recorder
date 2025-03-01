class SaveAudio {
  constructor() {
    this.dbName = "AudioRecorderDB";
    this.storeName = "Recordings";
    this.db = null;
  }

  // Open or create IndexedDB database
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(`Error opening database: ${event.target.error}`);
      };
    });
  }

  // Save audio blob to IndexedDB with filename and timestamp
  async saveAudio(audioBlob, filename) {
    if (!this.db) {
      await this.openDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.add({
        audio: audioBlob,
        filename: filename,
        timestamp: new Date(), // Add timestamp
      });

      request.onsuccess = () => {
        resolve("Audio saved successfully!");
      };

      request.onerror = (event) => {
        reject(`Error saving audio: ${event.target.error}`);
      };
    });
  }
}

export default SaveAudio;
