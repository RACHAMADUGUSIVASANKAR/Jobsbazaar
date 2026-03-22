const trimTrailingSlash = (value = '') => String(value || '').replace(/\/+$/, '');

const readConfiguredBase = () => {
    const raw = import.meta.env.VITE_API_BASE_URL;
    if (!raw) {
        // Fallback: detect backend from hostname
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        if (hostname.includes('vercel.app') || hostname.includes('vercel.dev')) {
            // On Vercel preview/production, use the Render backend
            return 'https://jobsbazaar-1.onrender.com';
        }
        return '';
    }
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

        // Case 1: String URL with /api path
        if (typeof input === 'string' && isApiPath(input)) {
            const fullUrl = toApiUrl(input);
            return originalFetch(fullUrl, init);
        }

        // Case 2: Request object with /api path
        if (input instanceof Request) {
            const pathname = new URL(input.url).pathname;
            if (isApiPath(pathname)) {
                const fullUrl = toApiUrl(pathname + new URL(input.url).search);
                // Properly clone the request with the new URL while preserving method and body
                return originalFetch(fullUrl, {
                    method: input.method,
                    headers: input.headers,
                    body: input.body,
                    ...init
                });
            }
        }

        return originalFetch(input, init);
    };

    window.__apiFetchPatched = true;
};

export { API_BASE_URL, toApiUrl, initApiFetchInterceptor };