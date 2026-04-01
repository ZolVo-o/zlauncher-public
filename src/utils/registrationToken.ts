export interface RegistrationPayload {
  requestId: string;
  username: string;
  email: string;
  issuedAt: number;
  expiresAt: number;
}

export interface LocalRegistrationRecord {
  requestId: string;
  token: string;
  username: string;
  email: string;
  passwordHash: string;
  issuedAt: number;
  expiresAt: number;
  consumedAt: number | null;
}

const TOKEN_PREFIX = 'ZL1';
const TOKEN_SALT = 'zlauncher-local-prep-v1';
const LOCAL_REGISTRATIONS_KEY = 'zlauncher-local-registrations';

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function checksum(raw: string) {
  let hash = 2166136261;
  const source = `${raw}:${TOKEN_SALT}`;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function encodeBase64Url(raw: string) {
  const encoded = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(raw)))
    : Buffer.from(raw, 'utf8').toString('base64');
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(raw: string) {
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = normalized + '==='.slice((normalized.length + 3) % 4);
  const decoded = typeof atob === 'function'
    ? decodeURIComponent(escape(atob(withPadding)))
    : Buffer.from(withPadding, 'base64').toString('utf8');
  return decoded;
}

export function createRegistrationToken(input: { username: string; email: string }) {
  const now = Date.now();
  const payload: RegistrationPayload = {
    requestId: createId(),
    username: input.username.trim(),
    email: input.email.trim().toLowerCase(),
    issuedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000,
  };
  const payloadEncoded = encodeBase64Url(JSON.stringify(payload));
  const sign = checksum(payloadEncoded);
  return {
    token: `${TOKEN_PREFIX}.${payloadEncoded}.${sign}`,
    payload,
  };
}

export function parseRegistrationToken(token: string): RegistrationPayload | null {
  const [prefix, payloadEncoded, sign] = String(token || '').trim().split('.');
  if (prefix !== TOKEN_PREFIX || !payloadEncoded || !sign) return null;
  if (checksum(payloadEncoded) !== sign) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(payloadEncoded)) as Partial<RegistrationPayload>;
    if (!payload || typeof payload !== 'object') return null;
    if (!payload.requestId || !payload.username || !payload.email) return null;
    if (!payload.expiresAt || payload.expiresAt < Date.now()) return null;
    return {
      requestId: payload.requestId,
      username: payload.username,
      email: payload.email,
      issuedAt: Number(payload.issuedAt || 0),
      expiresAt: Number(payload.expiresAt || 0),
    };
  } catch (_error) {
    return null;
  }
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function readLocalRegistrations(): LocalRegistrationRecord[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(LOCAL_REGISTRATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === 'object') as LocalRegistrationRecord[];
  } catch (_error) {
    return [];
  }
}

function writeLocalRegistrations(records: LocalRegistrationRecord[]) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(LOCAL_REGISTRATIONS_KEY, JSON.stringify(records));
}

export function createLocalRegistration(input: { username: string; email: string; password: string }) {
  const created = createRegistrationToken(input);
  const records = readLocalRegistrations();
  const nextRecord: LocalRegistrationRecord = {
    requestId: created.payload.requestId,
    token: created.token,
    username: created.payload.username,
    email: created.payload.email,
    passwordHash: checksum(input.password.trim()),
    issuedAt: created.payload.issuedAt,
    expiresAt: created.payload.expiresAt,
    consumedAt: null,
  };

  const fresh = records.filter((record) => record.expiresAt > Date.now());
  fresh.unshift(nextRecord);
  writeLocalRegistrations(fresh.slice(0, 100));

  return created;
}

export function confirmLocalRegistration(token: string): RegistrationPayload | null {
  const records = readLocalRegistrations();
  const now = Date.now();
  const index = records.findIndex((record) => record.token === token);

  if (index >= 0) {
    const found = records[index];
    if (found.expiresAt <= now || found.consumedAt) return null;

    const next = [...records];
    next[index] = { ...found, consumedAt: now };
    writeLocalRegistrations(next);

    return {
      requestId: found.requestId,
      username: found.username,
      email: found.email,
      issuedAt: found.issuedAt,
      expiresAt: found.expiresAt,
    };
  }

  return parseRegistrationToken(token);
}
