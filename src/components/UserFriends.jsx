import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Users, MessageSquare, X, Menu } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendsStore";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import SearchFriendsPortal from "./SearchFriendsPortal";

const UserFriends = () => {
  // State management
  const [activeFriend, setActiveFriend] = useState(null);
  const [showFriendSearchPortal, setShowFriendSearchPortal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { setSelectedFriend } = useChatStore();
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isUserFriendsSidebarOpen, setIsUserFriendsSidebarOpen] = useState(true);
  
  // Check screen size
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsUserFriendsSidebarOpen(!mobile); // Close sidebar by default on mobile
    };
    
    // Initial check
    checkIfMobile();
    
    // Add listener
    window.addEventListener('resize', checkIfMobile);
    
    // Listen for custom toggle event from ChatHeader
    const handleToggleSidebar = () => {
      setIsUserFriendsSidebarOpen(prev => !prev);
    };
    
    window.addEventListener('toggle-user-friends-sidebar', handleToggleSidebar);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener('toggle-user-friends-sidebar', handleToggleSidebar);
    };
  }, []);
  
  // Toggle sidebar
  const toggleUserFriendsSidebar = () => {
    setIsUserFriendsSidebarOpen(!isUserFriendsSidebarOpen);
  };
  
  // Get auth store functions and state
  const {
    isLoading: authLoading,
    onlineUsers,
  } = useAuthStore();

  // Get friend store functions and state
  const {
    friendRequests,
    friends,
    getFriendRequests,
    getFriendsList,
    removeFriend,
    isLoading: friendLoading,
  } = useFriendStore();

  // Refs for click outside detection
  const addFriendButtonRef = useRef(null);

  // Initialize data on component mount
  useEffect(() => {
    const loadData = async () => {
      await getFriendsList();
      await getFriendRequests();
    };

    loadData();
    
    // Reset selectedFriend when the component mounts
    // This ensures that when switching back to the Friends view, no friend is pre-selected
    setSelectedFriend(null);
    setActiveFriend(null);
    
  }, [getFriendsList, getFriendRequests, setSelectedFriend]);

  // Handler functions
  const handleAddFriend = () => {
    setShowFriendSearchPortal(true);
  };

  const handleRemoveFriend = async (userId) => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      await removeFriend(userId);
    }
  };

  // Search friends in the sidebar
  const handleSearchFriends = (e) => {
    setSearchQuery(e.target.value);
    // Filter the friends list based on search query
    // This would be implemented in a real app
  };

  const selectedFriendWhenClick = ({ id, friend }) => {
    setActiveFriend(id);
    setSelectedFriend(friend);
    if (isMobile) {
      setIsUserFriendsSidebarOpen(false);
    }
  };

  // Loading state
  const isLoadingData = authLoading || friendLoading;

  // Mobile toggle button for user friends sidebar
  const MobileUserFriendsToggle = () => {
    if (!isMobile) return null;
    
    return (
      <button 
        onClick={toggleUserFriendsSidebar}
        className="fixed top-20 left-4 z-40 p-2 bg-primary text-primary-content rounded-md shadow-md"
      >
        {isUserFriendsSidebarOpen ? <X /> : <Users />}
      </button>
    );
  };

  // Empty state if no friends and no friend requests
  if (friends.length === 0 && friendRequests.length === 0 && !isLoadingData) {
    return (
      <>
        <MobileUserFriendsToggle />
        <div className={`
          ${isMobile ? 'fixed left-0 top-16 bottom-0 z-30' : 'w-72'} 
          ${isMobile && !isUserFriendsSidebarOpen ? 'translate-x-[-100%]' : 'translate-x-0'}
          bg-base-200 h-full border-r border-base-300 flex flex-col items-center justify-center p-4
          transition-transform duration-300 ease-in-out
        `}>
          <div className="text-center mb-4">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <h3 className="font-medium text-lg">No Friends Yet</h3>
            <p className="text-sm opacity-70 mb-4">
              Add friends to start chatting
            </p>
            <button
              className="btn btn-primary"
              onClick={handleAddFriend}
              ref={addFriendButtonRef}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
              {friendRequests.length > 0 && (
                <span className="ml-1.5 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Friend search portal */}
        <SearchFriendsPortal 
          isOpen={showFriendSearchPortal} 
          onClose={() => setShowFriendSearchPortal(false)}
        />
      </>
    );
  }

  return (
    <>
      <MobileUserFriendsToggle />
      <div className={`
        ${isMobile ? 'fixed left-0 top-16 bottom-0 z-30' : 'w-72'} 
        ${isMobile && !isUserFriendsSidebarOpen ? 'translate-x-[-100%]' : 'translate-x-0'}
        bg-base-200 h-full border-r border-base-300 flex flex-col
        transition-transform duration-300 ease-in-out
      `}>
        {/* Header with title and search - fixed at top */}
        <div className="p-4 border-b border-base-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Friends</h2>
            <div className="flex items-center relative">
              <div className="relative">
                <button
                  ref={addFriendButtonRef}
                  className="p-2 hover:bg-base-300 rounded-md relative"
                  onClick={handleAddFriend}
                  aria-label="Add Friend"
                >
                  <UserPlus className="w-5 h-5" />
                  {/* Friend request notification indicator */}
                  {friendRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                      {friendRequests.length > 9 ? "9+" : friendRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search friends..."
              className="w-full pl-8 pr-4 py-2 rounded-md bg-base-100 text-sm"
              value={searchQuery}
              onChange={handleSearchFriends}
            />
            <svg
              className="w-4 h-4 absolute left-2 top-2.5 text-base-content/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>

        {/* Loading state */}
        {isLoadingData && <SidebarSkeleton />}

        {/* Scrollable content area */}
        {!isLoadingData && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {/* Friend requests section */}

              {/* Friends list */}
              <div className="space-y-1 mt-4">
                <div className="px-2 py-1 text-xs font-semibold text-base-content/70">
                  FRIENDS
                </div>
                {friends.map((friend) => (
                  <div key={friend.friendId} className="flex items-center">
                    <button
                      className={`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-base-300 flex-grow ${
                        activeFriend === friend.friendId
                          ? "bg-primary/10 text-primary font-medium"
                          : ""
                      }`}
                      onClick={() =>
                        selectedFriendWhenClick({
                          id: friend.friendId,
                          friend: friend,
                        })
                      }
                    >
                      <div className="flex items-center justify-center">
                        <img
                          src={friend.avatar || "/avatar.png"}
                          alt=""
                          className="w-6 h-6 rounded-full mr-2"
                        />
                      </div>
                      <span className="text-sm">{friend.username}</span>
                      
                      <div>
                        {onlineUsers.includes(friend.friendId) && (
                          <span
                            className="absolute bottom-0 right-0 size-3 bg-indigo-500 
                        rounded-full ring-2 ring-zinc-900"
                          />
                        )}
                      </div>
                    </button>
                    <button
                      className="w-5 h-5 flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 rounded-full"
                      onClick={() => handleRemoveFriend(friend.friendId)}
                      title="Remove Friend"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Direct Messages section */}
              {friends.length > 0 && (
                <div className="space-y-1 mt-4 border-t border-base-300 pt-4 pb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-base-content/70">
                    DIRECT MESSAGES
                  </div>
                  {friends.map((friend) => (
                    <Link
                      key={`dm-${friend.friendId}`}
                      to={`/direct-messages/${friend.friendId}`}
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-base-300"
                    >
                      <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{friend.username}</span>
                      <MessageSquare className="ml-auto w-4 h-4 text-base-content/50" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Friend search portal */}
      <SearchFriendsPortal 
        isOpen={showFriendSearchPortal} 
        onClose={() => setShowFriendSearchPortal(false)}
      />
    </>
  );
};

export default UserFriends;
