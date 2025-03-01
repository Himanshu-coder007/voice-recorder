class FetchAudio {
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

  // Fetch all saved recordings from IndexedDB
  async fetchRecordings() {
    if (!this.db) {
      await this.openDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(`Error fetching recordings: ${event.target.error}`);
      };
    });
  }

  // Delete a recording from IndexedDB
  async deleteRecording(id) {
    if (!this.db) {
      await this.openDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve("Recording deleted successfully!");
      };

      request.onerror = (event) => {
        reject(`Error deleting recording: ${event.target.error}`);
      };
    });
  }
}

export default FetchAudio;
