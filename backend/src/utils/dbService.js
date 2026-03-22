import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/db.json');
const DEFAULT_DB = { users: [], jobs: [], applications: [], savedJobs: [] };

const ensureDB = async () => {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });

  try {
    await fs.access(DB_PATH);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return;
    }
    throw error;
  }
};

const normalizeCollections = (db) => {
  const normalized = { ...DEFAULT_DB, ...(db || {}) };
  normalized.users = Array.isArray(normalized.users) ? normalized.users : [];
  normalized.jobs = Array.isArray(normalized.jobs) ? normalized.jobs : [];
  normalized.applications = Array.isArray(normalized.applications) ? normalized.applications : [];
  normalized.savedJobs = Array.isArray(normalized.savedJobs) ? normalized.savedJobs : [];
  return normalized;
};

const readDB = async () => {
  await ensureDB();
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return normalizeCollections(JSON.parse(data));
  } catch (error) {
    if (error.name === 'SyntaxError') {
      await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return { ...DEFAULT_DB };
    }
    throw error;
  }
};

const writeDB = async (data) => {
  await ensureDB();
  await fs.writeFile(DB_PATH, JSON.stringify(normalizeCollections(data), null, 2), 'utf-8');
};

const dbService = {
  get: async (collection) => {
    const db = await readDB();
    return db[collection] || [];
  },

  find: async (collection, predicate) => {
    const items = await dbService.get(collection);
    return items.find(predicate);
  },

  filter: async (collection, predicate) => {
    const items = await dbService.get(collection);
    return items.filter(predicate);
  },

  insert: async (collection, item) => {
    const db = await readDB();
    if (!db[collection]) db[collection] = [];
    const newItem = { ...item, id: item.id || Date.now().toString() };
    db[collection].push(newItem);
    await writeDB(db);
    return newItem;
  },

  update: async (collection, id, updates) => {
    const db = await readDB();
    const index = db[collection].findIndex(item => item.id === id);
    if (index !== -1) {
      db[collection][index] = { ...db[collection][index], ...updates };
      await writeDB(db);
      return db[collection][index];
    }
    return null;
  },

  delete: async (collection, id) => {
    const db = await readDB();
    const lengthBefore = db[collection].length;
    db[collection] = db[collection].filter(item => item.id !== id);
    if (db[collection].length !== lengthBefore) {
      await writeDB(db);
      return true;
    }
    return false;
  }
};

export default dbService;
