# Initials - Game Guide

## Overview

**Initials** is a fast-paced multiplayer word game built with Next.js, React, TypeScript, and Supabase. Players compete to fill in words that start with randomly generated two-letter combinations before time runs out. The game features customizable initial patterns - from sequential to weighted random to custom text passages.

## How to Play (Quick Start)

1. **Host creates a game** with custom settings (timer, initial patterns)
2. **Players join** using the game code
3. **Everyone plays simultaneously** - fill in 2 words for each of 3 rows (6 words total)
4. **Timer runs out** - all answers automatically submitted
5. **Compare results** - see who had unique answers
6. **Score manually** - group decides which answers are valid, duplicates eliminated

Each row shows a two-letter combination (e.g., "AZ"). Players must enter two words: one starting with the first letter (A) and one starting with the second letter (Z).

## Game Flow

### 1. Home Page (`/`)
- Players choose to either **Initiate Game** (create a new game) or **Join Game** (join existing game)

### 2. Creating a Game (`/initiate`)
The game initiator configures:
- **Player Name**: Their display name
- **Number of Teams**: 2-10 teams (currently not fully implemented in scoring)
- **Timer Duration**: 30-300 seconds (in 15-second increments)
- **First Initial Pattern**: How the first initial for each row is determined
- **Second Initial Pattern**: How the second initial for each row is determined

#### Initial Pattern Options

Each row gets two initials (e.g., "AZ", "BY", "CX"). The initiator chooses how these are generated:

1. **A to Z** - Sequential ascending (Row 1: A, Row 2: B, Row 3: C...)
2. **Z to A** - Sequential descending (Row 1: Z, Row 2: Y, Row 3: X...)
3. **Random (Each once)** - Uniform random, each letter appears only once across rows
4. **Random (Weighted by First Names)** - Letters selected based on frequency in US first names
   - Most common: J (9.97%), A (9.73%), L (7.01%)
   - Can repeat across rows
5. **Random (Weighted by Last Names)** - Letters selected based on frequency in US last names
   - Most common: S (10.93%), B (8.96%), M (8.28%)
   - Can repeat across rows
6. **Custom Text** - Paste any text; system extracts first 26 alphabetic characters
   - Reveals a textarea for input
   - Ignores spaces, numbers, and punctuation
   - Shows character count
   - Can repeat letters

**Example Combinations:**
- First: "A to Z", Second: "Z to A" → Rows: AZ, BY, CX
- First: "Random (First Names)", Second: "A to Z" → Rows: JA, MB, LC
- First: "Custom Text", Second: "Random (Last Names)" → Rows: (custom)S, (custom)B, (custom)M

When created, the game:
- Generates a unique game code (e.g., "IcyApple", "HotBear")
- Creates initials for 3 rows based on selected patterns
- Assigns the creator as the game initiator/host

### 3. Joining a Game (`/join`)
Players enter:
- **Player Name**: Their display name
- **Game Code**: The code shared by the game host

### 4. Waiting Room (`/waiting/[gameId]`)
- Displays the game code for sharing
- Shows all joined players in real-time
- Host sees "Let's Play" button (requires minimum 2 players)
- Non-host players see "Waiting for host to start the game..."
- Uses Supabase real-time subscriptions for live player updates

### 5. Playing the Game (`/play/[gameId]`)
Each player sees:
- **Timer**: Countdown showing remaining time (turns red and pulses in last 10 seconds)
- **Game Board**: 3 rows × 3 columns grid:
  - **Column 1**: Two-letter initial combination (e.g., "AZ")
  - **Column 2**: Input field for word starting with first initial
  - **Column 3**: Input field for word starting with second initial
  - Real-time validation (fields turn red if word doesn't start with correct letter)

Game mechanics:
- Players fill in 2 words per row (6 words total)
- Words must start with the corresponding initial
- Words are validated as they type
- Empty fields are allowed
- When timer expires:
  - All answers are automatically submitted to database
  - Host sees "Score Game" and "Reset Game" buttons
  - Game status changes to "scoring"

**Example gameplay:**
- Row 1 - Initials: **AZ** → Player enters "Apple" (starts with A) and "Zinc" (starts with Z)
- Row 2 - Initials: **BY** → Player enters "Banana" (starts with B) and "Yellow" (starts with Y)
- Row 3 - Initials: **CX** → Player enters "Cat" (starts with C) and "Xray" (starts with X)

### 6. Scoring (`/score/[gameId]`)
- Displays all answers organized by row
- Shows each row's two-letter initial combination
- Lists all players with their 2 answers per row
- Typically used for group discussion and manual scoring
- Players can compare answers to find duplicates
- Common scoring: Unique answers get points, duplicates get 0
- "New Game" button returns to home page

## Technical Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **State Management**: React hooks (useState, useEffect)
- **Routing**: Next.js App Router with dynamic routes

### Database Schema

#### Tables

**games**
- `id`: UUID (primary key)
- `code`: String (unique game code, e.g., "IcyApple")
- `num_teams`: Integer (2-10)
- `timer_duration`: Integer (seconds)
- `status`: Enum ('waiting', 'playing', 'scoring')
- `started_at`: Timestamp (when game started)
- `initiator_id`: UUID (reference to player who created game)
- `initials_row1`: String (2 characters, e.g., "AB")
- `initials_row2`: String (2 characters)
- `initials_row3`: String (2 characters)
- `created_at`: Timestamp

**players**
- `id`: UUID (primary key)
- `game_id`: UUID (foreign key to games)
- `name`: String (player name)
- `is_initiator`: Boolean
- `team_number`: Integer (nullable, currently unused)
- `joined_at`: Timestamp

**answers**
- `id`: UUID (primary key)
- `game_id`: UUID (foreign key to games)
- `player_id`: UUID (foreign key to players)
- `initials`: String (the two-letter combination for this row, e.g., "AZ")
- `answer_text`: String (the word entered)
- `column_number`: Integer (2 or 3, which input field - first or second initial)
- `row_number`: Integer (0, 1, or 2)
- `created_at`: Timestamp

## Project Structure

```
initials/
├── app/
│   ├── initiate/
│   │   └── page.tsx          # Create new game
│   ├── join/
│   │   └── page.tsx          # Join existing game
│   ├── waiting/[gameId]/
│   │   └── page.tsx          # Waiting room
│   ├── play/[gameId]/
│   │   └── page.tsx          # Active gameplay
│   ├── score/[gameId]/
│   │   └── page.tsx          # Scoring/results
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/
│   └── GameBoard.tsx         # Main game board component
├── lib/
│   └── supabase.ts           # Supabase client configuration
└── package.json
```

## Key Features

### Real-Time Synchronization
- Uses Supabase real-time subscriptions
- Players see live updates when others join
- Game automatically transitions when host starts
- No manual refresh needed

### Local Storage
- Player ID stored in `localStorage` as `player_${gameId}`
- Allows players to refresh page without losing their identity
- Persists across browser sessions

### Game Code Generation
- Combines random adjective + noun (e.g., "IcyApple")
- 40 adjectives × 40 nouns = 1,600 possible combinations
- Easy to communicate verbally

### Timer Synchronization
- Server-side timestamp (`started_at`) ensures all players see same time
- Calculates remaining time based on server time vs. current time
- Prevents client-side time manipulation
- Auto-submits answers when time expires

### Input Validation
- Real-time validation as user types
- Visual feedback (red border for invalid entries)
- Validates that word starts with the corresponding initial letter
- Doesn't check if word is in dictionary (manual scoring)
- Allows empty fields (players don't need to fill all 6 inputs)

## Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Visit `http://localhost:3000`

### Build
```bash
npm run build
npm start
```

## Supabase Setup

### Required Tables
You need to create the three tables described in the Database Schema section with appropriate relationships and permissions.

### Real-time Setup
Enable real-time for:
- `games` table (UPDATE events)
- `players` table (INSERT, UPDATE, DELETE events)

### Row Level Security (RLS)
Configure RLS policies to allow:
- Anyone can INSERT into games and players
- Anyone can READ games, players, answers
- Anyone can UPDATE games (for status changes)
- Anyone can INSERT into answers
- Anyone can DELETE answers (for game reset)

## Game Mechanics Notes

### Scoring
- Currently manual - players review answers together
- No automated scoring system
- Host/group decides which answers are valid
- Common rules (Scattergories-style):
  - Must be a real word
  - Must start with the correct initial letter
  - Unique answers score points (typically 1 point)
  - Duplicate answers score 0 points
  - Can add bonus points for creative/unusual answers
  - Empty cells score 0 points

### Strategy Tips
- With 6 words to fill and limited time:
  - Think of uncommon words to avoid duplicates
  - Different initial patterns create different difficulty levels
  - Some letter combinations are harder than others (e.g., XQ vs AB)

### Teams
- `num_teams` field exists but team assignment not implemented
- Currently all players compete individually
- Future enhancement could add team-based scoring

## Future Enhancements

Potential improvements:
- **Automated scoring** with dictionary API validation
- **Auto-calculate duplicate detection** and point totals
- **Team assignment and team scores** using existing num_teams field
- **Multiple rounds** with cumulative scoring
- **Configurable number of rows** (currently fixed at 3)
- **Category-based rows** (e.g., Row 1: Animals, Row 2: Cities, Row 3: Foods)
- **Adjustable timer per row** instead of one global timer
- **Game history and leaderboards** with player statistics
- **Mobile-optimized layout** for better touch screen experience
- **Sound effects and animations** for timer countdown
- **Export results** to PDF or CSV
- **Difficulty presets** (e.g., Easy: A-Z sequential, Hard: Random weighted)

## Common Issues

### Players stuck in waiting room
- Ensure Supabase real-time is enabled
- Check browser console for subscription errors
- Verify database permissions

### Timer desync
- Server time (`started_at`) is source of truth
- Client-side calculation prevents manipulation
- May appear slightly different due to network latency

### Lost connection after refresh
- Player ID stored in localStorage
- Works as long as same browser/device
- Incognito mode clears localStorage on close

## Files Reference

| File | Purpose | Key Features |
|------|---------|--------------|
| `app/page.tsx` | Home page | Landing page with Initiate/Join options |
| `app/initiate/page.tsx` | Game creation | 6 initial pattern options, custom text input, weighted random distributions |
| `app/join/page.tsx` | Join game | Enter name and game code |
| `app/waiting/[gameId]/page.tsx` | Waiting room | Real-time player list, host controls |
| `app/play/[gameId]/page.tsx` | Game page | Timer, game board wrapper |
| `components/GameBoard.tsx` | Game board | 3-column grid (initials + 2 inputs), validation, 3 rows |
| `app/score/[gameId]/page.tsx` | Scoring | Shows all player answers by row, comparison view |
| `lib/supabase.ts` | Database client | Supabase configuration |

## API Routes Used

This app uses Supabase client-side queries (no custom API routes):
- `supabase.from('games').insert()`
- `supabase.from('players').select()`
- `supabase.from('answers').insert()`
- Real-time channels via `supabase.channel()`

All database operations happen directly from client components using the Supabase JavaScript client.
