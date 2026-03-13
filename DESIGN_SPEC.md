# DumbAward — Spécification Design Complète

> Ce document décrit **chaque écran, composant, couleur, typographie, icône, espacement et interaction** de l'application DumbAward. L'objectif est de permettre à un designer ou un LLM de recréer parfaitement le design.

---

## Table des matières

1. [Design System](#design-system)
2. [Navigation & Architecture](#navigation--architecture)
3. [Écrans — Auth](#auth)
4. [Écrans — Tabs](#tabs)
5. [Écrans — Modals & Deep Links](#modals--deep-links)
6. [Composants UI Partagés](#composants-ui-partagés)

---

## Design System

### Palette de couleurs

| Token | Hex | Usage |
|---|---|---|
| `bg-primary` | `#0A0A0A` | Fond principal de toutes les pages |
| `bg-surface` | `#141414` | Cartes, conteneurs |
| `bg-elevated` | `#1C1C1E` | Bottom sheets, modals, input bars |
| `brand` | `#6C5CE7` | Boutons primaires, tab indicator, liens actifs |
| `brand-light` | `#8B5CF6` | Variante plus claire (gradients, record) |
| `brand-dark` | `#4B3BBF` | Fin de gradient primaire |
| `success` | `#22C55E` | Boutons accepter, prix (gift icon) |
| `warning` | `#F59E0B` | Countdown, objectif (flag icon), podium gold |
| `error` | `#EF4444` | Suppression, déconnexion, flame icon |
| `info` | `#3B82F6` | Bouton join, vote actif |
| `text-primary` | `#FFFFFF` | Titres, noms, boutons |
| `text-secondary` | `#888` | Descriptions |
| `text-tertiary` | `#555` ou `#666` | Labels, dates, sous-textes |
| `text-muted` | `rgba(255,255,255,0.4)` | Section headers, labels uppercase |
| `border-subtle` | `rgba(255,255,255,0.06)` | Bordures de cartes, inputs |
| `border-medium` | `rgba(255,255,255,0.08)` | Tab bar border |
| `border-light` | `rgba(255,255,255,0.1)` | Inputs focus |
| `overlay-dark` | `rgba(0,0,0,0.6)` | Backdrop des bottom sheets, badges vidéo |
| `overlay-black` | `rgba(0,0,0,0.5)` | Tab bar background |

### Gradients récurrents

| Nom | Couleurs | Usage |
|---|---|---|
| `gradient-upload` | `#6C5CE7` → `#4B3BBF` | Phase upload banner, bouton galerie |
| `gradient-vote` | `#8B5CF6` → `#6D28D9` | Phase vote banner, bouton record |
| `gradient-podium` | `#F59E0B` → `#D97706` | Phase podium banner |
| `gradient-overlay` | `transparent` → `rgba(0,0,0,0.8)` | Overlay bas des thumbnails |
| `gradient-auth-bg` | `#1a0a2e` → `#0A0A0A` | Background login |

### Typographie

| Style | Taille | Poids | Couleur | Usage |
|---|---|---|---|---|
| `h1` | 42px | 900 | white | Logo "DumbAward" (login) |
| `h2` | 28px | 800 | white | Titres de page (Home, My Challenges, Friends, Upload) |
| `h3` | 24px | 800 | white | Username profil |
| `h4` | 20px | 700 | white | Titres de bottom sheet |
| `h5` | 18px | 800 | white | Nom de challenge dans une carte |
| `body` | 16px | 400-600 | white | Inputs, boutons, texte principal |
| `body-small` | 15px | 600 | white | Titre vidéo dans feed |
| `caption` | 14px | 500-600 | white | Usernames listes, sous-titres |
| `caption-small` | 13px | 400-500 | `#888` | Descriptions, infos secondaires |
| `label` | 12px | 600 | `rgba(255,255,255,0.4)` | Section headers (uppercase, letter-spacing: 1) |
| `micro` | 11px | 600-700 | variable | Badges, labels form, tags |
| `mono` | 24px | 700 | white | Code d'invitation (fontFamily: SpaceMono, letter-spacing: 3) |
| `stat-number` | 20px | 800 | white | Chiffres stats profil |
| `stat-label` | 12px | 400 | `#555` | Labels sous stats |

### Border Radius

| Token | Valeur | Usage |
|---|---|---|
| `rounded-sm` | 10px | Badges vidéo count |
| `rounded-md` | 12px | Filter chips |
| `rounded` | 14px | Inputs, boutons, header buttons |
| `rounded-lg` | 16px | Options bottom sheet |
| `rounded-xl` | 20px | Cartes challenge, bottom sheet, thumbnails vidéo |
| `rounded-2xl` | 24px | Gros boutons upload |
| `rounded-3xl` | 28px | Tab bar |
| `rounded-full` | 50% | Avatars, FAB, cercles |

### Espacement standard

| Token | Valeur | Usage |
|---|---|---|
| `space-xs` | 4px | Handle bar bottom sheet, petits gaps |
| `space-sm` | 8px | Gaps entre petits éléments |
| `space-md` | 12px | Padding vertical inputs, gap between rows |
| `space-base` | 14px | Gap entre cartes, padding horizontal |
| `space-lg` | 16px | Padding intérieur cartes, padding horizontal standard |
| `space-xl` | 20px | Padding horizontal bottom sheets, margin bottom titres |
| `space-2xl` | 24px | Gaps entre sections |
| `space-3xl` | 32px | Grandes séparations |

### Ombres

| Element | Shadow |
|---|---|
| FAB | `rgba(108,92,231,0.4)`, offset: 0/4, radius: 12, elevation: 8 |
| Tab bar | Aucune ombre explicite, effet glass via BlurView |

### Icônes (Ionicons)

**Navigation tabs** : `globe` / `globe-outline`, `lock-closed` / `lock-closed-outline`, `add`, `people` / `people-outline`, `person-circle` / `person-circle-outline`

**Actions** : `heart` / `heart-outline`, `chatbubble-outline`, `share-outline`, `trash-outline`, `arrow-up-circle`, `camera`, `images`, `videocam`, `play`, `play-circle`, `close`, `arrow-back`, `search`, `close-circle`, `add`, `enter-outline`

**Status/Info** : `trophy` / `trophy-outline`, `checkmark-circle`, `flame`, `flag`, `gift`, `time-outline`, `information-circle-outline`, `notifications-outline`, `lock-closed`, `sparkles`, `people`

---

## Navigation & Architecture

### Structure des routes (Expo Router)

```
app/
├── _layout.tsx              → Stack root (thème dark)
├── (auth)/
│   ├── _layout.tsx          → Stack sans header
│   └── login.tsx            → Écran de connexion
├── (tabs)/
│   ├── _layout.tsx          → Tab bar glassmorphique custom
│   ├── index.tsx            → 🌐 Challenges publics (Home)
│   ├── explore.tsx          → 🔒 Challenges privés (My Challenges)
│   ├── upload.tsx           → ➕ Upload vidéo (multi-step)
│   ├── friends.tsx          → 👥 Amis & suggestions
│   └── profile.tsx          → 👤 Profil perso
├── feed/
│   └── [groupId].tsx        → Feed TikTok vertical
├── group/
│   └── [id].tsx             → Dashboard d'un challenge
├── user/
│   └── [id].tsx             → Profil public d'un user
├── video-comments/
│   └── [id].tsx             → Commentaires (modal)
└── video.tsx                → Lecteur vidéo plein écran (modal)
```

### Animations de transition

| Route | Animation |
|---|---|
| `group/[id]` | `slide_from_right` |
| `user/[id]` | `slide_from_right` |
| `feed/[groupId]` | `fade` |
| `video-comments/[id]` | `modal` (presentation) |
| `video` | `fullScreenModal` |

---

## Auth

### Login (`/app/(auth)/login.tsx`)

**Background** : LinearGradient `#1a0a2e` → `#0A0A0A`

**Layout** : KeyboardAvoidingView centré verticalement

**Éléments dans l'ordre :**

1. **Logo** : "DumbAward" — 42px, weight 900, white, center
2. **Tagline** : "Challenge your friends" — 16px, `rgba(255,255,255,0.5)`, center
3. **Boutons OAuth** (gap: 12px, margin top: 40px) :
   - **Apple** (iOS only) : fond blanc, texte noir, icône Apple, 56px height, borderRadius 14
   - **Google** : fond `rgba(255,255,255,0.06)`, bordure `rgba(255,255,255,0.06)`, texte blanc, icône logo Google (emoji 🔵 ou custom), 56px height, borderRadius 14
4. **Séparateur "OR"** : ligne `rgba(255,255,255,0.1)` + texte `#555` centré
5. **Inputs** (gap: 12px) :
   - Email : `rgba(255,255,255,0.06)` bg, placeholder `#555`, borderRadius 14, padding 18h/16v, fontSize 16, autoCapitalize none, keyboardType email
   - Password : idem, secureTextEntry
6. **Bouton submit** : full width, `#6C5CE7` bg (0.5 opacity si disabled), borderRadius 14, padding 16v, texte 16px 700 weight — "Sign In" ou "Sign Up"
7. **Toggle link** : texte `#666` + lien `#6C5CE7` — "Don't have an account? Sign Up" / "Already have an account? Sign In"
8. **Message d'erreur** (conditionnel) : `rgba(239,68,68,0.1)` bg, bordure `rgba(239,68,68,0.15)`, texte `#EF4444` 14px center, borderRadius 12, padding 12

---

## Tabs

### Tab Bar (`/app/(tabs)/_layout.tsx`)

**Design** : Barre flottante glassmorphique fixée en bas

**Conteneur** :
- Position absolute, bottom: 12px, left: 20px, right: 20px
- BorderRadius: 28
- Border: 1px `rgba(255,255,255,0.08)`
- Overflow: hidden

**Fond** : BlurView (intensity: 60, tint: "dark") + fond `rgba(0,0,0,0.5)`

**Contenu** : Row horizontal, padding 8px vertical, 6px horizontal

**Chaque tab (sauf upload)** :
- Flex: 1, center
- Icône : 24px, active = `#6C5CE7`, inactive = `rgba(255,255,255,0.4)`
- Indicateur actif : cercle 4x4, `#6C5CE7`, margin top 4px
- Indicateur inactif : cercle 4x4, transparent

**Tab Upload (central)** :
- LinearGradient : active `#8B5CF6` → `#6C5CE7`, inactive `#6C5CE7` → `#4B3BBF`
- Taille : 48w × 36h, borderRadius 14
- Icône `add` : 26px, white
- Pas de dot indicator

**Tabs dans l'ordre** :
1. `index` — globe/globe-outline — "Home" (caché)
2. `explore` — lock-closed/lock-closed-outline — "Explore" (caché)
3. `upload` — add (gradient button) — "Upload" (caché)
4. `friends` — people/people-outline — "Friends" (caché)
5. `profile` — person-circle/person-circle-outline — "Profile" (caché)

> Les labels sont masqués (`tabBarShowLabel: false`), navigation par icônes uniquement.

---

### Home — Challenges Publics (`/app/(tabs)/index.tsx`)

**Data hooks** : `usePublicGroups`, `useChallengeStats`, `useJoinPublicGroup`, `useTimelineLogic`

**Layout** : FlatList vertical, padding top = safeArea + 8px, padding horizontal 16px, padding bottom 120px

**Header (ListHeaderComponent)** :

1. **Row titre** :
   - "DumbAward" : 28px, 800 weight, white
   - Bouton notifications (droit) : 36×36, borderRadius 12, `rgba(255,255,255,0.06)` bg, icône `notifications-outline` 20px `rgba(255,255,255,0.4)`

2. **Phase Banner** : margin bottom 20px
   - LinearGradient, borderRadius 20, padding 20px
   - Couleurs selon phase : upload = `#6C5CE7` → `#4B3BBF`, vote = `#8B5CF6` → `#6D28D9`, podium = `#F59E0B` → `#D97706`
   - **Row supérieure** :
     - Icône (24px, white) : upload = `videocam`, vote = `trophy`, podium = `sparkles`
     - Texte "Week {n}" : 13px, 600 weight, `rgba(255,255,255,0.8)`
     - Badge countdown (droite) : `rgba(255,255,255,0.2)` bg, borderRadius 10, padding 6h/4v
       - Icône `time-outline` 12px white + texte "Xd Xh" 12px 600 weight white
   - **Titre** : 20px, 800 weight, white — "Upload Phase" / "Vote Phase" / "Podium"
   - **Sous-titre** : 13px, `rgba(255,255,255,0.7)` — description de la phase
   - **Timeline dots** (row, gap 8, margin top 14) :
     - Jours passés : 20×20, `rgba(255,255,255,0.3)` bg, icône `checkmark` 10px white
     - Jour actuel : 22×22, bordure 2px white, gradient bg
     - Jours futurs : 20×20, `rgba(255,255,255,0.15)` bg

3. **Filter Chips** (row horizontal, gap 8, margin bottom 16) :
   - 3 options : "🔥 Hot", "✨ New", "✅ Joined"
   - Actif : `#6C5CE7` bg
   - Inactif : `rgba(255,255,255,0.06)` bg
   - Tous : borderRadius 12, padding 16h/10v, texte 13px 600 weight white

4. **Section header** : "PUBLIC CHALLENGES" — icône `globe` 12px + texte label style (12px uppercase, letter-spacing 1, `rgba(255,255,255,0.4)`), margin bottom 14

**Carte Challenge (PublicChallengeCard)** :
- Container : `#141414` bg, borderRadius 20, overflow hidden, margin bottom 14, border 1px `rgba(255,255,255,0.06)` — si membre : border `rgba(108,92,231,0.3)`
- **Zone thumbnail** (140px height si image, 100px si fallback) :
  - Si image : Image cover + LinearGradient overlay (transparent → `rgba(0,0,0,0.8)`, height 60px, en bas)
  - Si pas d'image : fond `{color}15`, icône `trophy` 36px `{color}40`, centré
  - Badge video count (top right) : `rgba(0,0,0,0.6)` bg, borderRadius 10, padding 10h/5v, icône `videocam` 12px + texte 12px 700 weight
  - Badge "Joined" (top left, si membre) : `rgba(108,92,231,0.8)` bg, borderRadius 10, padding 10h/5v, texte 11px 700 weight
- **Zone info** (padding 16) :
  - Nom : 18px, 800 weight, white, max 2 lignes
  - Description : `#888`, 13px, margin top 4, max 2 lignes
  - **Goal/Prize** (margin top 8, gap 4) :
    - Goal : icône `flag` 12px `#F59E0B` + texte 12px 500 weight `#F59E0B`, max 1 ligne
    - Prize : icône `gift` 12px `#22C55E` + texte 12px 500 weight `#22C55E`, max 1 ligne
  - **Row stats** (margin top 12, space-between) :
    - Gauche (row, gap 16) :
      - Membres : icône `people` 14px `#555` + texte 13px 500 weight `#555`
      - Vidéos (si > 0) : icône `flame` 14px `#EF4444` + texte 13px 600 weight `#EF4444`
    - Droite (si pas membre) : Bouton "Join" — `#6C5CE7` bg, borderRadius 12, padding 12h/8v, icône `enter-outline` 14px white + texte 13px 700 weight white

**Empty state** : EmptyState component avec icône et texte
**Loading** : ActivityIndicator `#6C5CE7` centré

---

### Explore — Challenges Privés (`/app/(tabs)/explore.tsx`)

**Data hooks** : `useMyGroups` (filtré `!is_public`), `useChallengeStats`, `useCreateGroup`, `useJoinGroupByCode`, `useDeleteGroup`, `useUploadGroupVideo`, `useTimelineLogic`

**Layout** : FlatList + FAB + BottomSheets

**Header** :
- "My Challenges" : 28px, 800 weight
- Section header : icône `lock-closed` 12px + "PRIVATE CHALLENGES" label style

**Carte Challenge (ChallengeCard)** : Même structure que Home mais avec :
- Badge role (top left) : `rgba(108,92,231,0.8)` bg, texte capitalize du role (owner/member)
- Bouton upload (bas droite, si canUpload) : 36×36, borderRadius 18, `#6C5CE7` bg, icône `add` 20px white
- **Couleur** de fallback : hash déterministe du nom → palette `[#6C5CE7, #3B82F6, #EC4899, #22C55E, #F59E0B, #EF4444]`

**Long-press** : Alert avec option "Delete Challenge" (owner only)

**FAB** : Coin bas droit, position right 20 bottom 100, 56×56, `#6C5CE7`, icône `add`/`close` toggle

**BottomSheet Menu** (snapPoint 0.35) :
- Titre "Private Challenge" : 20px, 700 weight
- Option "Create Private Challenge" : row, icône dans carré 44×44 `rgba(108,92,231,0.2)` bg borderRadius 14, texte 16px 600 weight + sous-texte `#666` 13px, fond `rgba(255,255,255,0.05)` borderRadius 16 padding 16
- Option "Join Private Challenge" : idem, carré bleu `rgba(59,130,246,0.2)`, icône `enter-outline` `#3B82F6`

**BottomSheet Create** (snapPoint 0.65) :
- Titre "Create Private Challenge"
- 4 TextInputs : nom, description, goal, prize — style input standard
- Bouton "Create Challenge" : full width, `#6C5CE7` bg, borderRadius 14, padding 16v, disabled 0.5 opacity

**BottomSheet Join** (snapPoint 0.65) :
- Titre "Join Private Challenge"
- TextInput : invite code — SpaceMono font, letter-spacing 2
- Bouton "Join Challenge" : `#3B82F6` bg

**BottomSheet Upload** (snapPoint 0.35 → 0.5 quand vidéo sélectionnée) :
- **Étape 1 (pas de vidéo)** :
  - Titre "Add a video"
  - "Choose from Gallery" : icône `images` dans carré violet, texte + sous-texte
  - "Record a Video" : icône `videocam` dans carré `rgba(139,92,246,0.2)`, texte + sous-texte
- **Étape 2 (vidéo sélectionnée)** :
  - Titre "New Post"
  - Label "TITLE (OPTIONAL)" : 11px, uppercase, letter-spacing 1, `rgba(255,255,255,0.4)`
  - TextInput title : max 100 chars
  - Label "DESCRIPTION (OPTIONAL)"
  - TextInput description : multiline, 3 lines, min height 80px, max 300 chars
  - Bouton "Publish" : `#6C5CE7` bg, icône `arrow-up-circle` 20px + texte "Publish" — ou "Uploading..." avec ActivityIndicator

---

### Upload (`/app/(tabs)/upload.tsx`)

**Data hooks** : `useMyGroups`, `usePublicGroups`, `useUploadGroupVideo`, `useTimelineLogic`

**Layout** : Multi-step flow

**Étape 1 — Pas de vidéo** :
- Titre "Upload" : 28px, 800 weight
- Sous-titre "Share your moment" : `#888`, 14px
- **Deux gros boutons** (margin top 32, gap 14) :
  - "Choose from Gallery" : LinearGradient `#6C5CE7` → `#4B3BBF`, borderRadius 24, padding 40v/24h
    - Icône dans cercle 64×64 `rgba(255,255,255,0.2)`, icône `images` 28px white
    - Texte 20px 700 weight + sous-texte 14px `rgba(255,255,255,0.7)`
  - "Record a Video" : LinearGradient `#8B5CF6` → `#6D28D9`, même structure, icône `videocam`
- **Hors phase upload** : icône `time-outline` 48px `#555`, texte explicatif 16px 600 weight `#888`

**Étape 2 — Vidéo sélectionnée** :
- **Header** : bouton back 40×40 + "New Post" 18px 700 weight + spacer 40×40
- **ScrollView** :
  - **Preview vidéo** : 220px height, borderRadius 20, `#141414` bg, icône play overlay
    - Bouton "Change" (top right) : `rgba(0,0,0,0.6)` bg, borderRadius 10, padding 8h/6v
  - **Title input** : label 11px uppercase + TextInput, max 100
  - **Description input** : label 11px uppercase + TextInput multiline, max 300, min height 80
  - **Sélecteur de groupe** :
    - Label "SELECT CHALLENGE"
    - Filter chips horizontal : "All", "Private", "Public" — même style que Home
    - Liste à plat des groupes privés
    - Groupes publics groupés par catégorie (headers)
    - **Chaque option groupe** :
      - Row : avatar 44×44 (couleur catégorie ou initial) + infos + checkbox
      - Selected : border 2px `#6C5CE7`, bg `rgba(108,92,231,0.15)`
      - Unselected : border 1px `rgba(255,255,255,0.06)`, bg `#141414`
      - BorderRadius 16, padding 14
      - Checkbox : 24×24, borderRadius 12, `#6C5CE7` bg si selected sinon `rgba(255,255,255,0.06)`
- **Bouton Publish (fixed bottom)** :
  - Position absolute, bottom 0, full width
  - Padding : 18v/16h + safeArea bottom
  - Fond : `#1C1C1E` avec border top `rgba(255,255,255,0.06)`
  - Bouton intérieur : `#6C5CE7` si groupe sélectionné, `#222` sinon
  - BorderRadius 14, padding 16v
  - Texte : "Publish to {groupName}" ou "Select a challenge"

---

### Friends (`/app/(tabs)/friends.tsx`)

**Data hooks** : `useSearchUsers`, `useFriendships`, `useSuggestedFriends`, `useSendRequest`, `useAcceptRequest`, `useRemoveFriendship`

**Layout** : Search mode (FlatList) ou Default mode (ScrollView)

**Header** :
- "Friends" : 28px, 800 weight
- **Search bar** : `rgba(255,255,255,0.06)` bg, borderRadius 14, padding 14h/12v, row
  - Icône `search` 18px `#555` (gauche)
  - TextInput : flex 1, 15px, placeholder "Search users..."
  - Icône `close-circle` 18px `#555` (droite, conditionnel si texte)
  - Debounce : 300ms

**Mode Default (ScrollView)** :

1. **Section Suggestions** (si disponible) :
   - Header : "SUGGESTIONS" label style
   - **ScrollView horizontal** (gap 12) :
     - Carte 100w : `#141414` bg, borderRadius 16, border 1px `rgba(255,255,255,0.06)`, padding 14
       - Avatar 56×56, centré
       - Username 13px 600 weight, centré, max 1 ligne
       - "X shared groups" : 11px `#888`, centré
       - Bouton "Add" : full width, `#6C5CE7` bg, borderRadius 10, padding 8v
         - Ou "Sent" : `rgba(255,255,255,0.06)` bg, texte `#888`

2. **Section Friend Requests** (si > 0) :
   - Header : "FRIEND REQUESTS (count)" label style
   - **ScrollView horizontal** (gap 12) :
     - Carte 140w : `#141414` bg, borderRadius 16, border 1px `rgba(255,255,255,0.06)`, padding 14
       - Avatar 56×56, centré
       - Username 14px 600 weight, centré, max 1 ligne
       - Row boutons (gap 8, margin top 10) :
         - Accepter : flex 1, `#22C55E` bg, borderRadius 10, padding 10v, icône `checkmark` 18px white
         - Refuser : flex 1, `rgba(255,255,255,0.06)` bg, borderRadius 10, padding 10v, icône `close` 18px `#888`

3. **Section Sent Requests** (si > 0) :
   - Header : "SENT REQUESTS" label style
   - Liste verticale :
     - Row : Avatar + username 16px 600 weight + badge "Pending" (`rgba(255,255,255,0.06)` bg, borderRadius 8, padding 8h/4v, texte 12px `#888`)
     - Padding 12v, border bottom `rgba(255,255,255,0.04)`

4. **Section Friends** :
   - Header : "FRIENDS (count)" label style
   - Liste verticale :
     - Row pressable (vers `/user/[id]`) :
       - Avatar **64×64** (plus grand que le reste)
       - Username 16px 600 weight + "Friends since {date}" 12px `#555`
       - Bouton remove : 32×32, borderRadius 16, `rgba(239,68,68,0.1)` bg, icône `close` 14px `#EF4444`
     - Padding 12v, border bottom `rgba(255,255,255,0.04)`

**Mode Search (FlatList)** :
- Items : row avec Avatar + username + bouton action
- Bouton "Add" : `#6C5CE7` bg, borderRadius 10, padding 10h/6v
- Bouton "Sent" : `rgba(255,255,255,0.06)` bg
- Bouton "Friends" / "Pending" : `rgba(255,255,255,0.06)` bg, texte `#888`
- Empty : texte "No users found" centré, `#888`

---

### Profile (`/app/(tabs)/profile.tsx`)

**Data hooks** : `useUserProfile`, `useMyVideos`, `useMyGroups`, `useFollowerCount`, `useFollowingCount`, `useDeleteVideo`, `useUpdateAvatar`

**Layout** : ScrollView

1. **Avatar section** (center, margin top 20) :
   - Avatar : **96×96**
   - Bouton caméra (overlay, position absolute bottom -2 right -2) : 30×30, borderRadius 15, `#6C5CE7` bg, border 2px `#0A0A0A`, icône `camera` 14px white

2. **Username** : 24px, 800 weight, center, margin top 12
3. **Date inscription** : 13px, `#555`, center, margin top 4

4. **Stats Row** (row, margin top 20, padding horizontal 20) :
   - 4 colonnes (flex 1, center) :
     - Nombre : 20px, 800 weight, white
     - Label : 12px, `#555`
   - Colonnes : Videos, Followers, Following, Challenges

5. **Section "MY VIDEOS"** :
   - Header : label style avec icône `grid` 12px `#6C5CE7`
   - **Grid 3 colonnes** (gap 2px, flexWrap) :
     - Chaque tile : TILE_SIZE × TILE_SIZE (= (screenWidth - 32 - 4) / 3)
     - `#141414` bg, borderRadius 4
     - Si thumbnail : Image cover
     - Sinon : icône `play` 24px `#333` centré
     - Long-press : Alert confirmation suppression

6. **Bouton Sign Out** (margin top 32) :
   - `rgba(239,68,68,0.1)` bg
   - Border 1px `rgba(239,68,68,0.15)`
   - BorderRadius 14, padding 16v
   - Texte "Sign Out" : 16px, 600 weight, `#EF4444`, center

---

## Modals & Deep Links

### Feed TikTok (`/app/feed/[groupId].tsx`)

**Data hooks** : `useGroupVideos`, `useUploadGroupVideo`, `useMyVote`, `useVoteCounts`, `useCastVote`, `useTimelineLogic`

**Layout** : FlatList vertical, pagingEnabled, full screen items

**FeedItem (chaque vidéo)** — plein écran :

- **VideoView** : expo-video, contentFit cover, full screen
- **Tap simple** : pause/play avec icône animée (spring scale 0→1→0, opacity)
- **Double tap** : like + cœurs animés (3-5 cœurs, positions random, spring animations avec rotation)

- **Overlay droit** (position absolute, right 12, bottom ~200, gap 22) :
  - **Avatar** : 44×44, border 2px white, pressable → `/user/[id]`
  - **Like** : icône `heart`/`heart-outline` 28px (red si liké), count 11px white center
  - **Comments** : icône `chatbubble-outline` 28px white, count 11px white center, pressable → `/video-comments/[id]`
  - **Vote** (phase vote uniquement) : cercle 44×44
    - Pas voté : `rgba(255,255,255,0.2)` bg, icône `trophy-outline` 22px white
    - Voté : `#3B82F6` bg, icône `checkmark-circle` 22px white
  - **Vote count** (hors phase vote) : icône `trophy` 22px `#F59E0B` + count 11px

- **Overlay bas** (LinearGradient transparent → `rgba(0,0,0,0.7)`, height 200) :
  - Username : "@{username}" 16px, 700 weight, white, pressable
  - Titre (si existe) : 15px, 600 weight, white, margin top 4
  - Description (expandable) : 13px, `rgba(255,255,255,0.8)`, max 2 lignes
    - Lien "more" : `#6C5CE7` 13px 600 weight

- **Header overlay** (position absolute top, safeArea + 8, full width, z-index 50) :
  - Row space-between, padding horizontal 16
  - Gauche (row, gap 8) :
    - Back button : 40×40, borderRadius 20, `rgba(0,0,0,0.5)` bg, icône `arrow-back` 22px white
    - Upload button (conditionnel) : 40×40, borderRadius 20, `#6C5CE7` bg, icône `add` 22px white
  - Centre : "X / total" 14px, 600 weight, white (dans `rgba(0,0,0,0.5)` bg, borderRadius 12, padding 8h/4v)
  - Droite : Info button 40×40, borderRadius 20, `rgba(0,0,0,0.5)` bg, icône `information-circle-outline` 22px white

- **Mode user** : cache bouton upload et bouton info, accepte `userId` + `videoIds` params

---

### Dashboard Challenge (`/app/group/[id].tsx`)

**Data hooks** : `useMyGroups`, `useGroupVideos`, `useUploadGroupVideo`, `useDeleteVideo`, `useWeeklyPodium`, `useGroupMembers`, `useRemoveMember`, `useDeleteGroup`, `useLeaveGroup`, `useMyVote`, `useVoteCounts`, `useCastVote`, `useRealtimeGroupVideos`, `useTimelineLogic`

**Layout** : ScrollView + bottom sheets

**Header** (row, padding 16h, safeArea top) :
- Back button : 40×40, borderRadius 14, `rgba(255,255,255,0.06)` bg, icône `arrow-back` 22px white
- Titre : flex 1, 18px 700 weight, center, max 1 ligne
- Members button : 40×40, borderRadius 14, `rgba(255,255,255,0.06)` bg, icône `people` 20px white
- Share/Invite button : 40×40, borderRadius 14, `rgba(255,255,255,0.06)` bg, icône `share-outline` 20px white

**Info Card** (margin 16, `#141414` bg, borderRadius 20, border 1px `rgba(255,255,255,0.06)`, padding 20) :
- **Badges row** (gap 8, flexWrap) :
  - Public/Private : bg `rgba(108,92,231,0.15)` ou `rgba(59,130,246,0.15)`, texte `#6C5CE7` ou `#3B82F6`, 12px 600 weight, icône
  - Countdown : `rgba(245,158,11,0.15)` bg, `#F59E0B` texte, icône `time-outline` + "Xd Xh Xm"
  - Ended : `rgba(239,68,68,0.15)` bg, `#EF4444` texte
- **Goal** (margin top 12) : icône `flag` 14px `#F59E0B` + texte 14px `#F59E0B`
- **Prize** : icône `gift` 14px `#22C55E` + texte 14px `#22C55E`
- **Description** : `#888`, 13px, margin top 8
- **Member count** : 20px 800 weight white + "members" 13px `#888`

**Podium** (si winners, margin 16) :
- Container : `rgba(245,158,11,0.08)` bg, border 1px `rgba(245,158,11,0.15)`, borderRadius 20, padding 20
- Titre "🏆 This Week's Podium" : 16px 700 weight
- Médailles : 🥇🥈🥉 avec avatar, username, vote count

**Phase Banner** (margin 16h) :
- "Week {n}" + badge phase
- Badge couleurs : Vote `#8B5CF6`, Upload `#22C55E`, Results `#3B82F6`

**Boutons Upload** (si canUpload et pas ended, margin 16h, row gap 10) :
- Gallery : flex 1, `rgba(108,92,231,0.15)` bg, border 1px `rgba(108,92,231,0.2)`, borderRadius 16, padding 16v, icône `images` 22px `#6C5CE7`
- Record : flex 1, `rgba(139,92,246,0.15)` bg, border 1px `rgba(139,92,246,0.2)`, borderRadius 16, padding 16v, icône `videocam` 22px `#8B5CF6`

**Liste Vidéos** (VideoItem, section "VIDEOS THIS WEEK") :
- Row : thumbnail 80×80 borderRadius 12 + infos
- Infos : titre 15px 600 weight, username 13px `#888`, row actions
- Actions : like (heart + count), comments (chatbubble + count), vote (conditionnel)
- Pressable → feed

**BottomSheet Members** (snapPoint 0.6) :
- Header : "Members (count)" 20px 700 weight
- Liste : Avatar + username + role badge
- Actions owner : icône delete `#EF4444`
- Bouton bas : "Delete Challenge" (owner, rouge) ou "Leave Challenge" (member)

**BottomSheet Invite** (snapPoint 0.35) :
- Titre "Invite Friends"
- Code : SpaceMono, 24px, 700 weight, letter-spacing 3, center, `rgba(255,255,255,0.06)` bg, borderRadius 14, padding 16
- Bouton "Share Invite Code" : full width, `#6C5CE7`, icône `share-outline`

**BottomSheet Upload Details** (snapPoint 0.5) :
- Même contenu que dans explore.tsx étape 2

---

### Profil Public (`/app/user/[id].tsx`)

**Data hooks** : `usePublicProfile`, `usePublicVideos`, `useIsFollowing`, `useFollowerCount`, `useFollowingCount`, `useToggleFollow`

Même layout que Profile mais avec :
- Pas de bouton caméra sur l'avatar
- **Bouton Follow** au lieu de Sign Out :
  - Following : `rgba(255,255,255,0.06)` bg, texte "Following" `#999`
  - Not following : `#6C5CE7` bg, texte "Follow" white
  - BorderRadius 14, padding 12v/32h, minWidth 140, center
- 3 stats au lieu de 4 (pas "Challenges")
- Redirection auto si c'est son propre profil

---

### Commentaires (`/app/video-comments/[id].tsx`)

**Data hooks** : `useLikeCount`, `useHasLiked`, `useToggleLike`, `useComments`, `useAddComment`, `useDeleteComment`

**Présentation** : modal

**Layout** : FlatList + fixed input bar

**List Header** :
- **Preview vidéo** : 200px height, `#141414` bg, borderRadius 0, icône play overlay
- **User + Like bar** : row space-between, padding 12h/10v, border bottom 1px `rgba(255,255,255,0.04)`
  - Avatar 28×28 + username 14px 600 weight
  - Heart icon + count 13px 600 weight
- **Comments header** : "Comments (count)" 16px 700 weight, padding 16h/12v

**Comment Row** :
- Row : Avatar 32×32 + contenu
- Contenu : username 14px 700 weight (pressable → profile) + texte 14px inline
- Time ago : 12px, `#555`
- Delete link (si propre commentaire) : "Delete" 12px `#EF4444`
- Padding 12v/16h

**Input Bar** (fixed bottom) :
- Position absolute bottom 0, full width
- Background `#1C1C1E`, border top 1px `rgba(255,255,255,0.04)`
- Padding : 10v/16h + safeArea bottom
- Row : TextInput flex 1 + send button
- TextInput : `rgba(255,255,255,0.06)` bg, borderRadius 20, padding 16h/10v, placeholder `#555`, 15px, max 500 chars
- Send button : 36×36, borderRadius 18, `#6C5CE7` bg (ou `#333` si disabled), icône `arrow-up` 18px white

---

### Vidéo Plein Écran (`/app/video.tsx`)

- WebView full screen, fond noir
- Bouton close : 40×40, top left (safeArea), `rgba(0,0,0,0.6)` bg, borderRadius 20, icône `close` 24px white
- Loading : ActivityIndicator white centré

---

## Composants UI Partagés

### `BottomSheet` (`src/components/ui/BottomSheet.tsx`)
- **Props** : `isOpen`, `onClose`, `snapPoint` (0-1, default 0.5), `children`
- **Implementation** : React Native Modal + Reanimated + Gesture Handler
- **Backdrop** : `rgba(0,0,0,0.6)`, animated opacity, pressable to close
- **Sheet** : `#1C1C1E` bg, borderRadius 20 (top), full screen height
- **Handle** : 40×4, borderRadius 2, `#555`, centered, padding 12 top / 8 bottom
- **Gesture** : Pan down to close (threshold: 100px translation ou 500px/s velocity)
- **Animation** : Spring (damping 25, stiffness 200)
- **Content** : ScrollView + KeyboardAvoidingView

### `Avatar` (`src/components/ui/Avatar.tsx`)
- **Props** : `url?`, `username`, `size?`, `borderColor?`, `borderWidth?`
- **Colors** : `[#6C5CE7, #3B82F6, #EC4899, #22C55E, #F59E0B, #EF4444, #8B5CF6, #06B6D4]`
- **Hash** : deterministic color from username string
- **With URL** : Image rounded full
- **Without URL** : colored circle + first letter (font = 40% of size)

### `AnimatedPressable` (`src/components/ui/AnimatedPressable.tsx`)
- **Props** : PressableProps + `scaleValue` (default 0.96)
- **Animation** : withSpring scale (damping 15, stiffness 300)

### `FloatingActionButton` (`src/components/ui/FloatingActionButton.tsx`)
- **Props** : `onPress`, `icon` (default "add"), `size` (default 56), `bottom` (default 100)
- **Style** : `#6C5CE7` bg, position absolute right 20, borderRadius size/2
- **Shadow** : `rgba(108,92,231,0.4)`, offset 0/4, radius 12, elevation 8
- **Animation** : scale 0.9 on press, haptic medium impact

### `EmptyState` (`src/components/ui/EmptyState.tsx`)
- **Props** : `icon`, `title`, `subtitle?`, `actionLabel?`, `onAction?`
- **Icon circle** : 80×80, `rgba(108,92,231,0.15)` bg, borderRadius 40, icône 36px `#6C5CE7`
- **Title** : large, bold, white
- **Subtitle** : 14px, neutral-500
- **Action button** : `#6C5CE7` bg, borderRadius full, padding 24h/12v
