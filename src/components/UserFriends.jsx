import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserPlus,
  Users,
  MessageSquare,
  X,
  Menu,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  User,
  AlertCircle,
  Ban,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendsStore";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import SearchFriendsPortal from "./SearchFriendsPortal";

const UserFriends = ({ isUserFriendsSidebarOpen, setIsUserFriendsSidebarOpen }) => {
  // State management
  const [activeFriend, setActiveFriend] = useState(null);
  const [showFriendSearchPortal, setShowFriendSearchPortal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFriendActions, setShowFriendActions] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showBlockedUsersModal, setShowBlockedUsersModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const { setSelectedFriend } = useChatStore();
  const navigate = useNavigate();

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

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
    window.addEventListener("resize", checkIfMobile);

    // Listen for custom toggle event from ChatHeader
    const handleToggleSidebar = () => {
      setIsUserFriendsSidebarOpen((prev) => !prev);
    };

    window.addEventListener("toggle-user-friends-sidebar", handleToggleSidebar);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
      window.removeEventListener(
        "toggle-user-friends-sidebar",
        handleToggleSidebar
      );
    };
  }, [setIsUserFriendsSidebarOpen]);

  // Get auth store functions and state
  const { isLoading: authLoading, onlineUsers } = useAuthStore();

  // Get friend store functions and state
  const {
    friendRequests,
    friends,
    blockedUsers,
    getFriendRequests,
    getFriendsList,
    getBlockedUsers,
    removeFriend,
    blockUser,
    unblockUser,
    isLoading: friendLoading,
  } = useFriendStore();

  // Refs for click outside detection
  const addFriendButtonRef = useRef(null);
  const friendActionsRef = useRef(null);

  // Close friend actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        friendActionsRef.current &&
        !friendActionsRef.current.contains(event.target)
      ) {
        setShowFriendActions(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    const loadData = async () => {
      await getFriendsList();
      await getFriendRequests();
      await getBlockedUsers();
    };

    loadData();

    // Reset selectedFriend when the component mounts
    // This ensures that when switching back to the Friends view, no friend is pre-selected
    setSelectedFriend(null);
    setActiveFriend(null);
  }, [getFriendsList, getFriendRequests, getBlockedUsers, setSelectedFriend]);

  // Handler functions
  const handleAddFriend = () => {
    setShowFriendSearchPortal(true);
  };

  const handleShowBlockedUsers = () => {
    setShowBlockedUsersModal(true);
  };

  const handleRemoveFriend = async (userId) => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      await removeFriend(userId);
      setShowFriendActions(null);
    }
  };

  const handleBlockFriend = async (userId, username) => {
    // Show block modal instead of immediate confirmation
    setUserToBlock({ id: userId, username });
    setShowBlockModal(true);
    setShowFriendActions(null);
  };

  const confirmBlock = async () => {
    if (userToBlock) {
      await blockUser(userToBlock.id);
      setShowBlockModal(false);
      setUserToBlock(null);
    }
  };

  const cancelBlock = () => {
    setShowBlockModal(false);
    setUserToBlock(null);
  };

  const handleUnblockUser = async (userId) => {
    if (window.confirm("Are you sure you want to unblock this user?")) {
      await unblockUser(userId);
    }
  };

  const handleViewProfile = (friendId) => {
    navigate(`/profile/${friendId}`);
    setShowFriendActions(null);
  };

  // Toggle friend actions dropdown
  const toggleFriendActions = (friendId) => {
    setShowFriendActions(showFriendActions === friendId ? null : friendId);
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

  // Empty state if no friends and no friend requests
  if (
    friends.length === 0 &&
    friendRequests.length === 0 &&
    blockedUsers.length === 0 &&
    !isLoadingData
  ) {
    return (
      <>
       
        <div
          className={`
          ${isMobile ? "fixed left-0 top-16 bottom-0 z-30" : "w-72"} 
          ${
            isMobile && !isUserFriendsSidebarOpen
              ? "translate-x-[-100%]"
              : "translate-x-0"
          }
          bg-base-200 h-full border-r border-base-300 flex flex-col items-center justify-center p-4
          transition-transform duration-300 ease-in-out
        `}
        >
          <div className="text-center mb-4 w-60">
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
      
      <div
        className={`
        ${isMobile ? "fixed left-0 top-16 bottom-0 z-30 w-56" : "h-full"} 
        ${
          isMobile && !isUserFriendsSidebarOpen
            ? "translate-x-[-100%]"
            : "translate-x-0"
        }
        bg-base-200 h-full border-r border-base-300 flex flex-col
        transition-transform duration-300 ease-in-out
      `}
      >
        {/* Header with title and search - fixed at top */}
        <div className="p-4 border-b border-base-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg" >Friends</h2>
            <div className="flex items-center relative gap-2">
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

              {/* Blocked Users Button */}
              <div className="relative">
                <button
                  className="p-2 hover:bg-base-300 rounded-md relative"
                  onClick={handleShowBlockedUsers}
                  aria-label="Blocked Users"
                >
                  <Ban className="w-5 h-5" />
                  {/* Blocked users count indicator */}
                  {blockedUsers.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {blockedUsers.length > 9 ? "9+" : blockedUsers.length}
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
                    <div className="relative">
                      <button
                        className="w-8 h-8 flex items-center justify-center hover:bg-base-300 rounded-full"
                        onClick={() => toggleFriendActions(friend.friendId)}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {showFriendActions === friend.friendId && (
                        <div
                          className="absolute right-0 mt-1 w-40 bg-base-100 shadow-lg rounded-md z-50 py-1"
                          ref={friendActionsRef}
                        >
                          <button
                            className="w-full px-3 py-2 text-sm text-left hover:bg-base-200 flex items-center gap-2"
                            onClick={() => handleViewProfile(friend.friendId)}
                          >
                            <User size={14} />
                            View Profile
                          </button>
                          <button
                            className="w-full px-3 py-2 text-sm text-left hover:bg-base-200 flex items-center gap-2"
                            onClick={() => handleRemoveFriend(friend.friendId)}
                          >
                            <X size={14} />
                            Remove Friend
                          </button>
                          <button
                            className="w-full px-3 py-2 text-sm text-left hover:bg-base-200 flex items-center gap-2 text-red-500"
                            onClick={() =>
                              handleBlockFriend(
                                friend.friendId,
                                friend.username
                              )
                            }
                          >
                            <ShieldAlert size={14} />
                            <div>
                              <span>Block User</span>
                              <p className="text-xs text-gray-500">
                                Prevents all interaction
                              </p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Friend search portal */}
      <SearchFriendsPortal
        isOpen={showFriendSearchPortal}
        onClose={() => setShowFriendSearchPortal(false)}
      />

      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-base-300 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">
                Block {userToBlock?.username}
              </h3>
            </div>

            <div className="p-6">
              <p className="mb-4 text-sm text-base-content/80">
                Blocking this user will:
              </p>

              <ul className="mb-6 space-y-2 text-sm text-base-content/70 pl-5">
                <li className="list-disc">Prevent them from messaging you</li>
                <li className="list-disc">
                  Remove them from your friends list
                </li>
                <li className="list-disc">
                  Cancel any pending friend requests
                </li>
                <li className="list-disc">Hide your activity from them</li>
              </ul>

              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelBlock}
                  className="px-4 py-2 rounded-md bg-base-200 hover:bg-base-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBlock}
                  className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                >
                  Block User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Users Modal */}
      {showBlockedUsersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-base-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Ban size={20} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Blocked Users</h3>
              </div>
              <button
                onClick={() => setShowBlockedUsersModal(false)}
                className="p-1 hover:bg-base-200 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {blockedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Ban
                    size={40}
                    className="mx-auto text-base-content/30 mb-3"
                  />
                  <p className="text-base-content/70">
                    You haven't blocked any users
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-base-300/30 rounded-md p-3 mb-4">
                    <p className="text-xs text-base-content/70">
                      Blocked users cannot message you, see your activity, or
                      add you as a friend
                    </p>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {blockedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center bg-red-500/5 rounded-md border-l-2 border-red-500"
                      >
                        <div className="flex items-center gap-2 px-3 py-3 rounded-md flex-grow">
                          <div className="flex items-center justify-center relative">
                            <img
                              src={user.avatar || "/avatar.png"}
                              alt=""
                              className="w-8 h-8 rounded-full mr-2 grayscale"
                            />
                            <div className="absolute -bottom-1 -right-1">
                              <ShieldAlert size={12} className="text-red-500" />
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-base-content/70 line-through">
                              {user.username}
                            </span>
                            {user.blockedAt && (
                              <p className="text-xs text-base-content/50">
                                Blocked on{" "}
                                {new Date(user.blockedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div
                          className="tooltip tooltip-left"
                          data-tip="Unblock this user"
                        >
                          <button
                            className="w-10 h-10 flex items-center justify-center hover:bg-base-300 rounded-full text-green-500 mr-2"
                            onClick={() => handleUnblockUser(user.id)}
                            title="Unblock User"
                          >
                            <ShieldCheck size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserFriends;
