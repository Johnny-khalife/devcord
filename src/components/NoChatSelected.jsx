import { MessageSquare, Hash } from "lucide-react";

const NoChatSelected = ({ activeNavItem }) => {
  // Customize the content based on the active navigation item
  const isWorkspace = activeNavItem === "workSpace";
  
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6 pt-28 ">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce"
            >
              {isWorkspace ? (
                <Hash className="w-10 h-10 text-primary" />
              ) : (
                <MessageSquare className="w-10 h-10 text-primary" />
              )}
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold">
          {isWorkspace 
            ? "No Channel Selected" 
            : "Welcome to Devcord!"}
        </h2>
        <p className="text-base-content/60">
          {isWorkspace
            ? "Select a channel from the sidebar to start chatting"
            : "Select a conversation from the sidebar to start chatting"}
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;