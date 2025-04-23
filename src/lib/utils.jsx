import React from 'react';

export function formatMessageTime(date) {
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now - messageDate;
    const hoursDiff = diff / (1000 * 60 * 60);
    const yearDiff= now.getFullYear()-messageDate.getFullYear();

    // Check if message is from within last 24 hours
    if (hoursDiff < 24) {
      // If message is from last 24 hours, just show the time
      return messageDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      
      // If message is older than 24 hours, show date and time
    } else {
      if(yearDiff==0){
        return messageDate.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
      else{
        return messageDate.toLocaleString("en-US", {
          year:"numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
    }
  }
}
/**
 * Converts URLs in text to clickable links
 * @param {string} text - The text containing URLs
 * @returns {JSX.Element} - React element with clickable links
 */
export function convertUrlsToLinks(text,isCurrentUser) {
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
              className={`${!isCurrentUser ? "text-info hover:opacity-80 hover:underline" : "text-[#1f2937] hover:opacity-90 hover:underline"}`}
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