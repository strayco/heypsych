import React from "react";

interface Props {
  availableLetters: Set<string>;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function CrisisLetterIndex({ availableLetters }: Props) {
  const handleClick = (letter: string) => {
    const element = document.getElementById(`letter-${letter.toLowerCase()}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      aria-label="A-Z Index Navigation"
      className="hidden md:block mb-6 rounded-lg border border-separator bg-surface p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-2 text-sm font-medium text-label-primary">Jump to:</span>
        {ALPHABET.map((letter) => {
          const isAvailable = availableLetters.has(letter);
          return (
            <button
              key={letter}
              onClick={() => handleClick(letter)}
              disabled={!isAvailable}
              className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                isAvailable
                  ? "text-accent hover:bg-accent-tint-hover hover:text-accent-700 cursor-pointer"
                  : "text-label-quaternary cursor-not-allowed"
              }`}
              aria-label={
                isAvailable
                  ? `Jump to hotlines starting with ${letter}`
                  : `No hotlines starting with ${letter}`
              }
            >
              {letter}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
