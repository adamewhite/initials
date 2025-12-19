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

interface Game {
  id: string;
  code: string;
  num_teams: number;
  status: string;
  timer_duration: number;
}

export default function WaitingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2 text-white">
          Waiting Room
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Game Code</p>
            <p className="text-4xl font-bold text-blue-600 tracking-wider">{game.code}</p>
            <p className="text-sm text-gray-500 mt-2">Share this code with other players</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Players ({players.length})
            </h2>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-900">{player.name}</span>
                  {player.is_initiator && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {currentPlayer?.is_initiator ? (
          <>
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors shadow-lg"
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
