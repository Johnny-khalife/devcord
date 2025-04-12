import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { Search, X, ArrowUp, ArrowDown } from "lucide-react";
import { formatMessageTime } from "../lib/utils";

const MessageSearch = ({ channelId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef(null);
  
  const { 
    searchMessages, 
    clearSearch, 
    isSearching, 
    searchResults, 
    searchPagination,
    searchQuery
  } = useChatStore();

  // Focus input when search is opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Clear search when component unmounts
  useEffect(() => {
    return () => {
      clearSearch();
    };
  }, [clearSearch]);

  // Handle input change with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim()) {
        searchMessages(channelId, query, currentPage);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query, channelId, currentPage, searchMessages]);

  const handleToggleSearch = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // When opening the search, reset state
      setQuery("");
      clearSearch();
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    clearSearch();
  };

  const handleNextPage = () => {
    if (searchPagination && currentPage < searchPagination.pages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const scrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight the message temporarily
      messageElement.classList.add("bg-primary", "bg-opacity-10");
      setTimeout(() => {
        messageElement.classList.remove("bg-primary", "bg-opacity-10");
      }, 2000);
    }
  };

  return (
    <div className="relative">
      {/* Search toggle button */}
      <button
        className={`p-2 rounded-full ${isOpen ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`}
        onClick={handleToggleSearch}
        aria-label="Search messages"
      >
        <Search size={18} />
      </button>

      {/* Search panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-base-100 rounded-md shadow-lg z-50 border border-base-300 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-base-300 flex items-center gap-2">
            <Search size={16} className="text-base-content/60" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in conversation..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm"
            />
            {query && (
              <button 
                onClick={handleClearSearch}
                className="text-base-content/60 hover:text-base-content"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search results */}
          <div className="max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center">
                <span className="loading loading-spinner loading-sm"></span>
                <p className="text-sm mt-2">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="p-2 text-xs text-base-content/70 border-b border-base-300">
                  {searchPagination?.total} results for "{searchQuery}"
                </div>
                {searchResults.map((message) => (
                  <div
                    key={message._id}
                    className="p-2 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-none"
                    onClick={() => scrollToMessage(message._id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="avatar">
                        <div className="w-6 h-6 rounded-full">
                          <img
                            src={message.userId?.avatar || "/avatar.png"}
                            alt={`${message.userId?.username}'s avatar`}
                          />
                        </div>
                      </div>
                      <span className="font-semibold text-xs">
                        {message.userId?.username}
                      </span>
                      <time className="text-xs opacity-50 ml-auto">
                        {formatMessageTime(message.createdAt)}
                      </time>
                    </div>
                    <p className="text-sm line-clamp-2">
                      {message.content}
                    </p>
                  </div>
                ))}
              </>
            ) : query && !isSearching ? (
              <div className="p-4 text-center text-base-content/70">
                <p className="text-sm">No results found</p>
                <p className="text-xs mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="p-4 text-center text-base-content/70">
                <p className="text-sm">Type to search messages</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {searchPagination && searchPagination.pages > 1 && (
            <div className="p-2 border-t border-base-300 flex justify-between items-center">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`p-1 rounded ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-base-200"
                }`}
              >
                <ArrowUp size={16} />
              </button>
              <span className="text-xs">
                Page {currentPage} of {searchPagination.pages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === searchPagination.pages}
                className={`p-1 rounded ${
                  currentPage === searchPagination.pages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-base-200"
                }`}
              >
                <ArrowDown size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageSearch; 