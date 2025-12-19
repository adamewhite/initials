'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
}

interface RowAnswers {
  rowNumber: number;
  initials: string;
  playerAnswers: {
    playerId: string;
    playerName: string;
    teamNumber: number | null;
    answers: string[];
    score: number;
  }[];
}

export default function ScorePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [rowAnswers, setRowAnswers] = useState<RowAnswers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    const fetchAnswers = async () => {
      // Get game to get initials
      const { data: game } = await supabase
        .from('games')
        .select('initials_row1, initials_row2, initials_row3')
        .eq('id', gameId)
        .single();

      // Get all players
      const { data: players } = await supabase
        .from('players')
        .select('id, name, is_initiator, team_number')
        .eq('game_id', gameId)
        .order('joined_at', { ascending: true });

      // Get all answers
      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', gameId);

      if (game && players && answers) {
        // Create structure for each row
        const rows: RowAnswers[] = [
          { rowNumber: 0, initials: game.initials_row1, playerAnswers: [] },
          { rowNumber: 1, initials: game.initials_row2, playerAnswers: [] },
          { rowNumber: 2, initials: game.initials_row3, playerAnswers: [] }
        ];

        // For each row, group answers by player
        rows.forEach(row => {
          players.forEach(player => {
            const playerRowAnswers = answers
              .filter(a => a.player_id === player.id && a.row_number === row.rowNumber)
              .sort((a, b) => a.column_number - b.column_number)
              .map(a => a.answer_text);

            row.playerAnswers.push({
              playerId: player.id,
              playerName: player.name,
              teamNumber: player.team_number,
              answers: playerRowAnswers,
              score: 0 // Initialize score to 0
            });
          });
        });

        setRowAnswers(rows);
      }

      setLoading(false);
    };

    fetchAnswers();
  }, [gameId]);

  const handleScoreChange = (rowIndex: number, playerIndex: number, score: number) => {
    setRowAnswers(prev => {
      const updated = [...prev];
      updated[rowIndex].playerAnswers[playerIndex].score = score;
      return updated;
    });
  };

  const calculateTeamTotals = () => {
    const playerTotals: Record<string, number> = {};

    rowAnswers.forEach(row => {
      row.playerAnswers.forEach(playerAnswer => {
        if (!playerTotals[playerAnswer.playerName]) {
          playerTotals[playerAnswer.playerName] = 0;
        }
        playerTotals[playerAnswer.playerName] += playerAnswer.score;
      });
    });

    return Object.entries(playerTotals).sort((a, b) => b[1] - a[1]); // Sort by score descending
  };

  const handleNewGame = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-6 bg-gray-900">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          Scoring
        </h1>

        <div className="space-y-8">
          {rowAnswers.map((row) => (
            <div key={row.rowNumber} className="bg-white rounded-lg shadow-lg p-6">
              {/* Row Header with Initials */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-bold text-blue-600 font-[family-name:var(--font-roboto-mono)]">{row.initials[0]}</span>
                  <span className="text-5xl font-bold text-blue-600 font-[family-name:var(--font-roboto-mono)]">{row.initials[1]}</span>
                </div>
              </div>

              {/* Player Answers */}
              <div className="space-y-4">
                {row.playerAnswers.map((playerAnswer, playerIdx) => (
                  <div key={playerIdx} className="flex items-center gap-4">
                    {/* Player Name */}
                    <div className="w-32 flex-shrink-0">
                      <span className="font-semibold text-gray-900">{playerAnswer.playerName}</span>
                    </div>

                    {/* Combined Answers Display */}
                    <div className="flex-1">
                      {playerAnswer.answers.length === 2 ? (
                        <span className="text-gray-900 text-2xl">{playerAnswer.answers.join(' ')}</span>
                      ) : (
                        <span className="text-gray-400 italic text-xl">No Answer</span>
                      )}
                    </div>

                    {/* Score Dropdown */}
                    <div>
                      <select
                        value={playerAnswer.score}
                        onChange={(e) => handleScoreChange(row.rowNumber, playerIdx, parseInt(e.target.value))}
                        disabled={playerAnswer.answers.length !== 2}
                        className={`px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          playerAnswer.answers.length !== 2 ? 'bg-gray-100 text-gray-400' : 'bg-white'
                        }`}
                      >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Team Totals */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-900">Team Totals</h2>
          <div className="space-y-3">
            {calculateTeamTotals().map(([teamName, total]) => (
              <div key={teamName} className="flex items-center justify-between py-3 px-6 bg-gray-50 rounded-lg">
                <span className="text-2xl font-semibold text-gray-900">{teamName}</span>
                <span className="text-3xl font-bold text-blue-600">{total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleNewGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg"
          >
            New Game
          </button>
        </div>
      </div>
    </main>
  );
}
