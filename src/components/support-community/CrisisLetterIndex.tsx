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
      className="hidden md:block mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-2 text-sm font-medium text-slate-600">Jump to:</span>
        {ALPHABET.map((letter) => {
          const isAvailable = availableLetters.has(letter);
          return (
            <button
              key={letter}
              onClick={() => handleClick(letter)}
              disabled={!isAvailable}
              className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isAvailable
                  ? "text-blue-600 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
                  : "text-slate-300 cursor-not-allowed"
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
