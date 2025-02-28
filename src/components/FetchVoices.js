export const openDatabase = async (dbName, storeName) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
        console.log(
          `✅ Object store '${storeName}' created in database '${dbName}'.`
        );
      }
    };

    request.onsuccess = (event) => {
      console.log(`✅ Database '${dbName}' opened successfully.`);
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error(
        `❌ Error opening IndexedDB '${dbName}':`,
        event.target.error
      );
      reject(event.target.error);
    };
  });
};

export const fetchStoredVoices = async (dbName, storeName) => {
  try {
    const db = await openDatabase(dbName, storeName);
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const getAllRequest = store.getAll();

    return new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => {
        console.log(
          `🎤 Retrieved ${getAllRequest.result.length} voice recordings from '${storeName}'.`
        );
        resolve(getAllRequest.result);
      };

      getAllRequest.onerror = (event) => {
        console.error(
          `❌ Error fetching voices from '${storeName}':`,
          event.target.error
        );
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error(`❌ Error accessing database '${dbName}':`, error);
    throw error;
  }
};
