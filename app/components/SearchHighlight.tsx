import React from "react";

interface SearchHighlightProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * A component that highlights matching parts of a text based on a search query.
 */
export default function SearchHighlight({ text, query, className = "bg-purple-500/30 text-purple-300 rounded-sm px-0.5" }: SearchHighlightProps) {
  if (!query.trim() || !text) {
    return <>{text}</>;
  }

  // Normalize and tokenize query
  const keywords = query
    .toLowerCase()
    .trim()
    .split(" ")
    .filter(Boolean);

  if (keywords.length === 0) return <>{text}</>;

  // Create a regex pattern to match any of the keywords
  // We use word boundaries or just matching substrings depending on preference
  // Here we use case-insensitive substring matching for all keywords
  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => 
        pattern.test(part) ? (
          <mark key={i} className={className}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
