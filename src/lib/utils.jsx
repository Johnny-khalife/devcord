import React, { useState } from 'react';
// Import highlight.js for syntax highlighting
import hljs from 'highlight.js';
// Import code icon from lucide
import { Code, ChevronDown, ChevronUp, Maximize } from 'lucide-react';
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
 * Renders a code block with syntax highlighting and modern design
 * @param {string} code - The code to highlight
 * @param {string} language - The programming language
 * @returns {JSX.Element} - React element with highlighted code
 */
export function renderCodeBlock(code, language) {
  if (!code) return null;
  
  // Use React state for collapsible functionality
  const CollapsibleCodeBlock = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
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
    } catch {}
    
    return (
      <div className={`code-block-container relative my-2 rounded-lg overflow-hidden border border-base-300 bg-[#1e1e2e] shadow-md transition-all duration-300 ${isExpanded ? "w-full fixed top-10 left-0 right-0 z-50 h-[90vh] mx-4 md:mx-auto md:w-[90%] max-w-7xl" : ""}`}>
        {/* Header with language badge and buttons */}
        <div className="code-header flex items-center justify-between p-2 bg-[#313244] text-white/80">
          <div className="flex items-center gap-2">
            <Code size={14} className="text-[#89dceb]" />
            <div className="language-badge px-2 py-1 rounded text-xs font-mono bg-[#6c7086] text-white/90">
              {displayLanguage}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              className="copy-button px-2 py-1 rounded text-xs bg-[#45475a] hover:bg-[#585b70] transition-colors text-white/90"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(code);
                const button = e.target;
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                  button.textContent = originalText;
                }, 2000);
              }}
            >
              Copy
            </button>
            <button
              className="collapse-button p-1 rounded text-xs bg-[#45475a] hover:bg-[#585b70] transition-colors text-white/90 ml-1"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand code" : "Collapse code"}
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            <button
              className="expand-button p-1 rounded text-xs bg-[#45475a] hover:bg-[#585b70] transition-colors text-white/90 ml-1"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Exit fullscreen" : "Fullscreen"}
            >
              <Maximize size={14} />
            </button>
          </div>
        </div>
        
        {/* Code content with syntax highlighting */}
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? "max-h-0" : isExpanded ? "h-[calc(90vh-40px)]" : "max-h-96"}`}
        >
          <pre className={`p-4 m-0 overflow-auto bg-[#1e1e2e] text-[#cdd6f4] ${isExpanded ? "h-full" : ""}`}>
            <code 
              dangerouslySetInnerHTML={{ __html: highlightedCode }} 
              className={`hljs language-${language || 'plaintext'} font-mono text-sm`}
            />
          </pre>
        </div>
      </div>
    );
  };
  
  return <CollapsibleCodeBlock />;
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