import { useState, useEffect } from 'react';

/**
 * Debounce hook - delays updating value until after delay
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Local storage hook with SSR support
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error writing localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Media query hook
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * Previous value hook
 */
export function usePrevious(value) {
  const ref = { current: null };

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Intersection observer hook
 */
export function useIntersection(elementRef, options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef?.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

/**
 * Click outside hook
 */
export function useClickOutside(callback) {
  useEffect(() => {
    const handler = (event) => {
      callback(event);
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [callback]);
}