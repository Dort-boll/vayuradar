export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VayuASM_DB", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("api_cache")) {
        db.createObjectStore("api_cache", { keyPath: "url" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCached(url: string): Promise<any> {
  const db = await openDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction("api_cache", "readonly");
    const store = tx.objectStore("api_cache");
    const req = store.get(url);
    req.onsuccess = () => resolve(req.result?.response);
    tx.oncomplete = () => db.close();
  });
}

export async function cacheResponse(url: string, response: any): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction("api_cache", "readwrite");
  tx.objectStore("api_cache").put({ url, response, cachedAt: Date.now() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function fetchWithCache(url: string, options: RequestInit = {}): Promise<any> {
  const cached = await getCached(url);
  if (cached) return cached; 
  
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const contentType = res.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    
    await cacheResponse(url, data);
    return data;
  } catch (error) {
    // Suppress console error as we handle fallbacks gracefully in the API layer
    throw error;
  }
}
