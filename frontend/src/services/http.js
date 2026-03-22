const trimTrailingSlash = (value = '') => String(value || '').replace(/\/+$/, '');

const readConfiguredBase = () => {
    const raw = import.meta.env.VITE_API_BASE_URL;
    if (!raw) return '';
    return trimTrailingSlash(raw);
};

const API_BASE_URL = readConfiguredBase();

const isApiPath = (value = '') => String(value).startsWith('/api');

const toApiUrl = (path = '') => {
    const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${String(path)}`;
    if (!API_BASE_URL) return normalizedPath;
    if (isApiPath(normalizedPath)) {
        return `${API_BASE_URL}${normalizedPath}`;
    }
    return `${API_BASE_URL}/api${normalizedPath}`;
};

const initApiFetchInterceptor = () => {
    if (typeof window === 'undefined' || window.__apiFetchPatched) return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = (input, init) => {
        if (!API_BASE_URL) {
            return originalFetch(input, init);
        }

        if (typeof input === 'string' && isApiPath(input)) {
            return originalFetch(toApiUrl(input), init);
        }

        if (input instanceof Request && isApiPath(new URL(input.url).pathname)) {
            const updatedUrl = toApiUrl(new URL(input.url).pathname + new URL(input.url).search);
            const updatedRequest = new Request(updatedUrl, input);
            return originalFetch(updatedRequest, init);
        }

        return originalFetch(input, init);
    };

    window.__apiFetchPatched = true;
};

export { API_BASE_URL, toApiUrl, initApiFetchInterceptor };