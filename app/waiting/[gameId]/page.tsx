'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// NATO phonetic alphabet for team names
const NATO_ALPHABET = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu'
];

interface Player {
  id: string;
  name: string;
  is_initiator: boolean;
  team_number: number | null;
}

interface Game {
  id: string;
  code: string;
  num_teams: number;
  status: string;
  timer_duration: number;
}

interface TeamInfo {
  teamNumber: number;
  teamName: string;
  playerCount: number;
}

export default function WaitingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  // Organize players into teams
  const organizeTeams = (gameData: Game, playersData: Player[]) => {
    const teamMap: Record<number, number> = {};

    playersData.forEach(player => {
      if (player.team_number) {
        teamMap[player.team_number] = (teamMap[player.team_number] || 0) + 1;
      }
    });

    const teamInfo: TeamInfo[] = [];
    for (let i = 1; i <= gameData.num_teams; i++) {
      teamInfo.push({
        teamNumber: i,
        teamName: NATO_ALPHABET[i - 1],
        playerCount: teamMap[i] || 0
      });
    }

    setTeams(teamInfo);
  };

  useEffect(() => {
    if (!gameId) return;

    // Fetch initial game and players
    const fetchGameData = async () => {
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .order('joined_at', { ascending: true });

      // Get current player from localStorage
      const playerId = localStorage.getItem(`player_${gameId}`);
      let currentPlayerData = null;

      if (playerId) {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('id', playerId)
          .single();
        currentPlayerData = data;
      }

      setGame(gameData);
      setPlayers(playersData || []);
      setCurrentPlayer(currentPlayerData);

      // Organize players into teams
      if (gameData && playersData) {
        organizeTeams(gameData, playersData);
      }

      setLoading(false);
    };

    fetchGameData();

    // Subscribe to real-time player updates
    const playersSubscription = supabase
      .channel(`players-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('Player change detected:', payload);
          fetchGameData();
        }
      )
      .subscribe((status) => {
        console.log('Players subscription status:', status);
      });

    // Subscribe to game status updates
    const gameSubscription = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        async (payload) => {
          const updatedGame = payload.new as Game;
          setGame(updatedGame);

          // If game started, navigate to game board
          if (updatedGame.status === 'playing') {
            router.push(`/play/${gameId}`);
          }
        }
      )
      .subscribe();

    return () => {
      playersSubscription.unsubscribe();
      gameSubscription.unsubscribe();
    };
  }, [gameId, router]);

  const handleStartGame = async () => {
    if (!game) return;

    // Update game status to playing and set started_at timestamp
    const { error } = await supabase
      .from('games')
      .update({
        status: 'playing',
        started_at: new Date().toISOString()
      })
      .eq('id', gameId);

    if (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-600">Game not found</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-cyan-800 hover:text-cyan-900 font-medium text-xl"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="w-full max-w-md mx-auto mb-12">
        <Link href="/" className="inline-block mb-8">
          <h1 className="text-4xl font-light italic text-amber-500 tracking-wide font-[family-name:var(--font-sometype-mono)]">
            INITIALS
          </h1>
        </Link>

        <h1 className="text-4xl font-bold text-center mb-6 text-white">
          Waiting Room
        </h1>

        <div className="bg-gradient-to-r from-cyan-700 to-cyan-600 rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-amber-500 mb-2">Game Code</p>
            <p className="text-4xl font-bold text-white tracking-wider">{game.code}</p>
            <p className="text-sm text-sky-200 mt-2">Share this code with other players</p>
          </div>

          <div className="border-t border-sky-400 pt-6">
            <h2 className="font-light text-amber-500 mb-4">
              Teams ({players.length} {players.length === 1 ? 'player' : 'players'})
            </h2>
            <div className="space-y-2">
              {teams.map((team) => (
                <div
                  key={team.teamNumber}
                  className="flex items-center justify-between p-3 bg-sky-500/30 rounded-lg"
                >
                  <span className="font-medium text-white">{team.teamName}</span>
                  <span className="text-lg text-amber-500">
                    {team.playerCount} {team.playerCount === 1 ? 'player' : 'players'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {currentPlayer && (
            <div className="border-t border-sky-400 pt-6 mt-6">
              <h2 className="font-light text-amber-500 mb-2">Your Team</h2>
              <p className="text-white mb-4">
                {currentPlayer.team_number ? NATO_ALPHABET[currentPlayer.team_number - 1] : 'Not assigned'}
              </p>
              <label htmlFor="changeTeam" className="block text-lg font-medium text-amber-500 mb-2">
                Change Team
              </label>
              <select
                id="changeTeam"
                value={currentPlayer.team_number || 1}
                onChange={async (e) => {
                  const newTeam = parseInt(e.target.value);
                  const { error } = await supabase
                    .from('players')
                    .update({ team_number: newTeam })
                    .eq('id', currentPlayer.id);

                  if (error) {
                    console.error('Error changing team:', error);
                    alert('Failed to change team. Please try again.');
                  }
                }}
                className="w-full pl-4 pr-10 py-3 border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900 bg-blue-50 text-lg"
              >
                {teams.map((team) => (
                  <option key={team.teamNumber} value={team.teamNumber}>
                    {team.teamName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {currentPlayer?.is_initiator ? (
          <>
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className="w-full bg-cyan-800 hover:bg-cyan-900 disabled:bg-cyan-950 text-white font-light py-4 px-6 rounded-lg text-2xl transition-colors shadow-lg"
            >
              Let&apos;s Play
            </button>

            {players.length < 2 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Waiting for at least 2 players to start...
              </p>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-gray-300 text-lg">Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </main>
  );
}
