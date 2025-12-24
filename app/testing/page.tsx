'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CircleHelp, CheckCircle, XCircle } from 'lucide-react';

type InitialDirection = 'A_TO_Z' | 'Z_TO_A' | 'RANDOM' | 'RANDOM_FIRST_NAMES' | 'RANDOM_LAST_NAMES' | 'CUSTOM_TEXT';

// Distribution of first letters in US first names
const FIRST_NAME_DISTRIBUTION: Record<string, number> = {
  "A": 0.09732, "B": 0.04452, "C": 0.06532, "D": 0.04419, "E": 0.06148, "F": 0.01092,
  "G": 0.02579, "H": 0.02783, "I": 0.01792, "J": 0.09966, "K": 0.04840, "L": 0.07009,
  "M": 0.06946, "N": 0.03119, "O": 0.02135, "P": 0.01178, "Q": 0.00136, "R": 0.04467,
  "S": 0.04202, "T": 0.03460, "U": 0.00144, "V": 0.00640, "W": 0.02751, "X": 0.00378,
  "Y": 0.00553, "Z": 0.01501
};

// Distribution of first letters in US last names
const LAST_NAME_DISTRIBUTION: Record<string, number> = {
  "A": 0.0375, "B": 0.0896, "C": 0.0638, "D": 0.0565, "E": 0.0203, "F": 0.0363,
  "G": 0.0534, "H": 0.0559, "I": 0.0076, "J": 0.0136, "K": 0.0570, "L": 0.0524,
  "M": 0.0828, "N": 0.0213, "O": 0.0163, "P": 0.0527, "Q": 0.0026, "R": 0.0480,
  "S": 0.1093, "T": 0.0388, "U": 0.0047, "V": 0.0255, "W": 0.0346, "X": 0.0002,
  "Y": 0.0065, "Z": 0.0129
};

// Mock GameBoard Component
function MockGameBoard() {
  const [firstInitialDirection, setFirstInitialDirection] = useState<InitialDirection>('A_TO_Z');
  const [secondInitialDirection, setSecondInitialDirection] = useState<InitialDirection>('Z_TO_A');
  const [firstCustomText, setFirstCustomText] = useState('');
  const [secondCustomText, setSecondCustomText] = useState('');
  const [randomFirstLetters, setRandomFirstLetters] = useState<string[]>([]);
  const [randomSecondLetters, setRandomSecondLetters] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(90); // Mock timer starting at 90 seconds

  // Generate 26 rows with A-Z and Z-A pattern
  const [answers, setAnswers] = useState(
    Array.from({ length: 26 }, (_, i) => ({
      row: i,
      initial1: String.fromCharCode(65 + i), // A-Z
      initial2: String.fromCharCode(90 - i), // Z-A
      word1: '',
      word2: '',
      word1Valid: true,
      word2Valid: true
    }))
  );

  const shuffleLetters = (): string[] => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
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
    return 'A';
  };

  const extractAlphabeticCharacters = (text: string): string[] => {
    const alphabeticOnly = text.replace(/[^a-zA-Z]/g, '');
    return alphabeticOnly.toUpperCase().split('');
  };

  const getInitialForRow = (rowIndex: number, direction: InitialDirection, randomLetters: string[], customText: string): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (direction === 'A_TO_Z') {
      return letters[rowIndex % 26];
    } else if (direction === 'Z_TO_A') {
      return letters[25 - (rowIndex % 26)];
    } else if (direction === 'RANDOM') {
      return randomLetters[rowIndex] || 'A';
    } else if (direction === 'RANDOM_FIRST_NAMES') {
      return getWeightedRandomLetter(FIRST_NAME_DISTRIBUTION);
    } else if (direction === 'RANDOM_LAST_NAMES') {
      return getWeightedRandomLetter(LAST_NAME_DISTRIBUTION);
    } else if (direction === 'CUSTOM_TEXT') {
      const extractedLetters = extractAlphabeticCharacters(customText);
      return extractedLetters[rowIndex] || 'A';
    }
    return 'A';
  };

  // Mock timer countdown for testing colors
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) return 90; // Reset to 90 when it hits 0
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Scroll detection for compact timer
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Regenerate initials when patterns change
  useEffect(() => {
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

    const newAnswers = Array.from({ length: 26 }, (_, i) => {
      const first = getInitialForRow(i, firstInitialDirection, firstLetters, firstCustomText);
      const second = getInitialForRow(i, secondInitialDirection, secondLetters, secondCustomText);

      return {
        row: i,
        initial1: first,
        initial2: second,
        word1: answers[i]?.word1 || '',
        word2: answers[i]?.word2 || '',
        word1Valid: true,
        word2Valid: true
      };
    });

    setAnswers(newAnswers);
  }, [firstInitialDirection, secondInitialDirection, firstCustomText, secondCustomText]);

  const validateWord = (word: string, initial: string): boolean => {
    if (!word.trim()) return true;
    return word.trim().toUpperCase().startsWith(initial.toUpperCase());
  };

  const handleInputChange = (row: number, column: 1 | 2, value: string) => {
    setAnswers(prev =>
      prev.map(answer => {
        if (answer.row !== row) return answer;

        if (column === 1) {
          return {
            ...answer,
            word1: value,
            word1Valid: validateWord(value, answer.initial1)
          };
        } else {
          return {
            ...answer,
            word2: value,
            word2Valid: validateWord(value, answer.initial2)
          };
        }
      })
    );
  };

  const handleInputBlur = (row: number, column: 1 | 2) => {
    setAnswers(prev =>
      prev.map(answer => {
        if (answer.row !== row) return answer;

        if (column === 1 && answer.word1) {
          const capitalized = answer.word1.charAt(0).toUpperCase() + answer.word1.slice(1);
          return {
            ...answer,
            word1: capitalized,
            word1Valid: validateWord(capitalized, answer.initial1)
          };
        } else if (column === 2 && answer.word2) {
          const capitalized = answer.word2.charAt(0).toUpperCase() + answer.word2.slice(1);
          return {
            ...answer,
            word2: capitalized,
            word2Valid: validateWord(capitalized, answer.initial2)
          };
        }
        return answer;
      })
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Sticky Timer */}
      <div className={`sticky top-0 z-10 bg-indigo-900 transition-all duration-300 ${
        isScrolled ? 'py-2 shadow-lg' : 'py-6'
      }`}>
        <div className="text-center">
          <div className={`font-bold transition-[font-size] duration-300 ${
            isScrolled ? 'text-3xl' : 'text-6xl'
          } ${
            timeRemaining <= 30 ? 'text-red-600 animate-pulse' :
            timeRemaining <= 60 ? 'text-orange-500' :
            'text-white'
          }`}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
          {!isScrolled && <p className="text-gray-400 mt-2">Time Remaining</p>}
        </div>
      </div>

      {/* Spacer for when timer is normal size */}
      <div className={`transition-all duration-300 ${isScrolled ? 'h-0' : 'h-6'}`}></div>

      {/* Pattern Selection */}
      <div className="mb-6 bg-gradient-to-r from-cyan-800 to-cyan-700 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* First Initial Pattern */}
          <div>
            <label className="block text-sm font-medium text-sky-200 mb-2">
              First Initial Pattern
            </label>
            <select
              value={firstInitialDirection}
              onChange={(e) => {
                const newDirection = e.target.value as InitialDirection;
                setFirstInitialDirection(newDirection);
                if (newDirection !== 'RANDOM') setRandomFirstLetters([]);
                if (newDirection !== 'CUSTOM_TEXT') setFirstCustomText('');
              }}
              className="w-full pl-3 pr-10 py-2 border border-sky-400 bg-blue-50 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="A_TO_Z">A to Z</option>
              <option value="Z_TO_A">Z to A</option>
              <option value="RANDOM">Random (Each Letter Once)</option>
              <option value="RANDOM_FIRST_NAMES">Random (Weighted by First Name Frequency)</option>
              <option value="CUSTOM_TEXT">Custom Text</option>
            </select>

            {firstInitialDirection === 'CUSTOM_TEXT' && (
              <div className="mt-2">
                <textarea
                  value={firstCustomText}
                  onChange={(e) => setFirstCustomText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-sky-400 bg-blue-50 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-sm"
                  placeholder="Paste text here..."
                />
                <p className="text-xs text-sky-200 mt-1">
                  {extractAlphabeticCharacters(firstCustomText).length} letters found
                </p>
              </div>
            )}
          </div>

          {/* Second Initial Pattern */}
          <div>
            <label className="block text-sm font-medium text-sky-200 mb-2">
              Second Initial Pattern
            </label>
            <select
              value={secondInitialDirection}
              onChange={(e) => {
                const newDirection = e.target.value as InitialDirection;
                setSecondInitialDirection(newDirection);
                if (newDirection !== 'RANDOM') setRandomSecondLetters([]);
                if (newDirection !== 'CUSTOM_TEXT') setSecondCustomText('');
              }}
              className="w-full pl-3 pr-10 py-2 border border-sky-400 bg-blue-50 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="A_TO_Z">A to Z</option>
              <option value="Z_TO_A">Z to A</option>
              <option value="RANDOM">Random (Each Letter Once)</option>
              <option value="RANDOM_LAST_NAMES">Random (Weighted by Last Name Frequency)</option>
              <option value="CUSTOM_TEXT">Custom Text</option>
            </select>

            {secondInitialDirection === 'CUSTOM_TEXT' && (
              <div className="mt-2">
                <textarea
                  value={secondCustomText}
                  onChange={(e) => setSecondCustomText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-sky-400 bg-blue-50 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-white text-sm"
                  placeholder="Paste text here..."
                />
                <p className="text-xs text-sky-200 mt-1">
                  {extractAlphabeticCharacters(secondCustomText).length} letters found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="bg-gradient-to-r from-cyan-700 to-cyan-600 rounded-lg shadow-lg p-3 md:p-6">
        <div className="space-y-2 md:space-y-3">
          {answers.map((answer) => (
            <div key={answer.row} className="grid grid-cols-[4rem_1fr_1fr] md:grid-cols-[5rem_1fr_1fr] gap-2 md:gap-4 items-center py-1 md:py-2">
              {/* Column 1: Initials for this row */}
              <div className="flex items-center justify-center gap-1">
                <div className="text-3xl font-bold tracking-wider text-amber-500 font-[family-name:var(--font-sometype-mono)]">
                  {answer.initial1}
                </div>
                <div className="text-3xl font-bold tracking-wider text-amber-500 font-[family-name:var(--font-sometype-mono)]">
                  {answer.initial2}
                </div>
              </div>

              {/* Column 2: First word input */}
              <div>
                <input
                  type="text"
                  value={answer.word1}
                  onChange={(e) => handleInputChange(answer.row, 1, e.target.value)}
                  onBlur={() => handleInputBlur(answer.row, 1)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className={`w-full px-2 md:px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-800 text-lg md:text-xl text-gray-900 ${
                    !answer.word1Valid ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={`${answer.initial1}...`}
                />
              </div>

              {/* Column 3: Second word input */}
              <div>
                <input
                  type="text"
                  value={answer.word2}
                  onChange={(e) => handleInputChange(answer.row, 2, e.target.value)}
                  onBlur={() => handleInputBlur(answer.row, 2)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className={`w-full px-2 md:px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-800 text-lg md:text-xl text-gray-900 ${
                    !answer.word2Valid ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={`${answer.initial2}...`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// NATO phonetic alphabet for team names
const NATO_ALPHABET = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu'
];

interface ValidationResult {
  status: 'idle' | 'loading' | 'valid' | 'invalid';
  url?: string;
}

interface TeamAnswer {
  teamNumber: number;
  teamName: string;
  answers: string[];
  score: number;
  validation: ValidationResult;
}

interface RowAnswers {
  rowNumber: number;
  initials: string;
  teamAnswers: TeamAnswer[];
}

// Mock Scoring Component
function MockScoring({ isInitiator }: { isInitiator: boolean }) {
  const [rowAnswers, setRowAnswers] = useState<RowAnswers[]>([
    {
      rowNumber: 0,
      initials: 'AZ',
      teamAnswers: [
        { teamNumber: 1, teamName: 'Alpha', answers: ['Apple', 'Zebra'], score: 1, validation: { status: 'idle' } },
        { teamNumber: 2, teamName: 'Bravo', answers: ['Ant', 'Zone'], score: 3, validation: { status: 'idle' } },
      ]
    },
    {
      rowNumber: 1,
      initials: 'BY',
      teamAnswers: [
        { teamNumber: 1, teamName: 'Alpha', answers: ['Brigham', 'Young'], score: 5, validation: { status: 'idle' } },
        { teamNumber: 2, teamName: 'Bravo', answers: [], score: 0, validation: { status: 'idle' } },
      ]
    },
    {
      rowNumber: 2,
      initials: 'CX',
      teamAnswers: [
        { teamNumber: 1, teamName: 'Alpha', answers: ['Cat', 'Xray'], score: 3, validation: { status: 'idle' } },
        { teamNumber: 2, teamName: 'Bravo', answers: ['Cup', 'Xylophone'], score: 3, validation: { status: 'idle' } },
      ]
    },
  ]);

  const handleScoreChange = (rowIndex: number, teamIndex: number, score: number) => {
    setRowAnswers(prev => {
      const updated = [...prev];
      updated[rowIndex].teamAnswers[teamIndex].score = score;
      return updated;
    });
  };

  const handleValidate = async (rowIndex: number, teamIndex: number) => {
    const teamAnswer = rowAnswers[rowIndex].teamAnswers[teamIndex];
    const combinedAnswer = teamAnswer.answers.join(' ');

    if (!combinedAnswer.trim()) return;

    // Set loading state
    setRowAnswers(prev => {
      const updated = [...prev];
      updated[rowIndex].teamAnswers[teamIndex].validation = { status: 'loading' };
      return updated;
    });

    try {
      // Query Wikipedia API
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(combinedAnswer)}`
      );

      if (response.ok) {
        const data = await response.json();
        // Valid - found on Wikipedia
        setRowAnswers(prev => {
          const updated = [...prev];
          updated[rowIndex].teamAnswers[teamIndex].validation = {
            status: 'valid',
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(combinedAnswer)}`
          };
          return updated;
        });
      } else {
        // Invalid - not found on Wikipedia
        setRowAnswers(prev => {
          const updated = [...prev];
          updated[rowIndex].teamAnswers[teamIndex].validation = { status: 'invalid' };
          updated[rowIndex].teamAnswers[teamIndex].score = 0; // Set score to 0
          return updated;
        });
      }
    } catch (error) {
      console.error('Error validating answer:', error);
      // Treat error as invalid
      setRowAnswers(prev => {
        const updated = [...prev];
        updated[rowIndex].teamAnswers[teamIndex].validation = { status: 'invalid' };
        updated[rowIndex].teamAnswers[teamIndex].score = 0;
        return updated;
      });
    }
  };

  const calculateTeamTotals = () => {
    const teamTotals: Record<string, number> = {};

    rowAnswers.forEach(row => {
      row.teamAnswers.forEach(teamAnswer => {
        if (!teamTotals[teamAnswer.teamName]) {
          teamTotals[teamAnswer.teamName] = 0;
        }
        teamTotals[teamAnswer.teamName] += teamAnswer.score;
      });
    });

    return Object.entries(teamTotals).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">
        Scoring
      </h1>

      <div className="space-y-8">
        {rowAnswers.map((row) => (
          <div key={row.rowNumber} className="bg-gradient-to-r from-cyan-700 to-cyan-600 rounded-lg shadow-lg p-3 md:p-6">
            {/* Row Header with Initials */}
            <div className="mb-6 pb-4 border-b border-sky-400">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl md:text-5xl font-bold text-amber-500 font-[family-name:var(--font-sometype-mono)]">{row.initials[0]}</span>
                <span className="text-4xl md:text-5xl font-bold text-amber-500 font-[family-name:var(--font-sometype-mono)]">{row.initials[1]}</span>
              </div>
            </div>

            {/* Team Answers */}
            <div className="space-y-2 md:space-y-4">
              {row.teamAnswers.map((teamAnswer, teamIdx) => (
                <div key={teamIdx} className="flex items-center gap-1 md:gap-4">
                  {/* Team Name */}
                  <div className="w-16 md:w-32 flex-shrink-0">
                    <span className="font-light text-white text-base md:text-lg">{teamAnswer.teamName}</span>
                  </div>

                  {/* Combined Answers Display */}
                  <div className="flex-1 min-w-0">
                    {teamAnswer.answers.length === 2 ? (
                      <span className="text-white text-xl md:text-4xl break-words">{teamAnswer.answers.join(' ')}</span>
                    ) : (
                      <span className="text-sky-200 italic text-base md:text-2xl">No Answer</span>
                    )}
                  </div>

                  {/* Score Dropdown */}
                  <div className="flex-shrink-0">
                    <select
                      value={teamAnswer.score}
                      onChange={(e) => handleScoreChange(row.rowNumber, teamIdx, parseInt(e.target.value))}
                      disabled={teamAnswer.answers.length !== 2 || !isInitiator}
                      className={`w-10 md:w-16 px-1 md:px-2 py-1 md:py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-white text-sm md:text-base ${
                        teamAnswer.answers.length !== 2 || !isInitiator ? 'bg-sky-100 text-gray-700 cursor-not-allowed' : 'bg-blue-50 text-gray-900'
                      }`}
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                    </select>
                  </div>

                  {/* Validation */}
                  <div className="w-12 md:w-20 flex justify-center flex-shrink-0">
                    {teamAnswer.answers.length === 2 && teamAnswer.validation.status === 'idle' && (
                      <button
                        onClick={() => handleValidate(row.rowNumber, teamIdx)}
                        className="text-white hover:text-sky-200 transition-colors"
                      >
                        <CircleHelp className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                    )}
                    {teamAnswer.validation.status === 'loading' && (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 md:h-6 md:w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                    {teamAnswer.validation.status === 'valid' && (
                      <a
                        href={teamAnswer.validation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:text-green-400 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                      </a>
                    )}
                    {teamAnswer.validation.status === 'invalid' && (
                      <button className="text-red-500 cursor-default">
                        <XCircle className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Team Totals */}
      <div className="mt-8 bg-gradient-to-r from-cyan-800 to-cyan-700 rounded-lg shadow-lg p-3 md:p-6">
        <h2 className="text-3xl font-bold text-center mb-6 text-amber-500">Team Totals</h2>
        <div className="space-y-3">
          {calculateTeamTotals().map(([teamName, total]) => (
            <div key={teamName} className="flex items-center justify-between py-3 px-6 bg-sky-500/30 rounded-lg">
              <span className="text-2xl font-light text-white">{teamName}</span>
              <span className="text-3xl font-bold text-white">{total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TestingPage() {
  const [view, setView] = useState<'gameboard' | 'scoring-initiator' | 'scoring-non-initiator'>('gameboard');

  return (
    <main className="flex min-h-screen flex-col p-3 md:p-6">
      <div className="w-full max-w-6xl mx-auto mb-12">
        <Link href="/" className="inline-block mb-6">
          <h1 className="text-4xl font-light italic text-amber-500 tracking-wide font-[family-name:var(--font-sometype-mono)]">
            INITIALS
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <div className="w-full max-w-6xl mx-auto mb-12">
        <div className="bg-gray-800 rounded-lg p-4 flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => setView('gameboard')}
            className={`px-4 py-2 rounded-md font-light transition-colors ${
              view === 'gameboard'
                ? 'bg-cyan-800 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Game Board
          </button>
          <button
            onClick={() => setView('scoring-initiator')}
            className={`px-4 py-2 rounded-md font-light transition-colors ${
              view === 'scoring-initiator'
                ? 'bg-cyan-800 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Scoring (Initiator)
          </button>
          <button
            onClick={() => setView('scoring-non-initiator')}
            className={`px-4 py-2 rounded-md font-light transition-colors ${
              view === 'scoring-non-initiator'
                ? 'bg-cyan-800 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Scoring (Non-Initiator)
          </button>
          <Link
            href="/create"
            className="px-4 py-2 rounded-md font-light bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Create Page
          </Link>
          <Link
            href="/join"
            className="px-4 py-2 rounded-md font-light bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Join Page
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-md font-light bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>

      {/* Content */}
      {view === 'gameboard' && <MockGameBoard />}
      {view === 'scoring-initiator' && <MockScoring isInitiator={true} />}
      {view === 'scoring-non-initiator' && <MockScoring isInitiator={false} />}
    </main>
  );
}
