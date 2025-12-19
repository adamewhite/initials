'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface GameBoardProps {
  gameId: string;
  timerDuration: number;
  startedAt: string;
  isInitiator: boolean;
  onReset: () => void;
  onScoreGame: () => void;
  initialsRow1: string;
  initialsRow2: string;
  initialsRow3: string;
}

interface Answer {
  row: number;
  initial1: string;
  initial2: string;
  word1: string;
  word2: string;
  word1Valid: boolean;
  word2Valid: boolean;
}

export default function GameBoard({ gameId, timerDuration, startedAt, isInitiator, onReset, onScoreGame, initialsRow1, initialsRow2, initialsRow3 }: GameBoardProps) {
  const [timeRemaining, setTimeRemaining] = useState(timerDuration);
  const [isActive, setIsActive] = useState(true);

  // Initialize 26 rows (A-Z)
  const [answers, setAnswers] = useState<Answer[]>(
    Array.from({ length: 26 }, (_, i) => ({
      row: i,
      initial1: '',
      initial2: '',
      word1: '',
      word2: '',
      word1Valid: true,
      word2Valid: true
    }))
  );
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Get current player ID
  useEffect(() => {
    const getCurrentPlayer = async () => {
      // For now, we'll get the most recent player for this game
      // In a real app, you'd want to store the player ID in session/localStorage
      const { data } = await supabase
        .from('players')
        .select('id')
        .eq('game_id', gameId)
        .order('joined_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setPlayerId(data.id);
      }
    };

    getCurrentPlayer();
  }, [gameId]);

  // Timer logic
  useEffect(() => {
    if (!startedAt) return;

    const calculateTimeRemaining = () => {
      const started = new Date(startedAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - started) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      return remaining;
    };

    // Initial calculation
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);

    if (remaining === 0) {
      setIsActive(false);
      handleSubmitAnswers();
      return;
    }

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsActive(false);
        handleSubmitAnswers();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, timerDuration]);

  // Set initials from game data - generate all 26 rows based on the pattern
  useEffect(() => {
    if (initialsRow1 && initialsRow2 && initialsRow3) {
      // Extract the pattern from the first 3 rows
      const firstInitials = [initialsRow1[0], initialsRow2[0], initialsRow3[0]];
      const secondInitials = [initialsRow1[1], initialsRow2[1], initialsRow3[1]];

      // Detect pattern and generate all 26 rows
      const newAnswers = Array.from({ length: 26 }, (_, i) => {
        let first = '';
        let second = '';

        // Generate first initial for row i
        if (firstInitials[0] === 'A' && firstInitials[1] === 'B' && firstInitials[2] === 'C') {
          // A to Z pattern
          first = String.fromCharCode(65 + i); // A=65
        } else if (firstInitials[0] === 'Z' && firstInitials[1] === 'Y' && firstInitials[2] === 'X') {
          // Z to A pattern
          first = String.fromCharCode(90 - i); // Z=90
        } else {
          // Random or custom - use the stored value for first 3, then cycle
          first = firstInitials[i % 3];
        }

        // Generate second initial for row i
        if (secondInitials[0] === 'A' && secondInitials[1] === 'B' && secondInitials[2] === 'C') {
          // A to Z pattern
          second = String.fromCharCode(65 + i);
        } else if (secondInitials[0] === 'Z' && secondInitials[1] === 'Y' && secondInitials[2] === 'X') {
          // Z to A pattern
          second = String.fromCharCode(90 - i);
        } else {
          // Random or custom - use the stored value for first 3, then cycle
          second = secondInitials[i % 3];
        }

        return {
          row: i,
          initial1: first,
          initial2: second,
          word1: '',
          word2: '',
          word1Valid: true,
          word2Valid: true
        };
      });

      setAnswers(newAnswers);
    }
  }, [initialsRow1, initialsRow2, initialsRow3]);

  const validateWord = (word: string, initial: string): boolean => {
    if (!word.trim()) return true; // Empty is valid (no error shown)
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

  const handleSubmitAnswers = async () => {
    if (!playerId) return;

    // Prepare answers for submission
    const answersToSubmit: any[] = [];

    answers.forEach(answer => {
      const initials = answer.initial1 + answer.initial2;

      if (answer.word1.trim() !== '') {
        answersToSubmit.push({
          game_id: gameId,
          player_id: playerId,
          initials: initials,
          answer_text: answer.word1,
          column_number: 2,
          row_number: answer.row
        });
      }

      if (answer.word2.trim() !== '') {
        answersToSubmit.push({
          game_id: gameId,
          player_id: playerId,
          initials: initials,
          answer_text: answer.word2,
          column_number: 3,
          row_number: answer.row
        });
      }
    });

    if (answersToSubmit.length > 0) {
      const { error } = await supabase
        .from('answers')
        .insert(answersToSubmit);

      if (error) {
        console.error('Error submitting answers:', error);
      } else {
        console.log('Answers submitted successfully');
      }
    }

    // Only the initiator should update game status to scoring
    if (isInitiator) {
      await supabase
        .from('games')
        .update({ status: 'scoring' })
        .eq('id', gameId);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Timer */}
      <div className="mb-6 text-center">
        <div className={`text-6xl font-bold ${timeRemaining <= 10 ? 'text-red-600 animate-pulse' : 'text-white'}`}>
          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </div>
        <p className="text-gray-400 mt-2">Time Remaining</p>
      </div>

      {/* Game Board */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-3">
          {answers.map((answer) => (
            <div key={answer.row} className="grid grid-cols-[5rem_1fr_1fr] gap-4 items-center py-2">
              {/* Column 1: Initials for this row */}
              <div className="flex items-center justify-center gap-1">
                <div className="text-3xl font-bold tracking-wider text-blue-600 font-[family-name:var(--font-roboto-mono)]">
                  {answer.initial1}
                </div>
                <div className="text-3xl font-bold tracking-wider text-blue-600 font-[family-name:var(--font-roboto-mono)]">
                  {answer.initial2}
                </div>
              </div>

              {/* Column 2: First word input */}
              <div>
                <input
                  type="text"
                  value={answer.word1}
                  onChange={(e) => handleInputChange(answer.row, 1, e.target.value)}
                  disabled={!isActive}
                  className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base text-gray-900 ${
                    !answer.word1Valid ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={isActive ? `${answer.initial1}...` : ''}
                />
              </div>

              {/* Column 3: Second word input */}
              <div>
                <input
                  type="text"
                  value={answer.word2}
                  onChange={(e) => handleInputChange(answer.row, 2, e.target.value)}
                  disabled={!isActive}
                  className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base text-gray-900 ${
                    !answer.word2Valid ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={isActive ? `${answer.initial2}...` : ''}
                />
              </div>
            </div>
          ))}
        </div>

        {!isActive && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-3">
            <p className="text-lg font-semibold text-gray-900">Time&apos;s up!</p>
            <p className="text-gray-600">Your answers have been submitted.</p>

            {isInitiator && (
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={onScoreGame}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Score Game
                </button>
                <button
                  onClick={onReset}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Reset Game
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
