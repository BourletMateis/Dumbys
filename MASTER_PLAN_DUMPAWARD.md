# 🚀 DUMBAWARD - MASTER DEVELOPMENT PLAN (PRO/ENTERPRISE LEVEL)

## 1. Context & Product Vision
**Product:** DumbAward - A daily social video-sharing and tournament voting app.
**Platforms:** iOS & Android (Cross-platform).
**Core Loops:**
1. **Daily:** Submit external video links (TikTok, X, Reels) into specific categories. View global/friends' daily feeds.
2. **Weekly/Monthly/Yearly (Tournament):** Gamified 1v1 bracket voting system to elect the best videos.
3. **Retention:** "Hall of Fame" tracking personal user choices vs. global community winners.

## 2. Technical Stack (Strict)
The AI agent must adhere strictly to these technologies. Do not invent custom solutions if a standard library exists below.
- **Framework:** React Native + Expo (Managed Workflow).
- **Language:** TypeScript (Strict mode enabled).
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Client State (UI/Local):** Zustand.
- **Server State & Caching:** TanStack React Query (Crucial for video feeds and caching).
- **Routing:** Expo Router (File-based routing, modern standard).
- **Styling:** NativeWind v4 (TailwindCSS for React Native).
- **Lists:** `@shopify/flash-list` (Mandatory for performant video feeds).
- **Animations:** `react-native-reanimated` & `expo-haptics`.
- **Forms & Validation:** `react-hook-form` + `zod`.



---

## 3. Database Architecture (Supabase / PostgreSQL)
Initialize these tables with Row Level Security (RLS) enabled on EVERY table.

### 3.1. Core Tables
| Table Name | Columns (Types) | Foreign Keys / Notes |
| :--- | :--- | :--- |
| `users` | `id` (uuid PK), `username` (text UNIQUE), `avatar_url` (text), `created_at` (timestamptz) | PK links to `auth.users` via Trigger. |
| `friendships` | `id` (uuid PK), `requester_id` (uuid), `addressee_id` (uuid), `status` (enum: pending, accepted), `created_at` (timestamptz) | Composite Unique Key on `(requester_id, addressee_id)`. |
| `categories` | `id` (uuid PK), `slug` (text UNIQUE), `name` (text), `icon_name` (text) | E.g., 'cringe', 'funny', 'fail'. |

### 3.2. Content & Interaction Tables
| Table Name | Columns (Types) | Foreign Keys / Notes |
| :--- | :--- | :--- |
| `videos` | `id` (uuid PK), `submitter_id` (uuid), `category_id` (uuid), `source_url` (text), `thumbnail_url` (text), `created_at` (timestamptz) | URLs must be validated. RLS: Insert if authenticated. |
| `reactions` | `id` (uuid PK), `user_id` (uuid), `video_id` (uuid), `emoji` (text) | Lightweight daily interactions. |

### 3.3. Tournament Engine Tables
| Table Name | Columns (Types) | Foreign Keys / Notes |
| :--- | :--- | :--- |
| `tournaments` | `id` (uuid PK), `type` (enum: weekly, monthly, yearly), `start_time` (timestamptz), `end_time` (timestamptz), `status` (enum: pending, active, closed) | Managed via Supabase Cron / Edge Functions. |
| `matches` | `id` (uuid PK), `tournament_id` (uuid), `category_id` (uuid), `video_a_id` (uuid), `video_b_id` (uuid), `round_level` (int) | `round_level`: 1 (Quarter), 2 (Semi), 3 (Final). |
| `match_votes` | `id` (uuid PK), `user_id` (uuid), `match_id` (uuid), `voted_video_id` (uuid) | RLS: User can only vote once per match. |
| `hall_of_fame` | `id` (uuid PK), `user_id` (uuid), `tournament_id` (uuid), `category_id` (uuid), `winning_video_id` (uuid) | Inserted locally by user after completing their bracket. |



---

## 4. Project Directory Structure
Enforce this feature-based architecture for scalability:
```text
/
├── app/                  # Expo Router (Screens & Layouts)
│   ├── (auth)/           # Login, Register
│   ├── (tabs)/           # Feed, Tournaments, Submit, Friends, Profile
│   └── _layout.tsx       # Root layout & Providers
├── src/
│   ├── components/       # Global reusable UI (Buttons, Inputs)
│   ├── features/         # Feature-specific logic & components
│   │   ├── auth/
│   │   ├── feed/
│   │   ├── tournaments/
│   │   └── profile/
│   ├── lib/              # Configurations (Supabase client, React Query queryClient)
│   ├── store/            # Zustand stores (Client state only)
│   ├── types/            # TypeScript interfaces & database.types.ts
│   └── utils/            # Helpers (Date formatting, URL parsing)
├── assets/
└── package.json
5. Development Roadmap (AI Execution Phases)
Phase 1: Infrastructure & Boilerplate
Initialize Expo project with Expo Router and TypeScript.

Setup NativeWind v4 and configure tailwind.config.js.

Initialize @supabase/supabase-js in src/lib/supabase.ts.

Generate TypeScript types from Supabase CLI (database.types.ts) and place them in src/types/.

Wrap the root layout (app/_layout.tsx) with TanStack React Query QueryClientProvider.

Phase 2: Authentication & Security
Implement OAuth (Apple/Google) and Magic Link login using Supabase Auth.

Create an Auth Context or Zustand store (useAuthStore) to manage the session securely.

Crucial: Write Postgres SQL scripts to establish RLS (Row Level Security). Users must only be able to update/delete their own data.

Build UI: app/(auth)/login.tsx.

Phase 3: The Daily Engine (Feed & Submit)
Submit Flow: Create app/(tabs)/submit.tsx. Use react-hook-form and zod to validate external URLs. Extract metadata if possible, save to videos table.

Feed Flow: Create app/(tabs)/index.tsx.

Use TanStack React Query (useQuery) to fetch today's videos.

Render using @shopify/flash-list for 60fps scrolling.

Implement two tabs: "Global" and "Friends Only" (filter by friendships table).

Phase 4: Social Graph
Create app/(tabs)/friends.tsx.

Implement user search with debounce.

Handle friend request logic (Send, Accept, Reject) modifying the friendships table.

Phase 5: The Tournament Engine (The hardest part)
UI Architecture: Do NOT render the whole tree. Create app/(tabs)/tournaments.tsx.

Match State: Fetch all matches for the active tournament_id. Store them in a local Zustand store useTournamentStore to manage the offline voting flow.

Duel Component: Display video_a and video_b. Upon user swipe or tap, register the vote in Zustand, trigger a reanimated transition, and load the next match.

Data Sync: Once the user finishes the finale, execute a single Supabase RPC (Remote Procedure Call) or bulk insert to push all match_votes and the final hall_of_fame results at once (saves network requests).

Phase 6: Profile & Hall of Fame
Create app/(tabs)/profile.tsx.

Fetch data from hall_of_fame using React Query.

Render a "Spotify Wrapped" style grid using NativeWind, displaying the user's historical winners.

Phase 7: Polish & Performance
Add expo-haptics to all vote buttons and bottom tab interactions.

Ensure all images/thumbnails use expo-image for aggressive caching.

Add Loading Skeletons for all React Query isLoading states.

6. Strict Rules for AI Agent
Never mock data if a Supabase connection is established. Write the actual queries.

Handle Loading & Error states strictly: Every useQuery or useMutation must have UI representations for isPending and isError.

TypeScript: No any types. Rely entirely on database.types.ts generated from Supabase.

Step-by-Step: Do not attempt to code Phase 5 before Phase 1-4 are verified and functional. Ask for human confirmation between phases.