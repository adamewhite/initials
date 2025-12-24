'use client';

import { useState, useEffect, useRef } from 'react';
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
  allInitials?: string[];
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

export default function GameBoard({ gameId, timerDuration, startedAt, isInitiator, onReset, onScoreGame, initialsRow1, initialsRow2, initialsRow3, allInitials }: GameBoardProps) {
  const [timeRemaining, setTimeRemaining] = useState(timerDuration);
  const [isActive, setIsActive] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Initialize 26 rows
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
  const [teamNumber, setTeamNumber] = useState<number | null>(null);
  const [teamPlayerIds, setTeamPlayerIds] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll detection for compact timer
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get current player ID, team number, and all team member IDs
  useEffect(() => {
    const getCurrentPlayer = async () => {
      // Get current player from localStorage
      const storedPlayerId = localStorage.getItem(`player_${gameId}`);

      if (storedPlayerId) {
        const { data: currentPlayer } = await supabase
          .from('players')
          .select('id, team_number')
          .eq('id', storedPlayerId)
          .single();

        if (currentPlayer) {
          setPlayerId(currentPlayer.id);
          setTeamNumber(currentPlayer.team_number);

          // Get all players on the same team
          const { data: teamPlayers } = await supabase
            .from('players')
            .select('id')
            .eq('game_id', gameId)
            .eq('team_number', currentPlayer.team_number);

          if (teamPlayers) {
            setTeamPlayerIds(teamPlayers.map(p => p.id));
          }
        }
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

  // Set initials from game data - generate all 26 rows based on pattern
  useEffect(() => {
    // If we have all 26 initials stored, use them directly
    if (allInitials && allInitials.length === 26) {
      const newAnswers = Array.from({ length: 26 }, (_, i) => ({
        row: i,
        initial1: allInitials[i][0] || 'A',
        initial2: allInitials[i][1] || 'A',
        word1: '',
        word2: '',
        word1Valid: true,
        word2Valid: true
      }));
      setAnswers(newAnswers);
      return;
    }

    // Fallback to old logic for backwards compatibility
    if (initialsRow1 && initialsRow2 && initialsRow3) {
      const firstInitials = [initialsRow1[0], initialsRow2[0], initialsRow3[0]];
      const secondInitials = [initialsRow1[1], initialsRow2[1], initialsRow3[1]];

      const newAnswers = Array.from({ length: 26 }, (_, i) => {
        let first = '';
        let second = '';

        // Generate first initial for row i
        if (firstInitials[0] === 'A' && firstInitials[1] === 'B' && firstInitials[2] === 'C') {
          // A to Z pattern
          first = String.fromCharCode(65 + i);
        } else if (firstInitials[0] === 'Z' && firstInitials[1] === 'Y' && firstInitials[2] === 'X') {
          // Z to A pattern
          first = String.fromCharCode(90 - i);
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
  }, [initialsRow1, initialsRow2, initialsRow3, allInitials]);

  // Load existing answers from team members and subscribe to changes
  useEffect(() => {
    if (teamPlayerIds.length === 0) return;

    const loadTeamAnswers = async () => {
      // Load all answers from team members
      const { data: teamAnswers } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId)
        .in('player_id', teamPlayerIds);

      if (teamAnswers) {
        // Merge team answers into current answers state
        setAnswers(prev => {
          const newAnswers = [...prev];

          teamAnswers.forEach(answer => {
            const row = answer.row_number;
            if (row >= 0 && row < 26) {
              if (answer.column_number === 2) {
                newAnswers[row] = {
                  ...newAnswers[row],
                  word1: answer.answer_text,
                  word1Valid: validateWord(answer.answer_text, newAnswers[row].initial1)
                };
              } else if (answer.column_number === 3) {
                newAnswers[row] = {
                  ...newAnswers[row],
                  word2: answer.answer_text,
                  word2Valid: validateWord(answer.answer_text, newAnswers[row].initial2)
                };
              }
            }
          });

          return newAnswers;
        });
      }
    };

    loadTeamAnswers();

    // Subscribe to real-time answer changes from team members
    const answersSubscription = supabase
      .channel(`team-answers-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          // Handle DELETE events differently from INSERT/UPDATE
          const isDelete = payload.eventType === 'DELETE';
          const answer = (isDelete ? payload.old : payload.new) as any;

          // Only update if this answer is from a team member
          if (teamPlayerIds.includes(answer.player_id)) {
            setAnswers(prev => {
              const newAnswers = [...prev];
              const row = answer.row_number;

              if (row >= 0 && row < 26) {
                if (answer.column_number === 2) {
                  newAnswers[row] = {
                    ...newAnswers[row],
                    word1: isDelete ? '' : answer.answer_text,
                    word1Valid: isDelete ? true : validateWord(answer.answer_text, newAnswers[row].initial1)
                  };
                } else if (answer.column_number === 3) {
                  newAnswers[row] = {
                    ...newAnswers[row],
                    word2: isDelete ? '' : answer.answer_text,
                    word2Valid: isDelete ? true : validateWord(answer.answer_text, newAnswers[row].initial2)
                  };
                }
              }

              return newAnswers;
            });
          }
        }
      )
      .subscribe();

    return () => {
      answersSubscription.unsubscribe();
    };
  }, [teamPlayerIds, gameId]);

  // Auto-scroll to bottom for initiator when timer completes
  useEffect(() => {
    if (!isActive && isInitiator && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isActive, isInitiator]);

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

  const handleInputBlur = async (row: number, column: 1 | 2) => {
    if (!playerId || teamPlayerIds.length === 0) return;

    const answer = answers[row];
    const text = column === 1 ? answer.word1 : answer.word2;
    const capitalized = text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
    const initial = column === 1 ? answer.initial1 : answer.initial2;
    const initials = answer.initial1 + answer.initial2;

    // Update local state with capitalized text
    setAnswers(prev =>
      prev.map(a => {
        if (a.row !== row) return a;

        if (column === 1) {
          return {
            ...a,
            word1: capitalized,
            word1Valid: validateWord(capitalized, a.initial1)
          };
        } else {
          return {
            ...a,
            word2: capitalized,
            word2Valid: validateWord(capitalized, a.initial2)
          };
        }
      })
    );

    // Save to database
    const columnNumber = column === 1 ? 2 : 3;

    if (capitalized.trim() !== '') {
      // First delete any existing answer from ALL team members for this cell
      console.log('[GameBoard] Deleting existing answers before insert:', {
        gameId,
        teamPlayerIds,
        teamPlayerCount: teamPlayerIds.length,
        row,
        columnNumber,
        newAnswer: capitalized,
        currentPlayerId: playerId
      });

      // First, query to see if matching records exist
      const { data: existingAnswers } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId)
        .in('player_id', teamPlayerIds)
        .eq('row_number', row)
        .eq('column_number', columnNumber);

      console.log('[GameBoard] Existing answers found before delete:', existingAnswers);

      const { data: deletedData, error: deleteError } = await supabase
        .from('answers')
        .delete()
        .eq('game_id', gameId)
        .in('player_id', teamPlayerIds)
        .eq('row_number', row)
        .eq('column_number', columnNumber)
        .select();

      console.log('[GameBoard] Delete result:', {
        deleted: deletedData,
        error: deleteError
      });

      // Insert new answer
      console.log('[GameBoard] Inserting new answer:', {
        gameId,
        playerId,
        initials,
        answer_text: capitalized,
        column_number: columnNumber,
        row_number: row
      });

      const { data: insertData, error: insertError } = await supabase
        .from('answers')
        .insert({
          game_id: gameId,
          player_id: playerId,
          initials: initials,
          answer_text: capitalized,
          column_number: columnNumber,
          row_number: row
        })
        .select();

      console.log('[GameBoard] Insert result:', {
        inserted: insertData,
        error: insertError
      });

      if (insertError) {
        console.error('[GameBoard] Error saving answer:', insertError);
      }
    } else {
      // Delete answer from ALL team members if text is empty
      console.log('[GameBoard] Deleting answer (empty input):', {
        gameId,
        teamPlayerIds,
        row,
        columnNumber
      });

      const { data: deletedData, error: deleteError } = await supabase
        .from('answers')
        .delete()
        .eq('game_id', gameId)
        .in('player_id', teamPlayerIds)
        .eq('row_number', row)
        .eq('column_number', columnNumber)
        .select();

      console.log('[GameBoard] Delete result:', {
        deleted: deletedData,
        error: deleteError
      });

      if (deleteError && deleteError.code !== 'PGRST116') { // Ignore "not found" errors
        console.error('[GameBoard] Error deleting answer:', deleteError);
      }
    }
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
    <div className="w-full max-w-4xl mx-auto pb-12">
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
                  disabled={!isActive}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className={`w-full px-2 md:px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-800 disabled:bg-gray-100 disabled:cursor-not-allowed text-lg md:text-xl text-gray-900 ${
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
                  onBlur={() => handleInputBlur(answer.row, 2)}
                  disabled={!isActive}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className={`w-full px-2 md:px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-800 disabled:bg-gray-100 disabled:cursor-not-allowed text-lg md:text-xl text-gray-900 ${
                    !answer.word2Valid ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={isActive ? `${answer.initial2}...` : ''}
                />
              </div>
            </div>
          ))}
        </div>

        {!isActive && (
          <div ref={bottomRef} className="mt-6 pt-6 border-t border-sky-400 text-center space-y-3">
            <p className="text-lg font-light text-white">Time&apos;s up!</p>
            <p className="text-sky-200">Your answers have been submitted.</p>

            {isInitiator ? (
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={onScoreGame}
                  className="bg-cyan-800 hover:bg-cyan-900 text-white font-light py-3 px-6 rounded-lg text-2xl transition-colors"
                >
                  Score Game
                </button>
              </div>
            ) : (
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-cyan-800 hover:bg-cyan-900 text-white font-light py-3 px-6 rounded-lg text-2xl transition-colors"
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
