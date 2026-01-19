"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

export function HelpModal({ isOpen, onClose, title, content }: HelpModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Ensure portal mounts only on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);

      // Save scroll position and lock body to prevent page jump
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = "hidden";

      setIsAnimating(true);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);

      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset animation when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Don't render on server or if not mounted
  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className={`help-modal-overlay ${isAnimating ? "help-modal-overlay--open" : ""}`}>
      <div
        className={`help-modal ${isAnimating ? "help-modal--open" : ""}`}
        ref={modalRef}
      >
        <div className="help-modal__header">
          <h3 className="help-modal__title">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="help-modal__close"
            aria-label="Close help modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="help-modal__content">
          {content}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
}