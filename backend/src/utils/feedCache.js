const FEED_CACHE_TTL_MS = 60 * 1000;
const cacheStore = new Map();

const buildCacheKey = ({ userId = '', role = '', location = '', page = 1, pageSize = 25, filters = {} } = {}) => {
    const filterKey = JSON.stringify(filters || {});
    return `${String(userId)}|${String(role).toLowerCase()}|${String(location).toLowerCase()}|${page}|${pageSize}|${filterKey}`;
};

const getCache = (key) => {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > FEED_CACHE_TTL_MS) {
        cacheStore.delete(key);
        return null;
    }
    return entry.value;
};

const setCache = (key, value) => {
    cacheStore.set(key, { value, ts: Date.now() });
};

const clearFeedCache = () => {
    cacheStore.clear();
};

export { FEED_CACHE_TTL_MS, buildCacheKey, getCache, setCache, clearFeedCache };
