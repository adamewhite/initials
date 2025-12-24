'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CircleHelp, CheckCircle, XCircle } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  is_initiator: boolean;
  team_number: number | null;
}

interface Answer {
  id: string;
  player_id: string;
  initials: string;
  answer_text: string;
  column_number: number;
  row_number: number;
}

interface Game {
  initials_row1: string;
  initials_row2: string;
  initials_row3: string;
  num_teams: number;
  all_initials?: string[];
}

interface ValidationResult {
  status: 'idle' | 'loading' | 'valid' | 'invalid';
  url?: string;
}

// NATO phonetic alphabet for team names
const NATO_ALPHABET = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu'
];

interface RowAnswers {
  rowNumber: number;
  initials: string;
  teamAnswers: {
    teamNumber: number;
    teamName: string;
    answers: string[];
    score: number;
    validation: ValidationResult;
  }[];
}

export default function ScorePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [rowAnswers, setRowAnswers] = useState<RowAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitiator, setIsInitiator] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!gameId) return;

    const fetchAnswers = async () => {
      // Get current player to check if they're the initiator
      const playerId = localStorage.getItem(`player_${gameId}`);
      if (playerId) {
        const { data: playerData } = await supabase
          .from('players')
          .select('is_initiator')
          .eq('id', playerId)
          .single();

        if (playerData) {
          setIsInitiator(playerData.is_initiator);
        }
      }

      // Get game to get initials and number of teams
      const { data: game } = await supabase
        .from('games')
        .select('initials_row1, initials_row2, initials_row3, num_teams, all_initials')
        .eq('id', gameId)
        .single();

      // Get all players
      const { data: players } = await supabase
        .from('players')
        .select('id, team_number')
        .eq('game_id', gameId);

      // Get all answers
      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId);

      console.log('Game data:', game);
      console.log('Players:', players);
      console.log('Answers:', answers);

      if (game && players) {
        const numTeams = game.num_teams || 2; // Default to 2 teams if not set

        // Generate all 26 rows based on pattern
        const rows: RowAnswers[] = Array.from({ length: 26 }, (_, i) => {
          let first = '';
          let second = '';

          // If we have all 26 initials stored, use them directly
          if (game.all_initials && game.all_initials.length === 26) {
            first = game.all_initials[i][0] || 'A';
            second = game.all_initials[i][1] || 'A';
          } else {
            // Fallback to old logic for backwards compatibility
            const firstInitials = [game.initials_row1[0], game.initials_row2[0], game.initials_row3[0]];
            const secondInitials = [game.initials_row1[1], game.initials_row2[1], game.initials_row3[1]];

            // Generate first initial for row i
            if (firstInitials[0] === 'A' && firstInitials[1] === 'B' && firstInitials[2] === 'C') {
              first = String.fromCharCode(65 + i);
            } else if (firstInitials[0] === 'Z' && firstInitials[1] === 'Y' && firstInitials[2] === 'X') {
              first = String.fromCharCode(90 - i);
            } else {
              first = firstInitials[i % 3];
            }

            // Generate second initial for row i
            if (secondInitials[0] === 'A' && secondInitials[1] === 'B' && secondInitials[2] === 'C') {
              second = String.fromCharCode(65 + i);
            } else if (secondInitials[0] === 'Z' && secondInitials[1] === 'Y' && secondInitials[2] === 'X') {
              second = String.fromCharCode(90 - i);
            } else {
              second = secondInitials[i % 3];
            }
          }

          return {
            rowNumber: i,
            initials: first + second,
            teamAnswers: []
          };
        });

        // Group players by team
        const teamPlayerMap: Record<number, string[]> = {};
        players.forEach(player => {
          if (player.team_number) {
            if (!teamPlayerMap[player.team_number]) {
              teamPlayerMap[player.team_number] = [];
            }
            teamPlayerMap[player.team_number].push(player.id);
          }
        });

        console.log('Team player map:', teamPlayerMap);
        console.log('Number of teams:', numTeams);

        // For each row, group answers by team
        rows.forEach(row => {
          for (let teamNum = 1; teamNum <= numTeams; teamNum++) {
            const teamPlayerIds = teamPlayerMap[teamNum] || [];

            // Get answer for each column from any team member
            const column2Answer = answers?.find(
              a => teamPlayerIds.includes(a.player_id) &&
                   a.row_number === row.rowNumber &&
                   a.column_number === 2
            );

            const column3Answer = answers?.find(
              a => teamPlayerIds.includes(a.player_id) &&
                   a.row_number === row.rowNumber &&
                   a.column_number === 3
            );

            const teamRowAnswers = [];
            if (column2Answer) teamRowAnswers.push(column2Answer.answer_text);
            if (column3Answer) teamRowAnswers.push(column3Answer.answer_text);

            if (row.rowNumber === 0 && teamNum === 1) {
              console.log('Debug row 0, team 1:');
              console.log('  Team player IDs:', teamPlayerIds);
              console.log('  All matching column 2 answers:', answers?.filter(
                a => teamPlayerIds.includes(a.player_id) && a.row_number === 0 && a.column_number === 2
              ));
              console.log('  Column 2 answer (most recent):', column2Answer);
              console.log('  All matching column 3 answers:', answers?.filter(
                a => teamPlayerIds.includes(a.player_id) && a.row_number === 0 && a.column_number === 3
              ));
              console.log('  Column 3 answer (most recent):', column3Answer);
              console.log('  Final answers:', teamRowAnswers);
            }

            row.teamAnswers.push({
              teamNumber: teamNum,
              teamName: NATO_ALPHABET[teamNum - 1],
              answers: teamRowAnswers,
              score: 0, // Will be calculated below
              validation: { status: 'idle' }
            });
          }
        });

        // Calculate initial scores based on answer uniqueness
        rows.forEach(row => {
          row.teamAnswers.forEach((teamAnswer, teamIdx) => {
            if (teamAnswer.answers.length !== 2) {
              // No answer provided - score 0
              teamAnswer.score = 0;
            } else {
              // Normalize answer: trim each word, join with single space, lowercase, normalize whitespace
              const normalizeAnswer = (answers: string[]) => {
                return answers
                  .map(word => word.trim())
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .toLowerCase()
                  .trim();
              };

              const combinedAnswer = normalizeAnswer(teamAnswer.answers);

              // Count how many teams answered this row
              const teamsWithAnswers = row.teamAnswers.filter(ta => ta.answers.length === 2);

              // Check if this answer matches any other team's answer
              const matchingTeams = row.teamAnswers.filter((ta, idx) =>
                idx !== teamIdx &&
                ta.answers.length === 2 &&
                normalizeAnswer(ta.answers) === combinedAnswer
              );

              if (matchingTeams.length > 0) {
                // Answer matches another team - score 1
                teamAnswer.score = 1;
              } else if (teamsWithAnswers.length === 1) {
                // Only team to answer - score 5
                teamAnswer.score = 5;
              } else {
                // Unique answer but others answered - score 3
                teamAnswer.score = 3;
              }
            }
          });
        });

        setRowAnswers(rows);
      }

      setLoading(false);
    };

    fetchAnswers();

    // Subscribe to real-time answer changes
    const answersSubscription = supabase
      .channel(`scoring-answers-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] Answer change received on scoring page:`, payload.eventType, payload);
          // Refetch all answers to recalculate scores
          console.log(`[${timestamp}] Refetching answers...`);
          fetchAnswers();
        }
      )
      .subscribe((status) => {
        console.log('Scoring answers subscription status:', status);
      });

    return () => {
      answersSubscription.unsubscribe();
    };
  }, [gameId]);

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

    return Object.entries(teamTotals).sort((a, b) => b[1] - a[1]); // Sort by score descending
  };

  const handleNewGame = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-3 md:p-6">
      <div className="w-full max-w-6xl mx-auto mb-12">
        <Link href="/" className="inline-block mb-8">
          <h1 className="text-4xl font-light italic text-amber-500 tracking-wide font-[family-name:var(--font-sometype-mono)]">
            INITIALS
          </h1>
        </Link>

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
                      <span className="font-light text-amber-500 text-base md:text-4xl">{teamAnswer.teamName}</span>
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
                        className={`w-12 md:w-16 px-1 md:px-2 py-1 md:py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-white text-sm md:text-base ${
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
                    <div className="w-16 md:w-20 flex justify-center flex-shrink-0">
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

        <div className="mt-8 text-center">
          <button
            onClick={handleNewGame}
            className="bg-cyan-800 hover:bg-cyan-900 text-white font-light py-4 px-8 rounded-lg text-2xl transition-colors shadow-lg"
          >
            New Game
          </button>
        </div>
      </div>
    </main>
  );
}
