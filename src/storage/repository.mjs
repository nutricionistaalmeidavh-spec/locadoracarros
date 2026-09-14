import { createEmptySnapshot, migrateLegacySnapshot } from '../domain/rental.mjs';
import { ensureP1Snapshot } from '../domain/p1.mjs';
import { syncMaintenanceAvailability } from '../domain/maintenance.mjs';

export const STORE_KEY = 'artisys:locadora:store:v3';
export const P0_STORE_KEY = 'artisys:locadora:store:v2';
export const LEGACY_STORE_KEY = 'aluguel-veiculo:store:v1';

function normalize(raw){
  const source=typeof raw==='string'?JSON.parse(raw):raw;
  const base=Number(source?.version)>=2&&Array.isArray(source?.ledger)&&Array.isArray(source?.audit)?source:migrateLegacySnapshot(source);
  return syncMaintenanceAvailability(ensureP1Snapshot(base));
}

export function createRepository(storage = window.localStorage) {
  return {
    load() {
      const current = storage.getItem(STORE_KEY);
      if (current) return normalize(current);
      for (const key of [P0_STORE_KEY,LEGACY_STORE_KEY]) {
        const raw=storage.getItem(key);if(!raw)continue;const migrated=normalize(raw);storage.setItem(STORE_KEY,JSON.stringify(migrated));return migrated;
      }
      const empty = ensureP1Snapshot(createEmptySnapshot());
      storage.setItem(STORE_KEY, JSON.stringify(empty));
      return empty;
    },
    save(snapshot) {
      const normalized=syncMaintenanceAvailability(ensureP1Snapshot(snapshot));storage.setItem(STORE_KEY, JSON.stringify(normalized));return normalized;
    },
    reset() { storage.removeItem(STORE_KEY); }
  };
}
