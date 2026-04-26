/**
 * Normalizes a search query string for consistent matching.
 * Trims, lowercases, and removes unnecessary punctuation.
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove special characters except alphanumeric and whitespace
    .replace(/\s+/g, " ");   // Collapse multiple spaces
}

/**
 * Splits a query into non-empty keywords.
 */
export function tokenizeQuery(query: string): string[] {
  return normalizeQuery(query).split(" ").filter(Boolean);
}

/**
 * Basic fuzzy matching logic for local strings.
 * Checks if all keywords in the query are present in the target text.
 */
export function fuzzyMatch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const keywords = tokenizeQuery(query);
  const normalizedText = normalizeQuery(text);
  
  // All keywords must be found at least partially in the text
  return keywords.every(word => normalizedText.includes(word));
}

/**
 * Higher level fuzzy match that handles Indonesian specifics or typos (Distance based)
 * For small sets like FAQ.
 */
export function advancedFuzzyMatch(text: string, query: string): number {
  const normalizedText = normalizeQuery(text);
  const normalizedQueryText = normalizeQuery(query);
  
  if (normalizedText.includes(normalizedQueryText)) return 1.0; // Exact match or substring
  
  const keywords = tokenizeQuery(query);
  if (keywords.length === 0) return 0;
  
  let matches = 0;
  keywords.forEach(word => {
    if (normalizedText.includes(word)) matches++;
  });
  
  return matches / keywords.length;
}
