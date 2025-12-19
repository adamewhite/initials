'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900">
      <div className="w-full max-w-md">
        <h1 className="text-5xl font-bold text-center mb-2 text-white">
          Initials
        </h1>
        <p className="text-center text-gray-400 mb-12">
          The fast-paced word game
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/initiate"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg text-center text-lg transition-colors shadow-lg"
          >
            Initiate Game
          </Link>

          <Link
            href="/join"
            className="w-full bg-white hover:bg-gray-50 text-blue-600 font-semibold py-4 px-6 rounded-lg text-center text-lg transition-colors border-2 border-blue-600"
          >
            Join Game
          </Link>
        </div>

        <div className="mt-12 text-center text-sm text-gray-400">
          <p>Gather your friends and test your vocabulary!</p>
        </div>
      </div>
    </main>
  );
}
