import React from 'react';

export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

/**
 * Converts URLs in text to clickable links
 * @param {string} text - The text containing URLs
 * @returns {JSX.Element} - React element with clickable links
 */
export function convertUrlsToLinks(text) {
  if (!text) return null;

  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+\.[^\s]+)/g;
  
  // Replace URLs with link elements
  const parts = text.split(urlPattern);
  
  return (
    <span>
      {parts.map((part, index) => {
        if (part && urlPattern.test(part)) {
          const url = part.startsWith('www.') ? `https://${part}` : part;
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                window.open(url, '_blank');
              }}
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
} 