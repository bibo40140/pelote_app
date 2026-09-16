# PELOTE_APP

## Cahier des charges fonctionnel et technique

**Version :** 1.2  
**Date :** 15 septembre 2026  
**Statut :** Référence fonctionnelle validée avant développement  
**Dépôt GitHub :** `pelote_app`

---

# 1. Finalité du document

Ce document constitue la référence fonctionnelle du projet PELOTE_APP avant le démarrage du développement.

Il consolide :

- le besoin initial du club ;
- les fonctionnalités attendues ;
- les comportements validés ;
- les décisions fonctionnelles ;
- les règles de sécurité ;
- le périmètre de la V1 ;
- les fonctionnalités différées ;
- le découpage du développement ;
- les points qui restent à définir.

Toute nouvelle décision fonctionnelle devra être ajoutée à ce document.

Toute règle sportive non définie doit rester marquée :

```text
TODO / À DÉFINIR
```

Aucune règle sportive ne doit être inventée par l'application ou par l'assistant de développement.

---

# 2. Objectif du projet

Développer une application web responsive destinée à un club de pelote basque d'environ 40 joueurs.

L'application doit remplacer le fonctionnement actuel basé sur :

- des fichiers Excel ;
- des e-mails ;
- la construction manuelle des plannings ;
- des échanges informels pour trouver des remplaçants.

L'application doit permettre de gérer :

- les joueurs ;
- les comptes utilisateurs ;
- les saisons ;
- les disciplines ;
- les séries ;
- les installations ;
- les équipes ;
- les disponibilités ;
- les exceptions de disponibilité ;
- les créneaux d'entraînement ;
- les entraînements ;
- les affectations ;
- les remplacements ;
- les compétitions ;
- les disponibilités demandées par la ligue ;
- les matchs ;
- le calendrier ;
- les notifications ;
- l'historique.

L'objectif est d'obtenir une application :

- simple pour les joueurs ;
- complète pour les responsables ;
- utilisable sur téléphone, tablette et ordinateur ;
- sécurisée ;
- évolutive ;
- sans dépendance payante obligatoire en V1.

---

# 3. Principes fondamentaux

Le projet doit respecter les principes suivants :

1. Interface mobile-first.
2. Peu de clics pour les joueurs.
3. Séparation claire entre l'espace joueur et l'administration.
4. Données sécurisées.
5. Architecture évolutive sans surdimensionnement.
6. Aucune dépendance payante obligatoire pour la V1.
7. L'administrateur conserve toujours le contrôle final.
8. Les automatismes proposent une solution mais ne l'imposent jamais.
9. Une génération automatique ne modifie jamais directement un planning publié.
10. Les données historiques importantes ne sont pas supprimées physiquement.
11. Les opérations sensibles sont tracées.
12. Une règle sportive inconnue reste en `TODO / À DÉFINIR`.

---

# 4. Périmètre général

## 4.1 Périmètre V1

La V1 doit permettre le parcours suivant :

```text
Joueur
↓
Discipline et saison
↓
Équipe
↓
Disponibilités
↓
Planning manuel
↓
Publication
↓
Calendrier joueur
↓
Demande de remplacement
```

La V1 doit d'abord rendre ce parcours fiable avec des données réalistes.

## 4.2 Fonctionnalités ultérieures

Les fonctionnalités suivantes sont prévues après validation du socle :

- moteur d'optimisation globale ;
- notifications automatiques avancées ;
- import PDF de la ligue ;
- PWA ;
- notifications push ;
- éventuels SMS ;
- statistiques avancées ;
- scores et classements détaillés ;
- éventuel fonctionnement multi-club.

---

# 5. Architecture technique cible

```text
Navigateur web
PC / tablette / téléphone
        ↓
Frontend React + TypeScript
        ↓
Supabase
├── PostgreSQL
├── Authentification
├── API
├── Row Level Security
├── Edge Functions
├── tâches planifiées
└── stockage de fichiers
```

## 5.1 Hébergement

Architecture cible :

| Élément | Solution cible |
|---|---|
| Frontend | Cloudflare Pages ou solution gratuite équivalente |
| Base de données | Supabase PostgreSQL |
| Authentification | Supabase Auth |
| API | API Supabase |
| Fonctions sécurisées | Supabase Edge Functions si nécessaire |
| Développement | VS Code |
| Gestion de versions | Git et GitHub |

Aucun serveur local ne doit être nécessaire au fonctionnement quotidien de l'application en production.

Un serveur local de développement reste nécessaire pendant le travail dans VS Code.

---

# 6. Stack technique recommandée

La stack suivante constitue la cible technique de départ.

Elle devra être confirmée avant l'initialisation du projet.

| Composant | Choix cible |
|---|---|
| Frontend | React |
| Langage | TypeScript |
| Outil de construction | Vite |
| Navigation | React Router |
| Styles | Tailwind CSS |
| Composants | Composants simples ou bibliothèque sobre si nécessaire |
| Formulaires | React Hook Form |
| Validation | Zod |
| Données distantes | TanStack Query |
| Backend | Supabase |
| Base de données | PostgreSQL |
| Authentification | Supabase Auth |
| Tests unitaires | Vitest |
| Tests de parcours | Playwright |
| Dépôt | GitHub |

L'interface ne doit pas être surchargée par une bibliothèque complexe si des composants simples suffisent.

---

# 7. Paramètres généraux validés

| Paramètre | Valeur |
|---|---|
| Nombre de clubs en V1 | Un seul |
| Langue | Français |
| Fuseau horaire | Europe/Paris |
| Format horaire | 24 heures |
| Premier jour de la semaine | Lundi |
| Interface | Mobile-first |
| Application native | Non |
| PWA | Phase ultérieure |
| Inscription publique | Non |
| Création des comptes | Invitation par un administrateur |
| Administrateurs | Plusieurs autorisés |
| Canal de notification initial | E-mail |
| Suppression des données historiques | Non |

---

# 8. Utilisateurs et profils

## 8.1 Joueur

Un joueur possède :

- un identifiant ;
- un prénom ;
- un nom ;
- une adresse e-mail ;
- un téléphone facultatif ;
- un statut actif ou inactif ;
- éventuellement un compte utilisateur activé ;
- des préférences de notification ;
- des dates de création et de modification.

Un joueur peut exister dans la base sans avoir encore activé son compte.

Un joueur peut pratiquer plusieurs disciplines.

Un joueur peut avoir une série différente selon :

- la discipline ;
- la saison.

## 8.2 Administrateur

Un administrateur peut également être joueur.

Plusieurs administrateurs sont autorisés.

L'application doit éviter qu'il ne reste aucun administrateur actif.

## 8.3 Rôles

Deux rôles principaux sont prévus :

```text
PLAYER
ADMIN
```

### PLAYER

Un joueur peut accéder aux informations qui le concernent :

- son profil ;
- ses disciplines ;
- ses équipes ;
- ses disponibilités ;
- ses exceptions ;
- ses entraînements publiés ;
- ses compétitions ;
- son calendrier ;
- ses demandes de remplacement ;
- ses notifications.

### ADMIN

Un administrateur peut gérer les données du club :

- joueurs ;
- saisons ;
- disciplines ;
- séries ;
- compatibilités ;
- installations ;
- équipes ;
- périodes ;
- créneaux ;
- disponibilités ;
- plannings ;
- remplacements ;
- compétitions ;
- notifications.

---

# 9. Création et activation des comptes

Les joueurs ne s'inscrivent pas eux-mêmes.

Le processus validé est le suivant :

1. L'administrateur crée la fiche du joueur.
2. L'administrateur déclenche l'envoi d'une invitation.
3. Le joueur reçoit un lien par e-mail.
4. Le joueur active son compte.
5. Le joueur choisit son mot de passe.
6. Le compte utilisateur est associé à la fiche joueur existante.

Les cas suivants doivent être prévus :

- invitation expirée ;
- renvoi d'une invitation ;
- mot de passe oublié ;
- changement d'adresse e-mail ;
- joueur créé mais compte non activé ;
- joueur désactivé ;
- administrateur également joueur.

---

# 10. Saisons

Une saison représente une période sportive.

Exemple :

```text
Saison 2026-2027
```

Une saison permet d'isoler :

- les inscriptions des joueurs aux disciplines ;
- les séries ;
- les équipes ;
- les périodes d'entraînement ;
- les compétitions ;
- les plannings ;
- l'historique.

Une même paire de joueurs peut constituer une nouvelle équipe lors d'une autre saison.

Une saison possède au minimum :

| Champ | Description |
|---|---|
| id | Identifiant |
| name | Nom |
| start_date | Date de début |
| end_date | Date de fin |
| active | Saison active ou archivée |

La date de fin doit être postérieure ou égale à la date de début.

---

# 11. Disciplines

Les disciplines sont configurables.

Exemples :

- gomme pleine ;
- gomme creuse ;
- cuir ;
- grosse pala ;
- autres disciplines futures.

Une discipline possède au minimum :

| Champ | Description |
|---|---|
| id | Identifiant |
| name | Nom |
| description | Description facultative |
| active | Discipline active ou archivée |

Aucune discipline ne doit être codée en dur dans le frontend.

---

# 12. Types d'installation et installations

## 12.1 Types d'installation

Les types d'installation sont configurables.

Exemples :

- place libre ;
- mur à gauche ;
- trinquet.

Structure conceptuelle :

```text
installation_types
```

## 12.2 Installations

Une installation est un lieu réel utilisé par le club.

Exemples :

```text
Fronton X
Type : mur à gauche
```

```text
Trinquet Y
Type : trinquet
```

Une installation possède au minimum :

| Champ | Description |
|---|---|
| id | Identifiant |
| name | Nom |
| installation_type_id | Type |
| address | Adresse facultative |
| active | Installation active ou archivée |

## 12.3 Compatibilité discipline et type d'installation

Une discipline peut être compatible avec plusieurs types d'installation.

La relation est de type plusieurs-à-plusieurs.

Structure conceptuelle :

```text
discipline_installation_types
```

Exemple :

```text
Gomme pleine
├── Place libre
└── Mur à gauche
```

---

# 13. Séries

Les séries sont configurables.

Valeurs initiales possibles :

- 1re série ;
- 2e série ;
- 3e série ;
- 4e série.

Une série possède au minimum :

| Champ | Description |
|---|---|
| id | Identifiant |
| name | Nom affiché |
| sort_order | Ordre d'affichage |
| active | Série active ou archivée |

Les séries ne doivent pas être codées en dur dans l'application.

---

# 14. Compatibilités entre séries

Les compatibilités sont configurables.

Exemple :

```text
1 ↔ 1 : autorisé
1 ↔ 2 : autorisé
1 ↔ 3 : interdit
2 ↔ 3 : autorisé
3 ↔ 4 : autorisé
```

La compatibilité est symétrique.

Ainsi :

```text
2 ↔ 3 = autorisé
```

implique également :

```text
3 ↔ 2 = autorisé
```

La compatibilité peut varier selon la discipline.

Structure conceptuelle :

```text
series_compatibilities
```

Les règles doivent être administrables et ne doivent jamais être déduites automatiquement du numéro de série.

---

# 15. Inscription d'un joueur à une discipline

La série n'est pas stockée comme une caractéristique globale du joueur.

Elle dépend de :

```text
Joueur
+
Discipline
+
Saison
```

Exemple :

```text
Pierre
├── Gomme pleine : 2e série, saison 2026-2027
├── Cuir : 3e série, saison 2026-2027
└── Grosse pala : 2e série, saison 2026-2027
```

Structure conceptuelle :

```text
player_disciplines
```

Champs principaux :

| Champ | Description |
|---|---|
| id | Identifiant |
| player_id | Joueur |
| discipline_id | Discipline |
| season_id | Saison |
| series_id | Série |
| active | Inscription active ou inactive |

Un joueur ne doit pas avoir deux inscriptions actives identiques pour une même discipline et une même saison.

---

# 16. Équipes

Une équipe représente normalement une paire permanente de deux joueurs.

Une équipe est liée à :

- une discipline ;
- une saison ;
- une série de référence ;
- deux membres actifs.

## 16.1 Série de l'équipe

La série de l'équipe est choisie explicitement par l'administrateur.

Elle n'est jamais calculée automatiquement à partir des séries individuelles des joueurs.

Une éventuelle incohérence pourra produire un avertissement, sans remplacement automatique de la décision administrateur.

## 16.2 Règles validées

Une équipe active doit respecter les règles suivantes :

1. Elle possède exactement deux membres actifs.
2. Elle est liée à une discipline.
3. Elle est liée à une saison.
4. Sa série est choisie par un administrateur.
5. Les joueurs doivent être inscrits dans la discipline et la saison concernées.
6. Un joueur ne peut appartenir qu'à une seule équipe active pour une même discipline et une même saison.
7. Une composition ponctuelle ne crée pas une équipe permanente.

## 16.3 Historisation

Le modèle doit utiliser :

```text
teams
team_members
```

Il ne faut pas utiliser uniquement :

```text
team.player_1
team.player_2
```

Structure conceptuelle :

```text
team_members
```

| Champ | Description |
|---|---|
| id | Identifiant |
| team_id | Équipe |
| player_id | Joueur |
| start_date | Début d'appartenance |
| end_date | Fin éventuelle |
| active | Membre actif ou historique |

Cette structure permet de conserver l'historique des partenaires.

---

# 17. Périodes de planning

Une période délimite une campagne de disponibilités et un planning.

Exemple :

```text
Planning entraînements
Septembre à décembre 2026
```

Une période possède :

| Champ | Description |
|---|---|
| id | Identifiant |
| season_id | Saison |
| name | Nom |
| start_date | Date de début |
| end_date | Date de fin |
| availability_opens_at | Ouverture des réponses |
| availability_closes_at | Clôture des réponses |
| status | Statut |
| created_by | Administrateur créateur |

## 17.1 Statuts d'une période

```text
PREPARATION
AVAILABILITIES_OPEN
PLANNING_IN_PROGRESS
PUBLISHED
COMPLETED
CANCELLED
```

### PREPARATION

La période est en cours de configuration.

### AVAILABILITIES_OPEN

Les joueurs peuvent renseigner leurs disponibilités.

### PLANNING_IN_PROGRESS

Les disponibilités sont clôturées et le planning est en construction.

### PUBLISHED

Le planning de la période a été publié.

### COMPLETED

La période est terminée et conservée dans l'historique.

### CANCELLED

La période est annulée mais reste conservée.

Cette version sépare clairement le statut de la période du statut des événements et des versions de planning.

---

# 18. Créneaux récurrents

Les responsables définissent les créneaux proposés avant l'ouverture des disponibilités.

Un créneau récurrent possède :

| Champ | Description |
|---|---|
| id | Identifiant |
| training_period_id | Période |
| day_of_week | Jour de la semaine |
| start_time | Heure de début |
| end_time | Heure de fin |
| discipline_id | Discipline |
| installation_id | Installation |
| active | Créneau actif ou archivé |

Exemple :

```text
Tous les mardis
19h00 à 20h00
Gomme pleine
Fronton X
```

Les créneaux font généralement une heure, mais d'autres durées sont autorisées.

L'heure de fin doit toujours être postérieure à l'heure de début.

---

# 19. Événements d'entraînement

Un créneau récurrent est un modèle.

Chaque occurrence réelle devient un événement daté.

Structure conceptuelle :

```text
training_events
```

Exemple :

```text
Créneau récurrent :
Tous les mardis, 19h00 à 20h00

Occurrences :
Mardi 8 septembre 2026
Mardi 15 septembre 2026
Mardi 22 septembre 2026
```

Cette séparation permet :

- d'annuler une seule occurrence ;
- de déplacer un entraînement ;
- de changer ponctuellement l'installation ;
- d'ajouter un créneau exceptionnel ;
- de modifier un horaire ;
- de gérer les affectations ;
- de gérer un remplacement ;
- de conserver l'historique.

## 19.1 Statuts d'un événement

```text
DRAFT
PUBLISHED
CANCELLED
COMPLETED
```

### DRAFT

L'événement est en préparation et invisible aux joueurs.

### PUBLISHED

L'événement est visible par les joueurs concernés.

### CANCELLED

L'événement est annulé mais conservé dans l'historique.

### COMPLETED

L'événement a eu lieu.

Un événement publié ou annulé ne doit pas être supprimé physiquement.

---

# 20. Disponibilités récurrentes

Les joueurs renseignent leurs disponibilités pour une période.

Ils ne doivent pas répondre chaque semaine.

Exemple :

| Créneau | Réponse |
|---|---|
| Mardi 19h00 | Préféré |
| Mardi 20h00 | Disponible |
| Jeudi 19h00 | Disponible |
| Jeudi 20h00 | Indisponible |

## 20.1 États enregistrés

```text
UNAVAILABLE
AVAILABLE
PREFERRED
```

### UNAVAILABLE

Le joueur est indisponible.

### AVAILABLE

Le joueur peut participer.

### PREFERRED

Le joueur préfère ce créneau.

## 20.2 Absence de réponse

L'absence de réponse n'est pas enregistrée comme une disponibilité.

Elle est calculée comme :

```text
NO_RESPONSE
```

Une absence de réponse signifie :

```text
Disponibilité inconnue
```

Le joueur n'est pas sélectionnable automatiquement.

Une absence de réponse ne doit jamais être interprétée comme une disponibilité.

---

# 21. Exceptions de disponibilité

Une exception modifie la disponibilité habituelle sur une période datée.

Types :

```text
UNAVAILABLE_EXCEPTION
AVAILABLE_EXCEPTION
```

Exemple :

```text
Habituellement disponible le mardi à 19h00
mais indisponible du 14 au 16 septembre
```

Une exception peut contenir :

| Champ | Description |
|---|---|
| player_id | Joueur |
| start_date | Date de début |
| end_date | Date de fin |
| start_time | Heure facultative |
| end_time | Heure facultative |
| type | Type d'exception |
| reason | Motif facultatif |

Une exception datée a priorité sur la disponibilité récurrente.

Les exceptions contradictoires qui se chevauchent doivent être empêchées ou signalées.

Elles ne doivent jamais s'écraser silencieusement.

---

# 22. Calcul de la disponibilité réelle

Pour déterminer si un joueur est disponible sur un événement précis, l'ordre suivant doit être respecté :

```text
1. Conflit avec une autre affectation
2. Exception applicable
3. Disponibilité récurrente
4. Absence de réponse
```

## 22.1 Résultats possibles

```text
AVAILABLE
PREFERRED
UNAVAILABLE
NO_RESPONSE
CONFLICT
```

## 22.2 Clôture des réponses

Après la date de clôture :

- le joueur ne modifie plus librement ses disponibilités récurrentes ;
- le joueur peut déclarer une exception ;
- le joueur peut demander un remplacement s'il est affecté ;
- l'administrateur peut corriger une donnée ;
- toute correction importante réalisée par un administrateur doit être tracée.

---

# 23. Affectations aux entraînements

Un entraînement doit normalement contenir :

```text
4 joueurs
=
2 équipes de 2
```

Structure conceptuelle :

```text
training_assignments
```

Une affectation relie un joueur à un événement.

Elle peut également identifier :

- l'équipe habituelle ;
- le côté ou groupe dans la composition ;
- une composition ponctuelle ;
- la personne ayant réalisé l'affectation ;
- la date de l'affectation.

## 23.1 Contraintes automatiques

Pour une affectation automatique :

1. Le joueur pratique la discipline concernée.
2. Le joueur est disponible ou préfère le créneau.
3. Le joueur n'est pas affecté simultanément ailleurs.
4. Les séries respectent les compatibilités configurées.
5. Le joueur n'apparaît qu'une fois dans l'événement.

## 23.2 Dérogation administrateur

Le moteur automatique exige quatre joueurs.

Si seulement trois joueurs ou moins sont disponibles :

- le moteur signale un créneau incomplet ;
- le moteur ne publie pas automatiquement l'événement ;
- l'administrateur peut exceptionnellement accepter la situation ;
- l'interface doit afficher un avertissement explicite ;
- la dérogation doit être traçable.

---

# 24. Planning manuel

Le planning manuel doit être développé avant le moteur d'optimisation.

L'administrateur doit pouvoir :

- créer les événements à partir des créneaux récurrents ;
- créer un événement exceptionnel ;
- modifier un événement en brouillon ;
- annuler un événement ;
- affecter les joueurs ;
- retirer une affectation ;
- remplacer un joueur ;
- consulter les disponibilités calculées ;
- identifier les conflits ;
- enregistrer un brouillon ;
- publier le planning.

Les événements historiques ne doivent pas être supprimés via l'interface normale.

L'action « supprimer » doit être remplacée selon le contexte par :

```text
Annuler
Archiver
Désactiver
```

---

# 25. Versions et publication du planning

Une génération automatique ne doit jamais modifier directement le planning visible des joueurs.

Le cycle validé est :

```text
Construction
↓
Brouillon
↓
Contrôle administrateur
↓
Corrections
↓
Validation
↓
Publication explicite
↓
Visibilité joueur
```

Une nouvelle génération ne doit jamais écraser un planning publié.

Structure conceptuelle recommandée :

```text
planning_versions
```

Une version de planning peut posséder :

| Champ | Description |
|---|---|
| id | Identifiant |
| training_period_id | Période |
| version_number | Numéro de version |
| status | Statut |
| generated_at | Date de génération |
| generated_by | Administrateur ou système |
| published_at | Date de publication |
| published_by | Administrateur |
| notes | Notes facultatives |

Statuts proposés :

```text
DRAFT
VALIDATED
PUBLISHED
ARCHIVED
```

Une seule version peut être considérée comme publiée pour une même période.

Une publication ou une modification après publication doit être enregistrée dans le journal d'audit.

---

# 26. Moteur d'optimisation

Le moteur d'optimisation sera développé uniquement après validation du planning manuel.

Il ne s'agit pas d'une IA générative.

Le problème doit être traité comme une optimisation sous contraintes.

## 26.1 Optimisation globale

Le moteur doit travailler sur tous les événements de la période en une seule fois.

Il ne doit pas optimiser chaque entraînement indépendamment.

```text
Période complète
↓
Tous les créneaux
↓
Toutes les disponibilités
↓
Toutes les équipes
↓
Optimisation globale
↓
Proposition de planning
```

Cette approche permet d'équilibrer les participations sur l'ensemble de la période.

## 26.2 Contraintes dures

Une solution automatique est invalide si une contrainte dure est violée.

Contraintes initiales :

- quatre joueurs par événement automatique ;
- discipline correspondante ;
- disponibilité calculée positive ;
- aucun double emploi simultané ;
- aucun joueur en double dans le même événement ;
- compatibilité des séries ;
- respect de la période ;
- respect des inscriptions des joueurs.

## 26.3 Préférences

Les préférences influencent le score sans rendre automatiquement la solution invalide.

Préférences initiales :

- conserver une équipe habituelle ;
- former deux équipes complètes ;
- rapprocher les niveaux ;
- respecter un créneau préféré ;
- équilibrer le nombre d'entraînements ;
- éviter deux entraînements consécutifs ;
- éviter de casser les équipes ;
- éviter les compositions artificielles ;
- limiter les écarts injustifiés de participation.

## 26.4 Hiérarchie des compositions

### Niveau 1

Deux équipes habituelles complètes du même niveau.

### Niveau 2

Deux équipes habituelles complètes avec des séries proches et compatibles.

### Niveau 3

Joueurs de même niveau sans deux équipes habituelles complètes.

### Niveau 4

Équipes complètes de niveaux différents mais compatibles.

### Niveau 5

Compositions ponctuelles de niveaux différents mais compatibles.

### Dernier recours

Toute composition de quatre joueurs respectant les contraintes dures.

## 26.5 Équilibrage

Il n'existe pas de joueur prioritaire par défaut.

Le nombre cible d'entraînements dépend :

- du nombre de joueurs ;
- du nombre d'événements ;
- du nombre de disciplines ;
- des équipes ;
- des disponibilités ;
- des préférences.

Il ne faut pas imposer arbitrairement un entraînement par semaine.

L'équilibrage doit être calculé sur toute la période.

## 26.6 Score

Les valeurs de score ne sont pas encore définitives.

Les exemples initiaux servent uniquement de base de réflexion.

Les éléments suivants restent à définir pendant la phase d'optimisation :

```text
TODO / À DÉFINIR
```

- poids de conservation d'une équipe ;
- bonus d'une équipe complète ;
- bonus d'un même niveau ;
- bonus d'un créneau préféré ;
- pénalité de rupture d'équipe ;
- pénalité d'entraînements consécutifs ;
- pénalité de déséquilibre ;
- seuil d'acceptation ;
- méthode d'optimisation ;
- comportement lorsqu'aucune solution complète n'existe.

---

# 27. Conflits

Le système doit détecter les conflits suivants.

## 27.1 Conflit simultané

Un joueur ne peut pas être programmé sur deux événements qui se chevauchent.

Cette règle constitue une contrainte dure pour la génération automatique.

## 27.2 Entraînements consécutifs

Deux entraînements consécutifs doivent être évités autant que possible.

Cette règle constitue une préférence et non une interdiction définitive.

Le niveau exact de pénalité reste à définir.

## 27.3 Plusieurs entraînements le même jour

Le traitement de plusieurs entraînements non consécutifs le même jour reste à définir.

```text
TODO / À DÉFINIR
```

L'administrateur conserve la possibilité de valider manuellement une situation exceptionnelle.

---

# 28. Remplacements

Un remplacement correspond à une composition temporaire.

Il ne modifie jamais l'équipe permanente.

## 28.1 Workflow validé

```text
Demande joueur
↓
REQUESTED
↓
Examen administrateur
↓
IN_REVIEW
↓
Choix du remplaçant
↓
APPROVED ou REJECTED
↓
Notification
```

## 28.2 Statuts

```text
REQUESTED
IN_REVIEW
APPROVED
REJECTED
CANCELLED
```

## 28.3 Règles

1. Seul un joueur affecté peut demander son remplacement.
2. Le joueur initial reste officiellement affecté tant que la demande n'est pas approuvée.
3. L'administrateur choisit et valide le remplaçant.
4. Le remplaçant doit être compatible avec la discipline.
5. La disponibilité du remplaçant doit être vérifiée.
6. Un avertissement doit apparaître si une règle habituelle n'est pas respectée.
7. La composition ponctuelle ne crée aucune équipe permanente.
8. Les personnes concernées peuvent être notifiées.
9. La décision et son auteur doivent être tracés.

## 28.4 Données à conserver

- événement ;
- équipe d'origine ;
- joueur remplacé ;
- remplaçant ;
- demandeur ;
- motif facultatif ;
- statut ;
- administrateur ayant traité la demande ;
- dates de demande et de décision.

---

# 29. Compétitions

Les compétitions sont distinctes des entraînements.

Une compétition peut concerner plusieurs équipes du club.

Une équipe peut participer à plusieurs compétitions pendant une saison.

Une compétition possède au minimum :

| Champ | Description |
|---|---|
| id | Identifiant |
| name | Nom |
| discipline_id | Discipline |
| series_id | Série éventuelle |
| season_id | Saison |
| start_date | Début |
| end_date | Fin éventuelle |
| location | Lieu facultatif |
| status | Statut |
| active | Active ou archivée |

Structure conceptuelle :

```text
competitions
competition_teams
```

---

# 30. Disponibilités pour la ligue

Les responsables sélectionnent les équipes engagées.

Pour chaque date proposée par la ligue, l'application calcule la disponibilité de l'équipe.

Une équipe est disponible uniquement si les deux joueurs sont disponibles.

```text
Joueur 1 disponible
ET
Joueur 2 disponible
=
Équipe disponible
```

Si un joueur est indisponible :

```text
Équipe indisponible
```

Si un joueur n'a pas répondu :

```text
Disponibilité inconnue
```

Une disponibilité inconnue n'est jamais transformée automatiquement en disponibilité positive.

Les disponibilités de compétition sont distinctes des disponibilités d'entraînement.

---

# 31. Matchs de compétition

Une fois le calendrier établi par la ligue, les responsables doivent pouvoir enregistrer les matchs.

Structure conceptuelle :

```text
competition_matches
```

Un match possède au minimum :

| Champ | Description |
|---|---|
| id | Identifiant |
| competition_id | Compétition |
| team_id | Équipe du club |
| match_date | Date |
| start_time | Heure |
| location | Lieu |
| status | Statut |
| notes | Notes facultatives |

Informations différées :

```text
TODO / À DÉFINIR
```

- équipe adverse ;
- domicile ou extérieur ;
- adresse détaillée ;
- score ;
- résultat ;
- classement ;
- report ;
- référence de la ligue ;
- informations importées depuis un PDF.

Les scores, classements et statistiques détaillées ne font pas partie de la V1.

---

# 32. Import PDF de la ligue

L'import PDF sera développé dans une phase ultérieure.

Fonctionnement envisagé :

1. Dépôt du PDF.
2. Extraction du texte.
3. Identification des rencontres.
4. Rapprochement avec les équipes du club.
5. Présentation d'une proposition.
6. Signalement des données incertaines.
7. Validation humaine.
8. Création des matchs validés.

Règle obligatoire :

```text
Ne jamais importer automatiquement sans validation humaine.
```

Une donnée incertaine doit être signalée et non inventée.

---

# 33. Calendrier global

Le calendrier regroupe :

- entraînements ;
- compétitions ;
- matchs ;
- autres événements futurs du club.

## 33.1 Vue joueur

Le joueur voit uniquement les événements qui le concernent.

Le joueur ne doit pas pouvoir consulter les disponibilités privées ou le calendrier personnel complet des autres joueurs.

## 33.2 Vue administrateur

L'administrateur peut consulter tous les événements.

Filtres prévus :

- période ;
- date ;
- discipline ;
- série ;
- joueur ;
- équipe ;
- installation ;
- type d'événement ;
- statut.

---

# 34. Interface joueur

Navigation principale :

```text
Accueil
Mes disponibilités
Mes entraînements
Mes compétitions
Mon calendrier
Mon profil
```

## 34.1 Accueil

L'accueil affiche en priorité le prochain événement.

Exemple :

```text
Bonjour Pierre

PROCHAIN ÉVÉNEMENT

Mardi 15 septembre
19h00
Gomme pleine
Pierre / Jean

[Voir mon calendrier]
```

## 34.2 Disponibilités

Le joueur voit uniquement les créneaux proposés.

Il peut :

- choisir `UNAVAILABLE` ;
- choisir `AVAILABLE` ;
- choisir `PREFERRED` ;
- modifier sa réponse tant que la période est ouverte ;
- consulter la date limite ;
- ajouter une exception.

## 34.3 Entraînements

Le joueur peut consulter :

- la date ;
- l'heure ;
- la discipline ;
- l'installation ;
- la composition ;
- le statut ;
- les modifications ;
- les éventuelles annulations.

Le joueur peut demander un remplacement depuis un entraînement qui le concerne.

## 34.4 Profil

Le joueur peut consulter ses données.

Les champs modifiables par le joueur devront être limités aux informations personnelles autorisées.

Les informations sportives restent sous contrôle administrateur :

- disciplines ;
- séries ;
- équipes ;
- statut actif.

---

# 35. Interface administrateur

## 35.1 Tableau de bord

Indicateurs simples envisagés :

- périodes actives ;
- disponibilités ouvertes ;
- joueurs sans réponse ;
- prochains entraînements ;
- créneaux incomplets ;
- conflits ;
- demandes de remplacement ;
- prochaines compétitions ;
- notifications en erreur.

## 35.2 Joueurs

L'administrateur peut :

- créer ;
- modifier ;
- inviter ;
- renvoyer une invitation ;
- activer ;
- désactiver ;
- consulter les disciplines ;
- gérer les séries ;
- consulter les équipes ;
- consulter les disponibilités ;
- consulter le nombre d'entraînements.

## 35.3 Référentiels

L'administrateur gère :

- saisons ;
- disciplines ;
- séries ;
- compatibilités ;
- types d'installation ;
- installations ;
- compatibilités discipline et installation.

## 35.4 Équipes

L'administrateur peut :

- créer une équipe ;
- choisir les deux membres ;
- choisir la discipline ;
- choisir la saison ;
- choisir la série ;
- modifier les membres ;
- désactiver l'équipe ;
- consulter l'historique.

## 35.5 Planning

L'administrateur peut :

- créer une période ;
- créer les créneaux ;
- ouvrir et clôturer les disponibilités ;
- générer les événements ;
- affecter manuellement ;
- consulter les problèmes ;
- enregistrer un brouillon ;
- valider ;
- publier ;
- modifier après publication avec traçabilité ;
- annuler un événement ;
- traiter les remplacements.

---

# 36. Notifications

Le système de notifications doit être prévu dans le modèle de données dès le départ.

## 36.1 Types

- rappel d'entraînement à J-1 ;
- rappel de compétition ;
- modification d'horaire ;
- modification d'installation ;
- modification de composition ;
- annulation ;
- nouvelle compétition ;
- demande de remplacement ;
- validation ou refus d'un remplacement ;
- récapitulatif hebdomadaire.

Le délai exact des rappels de compétition reste à définir.

## 36.2 Canaux

Ordre de priorité :

1. E-mail.
2. Notification push avec la PWA.
3. SMS éventuel.

Le SMS ne fait pas partie de la V1.

## 36.3 Statuts

Statuts proposés :

```text
PENDING
PROCESSING
SENT
FAILED
CANCELLED
```

Une notification peut conserver :

- destinataire ;
- type ;
- canal ;
- objet métier concerné ;
- date prévue ;
- date d'envoi ;
- statut ;
- nombre de tentatives ;
- erreur éventuelle.

Les rappels et récapitulatifs doivent être exécutés dans le cloud.

Aucun ordinateur du club ne doit rester allumé pour envoyer les notifications.

---

# 37. Historique et archivage

L'application conserve l'historique des :

- équipes ;
- membres d'équipe ;
- disciplines des joueurs ;
- séries ;
- périodes ;
- créneaux ;
- événements ;
- affectations ;
- compétitions ;
- matchs ;
- remplacements ;
- publications ;
- modifications importantes.

Selon les données, utiliser :

```text
active
archived
start_date
end_date
cancelled_at
```

La suppression physique n'est pas le comportement par défaut.

Les données temporaires sans valeur historique pourront éventuellement être supprimées après analyse explicite.

---

# 38. Journal d'audit

Un journal d'audit doit enregistrer les modifications métier importantes.

Structure conceptuelle :

```text
audit_logs
```

Champs envisagés :

| Champ | Description |
|---|---|
| id | Identifiant |
| actor_user_id | Auteur |
| action | Action |
| entity_type | Type d'objet |
| entity_id | Objet |
| old_data | Ancienne valeur |
| new_data | Nouvelle valeur |
| created_at | Date |

Exemples d'actions à tracer :

- création ou désactivation d'un joueur ;
- changement de série ;
- modification d'une équipe ;
- correction administrative d'une disponibilité ;
- publication d'un planning ;
- modification d'un événement publié ;
- annulation ;
- validation d'un remplacement ;
- archivage.

Une simple consultation de page ne doit pas être enregistrée dans ce journal.

---

# 39. Sécurité Supabase

Supabase Auth gère l'authentification.

Les mots de passe ne sont jamais stockés dans les tables métier.

Les politiques Row Level Security sont obligatoires sur les tables exposées.

## 39.1 Droits PLAYER

Un joueur peut :

- consulter son profil ;
- modifier les champs personnels autorisés ;
- consulter ses disciplines ;
- consulter ses équipes ;
- gérer ses disponibilités pendant la période autorisée ;
- créer ses exceptions ;
- consulter ses événements publiés ;
- créer une demande de remplacement pour son événement ;
- consulter ses notifications.

Un joueur ne peut pas :

- modifier sa série ;
- modifier son équipe ;
- accéder aux disponibilités privées des autres joueurs ;
- modifier le planning ;
- publier ;
- valider un remplacement ;
- utiliser l'administration.

## 39.2 Droits ADMIN

Un administrateur peut :

- gérer les référentiels ;
- gérer les joueurs ;
- gérer les équipes ;
- consulter les disponibilités du club ;
- corriger avec traçabilité ;
- gérer les périodes ;
- gérer les événements ;
- construire et publier le planning ;
- gérer les compétitions ;
- traiter les remplacements ;
- gérer les notifications.

## 39.3 Clés et secrets

Le frontend peut utiliser uniquement la clé publique prévue pour le client.

Les clés secrètes ne doivent jamais apparaître dans :

- le code frontend ;
- le dépôt Git ;
- les fichiers Markdown ;
- les captures d'écran ;
- les journaux du navigateur.

Les opérations privilégiées doivent être exécutées côté serveur ou dans une fonction cloud sécurisée.

---

# 40. Schéma conceptuel initial

Le schéma définitif doit être conçu et validé avant la première migration SQL.

## 40.1 Identité

```text
profiles
club_settings
```

## 40.2 Référentiels

```text
seasons
disciplines
series
installation_types
installations
```

## 40.3 Relations

```text
discipline_installation_types
series_compatibilities
player_disciplines
```

## 40.4 Équipes

```text
teams
team_members
```

## 40.5 Planning

```text
training_periods
training_slots
training_events
planning_versions
training_assignments
```

## 40.6 Disponibilités

```text
player_availabilities
availability_exceptions
```

## 40.7 Compétitions

```text
competitions
competition_teams
competition_availabilities
competition_matches
```

## 40.8 Remplacements

```text
replacement_requests
replacements
```

## 40.9 Notifications

```text
notifications
notification_logs
```

## 40.10 Traçabilité

```text
audit_logs
```

---

# 41. Relations conceptuelles principales

```text
profiles
└── player_disciplines
    ├── disciplines
    ├── seasons
    └── series
```

```text
teams
├── seasons
├── disciplines
├── series
└── team_members
    └── profiles
```

```text
training_periods
└── training_slots
    └── training_events
        └── training_assignments
            └── profiles
```

```text
profiles
├── player_availabilities
└── availability_exceptions
```

```text
competitions
├── competition_teams
├── competition_availabilities
└── competition_matches
```

```text
training_events
└── replacement_requests
    └── replacements
```

---

# 42. Contraintes de base de données à prévoir

## 42.1 Unicité

Prévoir notamment :

- saison unique selon les règles retenues ;
- discipline non dupliquée ;
- une inscription active joueur, discipline et saison ;
- une équipe active unique par joueur, discipline et saison ;
- une réponse unique par joueur et créneau ;
- une affectation unique par joueur et événement ;
- une seule version de planning publiée par période.

## 42.2 Cohérence

Prévoir notamment :

- dates de fin postérieures aux dates de début ;
- heures de fin postérieures aux heures de début ;
- événements compris dans leur période ;
- deux membres actifs par équipe ;
- membres inscrits dans la discipline et la saison de l'équipe ;
- joueur affecté à la discipline de l'événement ;
- absence de doublon dans une composition ;
- cohérence entre compétition, saison et équipes ;
- conservation de l'historique.

## 42.3 Index

Des index seront nécessaires pour :

- saisons ;
- disciplines ;
- joueurs ;
- équipes ;
- périodes ;
- événements par date ;
- conflits horaires ;
- disponibilités ;
- notifications en attente ;
- demandes de remplacement.

Les index exacts seront définis dans le document du schéma SQL.

---

# 43. Développement par phases

## Phase 1 : socle

Contenu :

- initialisation React et TypeScript ;
- structure des dossiers ;
- connexion Supabase ;
- authentification ;
- profils ;
- rôles ;
- saisons ;
- disciplines ;
- séries ;
- types d'installation ;
- installations.

Critère de sortie :

```text
Connexion sécurisée
+
référentiels principaux fonctionnels
```

## Phase 2 : équipes

Contenu :

- inscriptions des joueurs ;
- séries par discipline et saison ;
- équipes ;
- membres ;
- historique ;
- contraintes d'unicité.

Critère de sortie :

```text
Équipes permanentes fiables et historisées
```

## Phase 3 : disponibilités

Contenu :

- périodes ;
- créneaux ;
- ouverture des réponses ;
- disponibilités ;
- préférences ;
- exceptions ;
- disponibilité calculée.

Critère de sortie :

```text
Disponibilité calculée et testée
```

## Phase 4 : planning manuel

Contenu :

- événements ;
- affectations ;
- conflits ;
- versions ;
- validation ;
- publication ;
- calendrier.

Critère de sortie :

```text
Planning manuel utilisable avec les données du club
```

## Phase 5 : optimisation

Contenu :

- contraintes dures ;
- préférences ;
- score ;
- optimisation globale ;
- équilibrage ;
- proposition ;
- anomalies ;
- validation humaine.

Critère de sortie :

```text
Proposition cohérente
+
modifiable
+
explicable
```

## Phase 6 : compétitions

Contenu :

- compétitions ;
- équipes engagées ;
- disponibilités ;
- matchs ;
- calendrier.

Critère de sortie :

```text
Gestion opérationnelle sans import PDF
```

## Phase 7 : notifications

Contenu :

- e-mails ;
- rappels ;
- changements ;
- remplacements ;
- récapitulatif ;
- journal des envois.

Critère de sortie :

```text
Notifications tracées et contrôlables
```

## Phase 8 : PDF

Contenu :

- dépôt ;
- extraction ;
- rapprochement ;
- incertitudes ;
- validation ;
- création des matchs.

Critère de sortie :

```text
Import assisté
mais jamais automatique
```

## Phase 9 : PWA

Contenu :

- installation sur téléphone ;
- comportement PWA ;
- notifications push.

Critère de sortie :

```text
Application installable
+
notifications push fonctionnelles
```

---

# 44. Ce qu'il ne faut pas développer au début

Ne pas commencer par :

- le moteur d'optimisation ;
- l'import PDF ;
- les SMS ;
- les statistiques avancées ;
- les scores et classements ;
- le multi-club ;
- une application native ;
- une interface excessivement sophistiquée ;
- une génération complète du projet en un seul prompt.

---

# 45. Critères de réussite de la V1

Un administrateur doit pouvoir :

1. créer une saison ;
2. créer les disciplines ;
3. créer les séries ;
4. configurer les compatibilités ;
5. créer les installations ;
6. créer les joueurs ;
7. inviter les joueurs ;
8. associer les joueurs aux disciplines ;
9. créer les équipes ;
10. définir une période ;
11. définir les créneaux ;
12. ouvrir les disponibilités ;
13. permettre aux joueurs de répondre ;
14. gérer les exceptions ;
15. calculer les disponibilités ;
16. créer les événements ;
17. affecter manuellement les joueurs ;
18. détecter les conflits ;
19. enregistrer un brouillon ;
20. valider le planning ;
21. publier le planning ;
22. permettre aux joueurs de consulter leur calendrier ;
23. traiter une demande de remplacement ;
24. conserver l'historique ;
25. protéger les données avec les politiques RLS.

---

# 46. Registre des décisions validées

| ID | Décision | Statut |
|---|---|---|
| D-01 | Application mono-club en V1 | VALIDÉ |
| D-02 | Rôles PLAYER et ADMIN | VALIDÉ |
| D-03 | Plusieurs administrateurs autorisés | VALIDÉ |
| D-04 | Un administrateur peut également être joueur | VALIDÉ |
| D-05 | Comptes créés par invitation d'un administrateur | 