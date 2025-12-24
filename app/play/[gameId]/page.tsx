'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import GameBoard from '@/components/GameBoard';

interface Game {
  id: string;
  code: string;
  status: string;
  timer_duration: number;
  started_at: string;
  initiator_id: string;
  initials_row1: string;
  initials_row2: string;
  initials_row3: string;
  all_initials?: string[];
}

interface Player {
  id: string;
  is_initiator: boolean;
}

export default function PlayPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    // Fetch game data and current player
    const fetchGameData = async () => {
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      // Get current player from localStorage
      const playerId = localStorage.getItem(`player_${gameId}`);
      let playerData = null;

      if (playerId) {
        const { data } = await supabase
          .from('players')
          .select('id, is_initiator')
          .eq('id', playerId)
          .single();
        playerData = data;
      }

      setGame(gameData);
      setCurrentPlayer(playerData);
      setLoading(false);
    };

    fetchGameData();

    // Subscribe to game status updates
    const gameSubscription = supabase
      .channel(`game-play-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          console.log('Game status update received:', payload);
          const updatedGame = payload.new as Game;
          setGame(updatedGame);

          // If game moved to scoring, navigate ALL players
          if (updatedGame.status === 'scoring') {
            console.log('Navigating to scoring page');
            router.push(`/score/${gameId}`);
          }
        }
      )
      .subscribe((status) => {
        console.log('Game subscription status:', status);
      });

    return () => {
      gameSubscription.unsubscribe();
    };
  }, [gameId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
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

  const handleScoreGame = () => {
    router.push(`/score/${gameId}`);
  };

  const handleResetGame = async () => {
    if (!confirm('Are you sure you want to reset the game? This will clear all answers and restart.')) {
      return;
    }

    // Delete all answers
    await supabase
      .from('answers')
      .delete()
      .eq('game_id', gameId);

    // Reset game status to waiting
    await supabase
      .from('games')
      .update({
        status: 'waiting',
        started_at: null
      })
      .eq('id', gameId);

    // Navigate back to waiting room
    router.push(`/waiting/${gameId}`);
  };

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="w-full max-w-4xl mx-auto mb-6">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-light italic text-amber-500 tracking-wide font-[family-name:var(--font-sometype-mono)]">
            INITIALS
          </h1>
        </Link>
      </div>
      <GameBoard
        gameId={gameId}
        timerDuration={game.timer_duration}
        startedAt={game.started_at}
        isInitiator={currentPlayer?.is_initiator || false}
        onReset={handleResetGame}
        onScoreGame={handleScoreGame}
        initialsRow1={game.initials_row1}
        initialsRow2={game.initials_row2}
        initialsRow3={game.initials_row3}
        allInitials={game.all_initials}
      />
    </main>
  );
}
