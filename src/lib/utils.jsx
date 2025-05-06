import React from 'react';
// Import highlight.js for syntax highlighting
import hljs from 'highlight.js';
// Import default style - you can replace with your preferred style in your CSS imports
// For example: import 'highlight.js/styles/github.css';

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
 * Renders a code block with syntax highlighting
 * @param {string} code - The code to highlight
 * @param {string} language - The programming language
 * @returns {JSX.Element} - React element with highlighted code
 */
export function renderCodeBlock(code, language) {
  if (!code) return null;
  
  let highlightedCode;
  const displayLanguage = language && language !== 'multiple' ? language : 'code';
  
  try {
    // If language is specified and supported, use it for highlighting
    if (language && language !== 'multiple') {
      highlightedCode = hljs.highlight(code, { language }).value;
    } else {
      // Auto-detect language if not specified or multiple
      highlightedCode = hljs.highlightAuto(code).value;
    }
  } catch (error) {
    console.error('Error highlighting code:', error);
    // Fallback to plain text if highlighting fails
    highlightedCode = hljs.highlight(code, { language: 'plaintext' }).value;
  }
  
  return (
    <pre className="code-block" data-language={displayLanguage}>
      <code 
        dangerouslySetInnerHTML={{ __html: highlightedCode }} 
        className={`hljs language-${language || 'plaintext'}`}
      />
    </pre>
  );
}

/**
 * Parses message content to detect code blocks
 * @param {string} text - The message text
 * @returns {Array} - Array of content segments (text, code blocks)
 */
export function parseMessageContent(text) {
  if (!text) return [];
  
  // Look for code blocks with language specification: ```language\ncode```
  const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)```/g;
  const segments = [];
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Add the code block
    segments.push({
      type: 'code',
      language: match[1].trim() || 'plaintext',
      content: match[2].trim()
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last code block
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  return segments;
}

/**
 * Converts URLs in text to clickable links
 * @param {string} text - The text containing URLs
 * @param {boolean} isCurrentUser - Whether the message is from the current user
 * @returns {JSX.Element} - React element with clickable links
 */
export function convertUrlsToLinks(text, isCurrentUser) {
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