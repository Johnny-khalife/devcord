import { useThemeStore } from "../store/useThemeStore";
import { Sun, Moon } from "lucide-react";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center justify-center w-full">
      <div className="relative flex items-center justify-between w-full max-w-md p-1 bg-base-200 rounded-full">
        <button
          onClick={() => setTheme("light")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
            theme === "light"
              ? "bg-primary text-primary-content shadow-lg"
              : "text-base-content/70 hover:text-base-content"
          }`}
        >
          <Sun className="w-4 h-4" />
          <span className="text-sm font-medium">Light</span>
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
            theme === "dark"
              ? "bg-primary text-primary-content shadow-lg"
              : "text-base-content/70 hover:text-base-content"
          }`}
        >
          <Moon className="w-4 h-4" />
          <span className="text-sm font-medium">Dark</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeSwitcher; 