import DOMPurify from 'dompurify';

const SOCIAL_CTA_REGEX = /facebook sharing button|twitter sharing button|linkedin sharing button|email sharing button/gi;

export const sanitizeJobHtml = (html = '') => {
    const normalized = String(html || '').replace(SOCIAL_CTA_REGEX, ' ');

    return DOMPurify.sanitize(normalized, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a',
            'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'span'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'class'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'style']
    });
};

export const descriptionPreviewText = (html = '', limit = 120) => {
    const plain = sanitizeJobHtml(html)
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!plain) return 'No description available.';
    if (plain.length <= limit) return plain;
    return `${plain.slice(0, limit)}...`;
};

export const hasRichDescription = (html = '') => {
    const value = String(html || '').trim();
    return value.length > 0;
};
