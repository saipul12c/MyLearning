/**
 * Generic Utility Functions for MyLearning
 */

export const PLATFORM_DIRECTOR = "Muhammad Syaiful Mukmin";
export const PLATFORM_NAME = "MyLearning";

/**
 * Format number to Indonesian Rupiah currency string
 */
export function formatPrice(price: number): string {
  const formatted = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formatted}`;
}

/**
 * Format number with thousand separators (fixed locale for Hydration Safety)
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Generate a random unique ID for certificates or other entities
 */
export function generateProfessionalId(prefix: string = "ML"): string {
  const year = new Date().getFullYear();
  const randomHex = () => Math.random().toString(16).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${randomHex()}-${randomHex()}`;
}

/**
 * Calculate reading/learning time in minutes
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const noOfWords = text.split(/\s/g).length;
  return Math.ceil(noOfWords / wordsPerMinute);
}
/**
 * Format duration hours into a human-readable string
 * Example: 1.5 -> "1 jam 30 menit", 0.5 -> "30 menit", 2 -> "2 jam"
 */
export function formatDuration(hours: number): string {
  if (!hours || hours <= 0) return "Durasi tidak tersedia";
  
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0 && m > 0) {
    return `${h} jam ${m} menit`;
  } else if (h > 0) {
    return `${h} jam`;
  } else {
    return `${m} menit`;
  }
}
/**
 * Detects if the user wants to talk to a human agent
 */
export function detectAgentRequest(text: string): boolean {
  const keywords = [
    "hubungi agen", "bicara dengan admin", "kontak admin", 
    "instruktur", "manusia", "bantuan langsung", "cs live"
  ];
  return keywords.some(k => text.toLowerCase().includes(k));
}

/**
 * Gets or creates a unique client fingerprint stored in localStorage
 */
export function getClientFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  let fp = localStorage.getItem('client_fingerprint');
  if (!fp) {
    fp = 'fp-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('client_fingerprint', fp);
  }
  return fp;
}

/**
 * Converts a string into a URL-friendly slug
 * Example: "Dimas Pratama" -> "dimas-pratama"
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}
