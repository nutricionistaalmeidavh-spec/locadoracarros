function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2,'0')).join('');
}

async function checksum(text) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

export async function createBackupEnvelope(snapshot) {
  const payload = JSON.stringify(snapshot);
  return JSON.stringify({ format:'artisys-locadora-backup', schemaVersion:2, createdAt:new Date().toISOString(), checksum:await checksum(payload), snapshot });
}

export async function restoreBackupEnvelope(raw) {
  const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (envelope?.format !== 'artisys-locadora-backup' || !envelope.snapshot) throw new Error('Backup inválido.');
  const actual = await checksum(JSON.stringify(envelope.snapshot));
  if (actual !== envelope.checksum) throw new Error('Falha de integridade do backup.');
  return envelope.snapshot;
}
