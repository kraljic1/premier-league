"use client";

import { useEffect, useRef, useState } from 'react';

interface ContentRevealOptions {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  staggerDelay?: number;
  triggerOnce?: boolean;
}

export function useContentReveal(options: ContentRevealOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    delay = 0,
    staggerDelay = 0,
    triggerOnce = true,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure we're mounted before setting up observer
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!mounted) return;
    
    const element = elementRef.current;
    if (!element || typeof window === 'undefined') return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Cleanup previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    let isMounted = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!isMounted) return;
        
        if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
          timeoutRef.current = setTimeout(() => {
            if (isMounted) {
              setIsVisible(true);
              if (triggerOnce) {
                setHasTriggered(true);
              }
            }
          }, delay);
        } else if (!triggerOnce && !entry.isIntersecting) {
          if (isMounted) {
            setIsVisible(false);
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current = observer;
    observer.observe(element);

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [threshold, rootMargin, delay, triggerOnce, hasTriggered, mounted]);

  const refCallback = (element: HTMLElement | null) => {
    elementRef.current = element;
  };

  return { elementRef: refCallback, isVisible };
}

export function useStaggeredReveal(
  itemCount: number,
  options: ContentRevealOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    delay = 0,
    staggerDelay = 100,
    triggerOnce = true,
  } = options;

  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Ensure we're mounted before setting up observer
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!mounted) return;
    
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Cleanup all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();

    let isMounted = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!isMounted) return;
        
        if (entry.isIntersecting) {
          // Trigger staggered animations for all items
          itemRefs.current.forEach((item, index) => {
            if (item) {
              const timeout = setTimeout(() => {
                if (isMounted) {
                  setVisibleItems(prev => {
                    const next = new Set(prev);
                    next.add(index);
                    return next;
                  });
                }
              }, delay + (index * staggerDelay));
              timeoutRefs.current.set(index, timeout);
            }
          });
        } else if (!triggerOnce) {
          if (isMounted) {
            setVisibleItems(new Set());
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current = observer;
    observer.observe(container);

    return () => {
      isMounted = false;
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [threshold, rootMargin, delay, staggerDelay, triggerOnce, itemCount, mounted]);

  const getItemRef = (index: number) => (el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  };

  const isItemVisible = (index: number) => visibleItems.has(index);

  return { containerRef, getItemRef, isItemVisible };
}