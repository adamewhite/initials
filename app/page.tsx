'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className='fixed inset-0 flex flex-col items-center justify-center p-6 overflow-hidden overscroll-none touch-none'>
      <div className='w-full max-w-md'>
        <h1 className='text-5xl font-light italic text-center mb-5 text-amber-500 tracking-wide font-[family-name:var(--font-sometype-mono)]'>
          INITIALS
        </h1>
        <p className='text-center text-amber-700 mb-12 px-8 text-balance text-xl leading-tight font-light'>
          <span className='text-amber-600'>I</span>nventive <span className='text-amber-600'>N</span>aming <span className='text-amber-600'>I</span>n <span className='text-amber-600'>T</span>ime-pressured <span className='text-amber-600'>I</span>nteractive <span className='text-amber-600'>A</span>lphabetic <span className='text-amber-600'>L</span>anguage <span className='text-amber-600'>S</span>howdowns
        </p>

        <div className='flex flex-col gap-4'>
          <Link
            href='/create'
            className='w-full bg-cyan-800 hover:bg-cyan-900 text-white font-light py-4 px-6 rounded-lg text-center text-2xl transition-colors shadow-lg'
          >
            Create Game
          </Link>

          <Link
            href='/join'
            className='w-full bg-white hover:bg-gray-50 text-cyan-800 font-light py-4 px-6 rounded-lg text-center text-2xl transition-colors border-2 border-cyan-800'
          >
            Join Game
          </Link>
        </div>
      </div>
    </main>
  );
}
