# CLAUDE DESIGN REBOOT

## Objectif

Refondre integralement l'application (UI/UX) pour passer d'un design sombre classique a l'identite visuelle Dumbys : **fun, energique, social-first et moderne**.

---

## 1. Nouvelle Identite Graphique (Dumbys)

Ignorer les anciens tokens de couleur. Appliquer strictement cette nouvelle palette.

### 1.1 Palette de Couleurs "Energie"

| Usage | Couleur | Valeur | Notes |
|------|---------|--------|-------|
| Fond (app-wide) | Noir-sarcelle profond | `#080F0F` | Ne jamais utiliser `#000` pur |
| Action primaire | Sarcelle Dumbys | `#3FD0C9` | Typographie forte, boutons d'action |
| Action secondaire / fun | Fuchsia Defi | `#FF2D7D` | Icone D-Challengeur, moments de haute intensite |
| Accent / recompense | Jaune Sourire | `#FDB813` | Trophees, gains, reflets |
| Surfaces (cards/modals) | Sarcelle sombre translucide | `rgba(63, 208, 201, 0.05)` ou `#142121` | Profondeur visuelle sans perdre l'identite sarcelle |

### 1.2 Typographie et Formes

- **Police** : Poppins exclusivement
- **Titres** : ExtraBold (`700-900`)
- **Corps** : Medium ou Regular
- **Border radius** : minimum `24px` pour cartes et conteneurs (rien de pointu)
- **Effets** : Glassmorphism (`BlurView`) + bordure fine `1px` en `rgba(255,255,255,0.1)`

---

## 2. Reconstruction des Composants (UI)

### 2.1 Navigation (Bottom Bar)

- **Style** : pilule flottante decallee du bas de l'ecran
- **Effet** : fond `BlurView` (intensite sombre) + bordure sarcelle subtile
- **Bouton central (Upload)** : gradient Fuchsia -> Jaune + micro-vibration haptique a chaque ouverture

### 2.2 Cartes de Defis (Challenge Cards)

- **Visuel** : supprimer les bordures grises, utiliser un fond sombre avec glow sarcelle interne
- **Badges** : "Prize" / "Goal" en Jaune Sourire (`#FDB813`) avec texte noir (contraste maximal)
- **Images** : coins arrondis a `20px` + overlay degrade (transparent -> noir sarcelle)

### 2.3 Feed Video

- **Plein ecran** : la video occupe `100%` de l'espace
- **Interactions** :
	- **Like** : animation d'explosion de l'icone D-Challengeur (forme de D stylisee)
	- **Progression** : fine ligne sarcelle en bas de l'ecran

---

## 3. Animations et Experience (UX)

L'application doit paraitre vivante.

- **Transitions de page** : Shared Element Transitions pour faire "voler" avatars et titres d'un ecran a l'autre
- **Etats de chargement (skeletons)** : pas de spinner classique, utiliser des formes animees avec gradient sarcelle pulse
- **Boutons** : effet de scale automatique (`0.95`) sur chaque `Pressable`

---

## 4. Directives de Codage pour Claude

- **Styling** : NativeWind (Tailwind) ou `StyleSheet` Expo
- **Icons** : Ionicons ; remplacer le coeur du Like par une icone custom D-Challengeur si possible, sinon conserver un style arrondi
- **Gradients** : jamais de couleur unie sur les gros boutons, toujours un gradient lineaire a `45deg` (ex: `#3FD0C9` -> `#28A5A0`)

---

## 5. Interdits

- Interdit : utiliser du gris pur ou des couleurs ternes
- Interdit : utiliser des polices serif
- Interdit : utiliser des bordures `1px` noires ou blanches agressives

---

## DUMBYS - Let's Go!