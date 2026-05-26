# Dumbys — Devlog

> Journal de bord du développement. Entrées les plus récentes en premier.

---

## [2026-05-26] — UX Polish + Partage vidéo natif

### 🎯 Contexte
Session de polish UX intensive : correction des bugs d'interaction sur la page Amis, refonte de l'alignement des Paramètres, nouveau système d'actions amis, et ajout du partage vidéo natif.

---

### ✅ Fait

#### 1. Page Amis — Bouton Message
- **Avant** : clic sur l'icône message → rien ne se passait.
- **Après** : toast informatif "Messagerie bientôt disponible 💬" + feedback haptic `Light`.
- **Prévu** : connecter à un vrai système de messagerie DM quand il sera créé en base.

#### 2. Page Amis — Bouton "⋯" (3 petits points)
- **Avant** : supprimait l'ami immédiatement sans confirmation (comportement destructif silencieux).
- **Après** : ouvre `FriendActionsSheet`, un bottom sheet animé avec 7 actions :
  - Envoyer un message
  - Voir le profil
  - Inviter dans un groupe *(bientôt)*
  - Inviter dans un tournoi *(bientôt)*
  - Retirer des amis → confirmation Alert obligatoire
  - Bloquer → confirmation Alert obligatoire
  - Signaler → sous-menu contextuel

#### 3. FriendActionsSheet — `src/features/friends/FriendActionsSheet.tsx`
- Nouveau composant bottom sheet from scratch.
- Animation spring entrée / timing sortie via `Animated` RN.
- Backdrop semi-transparent avec dismiss au tap.
- Avatar + username dans le header du sheet.
- Deux groupes visuels distincts (actions normales / actions danger).
- `useSafeAreaInsets` pour le padding bas (notch-safe).
- Tous les textes : `includeFontPadding: false` pour alignement cross-platform.
- **Fix icônes centrées** : `padding: (BOX - ICON) / 2` au lieu de `alignItems/justifyContent` seul — plus fiable sur Android avec les font icons (Ionicons).

#### 4. Page Paramètres — Refonte complète de l'alignement
- **Problème racine** : `alignItems/justifyContent: "center"` sur les containers d'icônes ne centre pas de façon fiable les `Ionicons` (font icons rendus comme `Text`) sur toutes les plateformes.
- **Solution** : `padding: (ICON_BOX - ICON_SIZE) / 2` sur chaque container — centrage mathématique garanti.
- Architecture `StyleSheet.create` propre avec constantes nommées :
  ```
  ROW_PH = 16      // padding horizontal row
  ICON_BOX = 30    // container icône
  ICON_SIZE = 16   // taille glyph
  ICON_PAD = 7     // (30-16)/2 = centrage
  GAP = 12         // gap icône → texte
  SEP_INDENT = 58  // retrait séparateur = ROW_PH + ICON_BOX + GAP
  ```
- Séparateurs alignés mathématiquement sous le début du texte.
- `includeFontPadding: false` sur tous les `Text`.
- Pressable → inner `View` pour isoler le `flexDirection: "row"` du style pressé.

#### 5. Partage vidéo natif — `app/feed/[groupId].tsx`
- Ajout du bouton **Partager** dans la sidebar droite du feed (après Commentaires).
- Utilise `Share` natif React Native — **zéro dépendance supplémentaire**.
- Fonctionne sur iOS (natif share sheet avec `url` + `message`) et Android (`message` + `title`).
- Contenu partagé :
  ```
  🎬 [titre] — @[username] sur Dumbys !
  Viens relever le défi 👊
  + URL de la vidéo (iOS)
  ```
- Haptic `Medium` au tap.
- Gestion silencieuse du cancel (l'utilisateur referme le share sheet).

---

### 🐛 Bugs corrigés
| Bug | Fichier | Fix |
|-----|---------|-----|
| Icônes non centrées dans containers colorés (iOS + Android) | `FriendActionsSheet`, `settings.tsx` | Padding explicite au lieu de flexbox |
| Tap "⋯" → suppression ami immédiate sans confirmation | `friends.tsx` | Bottom sheet + Alert de confirmation |
| Tap message → rien | `friends.tsx` | Toast + haptic |
| Textes mal alignés verticalement (font padding Android) | `settings.tsx`, `FriendActionsSheet` | `includeFontPadding: false` |
| Séparateurs intra-card mal indentés | `settings.tsx` | Calcul `ROW_PH + ICON_BOX + GAP` |

---

### 📁 Fichiers modifiés
```
app/settings.tsx                              — Refonte complète layout
app/(tabs)/friends.tsx                        — Share sheet + message button
app/feed/[groupId].tsx                        — Bouton partage natif
src/features/friends/FriendActionsSheet.tsx   — Nouveau composant (créé)
```

---

### 🔜 À faire (backlog)
- [ ] Système de messagerie DM (table `conversations` + `messages` en base)
- [ ] "Inviter dans un groupe" dans FriendActionsSheet (picker de groupes)
- [ ] "Inviter dans un tournoi" dans FriendActionsSheet (picker de tournois)
- [ ] Deep link sur les vidéos partagées (ex: `dumbys://video/[id]`)
- [ ] Partage de la miniature vidéo (pas seulement l'URL) via `expo-sharing` + `expo-file-system`
- [ ] Compteur de partages en base (table `video_shares`)

---

## [2026-05-26] — Initialisation du devlog

Mise en place du fichier `DEVLOG.md` pour tracer toutes les décisions techniques, bugs corrigés et features ajoutées au fil du développement de Dumbys.

### Stack technique
- **Framework** : Expo ~54 / React Native 0.81.5
- **Navigation** : expo-router v6
- **State** : Zustand + TanStack Query v5
- **Backend** : Supabase (Postgres + Storage + Auth + Realtime)
- **Styling** : NativeWind + StyleSheet natif
- **Fonts** : Poppins (Google Fonts via expo-google-fonts)
- **Icons** : Ionicons (expo/vector-icons)
- **Animations** : react-native-reanimated v4 + Animated natif
- **Video** : expo-video

### Palette Dumbys
| Nom | Hex | Usage |
|-----|-----|-------|
| Sarcelle Dumbys | `#3FD0C9` | Brand, actions primaires |
| Fuchsia Défi | `#FF2D7D` | Énergie, moments forts |
| Jaune Sourire | `#FDB813` | Trophées, succès |
| Fond | `#121212` | Background app |

---

*Ce devlog est maintenu manuellement. Chaque session de dev significative doit avoir une entrée.*
