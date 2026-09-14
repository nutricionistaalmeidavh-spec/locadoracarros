import { createEmptySnapshot, migrateLegacySnapshot } from '../domain/rental.mjs';

export const STORE_KEY = 'artisys:locadora:store:v2';
export const LEGACY_STORE_KEY = 'aluguel-veiculo:store:v1';

export function createRepository(storage = window.localStorage) {
  return {
    load() {
      const current = storage.getItem(STORE_KEY);
      if (current) return migrateLegacySnapshot(current);
      const legacy = storage.getItem(LEGACY_STORE_KEY);
      if (legacy) {
        const migrated = migrateLegacySnapshot(legacy);
        storage.setItem(STORE_KEY, JSON.stringify(migrated));
        return migrated;
      }
      const empty = createEmptySnapshot();
      storage.setItem(STORE_KEY, JSON.stringify(empty));
      return empty;
    },
    save(snapshot) {
      storage.setItem(STORE_KEY, JSON.stringify(snapshot));
      return snapshot;
    },
    reset() {
      storage.removeItem(STORE_KEY);
    }
  };
}
