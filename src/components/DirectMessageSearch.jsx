import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { Search, X, ArrowUp, ArrowDown } from "lucide-react";
import { formatMessageTime } from "../lib/utils";
import toast from "react-hot-toast";

const DirectMessageSearch = ({ friendId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef(null);
  
  const { 
    searchDirectMessages, 
    clearSearch, 
    isSearching, 
    directMessageSearchResults, 
    directMessageSearchPagination,
    directMessageSearchQuery,
    directMessages,
    selectedFriend
  } = useChatStore();

  // Get the effective friend ID (from prop or store)
  const effectiveFriendId = friendId || selectedFriend?.friendId;

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

  // Reset search when friend changes
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      clearSearch();
    }
  }, [effectiveFriendId, clearSearch, isOpen]);

  // Handle input change with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim() && effectiveFriendId) {
        
        searchDirectMessages(effectiveFriendId, query, currentPage);
      } else if (!query.trim()) {
        clearSearch();
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query, effectiveFriendId, currentPage, searchDirectMessages, clearSearch]);

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
    if (directMessageSearchPagination && currentPage < directMessageSearchPagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const scrollToMessage = (messageId) => {
    // First check if this message exists in current conversation
    const messageExists = directMessages.some(msg => 
      msg._id === messageId || msg.messageId === messageId
    );
    
    if (!messageExists) {
      toast.error("This message has been deleted or is not available in the current conversation");
      return;
    }
    
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight the message temporarily
      messageElement.classList.add("bg-primary", "bg-opacity-10");
      setTimeout(() => {
        messageElement.classList.remove("bg-primary", "bg-opacity-10");
      }, 2000);
    } else {
      
      toast.error("Could not locate this message in the current view");
    }
  };

  return (
    <div className="relative">
      {/* Search toggle button */}
      <button
        className={`p-2 rounded-full ${isOpen ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}`}
        onClick={handleToggleSearch}
        aria-label="Search direct messages"
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
            ) : directMessageSearchResults && directMessageSearchResults.length > 0 ? (
              <>
                <div className="p-2 text-xs text-base-content/70 border-b border-base-300">
                  {directMessageSearchPagination?.total || directMessageSearchResults.length} results for "{directMessageSearchQuery}"
                </div>
                {directMessageSearchResults.map((message) => (
                  <div
                    key={message.messageId || message._id}
                    className="p-2 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-none"
                    onClick={() => scrollToMessage(message.messageId || message._id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="avatar">
                        <div className="w-6 h-6 rounded-full">
                          <img
                            src={message.sender?.avatar || "/avatar.png"}
                            alt={`${message.sender?.username}'s avatar`}
                          />
                        </div>
                      </div>
                      <span className="font-semibold text-xs">
                        {message.sender?.username || "Unknown user"}
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

                {/* Pagination */}
                {directMessageSearchPagination && directMessageSearchPagination.totalPages > 1 && (
                  <div className="p-2 flex justify-between items-center border-t border-base-300">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`btn btn-xs ${currentPage === 1 ? 'btn-disabled' : ''}`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <span className="text-xs">
                      Page {currentPage} of {directMessageSearchPagination.totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage >= directMessageSearchPagination.totalPages}
                      className={`btn btn-xs ${currentPage >= directMessageSearchPagination.totalPages ? 'btn-disabled' : ''}`}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                )}
              </>
            ) : query ? (
              <div className="p-4 text-center text-base-content/60">
                <p>No messages found</p>
              </div>
            ) : (
              <div className="p-4 text-center text-base-content/60">
                <p>Type to search messages</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessageSearch; 