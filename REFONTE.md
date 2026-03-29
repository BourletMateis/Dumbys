# REFONTE DUMBYS — Plan complet

> **Objectif** : Passer d'une app confuse à 5 tabs avec une hiérarchie de 4 niveaux à une app fluide, intuitive, avec un feed social vivant et des notifications push Apple + Android.

---

## Table des matières

1. [Vision & Principes](#1-vision--principes)
2. [Navigation — Avant / Après](#2-navigation--avant--après)
3. [Écrans redesignés](#3-écrans-redesignés)
4. [Push Notifications](#4-push-notifications)
5. [Migrations Supabase](#5-migrations-supabase)
6. [Fichiers à créer / modifier / supprimer](#6-fichiers-à-créer--modifier--supprimer)
7. [Phases d'implémentation](#7-phases-dimplentation)

---

## 1. Vision & Principes

### Concept central
Dumbys = **des potes qui se foutent des défis vidéo, votent pour le meilleur, et se battent en tournois**.

### Problèmes actuels résumés
| Problème | Impact |
|---|---|
| 4 niveaux de navigation (Groupe→Tournoi→Défi→Vidéo) | Les tournois/défis ne sont jamais utilisés |
| Tab Upload = upload + créer tournoi (aucun rapport) | Confusion totale |
| Home = 2 listes statiques | Aucun engagement, aucune activité |
| Amis = carnet d'adresses inutile | Feature morte |
| Timeline hebdo invisible | Personne ne comprend pourquoi il peut/ne peut pas voter |
| Explore tab séparé du feed | Fragmentation |
| Démo data hardcodée (DEMO_GROUPS) | Bugs visuels |

### Principes de la refonte
- **1 action = 1 tap maximum** depuis la home
- **La timeline est toujours visible** sur chaque groupe
- **Les amis ont un impact réel** sur le feed
- **Le feed est vivant** : activité de mes groupes + amis + discover
- **Notifications** pour ramener les gens à l'app aux bons moments

---

## 2. Navigation — Avant / Après

### Avant (5 tabs)
```
Home | Explore | Upload(tab) | Friends | Profile
```
- Upload est une action, pas une destination
- Friends est un carnet d'adresses sans utilité dans le feed
- Explore duplique le contenu de la Home

### Après (4 tabs + FAB)
```
┌──────────┬──────────┬────┬──────────┬──────────┐
│  Feed    │ Tournois │ ➕ │          │  Profil  │
└──────────┴──────────┴────┴──────────┴──────────┘
```

| Tab | Rôle |
|---|---|
| **Feed** | Mon feed : stories groupes + vidéos groupes + amis + discover |
| **Tournois** | Tous mes tournois actifs avec leurs défis et phases |
| **➕ FAB** | Action : poster dans un groupe OU répondre à un défi |
| **Profil** | Mon profil + mes vidéos + mes batailles gagnées + mes amis |

### Logique du FAB
Le FAB n'est plus un tab. C'est un bouton flottant qui ouvre un BottomSheet.

```
Tap ➕
  ↓
BottomSheet "Où tu veux poster ?"
  ├── Section "Mes groupes" (cards horizontales)
  └── Section "Défis actifs" (si phase upload en cours)

Tap sur un groupe
  ↓
Caméra native OU galerie (sheet de choix)
  ↓
Screen post.tsx (preview + description + publier)

Tap sur un défi actif
  ↓
Caméra OU galerie
  ↓
Screen post-challenge.tsx (preview + titre optionnel + publier dans le défi)
```

---

## 3. Écrans redesignés

### 3.1 Feed (nouvelle Home)

**Structure verticale :**

```
┌─────────────────────────────────────────┐
│  Dumbys              🔔 [avatar]        │  ← header minimaliste
├─────────────────────────────────────────┤
│  ○ La Team   ○ Skate   ○ Besties  ──→  │  ← Stories groupes
│  UPLOAD      VOTE      PODIUM           │     badge phase coloré
├─────────────────────────────────────────┤
│                                         │
│  [Video card - groupe La Team]          │  ← vidéos de mes groupes
│  [Video card - ami @clement]            │  ← vidéos de mes amis
│  [Video card - découverte]              │  ← public/discover
│  ...infinite scroll...                  │
└─────────────────────────────────────────┘
```

**Stories de groupes :**
- Cercle avec initial du groupe (ou cover_url si dispo)
- Badge couleur phase :
  - 🟢 UPLOAD (mar-ven) → vert
  - 🟠 VOTE (sam-dim) → orange
  - 🏆 PODIUM (lun) → or
  - ⚫ Inactif → gris
- Tap → ouvre directement le feed du groupe

**Feed vertical (cards) :**
- Pas TikTok fullscreen ici — cards scrollables (comme Instagram Reels discovery)
- Chaque card : thumbnail + auteur + groupe + likes + commentaires
- Tap → ouvre le feed TikTok fullscreen (comportement actuel de feed/[groupId])
- **Ordre de priorité** :
  1. Vidéos non vues de mes groupes (cette semaine)
  2. Vidéos de mes amis (toutes périodes)
  3. Vidéos discover (groupes publics)

**Fichiers impactés :**
- `app/(tabs)/index.tsx` → réécriture complète
- `src/features/groups/useHomeFeed.ts` → nouveau hook (merge groupes + amis + discover)

---

### 3.2 Tournois

**Structure :**

```
┌─────────────────────────────────────────┐
│  Mes Tournois                    + Créer│
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │ 🏆 Kickflip Masters             │    │
│  │ La Team · Phase : VOTE · J+1   │    │
│  │ 3 défis · 12 vidéos            │    │
│  │ [Voir] [Voter]                  │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🎭 Halloween Special            │    │
│  │ Besties · Phase : UPLOAD · J+3  │    │
│  │ 2 défis · 4 vidéos             │    │
│  │ [Voir] [Participer]             │    │
│  └─────────────────────────────────┘    │
│  ─────── Découvrir des tournois ────── │
│  (tournois publics rejoignables)        │
└─────────────────────────────────────────┘
```

**Comportement :**
- Liste de tous mes tournois (depuis tous mes groupes) — plus besoin de naviguer dans chaque groupe
- Bouton d'action contextuel selon la phase : `Participer` / `Voter` / `Voir podium`
- Bouton `+ Créer` → BottomSheet création tournoi (déplacé depuis upload.tsx)
- Section "Découvrir" en bas = `useAllPublicTournaments()` existant

**Fichiers impactés :**
- `app/(tabs)/tournois.tsx` → nouveau fichier (remplace explore.tsx)

---

### 3.3 Profil (unifié avec Amis)

**Structure :**

```
┌─────────────────────────────────────────┐
│  [Avatar]  @username                    │
│  12 vidéos · 3 victoires · 5 groupes   │
│  [Modifier profil]                      │
├─────────────────────────────────────────┤
│  [Vidéos]  [Batailles]  [Amis]          │  ← 3 onglets
├─────────────────────────────────────────┤
│  Onglet Vidéos = galerie actuelle       │
│                                         │
│  Onglet Batailles =                     │
│    historique des défis participés      │
│    + victoires podium                   │
│                                         │
│  Onglet Amis =                          │
│    [Rechercher]                         │
│    Invitations reçues (badge)           │
│    Mes amis                             │
│    Suggestions                          │
└─────────────────────────────────────────┘
```

**Changements :**
- Tab `Friends` supprimé de la navbar
- Contenu de `friends.tsx` intégré comme onglet dans `profile.tsx`
- Nouveau stat "victoires" (count podiums rank=1)
- Onglet "Batailles" = historique personnel des défis

**Fichiers impactés :**
- `app/(tabs)/profile.tsx` → ajouter onglets + intégrer friends
- `app/(tabs)/friends.tsx` → supprimé

---

### 3.4 Groupe (simplifié)

**Avant :** Groupe → Vidéos + bouton Tournois → page séparée Tournois → Tournoi → Défis

**Après :**

```
┌─────────────────────────────────────────┐
│  ← La Team              [Inviter] [⚙]  │
│  ████████░░  UPLOAD  Mar→Ven  J+2 rest  │  ← timeline toujours visible
├─────────────────────────────────────────┤
│  [Cette semaine]  [Tournois]            │
├─────────────────────────────────────────┤
│  Onglet "Cette semaine" :               │
│    Feed TikTok vidéos hebdo             │
│    Bouton VOTER si phase vote           │
│    Podium si phase podium               │
│                                         │
│  Onglet "Tournois" :                    │
│    [+ Créer tournoi] (owner/admin only) │
│    Tournoi 1 → liste défis             │
│    Tournoi 2 → liste défis             │
└─────────────────────────────────────────┘
```

**Composant Timeline :**
```tsx
// src/components/ui/PhaseIndicator.tsx
// Props: weekNumber, year
// Affiche la barre de progression + label + jours restants
// Réutilisé dans : groupe, story, tournois tab, notification
```

**Fichiers impactés :**
- `app/group/[id].tsx` → ajouter PhaseIndicator + restructurer en 2 onglets
- `src/components/ui/PhaseIndicator.tsx` → nouveau composant

---

### 3.5 FAB — UploadSheet

Remplace totalement `app/(tabs)/upload.tsx`.

```tsx
// src/components/ui/UploadSheet.tsx
// BottomSheet qui s'ouvre au tap du FAB
// Props: isOpen, onClose

// Contenu :
// - Section "Poster dans un groupe"
//   → Scroll horizontal de mes groupes (avec phase badge)
//   → Tap → picker caméra/galerie → post.tsx
//
// - Section "Répondre à un défi" (visible seulement si défis actifs en phase UPLOAD)
//   → Liste des défis actifs
//   → Tap → picker → post-challenge screen
//
// - Bouton "Créer un groupe" en bas (déplacé depuis upload)
```

**Fichiers impactés :**
- `app/(tabs)/upload.tsx` → supprimé
- `src/components/ui/UploadSheet.tsx` → nouveau
- `app/(tabs)/_layout.tsx` → FAB ouvre UploadSheet au lieu de naviguer

---

### 3.6 Nettoyage upload.tsx / données fantômes

```typescript
// À supprimer dans upload.tsx :
const DEMO_GROUPS = [
  { id: "create", name: "Créer", isCreate: true },
  { id: "1", name: "La Team", ... },   // ← données fantômes
  ...
];
```

---

## 4. Push Notifications

### Stack technique
- `expo-notifications` — SDK Expo natif (Apple APNs + Google FCM)
- Supabase Edge Functions — pour les notifications schedulées (cron)
- Supabase Database Webhooks — pour les notifications temps réel (nouveau défi, ami…)

### 4.1 Setup initial

**Installation :**
```bash
npx expo install expo-notifications expo-device
```

**app.json — permissions :**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#FF2D7D",
          "sounds": [],
          "androidMode": "default",
          "androidCollapsedTitle": "Dumbys",
          "iosDisplayInForeground": true
        }
      ]
    ]
  }
}
```

**Hook d'initialisation :**
```typescript
// src/hooks/usePushNotifications.ts
// - Vérifie si c'est un vrai appareil (expo-device)
// - Demande permission iOS (Alert explicatif avant)
// - Récupère le token Expo Push
// - Sauvegarde le token dans Supabase (users.push_token)
// - Configure le handler de réception foreground
// - Configure le handler de tap sur notification → navigation
// Appelé une seule fois dans app/_layout.tsx après auth
```

**Handler de navigation (tap notification) :**
```typescript
// Données dans la notification payload :
// { type: "vote_reminder", groupId: "xxx" }
// { type: "new_video", groupId: "xxx", videoId: "yyy" }
// { type: "friend_request", friendshipId: "xxx" }
// { type: "podium", groupId: "xxx", week: 12, year: 2025 }
// { type: "new_challenge", tournamentId: "xxx", challengeId: "yyy" }
//
// → router.push() vers la bonne page selon le type
```

### 4.2 Types de notifications

| Notification | Déclencheur | Heure | Navigation |
|---|---|---|---|
| 🗳️ **Vote ouvert** | Samedi 9h (cron) | Sam 9h00 | `/group/[id]` |
| 🏆 **Podium dispo** | Lundi 9h (cron) | Lun 9h00 | `/group/[id]` |
| 🎥 **Nouvelle vidéo** dans mon groupe | DB webhook INSERT videos | Immédiat | `/feed/[groupId]` |
| 👋 **Demande d'ami** | DB webhook INSERT friendships | Immédiat | `/profile` (onglet Amis) |
| 🚩 **Nouveau défi** dans mon tournoi | DB webhook INSERT challenges | Immédiat | `/challenge/[id]` |
| ⏰ **Dernier jour upload** | Vendredi 18h (cron) | Ven 18h00 | `/group/[id]` |

### 4.3 Supabase Edge Functions

**Structure :**
```
supabase/functions/
├── send-push/           ← fonction utilitaire commune (envoie via Expo Push API)
│   └── index.ts
├── vote-reminder/       ← cron sam 9h
│   └── index.ts
├── podium-notification/ ← cron lun 9h
│   └── index.ts
└── upload-reminder/     ← cron ven 18h
    └── index.ts
```

**Fonction `send-push` (utilitaire) :**
```typescript
// supabase/functions/send-push/index.ts
// Reçoit : { tokens: string[], title: string, body: string, data: object }
// Appelle l'API Expo Push : https://exp.host/--/api/v2/push/send
// Gère les erreurs (token invalide → le supprimer en DB)
// Utilisée par toutes les autres fonctions
```

**Fonction `vote-reminder` :**
```typescript
// Tourne chaque samedi à 9h (cron: "0 9 * * 6")
// 1. Récupère tous les groupes actifs (ayant des vidéos cette semaine)
// 2. Pour chaque groupe, récupère les membres avec push_token
// 3. Filtre les membres qui n'ont pas encore voté cette semaine
// 4. Appelle send-push pour chacun
```

**Fonction `podium-notification` :**
```typescript
// Tourne chaque lundi à 9h (cron: "0 9 * * 1")
// 1. Calcule le podium de la semaine passée pour chaque groupe
// 2. Envoie à tous les membres du groupe
// 3. Envoie un message spécial au vainqueur (#1)
```

**Webhook temps réel — new_video :**
```typescript
// Supabase Dashboard → Database → Webhooks → INSERT sur "videos"
// Payload → Edge Function "notify-new-video"
// → Récupère les membres du groupe
// → Filtre : pas l'auteur de la vidéo
// → Envoie notification
```

**Webhook temps réel — friend_request :**
```typescript
// Supabase Dashboard → Database → Webhooks → INSERT sur "friendships"
// → Récupère le push_token de l'addressee
// → Envoie notification "XXX veut être ton ami !"
```

**Webhook temps réel — new_challenge :**
```typescript
// Supabase Dashboard → Database → Webhooks → INSERT sur "challenges"
// → Remonte au tournoi → groupe → membres
// → Envoie notification "Nouveau défi : [titre]"
```

### 4.4 Préférences de notification

Écran dans Profil → ⚙ Paramètres → Notifications :
```
✅ Rappels de vote (samedi)
✅ Résultats podium (lundi)
✅ Nouvelles vidéos dans mes groupes
✅ Demandes d'amis
✅ Nouveaux défis
```

---

## 5. Migrations Supabase

### Migration 015 — push_token + notification prefs

```sql
-- 015_push_notifications.sql

-- Colonne push_token sur users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

-- Table préférences granulaires
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote_reminder BOOLEAN DEFAULT TRUE,
  podium_result BOOLEAN DEFAULT TRUE,
  new_video BOOLEAN DEFAULT TRUE,
  friend_request BOOLEAN DEFAULT TRUE,
  new_challenge BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification prefs"
  ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Trigger : créer prefs par défaut à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_notifications
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_notifications();
```

### Migration 016 — index perf pour le Feed Home

```sql
-- 016_feed_indexes.sql
-- Accélérer la requête du Feed Home (groupes + amis + discover)

CREATE INDEX IF NOT EXISTS idx_videos_submitter_created
  ON videos (submitter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_videos_group_week
  ON videos (group_id, week_number, year)
  WHERE group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_friendships_accepted
  ON friendships (requester_id, addressee_id)
  WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_videos_challenge_created
  ON videos (challenge_id, created_at DESC)
  WHERE challenge_id IS NOT NULL;
```

### Migration 017 — vue podium wins pour stats profil

```sql
-- 017_profile_stats.sql
-- Vue pour compter les victoires (rank=1) par user

CREATE OR REPLACE VIEW user_podium_wins AS
SELECT
  user_id,
  COUNT(*) AS win_count
FROM weekly_podium
WHERE rank = 1
GROUP BY user_id;
```

---

## 6. Fichiers à créer / modifier / supprimer

### Créer

```
app/
├── (tabs)/tournois.tsx              ← nouveau tab Tournois
└── (tabs)/upload.tsx                ← remplacé par UploadSheet (voir Modifier)

src/
├── components/ui/
│   ├── PhaseIndicator.tsx           ← barre de timeline réutilisable
│   ├── UploadSheet.tsx              ← FAB BottomSheet (remplace upload tab)
│   ├── GroupStory.tsx               ← cercle story avec badge phase
│   └── VideoCard.tsx                ← card scrollable pour le Feed Home
├── features/
│   ├── feed/
│   │   └── useHomeFeed.ts           ← merge groupes + amis + discover paginé
│   └── notifications/
│       ├── usePushNotifications.ts  ← setup token + handlers
│       ├── useNotificationPrefs.ts  ← lire/écrire prefs
│       └── useUpdatePushToken.ts    ← mutation save token en DB
├── hooks/
│   └── useDeepLink.ts               ← gérer tap notification → navigation
└── types/
    └── notifications.types.ts       ← types payload notifications

supabase/
├── migrations/
│   ├── 015_push_notifications.sql
│   ├── 016_feed_indexes.sql
│   └── 017_profile_stats.sql
└── functions/
    ├── send-push/index.ts
    ├── vote-reminder/index.ts
    ├── podium-notification/index.ts
    ├── upload-reminder/index.ts
    ├── notify-new-video/index.ts
    ├── notify-friend-request/index.ts
    └── notify-new-challenge/index.ts
```

### Modifier

```
app/
├── _layout.tsx                      ← ajouter usePushNotifications() après auth
├── (tabs)/_layout.tsx               ← 4 tabs + FAB ouvre UploadSheet
├── (tabs)/index.tsx                 ← réécriture Feed Home complet
├── (tabs)/profile.tsx               ← ajouter 3 onglets + intégrer friends
├── (tabs)/upload.tsx                ← vider, garder uniquement le BottomSheet
├── group/[id].tsx                   ← ajouter PhaseIndicator + 2 onglets
└── tournament/[id].tsx              ← lien retour amélioré + accès rapide

src/
├── features/groups/
│   ├── useDiscoverFeed.ts           ← ajouter "amis" dans le feed
│   └── useMyGroups.ts               ← ajouter cover_url + phase courante
└── hooks/
    └── useTimelineLogic.ts          ← exporter getPhaseForGroup() réutilisable
```

### Supprimer

```
app/
├── (tabs)/friends.tsx               ← intégré dans profile.tsx
└── (tabs)/explore.tsx               ← intégré dans index.tsx (Feed)
```

---

## 7. Phases d'implémentation

### Phase 1 — Nettoyage & fondations (2-3 jours)
> Pas de nouvelles features, juste stabiliser

- [ ] Supprimer `DEMO_GROUPS` dans `upload.tsx`
- [ ] Supprimer imports inutilisés post-refacto précédent
- [ ] Appliquer migrations 015, 016, 017 sur Supabase
- [ ] Créer `PhaseIndicator.tsx` (composant réutilisable)
- [ ] Créer `useHomeFeed.ts` (hook merge groupes + amis + discover)

### Phase 2 — Nouvelle navigation (2-3 jours)
> Restructurer les tabs sans casser l'existant

- [ ] Modifier `_layout.tsx` → passer à 4 tabs
- [ ] Créer `app/(tabs)/tournois.tsx` (contenu de `tournaments.tsx` adapté)
- [ ] Créer `UploadSheet.tsx` (le FAB ouvre une sheet)
- [ ] Modifier `_layout.tsx` tabs → FAB déclenche UploadSheet
- [ ] Supprimer `friends.tsx` + intégrer onglet Amis dans `profile.tsx`
- [ ] Supprimer `explore.tsx`

### Phase 3 — Feed Home (3-4 jours)
> Le plus gros chantier

- [ ] Réécrire `app/(tabs)/index.tsx` complet
- [ ] Implémenter `GroupStory.tsx` avec badge phase
- [ ] Implémenter `VideoCard.tsx` (card scrollable, pas fullscreen)
- [ ] Connecter `useHomeFeed.ts` : mes groupes → amis → discover
- [ ] Pagination infinite scroll sur le feed home
- [ ] Tap sur story → feed TikTok du groupe

### Phase 4 — Groupe & Tournois (2-3 jours)
> Simplifier la hiérarchie

- [ ] Refaire `group/[id].tsx` : PhaseIndicator + 2 onglets (Semaine / Tournois)
- [ ] Créer `app/(tabs)/tournois.tsx` complet (tous mes tournois cross-groupes)
- [ ] Bouton d'action contextuel selon phase (Participer / Voter / Podium)
- [ ] Création tournoi déplacée dans le tab Tournois (pas dans upload)

### Phase 5 — Push Notifications (3-4 jours)
> Apple + Android

- [ ] `npx expo install expo-notifications expo-device`
- [ ] Configurer `app.json` (plugin notifications)
- [ ] Créer `usePushNotifications.ts` + `useUpdatePushToken.ts`
- [ ] Intégrer dans `_layout.tsx` après auth
- [ ] Déployer Edge Function `send-push`
- [ ] Déployer Edge Function `vote-reminder` (cron sam 9h)
- [ ] Déployer Edge Function `podium-notification` (cron lun 9h)
- [ ] Déployer Edge Function `upload-reminder` (cron ven 18h)
- [ ] Configurer webhook Supabase → `notify-new-video`
- [ ] Configurer webhook Supabase → `notify-friend-request`
- [ ] Configurer webhook Supabase → `notify-new-challenge`
- [ ] Créer écran Paramètres notifications dans Profil
- [ ] Implémenter `useDeepLink.ts` (tap notification → bonne page)

### Phase 6 — Polish (1-2 jours)
> Finitions

- [ ] Animations de transition entre tabs
- [ ] Pull-to-refresh sur Feed Home
- [ ] Empty states redesignés
- [ ] Test notifications réelles sur iPhone + Android
- [ ] Vérifier deep links fonctionnent depuis les notifications

---

## Récapitulatif des impacts

| Catégorie | Avant | Après |
|---|---|---|
| Tabs | 5 (Home, Explore, Upload, Friends, Profil) | 4 (Feed, Tournois, Profil) + FAB |
| Niveaux de navigation max | 4 (Groupe→Tournoi→Défi→Vidéo) | 3 (Tournoi→Défi→Vidéo) |
| Notifications | 0 | 6 types (Apple + Android) |
| Amis dans le feed | Non | Oui (priorité 2) |
| Timeline visible | Non (cachée dans code) | Oui (partout) |
| Données fantômes | DEMO_GROUPS hardcodé | Supprimé |
| Tables DB ajoutées | — | notification_preferences |
| Colonnes DB ajoutées | — | users.push_token, users.notifications_enabled |
| Index DB ajoutés | — | 4 index perf |
| Vue DB ajoutée | — | user_podium_wins |
| Edge Functions | 0 | 7 |
| DB Webhooks | 0 | 3 |
