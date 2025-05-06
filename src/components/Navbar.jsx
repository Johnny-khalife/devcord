import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Code, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Handle clicking outside of the mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

  // Close mobile menu when changing window size
  useEffect(() => {
    if (!isMobile) {
      setShowMobileMenu(false);
    }
  }, [isMobile]);

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
      backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Devcord</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Link
                to={"/settings"}
                className="btn btn-sm gap-2 transition-colors"
              >
                <Settings className="w-4 h-4 text-primary" />
                <span>Settings</span>
              </Link>

              {authUser && (
                <>
                  <Link to={"/profile"} className="btn btn-sm gap-2">
                    <User className="size-5 text-primary" />
                    <span>Profile</span>
                  </Link>

                  <Link to={"/code-playground"} className="btn btn-sm gap-2">
                    <Code className="size-5 text-primary" />
                    <span>Code Playground</span>
                  </Link>

                  <button className="btn btn-sm gap-2" onClick={logout}>
                    <LogOut className="size-5  text-red-500" />
                    <span className="text-red-500">Logout</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <div className="relative" ref={mobileMenuRef}>
              <button 
                onClick={toggleMobileMenu}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              {/* Mobile Menu Dropdown */}
              {showMobileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg bg-base-100 border border-base-300 overflow-hidden transition-all transform origin-top-right z-50">
                  <div className="py-1">
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">Settings</span>
                    </Link>

                    {authUser && (
                      <>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium">Profile</span>
                        </Link>

                        <Link
                          to="/code-playground"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Code className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium">Code Playground</span>
                        </Link>

                        <button
                          onClick={() => {
                            setShowMobileMenu(false);
                            logout();
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                            <LogOut className="w-4 h-4 text-red-500" />
                          </div>
                          <span className="font-medium text-red-500">Logout</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;