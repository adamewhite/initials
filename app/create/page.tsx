'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type InitialDirection = 'A_TO_Z' | 'Z_TO_A' | 'RANDOM' | 'RANDOM_FIRST_NAMES' | 'RANDOM_LAST_NAMES' | 'CUSTOM_TEXT';

// Distribution of first letters in US first names
const FIRST_NAME_DISTRIBUTION: Record<string, number> = {
  "A": 0.09732,
  "B": 0.04452,
  "C": 0.06532,
  "D": 0.04419,
  "E": 0.06148,
  "F": 0.01092,
  "G": 0.02579,
  "H": 0.02783,
  "I": 0.01792,
  "J": 0.09966,
  "K": 0.04840,
  "L": 0.07009,
  "M": 0.06946,
  "N": 0.03119,
  "O": 0.02135,
  "P": 0.01178,
  "Q": 0.00136,
  "R": 0.04467,
  "S": 0.04202,
  "T": 0.03460,
  "U": 0.00144,
  "V": 0.00640,
  "W": 0.02751,
  "X": 0.00378,
  "Y": 0.00553,
  "Z": 0.01501
};

// Distribution of first letters in US last names
const LAST_NAME_DISTRIBUTION: Record<string, number> = {
  "A": 0.0375,
  "B": 0.0896,
  "C": 0.0638,
  "D": 0.0565,
  "E": 0.0203,
  "F": 0.0363,
  "G": 0.0534,
  "H": 0.0559,
  "I": 0.0076,
  "J": 0.0136,
  "K": 0.0570,
  "L": 0.0524,
  "M": 0.0828,
  "N": 0.0213,
  "O": 0.0163,
  "P": 0.0527,
  "Q": 0.0026,
  "R": 0.0480,
  "S": 0.1093,
  "T": 0.0388,
  "U": 0.0047,
  "V": 0.0255,
  "W": 0.0346,
  "X": 0.0002,
  "Y": 0.0065,
  "Z": 0.0129
};

// NATO phonetic alphabet for team names
const NATO_ALPHABET = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu'
];

export default function InitiatePage() {
  const router = useRouter();
  const [numTeams, setNumTeams] = useState(2);
  const [timerDuration, setTimerDuration] = useState(60);
  const [firstInitialDirection, setFirstInitialDirection] = useState<InitialDirection>('A_TO_Z');
  const [secondInitialDirection, setSecondInitialDirection] = useState<InitialDirection>('Z_TO_A');
  const [loading, setLoading] = useState(false);

  // Random letter sequences (generated once when component mounts or when random is selected)
  const [randomFirstLetters, setRandomFirstLetters] = useState<string[]>([]);
  const [randomSecondLetters, setRandomSecondLetters] = useState<string[]>([]);

  // Custom text inputs
  const [firstCustomText, setFirstCustomText] = useState('');
  const [secondCustomText, setSecondCustomText] = useState('');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const generateGameCode = () => {
    const adjectives = [
      'Icy', 'Hot', 'Red', 'Blue', 'Big', 'Tiny', 'Fast', 'Slow', 'Wild', 'Calm',
      'Dark', 'Lite', 'Cool', 'Warm', 'Bold', 'Soft', 'Hard', 'Rare', 'Wide', 'High',
      'Low', 'Neat', 'Odd', 'Old', 'New', 'Raw', 'Pure', 'Rich', 'Dull', 'Loud',
      'Pink', 'Gray', 'Gold', 'Sour', 'Flat', 'Deep', 'Weak', 'Long', 'Tall', 'Kind'
    ];

    const nouns = [
      'Apple', 'Bear', 'Cloud', 'Dog', 'Eagle', 'Fox', 'Game', 'Hero', 'Iron', 'Jade',
      'King', 'Lion', 'Moon', 'Night', 'Ocean', 'Path', 'Queen', 'River', 'Star', 'Tree',
      'Unicorn', 'Viper', 'Wave', 'Xerus', 'Yacht', 'Zebra', 'Fire', 'Wind', 'Rain', 'Snow',
      'Stone', 'Pearl', 'Flame', 'Storm', 'Light', 'Dawn', 'Dusk', 'Shark', 'Tiger', 'Wolf'
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return adjective + noun;
  };

  const shuffleLetters = (): string[] => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    // Fisher-Yates shuffle
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  };

  const getWeightedRandomLetter = (distribution: Record<string, number>): string => {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const [letter, probability] of Object.entries(distribution)) {
      cumulativeProbability += probability;
      if (random < cumulativeProbability) {
        return letter;
      }
    }

    // Fallback (should never reach here if probabilities sum to 1)
    return 'A';
  };

  const extractAlphabeticCharacters = (text: string): string[] => {
    // Extract only alphabetic characters from the text
    const alphabeticOnly = text.replace(/[^a-zA-Z]/g, '');
    // Convert to uppercase and split into array
    return alphabeticOnly.toUpperCase().split('');
  };

  const getInitialForRow = (rowIndex: number, direction: InitialDirection, randomLetters: string[], customText: string): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (direction === 'A_TO_Z') {
      return letters[rowIndex % 26];
    } else if (direction === 'Z_TO_A') {
      return letters[25 - (rowIndex % 26)];
    } else if (direction === 'RANDOM') {
      // RANDOM - use the pre-generated random letters (each letter once)
      return randomLetters[rowIndex] || 'A';
    } else if (direction === 'RANDOM_FIRST_NAMES') {
      // Weighted random based on first name distribution (can repeat)
      return getWeightedRandomLetter(FIRST_NAME_DISTRIBUTION);
    } else if (direction === 'RANDOM_LAST_NAMES') {
      // Weighted random based on last name distribution (can repeat)
      return getWeightedRandomLetter(LAST_NAME_DISTRIBUTION);
    } else if (direction === 'CUSTOM_TEXT') {
      // Extract alphabetic characters from custom text
      const extractedLetters = extractAlphabeticCharacters(customText);
      // Use the letter at the row index, or 'A' if not enough letters
      return extractedLetters[rowIndex] || 'A';
    }
    return 'A';
  };

  const generateInitialsForRow = (rowIndex: number): string => {
    // Generate random letters if needed
    let firstLetters = randomFirstLetters;
    let secondLetters = randomSecondLetters;

    if (firstInitialDirection === 'RANDOM' && firstLetters.length === 0) {
      firstLetters = shuffleLetters();
      setRandomFirstLetters(firstLetters);
    }

    if (secondInitialDirection === 'RANDOM' && secondLetters.length === 0) {
      secondLetters = shuffleLetters();
      setRandomSecondLetters(secondLetters);
    }

    const first = getInitialForRow(rowIndex, firstInitialDirection, firstLetters, firstCustomText);
    const second = getInitialForRow(rowIndex, secondInitialDirection, secondLetters, secondCustomText);
    return first + second;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[Create] handleSubmit called');
    e.preventDefault();
    console.log('[Create] preventDefault called');
    setLoading(true);

    try {
      let gameCode = generateGameCode();
      console.log('[Create] Game code generated:', gameCode);

      // Generate random letters if needed BEFORE the loop
      let firstLetters = randomFirstLetters;
      let secondLetters = randomSecondLetters;

      if (firstInitialDirection === 'RANDOM' && firstLetters.length === 0) {
        firstLetters = shuffleLetters();
        setRandomFirstLetters(firstLetters);
      }

      if (secondInitialDirection === 'RANDOM' && secondLetters.length === 0) {
        secondLetters = shuffleLetters();
        setRandomSecondLetters(secondLetters);
      }

      // Generate all 26 rows of initials, ensuring uniqueness
      const allInitials: string[] = [];
      const usedPairs = new Set<string>();

      // For custom text, extract letters and track positions
      const firstCustomLetters = firstInitialDirection === 'CUSTOM_TEXT'
        ? extractAlphabeticCharacters(firstCustomText)
        : [];
      const secondCustomLetters = secondInitialDirection === 'CUSTOM_TEXT'
        ? extractAlphabeticCharacters(secondCustomText)
        : [];
      let firstCustomIndex = 0;
      let secondCustomIndex = 0;

      const isWeightedRandom = firstInitialDirection === 'RANDOM_FIRST_NAMES' ||
                               firstInitialDirection === 'RANDOM_LAST_NAMES' ||
                               secondInitialDirection === 'RANDOM_FIRST_NAMES' ||
                               secondInitialDirection === 'RANDOM_LAST_NAMES';

      const hasCustomText = firstInitialDirection === 'CUSTOM_TEXT' ||
                           secondInitialDirection === 'CUSTOM_TEXT';

      for (let i = 0; i < 26; i++) {
        let pair = '';
        let attempts = 0;
        const maxAttempts = 100;

        do {
          // Generate first initial
          let first = '';
          if (firstInitialDirection === 'CUSTOM_TEXT') {
            if (firstCustomIndex < firstCustomLetters.length) {
              first = firstCustomLetters[firstCustomIndex];
            } else {
              // Out of custom text, use random letter
              first = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
          } else {
            first = getInitialForRow(i, firstInitialDirection, firstLetters, firstCustomText);
          }

          // Generate second initial
          let second = '';
          if (secondInitialDirection === 'CUSTOM_TEXT') {
            if (secondCustomIndex < secondCustomLetters.length) {
              second = secondCustomLetters[secondCustomIndex];
            } else {
              // Out of custom text, use random letter
              second = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
          } else {
            second = getInitialForRow(i, secondInitialDirection, secondLetters, secondCustomText);
          }

          pair = first + second;

          // If duplicate found and using custom text or weighted random, try next position
          if (usedPairs.has(pair) && (hasCustomText || isWeightedRandom)) {
            if (firstInitialDirection === 'CUSTOM_TEXT') {
              firstCustomIndex++;
            }
            if (secondInitialDirection === 'CUSTOM_TEXT') {
              secondCustomIndex++;
            }
          } else {
            // No duplicate, advance to next position for next row
            if (firstInitialDirection === 'CUSTOM_TEXT') {
              firstCustomIndex++;
            }
            if (secondInitialDirection === 'CUSTOM_TEXT') {
              secondCustomIndex++;
            }
            break;
          }

          attempts++;
        } while (usedPairs.has(pair) && attempts < maxAttempts);

        allInitials.push(pair);
        usedPairs.add(pair);
      }

      // Create the game with initials for each row (with retry logic for duplicate codes)
      let game;
      let gameError;
      let retryCount = 0;
      const maxRetries = 5;

      do {
        console.log('[Create] Creating game with:', {
          code: gameCode,
          num_teams: numTeams,
          timer_duration: timerDuration,
          initials_count: allInitials.length,
          attempt: retryCount + 1
        });

        const result = await supabase
          .from('games')
          .insert({
            code: gameCode,
            num_teams: numTeams,
            timer_duration: timerDuration,
            status: 'waiting',
            initials_row1: allInitials[0],
            initials_row2: allInitials[1],
            initials_row3: allInitials[2],
            all_initials: allInitials
          })
          .select()
          .single();

        game = result.data;
        gameError = result.error;

        console.log('[Create] Game created:', game, 'Error:', gameError);

        // If duplicate key error, generate new code and retry
        if (gameError && gameError.code === '23505') {
          gameCode = generateGameCode();
          console.log('[Create] Duplicate code detected, retrying with new code:', gameCode);
          retryCount++;
        } else {
          break;
        }
      } while (retryCount < maxRetries);

      if (gameError) throw gameError;

      // Create the initiator player (automatically assigned to Team Alpha - team_number 1)
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          game_id: game.id,
          name: 'Alpha Player 1', // Temporary name for tracking
          is_initiator: true,
          team_number: 1 // Alpha team
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Store player ID in localStorage
      if (playerData) {
        localStorage.setItem(`player_${game.id}`, playerData.id);

        // Update game with initiator_id
        await supabase
          .from('games')
          .update({ initiator_id: playerData.id })
          .eq('id', game.id);
      }

      // Navigate to waiting room
      console.log('[Create] Navigating to waiting room:', `/waiting/${game.id}`);
      router.push(`/waiting/${game.id}`);
    } catch (error: any) {
      console.error('[Create] Error creating game:', error);
      alert(`Failed to create game: ${error.message || 'Please try again.'}`);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="w-full max-w-md mx-auto mb-12">
        <Link href="/" className="inline-block mb-8">
          <h1 className="text-4xl font-light italic text-amber-500 tracking-wide font-[family-name:var(--font-sometype-mono)]">
            INITIALS
          </h1>
        </Link>

        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          Create Game
        </h1>

        <form onSubmit={handleSubmit} className="bg-gradient-to-r from-cyan-700 to-cyan-600 rounded-lg shadow-lg p-6 space-y-6">
          <div>
            <label htmlFor="numTeams" className="block text-lg font-medium text-amber-500 mb-2">
              Number of Teams
            </label>
            <select
              id="numTeams"
              value={numTeams}
              onChange={(e) => setNumTeams(parseInt(e.target.value))}
              required
              className="w-full pl-4 pr-10 py-3 border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900 bg-blue-50 text-lg"
            >
              {[2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="timerDuration" className="block text-lg font-medium text-amber-500 mb-2">
              Game Length
            </label>
            <select
              id="timerDuration"
              value={timerDuration}
              onChange={(e) => setTimerDuration(parseInt(e.target.value))}
              required
              className="w-full pl-4 pr-10 py-3 border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900 bg-blue-50 text-lg"
            >
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={180}>3 minutes</option>
              <option value={240}>4 minutes</option>
              <option value={300}>5 minutes</option>
              <option value={360}>6 minutes</option>
              <option value={420}>7 minutes</option>
              <option value={480}>8 minutes</option>
              <option value={540}>9 minutes</option>
              <option value={600}>10 minutes</option>
            </select>
          </div>

          <div>
            <label htmlFor="firstInitial" className="block text-lg font-medium text-amber-500 mb-2">
              First Initial
            </label>
            <select
              id="firstInitial"
              value={firstInitialDirection}
              onChange={(e) => {
                const newDirection = e.target.value as InitialDirection;
                setFirstInitialDirection(newDirection);
                // Reset random letters when changing away from random
                if (newDirection !== 'RANDOM') {
                  setRandomFirstLetters([]);
                }
                // Clear custom text when changing away from custom
                if (newDirection !== 'CUSTOM_TEXT') {
                  setFirstCustomText('');
                }
              }}
              className="w-full pl-4 pr-10 py-3 border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900 bg-blue-50 text-lg"
            >
              <option value="A_TO_Z">A to Z</option>
              <option value="Z_TO_A">Z to A</option>
              <option value="RANDOM">Random (Each Letter Once)</option>
              <option value="RANDOM_FIRST_NAMES">Random (Weighted by First Name Frequency)</option>
              <option value="CUSTOM_TEXT">Custom Text</option>
            </select>

            {firstInitialDirection === 'CUSTOM_TEXT' && (
              <div className="mt-3">
                <label htmlFor="firstCustomText" className="block text-xs font-medium text-sky-200 mb-1">
                  Paste your text (first 26 letters will be used)
                </label>
                <textarea
                  id="firstCustomText"
                  value={firstCustomText}
                  onChange={(e) => setFirstCustomText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-sky-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-sm text-gray-900 bg-blue-50"
                  placeholder="Enter or paste text here..."
                />
                <p className="text-xs text-sky-200 mt-1">
                  {extractAlphabeticCharacters(firstCustomText).length} alphabetic characters found
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="secondInitial" className="block text-lg font-medium text-amber-500 mb-2">
              Second Initial
            </label>
            <select
              id="secondInitial"
              value={secondInitialDirection}
              onChange={(e) => {
                const newDirection = e.target.value as InitialDirection;
                setSecondInitialDirection(newDirection);
                // Reset random letters when changing away from random
                if (newDirection !== 'RANDOM') {
                  setRandomSecondLetters([]);
                }
                // Clear custom text when changing away from custom
                if (newDirection !== 'CUSTOM_TEXT') {
                  setSecondCustomText('');
                }
              }}
              className="w-full pl-4 pr-10 py-3 border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900 bg-blue-50 text-lg"
            >
              <option value="A_TO_Z">A to Z</option>
              <option value="Z_TO_A">Z to A</option>
              <option value="RANDOM">Random (Each Letter Once)</option>
              <option value="RANDOM_LAST_NAMES">Random (Weighted by Last Name Frequency)</option>
              <option value="CUSTOM_TEXT">Custom Text</option>
            </select>

            {secondInitialDirection === 'CUSTOM_TEXT' && (
              <div className="mt-3">
                <label htmlFor="secondCustomText" className="block text-xs font-medium text-sky-200 mb-1">
                  Paste your text (first 26 letters will be used)
                </label>
                <textarea
                  id="secondCustomText"
                  value={secondCustomText}
                  onChange={(e) => setSecondCustomText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-sky-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-sm text-gray-900 bg-blue-50"
                  placeholder="Enter or paste text here..."
                />
                <p className="text-xs text-sky-200 mt-1">
                  {extractAlphabeticCharacters(secondCustomText).length} alphabetic characters found
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-800 hover:bg-cyan-900 disabled:bg-cyan-950 text-white font-light py-4 px-6 rounded-lg text-2xl transition-colors"
          >
            {loading ? 'Creating Game...' : 'Create Game'}
          </button>
        </form>

        <button
          onClick={() => router.push('/')}
          className="w-full mt-8 text-gray-300 hover:text-white font-medium text-xl"
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
