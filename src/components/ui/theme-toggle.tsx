import { useState, useEffect } from "react";
import { Button } from "./button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      className="btn theme-toggle"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? "☀️" : "🌙"}
      <span className="ml-2">{isDark ? "Light" : "Dark"} Mode</span>
    </Button>
  );
}
