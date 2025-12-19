'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function JoinPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find the game by code (case-insensitive)
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .ilike('code', gameCode)
        .single();

      if (gameError || !game) {
        alert('Game not found. Please check the code and try again.');
        setLoading(false);
        return;
      }

      if (game.status !== 'waiting') {
        alert('This game has already started or finished.');
        setLoading(false);
        return;
      }

      // Create player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          game_id: game.id,
          name: playerName,
          is_initiator: false
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Store player ID in localStorage
      if (playerData) {
        localStorage.setItem(`player_${game.id}`, playerData.id);
      }

      // Navigate to waiting room
      router.push(`/waiting/${game.id}`);
    } catch (error) {
      console.error('Error joining game:', error);
      alert('Failed to join game. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2 text-white">
          Join Game
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Enter the game code to join
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label htmlFor="gameCode" className="block text-sm font-medium text-gray-700 mb-2">
              Game Code
            </label>
            <input
              type="text"
              id="gameCode"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              required
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl font-semibold text-gray-900"
              placeholder="IcyApple"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors"
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </form>

        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 text-gray-300 hover:text-white font-medium"
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
