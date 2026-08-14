import localforage from 'localforage';

const stores = {};

function getStore(namespace) {
  if (!stores[namespace]) {
    stores[namespace] = localforage.createInstance({ name: `ai-tools-${namespace}` });
  }
  return stores[namespace];
}

export const storage = {
  async get(namespace, key) {
    const store = getStore(namespace);
    return await store.getItem(key);
  },
  
  async set(namespace, key, value) {
    const store = getStore(namespace);
    return await store.setItem(key, value);
  },
  
  async remove(namespace, key) {
    const store = getStore(namespace);
    return await store.removeItem(key);
  },
  
  async migrateFromLocalStorage(namespace, keys) {
    const store = getStore(namespace);
    for (const key of keys) {
      const lsData = localStorage.getItem(key);
      if (lsData) {
        try {
          const parsed = JSON.parse(lsData);
          await store.setItem(key, parsed);
          localStorage.removeItem(key); // clear it after migrating
        } catch (e) {
          console.warn(`Failed to parse localStorage key: ${key}`, e);
        }
      }
    }
  }
};
