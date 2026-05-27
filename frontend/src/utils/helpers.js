import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines clsx and tailwind-merge for optimized class handling
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date for display
 */
export function formatDate(date, format = 'short') {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;

  // Less than 1 minute
  if (diff < 60000) return 'Just now';

  // Less than 1 hour
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;

  // Less than 24 hours
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  // Less than 7 days
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  // Same year
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format message preview
 */
export function formatMessagePreview(content, type = 'text') {
  if (!content) return '';

  const maxLength = 50;
  if (content.length <= maxLength) return content;

  return content.slice(0, maxLength) + '...';
}

/**
 * Generate avatar URL
 */
export function generateAvatarUrl(seed) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Truncate text
 */
export function truncate(text, length = 100) {
  if (!text || text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * File size formatter
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate email
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Generate random ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Sleep utility
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));