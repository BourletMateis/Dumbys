# Review — Session du 15 Mars 2026

## Ce qu'on a fait

### 1. Bouton + → Caméra intégrée (style TikTok)

- **`app/camera.tsx`** — Nouvel écran plein écran dark `#080F0F`
  - Preview caméra live avec `expo-camera` (CameraView)
  - Barre de progression sarcelle en haut pendant l'enregistrement
  - Overlay haut : bouton fermer (X), timer en temps réel (fuchsia), flash, flip caméra
  - Sélecteur de durée : `15s / 30s / 60s` (pills sarcelle)
  - Bas : bouton galerie (accès vidéo depuis la galerie) + bouton record (gradient fuchsia→orange → carré rouge pour stopper)
  - `useIsFocused()` → la caméra se désactive quand l'écran n'est plus au premier plan (évite le bug caméra en arrière-plan)
- **`app/(tabs)/_layout.tsx`** — FAB (bouton +) navigue directement vers `/camera`

### 2. Écran de finalisation post

- **`app/post.tsx`** — Nouvel écran dark Dumbys après enregistrement/sélection vidéo
  - Thumbnail + champ description côte à côte
  - Sélecteur de **groupe** (chips sarcelle) — auto-sélectionne le premier groupe
  - Sélecteur de **catégorie** avec les vraies clés `PUBLIC_CATEGORIES` (comedy, sports, dance, fails, pets, food, talent, other) + icônes + couleurs
  - Bouton **"Publier maintenant"** gradient fuchsia→sarcelle épinglé en bas
  - `router.dismissAll()` après publication → vide toute la stack proprement
- **`app/_layout.tsx`** — Routes `camera` et `post` enregistrées dans le Stack

### 3. Sauvegarde de la catégorie

- **`src/features/groups/useUploadGroupVideo.ts`** — Champ `category` ajouté dans `UploadInput` et transmis à l'insert Supabase
- La catégorie choisie dans `post.tsx` est maintenant sauvegardée en base

### 4. Suppression vidéo dans le profil

- **`app/(tabs)/profile.tsx`**
  - Bouton poubelle (fond rouge) sur chaque carte vidéo réelle
  - `Alert.alert` de confirmation : _"Cette action est irréversible"_
  - Branchement sur `useDeleteVideo` → supprime en base Supabase + fichiers Cloudflare R2

### 5. Onglet Upload restauré

- Design original de la page Déposer intact (zone upload + groupes privés + tournoi)
- Tout le flux caméra passe désormais par `/camera`

---

## Ce qu'il reste à faire

### Bloquant — Base de données

- [ ] Ajouter la colonne `category` dans Supabase (sinon erreur à la publication) :
  ```sql
  ALTER TABLE videos ADD COLUMN IF NOT EXISTS category text;
  ```

### Fonctionnel à compléter

- [ ] **Explore → Catégories** : vérifier que `useCategoryFeed` filtre bien sur le champ `category` de la table `videos`
- [ ] **Description** : vérifier que la colonne `description` existe dans `videos` (même problème potentiel que `category`)
- [ ] **Suppression** : vérifier que `video_path` est bien retourné par `useMyVideos` pour que la suppression R2 fonctionne
- [ ] **Onglet Upload** : les tabs "Enregistrer" et "Tournoi" sont redondants avec le nouveau flux — à simplifier ou supprimer

### Améliorations UX

- [ ] **Caméra** : animation pulsation sur le bouton record pendant l'enregistrement
- [ ] **Post** : si aucun groupe → CTA pour en créer un directement
- [ ] **Profil → bouton NOUVEAU** : le brancher sur `/camera`
- [ ] **Feed Explore** : le hashtag `#WTF` est hardcodé — remplacer par la vraie catégorie de la vidéo
- [ ] **Notifications** et **Recherche** dans le profil : icônes non fonctionnelles

### Design / DA (cohérence dark Dumbys)

- [ ] **Page Upload (Déposer)** : fond blanc → passer en dark `#080F0F`
- [ ] **Page Profil** : fond blanc → retravailler en dark
- [ ] **Post-screen** : ajouter une option visibilité (privé au groupe / public dans l'Explore)
