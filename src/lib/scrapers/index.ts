import { KomikuAdapter } from './adapters/komiku.adapter';

// Register all adapters here
const ADAPTERS = [KomikuAdapter];

/**
 * Detect adapter based on URL
 */
export function getAdapter(url: string) {
  const Adapter = ADAPTERS.find((a) => a.match(url));
  if (!Adapter) {
    throw new Error(`No adapter found for URL: ${url}`);
  }
  return new Adapter();
}

/**
 * Get the manga series URL from any supported URL (chapter or manga)
 */
export function getMangaUrl(url: string): string {
  const adapter = getAdapter(url);
  return (adapter as KomikuAdapter).toMangaUrl(url);
}

/**
 * List all supported websites
 */
export function getSupportedSites() {
  return ADAPTERS.map((a) => ({
    name: new a().name,
    pattern: a.DOMAIN_PATTERN,
  }));
}

/**
 * Check if URL is supported
 */
export function isSupported(url: string): boolean {
  return ADAPTERS.some((a) => a.match(url));
}
