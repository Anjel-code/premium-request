/*
 * COLOR THEMES FILE
 * 
 * This file stores different color schemes for the website.
 * When you need to update colors, just modify the 'current' theme object.
 * 
 * USAGE:
 * - To change colors: Update the 'current' theme object with new colors
 * - To add new themes: Add a new theme object with a descriptive name
 * - To switch themes: Change the 'current' export to point to a different theme
 * 
 * Each theme should have:
 * - accent: Primary brand color (buttons, highlights, etc.)
 * - secondary: Secondary brand color (text, borders, etc.)
 * - neutral: Background/neutral color (backgrounds, cards, etc.)
 */

export const themes = {
  // Current luxury watch theme
  luxuryWatch: {
    name: "Luxury Watch",
    accent: "#C6A678", // Muted gold - luxury symbol
    secondary: "#5B6C7B", // Refined cool grey - professional feel
    neutral: "#F5F5F5" // Off-white - clean minimalistic background
  },
  
  // Purple theme (previous)
  purple: {
    name: "Purple",
    accent: "#8B5CF6",
    secondary: "#6B7280",
    neutral: "#F9FAFB"
  }
};

// Export the current theme (change this to switch themes)
export const current = themes.luxuryWatch;

// Helper function to get current theme colors
export const getCurrentColors = () => current; 