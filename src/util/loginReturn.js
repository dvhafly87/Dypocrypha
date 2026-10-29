// Accept only local application routes, never external or encoded separator URLs.
export function safeReturnTo(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || /[\\\u0000-\u0020]/.test(value) || /%2f|%5c|%0[0-9a-f]|%1[0-9a-f]/i.test(value)) return '/';
  try {
    const url = new URL(value, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid' || /^\/(login|register)(\/|$)/.test(url.pathname)) return '/';
    return url.pathname + url.search + url.hash;
  } catch { return '/'; }
}
