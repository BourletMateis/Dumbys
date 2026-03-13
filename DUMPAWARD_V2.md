# 🚀 DUMBAWARD - PLAN DE MIGRATION V1 -> V2 (UPDATE MAJEURE)

## 1. Contexte de la Mise à Jour
L'application V1 (basée sur des liens réseaux sociaux et des catégories globales) existe déjà. L'objectif de cette mission est de **refactorer** l'application pour la transformer en un réseau social basé sur des **Groupes privés/publics** et des **Uploads de vidéos natifs** avec une **chronologie stricte (Lundi-Dimanche)**.

**Règle absolue pour l'Agent IA :** Ne supprime pas l'architecture existante (Expo Router, Supabase, Zustand). Adapte et modifie les fichiers existants étape par étape.

---

## 2. Nouvelles Dépendances à Installer
Avant de coder, mets à jour le `package.json` avec ces librairies pour la gestion vidéo :
- `expo-image-picker` (Pour sélectionner une vidéo depuis la galerie)
- `expo-camera` (Optionnel, pour filmer directement)
- `react-native-compressor` (OBLIGATOIRE : pour compresser les vidéos avant upload)
- `expo-video` ou `expo-av` (Pour le lecteur vidéo natif)

---

## 3. Étape 1 : Migration de la Base de Données (Supabase)
*L'IA doit générer et exécuter (ou me fournir) le code SQL pour modifier la base existante.*

1. **Nouveau Concept : Les "Catégories" deviennent des "Groupes".**
   - Créer une table `groups` : `id`, `name`, `owner_id`, `is_public` (boolean, defaut: false), `status` (enum: 'private', 'pending_public', 'approved_public'), `created_at`.
   - Créer une table `group_members` : `id`, `group_id`, `user_id`, `role`.
2. **Refonte de la table `videos` :**
   - **Supprimer** la colonne `video_url` (qui stockait les liens TikTok/X).
   - **Ajouter** la colonne `video_path` (pour stocker le chemin du fichier dans Supabase Storage).
   - **Ajouter** les colonnes `group_id` (lien vers le groupe), `week_number` (int) et `year` (int).
3. **Mise à jour de la table `votes` :**
   - Lier les votes aux groupes (`group_id`) et à la semaine (`week_number`).
4. **Créer le Bucket Storage :**
   - Initialiser un bucket `group_videos` dans Supabase pour héberger les fichiers mp4 compressés.

---

## 4. Étape 2 : Refactoring du système d'Upload (Le plus gros chantier)
*Cible : Remplacer l'ancien `SubmitScreen`.*

1. **Supprimer** toute la logique de parsing d'URL externe.
2. **Créer un nouveau Flow d'Upload :**
   - L'utilisateur clique sur "Ajouter une vidéo".
   - Ouverture de `expo-image-picker` (restreint aux vidéos).
   - **Compression locale** de la vidéo via `react-native-compressor`.
   - Upload de la vidéo compressée vers le bucket Supabase Storage `group_videos`.
   - Insertion de l'entrée dans la table `videos` avec le `video_path`.

---

## 5. Étape 3 : Implémentation de la "Time Machine" (Chronologie)
*Cible : Gérer l'affichage conditionnel selon le jour de la semaine.*

1. Créer un hook utilitaire `useTimelineLogic.ts`.
2. **Lundi au Vendredi (Phase d'Upload) :**
   - Le bouton "Ajouter une vidéo" est **visible** et actif.
   - Le Feed affiche les vidéos de la semaine en cours.
3. **Samedi et Dimanche (Phase de Vote) :**
   - Le bouton "Ajouter une vidéo" est **masqué/désactivé**.
   - Le Feed classique est remplacé par l'interface de **Vote** (les utilisateurs doivent choisir la meilleure vidéo parmi celles postées dans la semaine).
4. **Le Lundi (Phase de Podium) :**
   - Figer les résultats du week-end. Afficher un composant `PodiumTop3` tout en haut du groupe pour célébrer les gagnants de la semaine précédente.

---

## 6. Étape 4 : Gestion des Groupes et Admin
*Cible : Remplacer l'ancien Feed global.*

1. **Écran d'Accueil (`HomeScreen`) :** Affiche la liste des groupes dont l'utilisateur est membre (fetch sur `group_members`).
2. **Création de Groupe :** Formulaire pour créer un groupe, inviter des amis, et bouton "Demander à passer en Public".
3. **Vue Admin :** Si l'utilisateur a le rôle 'admin' dans Supabase, lui afficher un onglet caché permettant d'accepter (`approved_public`) ou refuser les groupes en attente (`pending_public`).

---

## 7. Instructions strictes d'exécution pour l'IA
- Procède **Étape par Étape**. Ne passe pas à l'Étape 2 si l'Étape 1 (Migration DB) n'est pas validée et testée par l'humain.
- Fais très attention aux imports. Si un fichier existant de la V1 est obsolète, propose de le supprimer proprement plutôt que de le laisser traîner.
- Sécurise l'Upload : La taille des vidéos DOIT être compressée côté client pour éviter d'exploser le quota Supabase Storage.