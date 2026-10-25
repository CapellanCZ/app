/**
 * Native auth session storage backed by the platform keystore/keychain.
 * Chunks values to stay under SecureStore size limits (~2KB on some devices).
 * Web falls back to AsyncStorage (browser cannot use SecureStore).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = '__chunk_count';

export type AuthStorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStorage: AuthStorageAdapter = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

async function secureGetItem(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(key + CHUNK_COUNT_SUFFIX);
  if (countRaw != null) {
    const count = Number.parseInt(countRaw, 10);
    if (!Number.isFinite(count) || count <= 0) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}__${i}`);
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join('');
  }
  // Legacy single-key (or migrated) value
  return SecureStore.getItemAsync(key);
}

async function secureSetItem(key: string, value: string): Promise<void> {
  // Clear any previous chunk layout
  await secureRemoveItem(key);

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const count = Math.ceil(value.length / CHUNK_SIZE);
  await SecureStore.setItemAsync(key + CHUNK_COUNT_SUFFIX, String(count));
  for (let i = 0; i < count; i++) {
    const slice = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}__${i}`, slice);
  }
}

async function secureRemoveItem(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(key + CHUNK_COUNT_SUFFIX);
  if (countRaw != null) {
    const count = Number.parseInt(countRaw, 10);
    if (Number.isFinite(count) && count > 0) {
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}__${i}`).catch(() => undefined);
      }
    }
    await SecureStore.deleteItemAsync(key + CHUNK_COUNT_SUFFIX).catch(() => undefined);
  }
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
}

const webAsyncStorage: AuthStorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

/** Node/SSR (Expo Router web) has no window — use memory. */
const isBrowserLike = typeof window !== 'undefined';

/**
 * Prefer SecureStore on iOS/Android. Web uses AsyncStorage.
 * Also migrates any leftover AsyncStorage session into SecureStore on first read.
 */
export function createAuthStorage(): AuthStorageAdapter {
  if (!isBrowserLike) return memoryStorage;
  if (Platform.OS === 'web') return webAsyncStorage;

  return {
    async getItem(key) {
      const secure = await secureGetItem(key);
      if (secure != null) return secure;
      // One-time migration from pre-SecureStore installs
      const legacy = await AsyncStorage.getItem(key);
      if (legacy != null) {
        await secureSetItem(key, legacy);
        await AsyncStorage.removeItem(key);
        return legacy;
      }
      return null;
    },
    setItem: secureSetItem,
    async removeItem(key) {
      await secureRemoveItem(key);
      await AsyncStorage.removeItem(key);
    },
  };
}
