# Dumbys — Feature Development TODO

> ⚠️ Règle importante :  
> **En aucun cas le design de l'application ne doit être modifié.**  
> Seule la logique fonctionnelle doit être implémentée.

---

# 1. Logique Groupe / Tournoi

Objectif : séparer clairement les concepts **Groupe** et **Tournoi**.

Un **utilisateur peut créer un groupe avec ses amis**, et **dans ce groupe il peut créer des tournois**.

## À faire

- [ ] Créer le modèle **Group**
- [ ] Permettre à un utilisateur de **créer un groupe**
- [ ] Permettre à un utilisateur **d'inviter des amis dans un groupe**
- [ ] Associer les **membres au groupe**
- [ ] Permettre la **création de tournois à l'intérieur d'un groupe**
- [ ] Vérifier que **seuls les membres du groupe peuvent voir les tournois du groupe**

---

# 2. Système de Tournoi

Un **tournoi est un regroupement de défis**.

## Structure d'un tournoi

Un tournoi doit contenir :

- un **titre**
- une **description**
- un **gain (optionnel)**

## À faire

- [ ] Créer le modèle **Tournament**
- [ ] Ajouter les champs :
  - [ ] `title`
  - [ ] `description`
  - [ ] `reward` (optionnel)
- [ ] Lier un **tournoi à un groupe**
- [ ] Permettre à un utilisateur de **créer un tournoi dans un groupe**
- [ ] Afficher les **informations du tournoi**

---

# 3. Système de Défis

Un tournoi est composé de **plusieurs défis**.

Exemple de défi :
> Faire une vidéo déguisé

## À faire

- [ ] Créer le modèle **Challenge**
- [ ] Ajouter les champs :
  - [ ] `title`
  - [ ] `description`
  - [ ] `tournamentId`
- [ ] Permettre d'ajouter **un ou plusieurs défis à un tournoi**
- [ ] Afficher les **défis sous forme de cards dans la page du tournoi**

---

# 4. Publication de Vidéos dans un Défi

Un utilisateur doit pouvoir **poster une vidéo pour un défi**.

## À faire

- [ ] Lier une **vidéo à un défi**
- [ ] Permettre à l'utilisateur de **poster une vidéo dans un défi**
- [ ] Associer la vidéo à :
  - [ ] un utilisateur
  - [ ] un défi
  - [ ] un tournoi
- [ ] Afficher les vidéos dans la **card du défi**

---

# 5. Page Tournoi (Vue utilisateur)

Quand un utilisateur ouvre un tournoi, il doit voir :

- les **informations du tournoi**
- les **cards de chaque défi**
- les **vidéos postées dans ces défis**

## À faire

- [ ] Afficher le **titre du tournoi**
- [ ] Afficher la **description**
- [ ] Afficher le **gain (si présent)**
- [ ] Afficher les **cards de défis**
- [ ] Permettre de **poster une vidéo dans un défi**

---

# 6. Page Explore (Feed type TikTok)

La page **Explore** doit contenir **3 sections** :

- Découvrir
- Catégories
- Tournois

⚠️ Le **design actuel ne doit pas être modifié**.

---

# 6.1 Section "Découvrir"

Afficher les **vidéos récentes ou populaires**.

## À faire

- [ ] Récupérer les **vidéos récentes**
- [ ] Récupérer les **vidéos populaires**
- [ ] Mélanger les deux pour créer le feed
- [ ] Afficher les vidéos en **format TikTok**

---

# 6.2 Section "Catégories"

Afficher **uniquement les vidéos correspondant aux catégories sélectionnées**.

## À faire

- [ ] Créer un système de **catégories**
- [ ] Permettre à l'utilisateur de **sélectionner une catégorie**
- [ ] Filtrer les vidéos par **catégorie**
- [ ] Afficher seulement les **vidéos correspondant à la catégorie**

---

# 6.3 Section "Tournois"

L'utilisateur peut sélectionner un tournoi et voir **toutes les vidéos liées aux défis de ce tournoi**.

## À faire

- [ ] Afficher la **liste des tournois**
- [ ] Permettre à l'utilisateur de **sélectionner un tournoi**
- [ ] Récupérer **tous les défis du tournoi**
- [ ] Récupérer **toutes les vidéos liées aux défis**
- [ ] Afficher ces vidéos dans le **feed**

---

# 7. Règles Importantes

## Logique produit

- [ ] Un **groupe contient plusieurs tournois**
- [ ] Un **tournoi contient plusieurs défis**
- [ ] Un **défi contient plusieurs vidéos**

## Contraintes

- [ ] Ne **pas modifier le design existant**
- [ ] Implémenter uniquement **la logique et la data**
- [ ] Garder la compatibilité avec le **feed vidéo existant**

---

