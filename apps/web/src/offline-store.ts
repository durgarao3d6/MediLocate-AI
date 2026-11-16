import type { CachedMedicine } from "./local-search";

const DB_NAME = "medilocate-demo-cache";
const STORE = "catalog";
const META = "meta";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadCatalog(): Promise<{ items: CachedMedicine[]; savedAt: string | null }> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE, META], "readonly");
      const items = tx.objectStore(STORE).getAll();
      const saved = tx.objectStore(META).get("savedAt");
      tx.oncomplete = () => resolve({items: items.result as CachedMedicine[], savedAt: (saved.result as string | undefined) || null});
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export async function saveCatalog(items: CachedMedicine[]): Promise<string> {
  const db = await openDb();
  const now = new Date().toISOString();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE, META], "readwrite");
      const store = tx.objectStore(STORE);
      store.clear();
      for (const item of items) store.put(item);
      tx.objectStore(META).put(now, "savedAt");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return now;
  } finally { db.close(); }
}

export async function clearCatalog(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE, META], "readwrite");
      tx.objectStore(STORE).clear();
      tx.objectStore(META).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}
