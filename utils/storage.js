export function saveToStorage(storage, key, data) {
  try {
    storage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    return false;
  }
}

export function loadFromStorage(storage, key, defaultValue) {
  try {
    const saved = storage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}
