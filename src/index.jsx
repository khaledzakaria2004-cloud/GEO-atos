import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";

// Apply persisted theme early (before React render) to avoid flash
try {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || !savedTheme) {
    // Default to dark mode if no theme is saved or if dark mode is explicitly set
    document.documentElement.classList.add('dark');
    if (!savedTheme) {
      localStorage.setItem('theme', 'dark');
    }
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  }
} catch (e) {
  // ignore (e.g., localStorage not available)
  // Default to dark mode if localStorage is not available
  document.documentElement.classList.add('dark');
}

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);
