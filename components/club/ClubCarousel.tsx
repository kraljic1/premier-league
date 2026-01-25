"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CLUBS } from "@/lib/clubs";
import { SafeImage } from "@/components/SafeImage";

export function ClubCarousel() {
  const clubs = Object.values(CLUBS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group">
      {/* Navigation Buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 transition-all"
          aria-label="Scroll left"
        >
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 transition-all"
          aria-label="Scroll right"
        >
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto gap-6 py-8 px-4 no-scrollbar snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {clubs.map((club) => (
          <Link
            key={club.id}
            href={`/club/${club.id}`}
            className="flex-shrink-0 w-64 snap-center group/card"
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center"
              style={{ borderTop: `4px solid ${club.primaryColor}` }}
            >
              <div className="w-32 h-32 mb-6 relative flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-full p-4 group-hover/card:scale-110 transition-transform duration-300">
                <SafeImage
                  src={club.logoUrl || ""}
                  alt={`${club.name} logo`}
                  width={100}
                  height={100}
                  className="object-contain"
                  unoptimized={club.logoUrl?.endsWith(".svg")}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover/card:text-purple-600 transition-colors">
                {club.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {club.shortName}
              </p>
              <div className="mt-6 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400 text-sm font-semibold opacity-0 group-hover/card:opacity-100 transition-opacity">
                View Details
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
