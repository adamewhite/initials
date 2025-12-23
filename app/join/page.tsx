'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// NATO phonetic alphabet for team names
const NATO_ALPHABET = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu'
];

export default function JoinPage() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(1);
  const [availableTeams, setAvailableTeams] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [gameFound, setGameFound] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGameCodeLookup = async () => {
    if (!gameCode.trim()) return;

    try {
      const { data: game, error } = await supabase
        .from('games')
        .select('num_teams')
        .ilike('code', gameCode)
        .single();

      if (game) {
        setAvailableTeams(game.num_teams);
        setGameFound(true);
      }
    } catch (error) {
      console.log('Game lookup failed');
    }
  };

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

      // Set available teams from the game
      setAvailableTeams(game.num_teams);

      // Count players on selected team
      const { data: teamPlayers } = await supabase
        .from('players')
        .select('id')
        .eq('game_id', game.id)
        .eq('team_number', selectedTeam);

      const playerCount = (teamPlayers?.length || 0) + 1;

      // Create player with selected team
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          game_id: game.id,
          name: `${NATO_ALPHABET[selectedTeam - 1]} Player ${playerCount}`,
          is_initiator: false,
          team_number: selectedTeam
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
    <main className="flex min-h-screen flex-col p-6">
      <div className="w-full max-w-md mx-auto mb-12">
        <Link href="/" className="inline-block mb-8">
          <h1 className="text-4xl font-light italic text-amber-500 tracking-wide font-[family-name:var(--font-sometype-mono)]">
            INITIALS
          </h1>
        </Link>

        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          Join Game
        </h1>

        <form onSubmit={handleSubmit} className="bg-gradient-to-r from-cyan-700 to-cyan-600 rounded-lg shadow-lg p-6 space-y-6">
          <div>
            <label htmlFor="gameCode" className="block text-lg font-medium text-amber-500 mb-2">
              Game Code
            </label>
            <input
              type="text"
              id="gameCode"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              onBlur={handleGameCodeLookup}
              required
              maxLength={20}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full px-4 py-3 border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-center text-xl font-light text-gray-900 bg-blue-50"
              placeholder="IcyApple"
            />
          </div>

          <div>
            <label htmlFor="selectedTeam" className="block text-lg font-medium text-amber-500 mb-2">
              Select Team
            </label>
            <select
              id="selectedTeam"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(parseInt(e.target.value))}
              required
              className="w-full pl-4 pr-10 py-3 border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900 bg-blue-50 text-lg"
            >
              {Array.from({ length: availableTeams }, (_, i) => i + 1).map(teamNum => (
                <option key={teamNum} value={teamNum}>
                  {NATO_ALPHABET[teamNum - 1]}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-800 hover:bg-cyan-900 disabled:bg-cyan-950 text-white font-light py-4 px-6 rounded-lg text-2xl transition-colors"
          >
            {loading ? 'Joining...' : 'Join Game'}
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
