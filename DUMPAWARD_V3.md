# 🚀 DUMBAWARD - MASTER DEVELOPMENT PLAN V3 (CHALLENGES & REFACTORING MAJEUR)

## 1. Vision Globale & Stack Technique
**Concept :** DumbAward est une application sociale compétitive basée sur des "Challenges" (vidéos).
- **Home (Public) :** Les utilisateurs découvrent et participent à des challenges publics créés par les admins.
- **Explore (Privé) :** Les utilisateurs créent ou rejoignent des challenges privés entre amis.
- **Chronologie stricte :** Chaque challenge a une durée de vie définie (date de fin) ou suit le cycle (Lundi-Vendredi : Upload / Samedi-Dimanche : Vote / Lundi : Podium).

**Stack Technique :**
- React Native + Expo Router
- Supabase (PostgreSQL, Auth, Storage)
- State & Data : Zustand + TanStack React Query
- UI : NativeWind v4 (Tailwind), `@gorhom/bottom-sheet` (pour les modales)
- Médias : `expo-image-picker`, `react-native-compressor`, composant vidéo existant.

---

## 2. Base de Données : Migrations SQL (Supabase)
*L'agent IA doit prioriser la mise à jour du schéma de base de données sans perdre les données existantes.*

1. **Table `challenges` (anciennement `groups`) :**
   - Ajouter `end_date` (timestamptz) : Date de fin de l'upload.
   - Ajouter `goal_description` (text) : Le but ou le thème du challenge.
   - Ajouter `prize` (text) : Le gain/récompense (ex: "100€", "Un resto").
   - Ajouter `type` (enum: 'private', 'public_admin').
2. **Table `users` :**
   - S'assurer de la présence et de l'utilisation de `avatar_url` (text).
   - S'assurer de la présence de `role` (enum: 'user', 'admin').
3. **Storage (Buckets) :**
   - Créer/Vérifier le bucket public `avatars` pour les photos de profil.
   - Le bucket `group_videos` gère toujours les vidéos compressées.

---

## 3. Restructuration de la Navigation (Inversion Home / Explore)
*Modifier les fichiers d'Expo Router pour restructurer l'expérience utilisateur dès l'ouverture de l'app.*

- **`app/(tabs)/index.tsx` (Home) :** Devient le flux des **Challenges Publics**. C'est la page d'accueil par défaut. Affiche les tournois créés par les admins de l'app.
- **`app/(tabs)/explore.tsx` (Explore) :** Devient le hub des **Challenges Privés**. Permet de lister ses groupes privés, de créer un nouveau challenge, ou de rejoindre un challenge via un code secret.

---

## 4. Logique et UI des Challenges
*Règles applicables aux challenges privés ET publics.*

1. **Création d'un Challenge :**
   - Le formulaire doit inclure : Nom, Thème (`goal_description`), Récompense (`prize`) et **Date de fin** (`end_date`).
   - Seuls les utilisateurs avec le rôle `admin` peuvent créer un challenge de type `public_admin` qui apparaîtra sur la Home.
2. **Le Dashboard du Challenge (Page Info) :**
   - **Header UI :** Remplacer l'ancien gros bloc de code d'invitation par un tableau de bord clair affichant : "But du tournoi", "Temps restant" (Countdown dynamique), "Nombre de vidéos participantes", et "Gain".
   - **Partage :** Le code secret et le bouton "Inviter" doivent être déplacés dans un **Bottom Sheet Modal** (qui s'ouvre au clic sur un bouton "Partager / Inviter").
3. **Verrouillage Temporel (Time Lock) :**
   - Le bouton "Ajouter une vidéo" doit être masqué ou désactivé SI la date actuelle dépasse la `end_date` du challenge. L'interface passe alors en mode "Vote" ou "Résultats" selon le statut.

---

## 5. Refonte de la page "Friends"
*Refonte purement UI/UX pour correspondre aux codes Gen Z (Snapchat, Instagram).*

- Casser l'ancienne liste austère.
- Utiliser de grandes photos de profil (`avatar_url`) de forme circulaire.
- Ajouter des indicateurs visuels (en ligne, a posté récemment).
- Intégrer un système de "Suggestions" ou de recherche d'amis rapide avec un bouton d'ajout direct, stylisé avec NativeWind.

---

## 6. Profil Utilisateur & Mode TikTok (⚠️ INSTRUCTION STRICTE)

1. **Édition du Profil :**
   - Ajouter un bouton "Modifier mon profil" sur le `ProfileScreen`.
   - Permettre l'upload d'une photo de profil (`expo-image-picker`) sauvegardée dans le bucket Supabase `avatars`.
2. **Le Lecteur Vidéo du Profil (Mode TikTok) :**
   - **ATTENTION POUR L'AGENT IA :** NE DÉVELOPPE PAS de nouveau lecteur vidéo plein écran ou de système de scroll vertical. Le composant "Feed TikTok" existe DÉJÀ dans la codebase de l'application. Ton but est uniquement de le **réutiliser**.
   - **Comportement attendu :** Sur le `ProfileScreen`, les vidéos de l'utilisateur s'affichent sous forme de miniatures (grille 3 colonnes).
   - **Interaction :** Au clic sur une miniature, ouvre l'écran existant du lecteur vidéo TikTok. Tu DOIS passer en paramètres de navigation :
     1. Le tableau complet des vidéos de l'utilisateur.
     2. L'index initial (ou l'ID) correspondant à la miniature cliquée, pour que le lecteur commence sur la bonne vidéo.

---

## 7. Plan d'Exécution (Étapes pour l'Agent IA)

**Phase 1 : Migration Supabase & Auth**
- Exécuter les modifications de base de données (ajout de `end_date`, `prize`, `goal_description`, types de challenges).
- Implémenter l'upload d'avatar et l'édition de profil.

**Phase 2 : Restructuration Navigation (Routing)**
- Inverser les routes : Home = Challenges Publics, Explore = Challenges Privés. S'assurer que les requêtes React Query pointent vers les bons filtres (`type = 'public_admin'` vs `type = 'private'`).

**Phase 3 : Dashboard Challenges & Modal**
- Mettre à jour le composant d'information du challenge.
- Ajouter le timer/countdown basé sur `end_date`.
- Cacher le bouton d'upload si le temps est écoulé.
- Déplacer l'invitation dans une `BottomSheetModal`.

**Phase 4 : Refonte UI Friends**
- Recoder intégralement le composant d'affichage des amis avec le nouveau design "Gen Z" via NativeWind.

**Phase 5 : Branchement du Lecteur Vidéo (Profil)**
- Transformer la liste du profil en grille de miniatures.
- Brancher la navigation au clic vers le composant TikTok existant en passant les bons `initialIndex` et `data`.