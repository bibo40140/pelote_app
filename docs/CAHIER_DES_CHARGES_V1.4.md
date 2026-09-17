# PELOTE_APP

## Cahier des charges fonctionnel et technique

Version : 1.4
Date : 15 septembre 2026
Statut : Référence validée avant développement
**Dépôt GitHub :** `pelote_app`

---

# 1. Finalité du document

Ce document constitue la référence fonctionnelle et technique du projet PELOTE_APP avant le démarrage du développement.

Il consolide :

- le besoin du club ;
- les fonctionnalités attendues ;
- les comportements validés ;
- les décisions fonctionnelles ;
- les contraintes techniques ;
- les règles de sécurité ;
- le périmètre de la V1 ;
- les fonctionnalités différées ;
- le découpage du développement ;
- les points restant à définir.

Toute nouvelle décision fonctionnelle devra être ajoutée à ce document et au registre des décisions.

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

- les joueurs et leurs comptes ;
- les saisons ;
- les disciplines ;
- les séries et leurs compatibilités ;
- les installations ;
- les équipes ;
- les disponibilités et leurs exceptions ;
- les périodes et créneaux d'entraînement ;
- les entraînements et affectations ;
- les versions et publications de planning ;
- les remplacements ;
- les compétitions et matchs ;
- les disponibilités demandées par la ligue ;
- le calendrier ;
- les notifications ;
- l'historique et l'audit.

L'objectif est d'obtenir une application :

- simple pour les joueurs ;
- puissante pour les responsables ;
- utilisable sur téléphone, tablette et ordinateur ;
- sécurisée ;
- évolutive ;
- sans dépendance payante obligatoire en V1.

---

# 3. Principes fondamentaux

1. Interface mobile-first.
2. Peu de clics pour les joueurs.
3. Séparation claire entre l'espace joueur et l'administration.
4. Données protégées par PostgreSQL, les politiques RLS et des fonctions sécurisées si nécessaire.
5. Architecture évolutive sans surdimensionnement prématuré.
6. Aucune dépendance payante obligatoire pour la V1.
7. L'administrateur conserve toujours le contrôle final.
8. Les automatismes proposent mais n'imposent jamais une décision sportive.
9. Une génération automatique ne modifie jamais directement un planning publié.
10. Les données historiques importantes ne sont pas supprimées physiquement.
11. Les opérations métier sensibles sont tracées.
12. Une règle sportive inconnue reste en `TODO / À DÉFINIR`.
13. Les contrôles critiques ne reposent jamais uniquement sur le frontend.

---

# 4. Périmètre général

## 4.1 Périmètre V1

La V1 doit rendre fiable le parcours suivant :

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

## 4.2 Fonctionnalités ultérieures

- moteur d'optimisation globale ;
- notifications automatiques avancées ;
- import PDF de la ligue ;
- PWA et notifications push ;
- SMS éventuels ;
- statistiques avancées ;
- scores et classements détaillés ;
- fonctionnement multi-club éventuel.

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

| Élément | Solution cible |
|---|---|
| Frontend | Cloudflare Pages ou solution gratuite équivalente |
| Base de données | Supabase PostgreSQL |
| Authentification | Supabase Auth |
| API | API Supabase |
| Fonctions sécurisées | Supabase Edge Functions si nécessaire |
| Développement | VS Code |
| Versions | Git et GitHub |

Aucun serveur local ne doit être nécessaire au fonctionnement quotidien de l'application en production. Un serveur local de développement reste autorisé dans VS Code.

---

# 6. Stack technique recommandée

| Composant | Choix cible |
|---|---|
| Frontend | React |
| Langage | TypeScript |
| Construction | Vite |
| Navigation | React Router |
| Styles | Tailwind CSS |
| Formulaires | React Hook Form |
| Validation | Zod |
| Données distantes | TanStack Query |
| Backend | Supabase |
| Base de données | PostgreSQL |
| Authentification | Supabase Auth |
| Tests unitaires | Vitest |
| Tests de parcours | Playwright |
| Dépôt | GitHub |

L'interface ne doit pas être alourdie par une bibliothèque complexe si des composants simples suffisent.

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
| Création des comptes | Invitation administrateur |
| Administrateurs | Plusieurs autorisés |
| Canal initial | E-mail |
| Suppression historique | Non |

---

# 8. Utilisateurs, profils et rôles

## 8.1 Joueur

Un joueur possède :

- un identifiant ;
- un prénom ;
- un nom ;
- une adresse e-mail ;
- un téléphone facultatif ;
- un statut actif ou inactif ;
- éventuellement un compte activé ;
- des préférences de notification ;
- des dates de création et de modification.

Un joueur peut exister sans avoir encore activé son compte. Il peut pratiquer plusieurs disciplines et avoir une série différente selon la discipline et la saison.

## 8.2 Rôles

```text
PLAYER
ADMIN
```

Un administrateur peut également être joueur. Plusieurs administrateurs sont autorisés.

## 8.3 Protection du dernier administrateur

La désactivation, la suppression logique ou la rétrogradation du dernier administrateur actif est interdite.

Cette règle doit être garantie côté base ou par une fonction sécurisée, et non uniquement dans l'interface.

## 8.4 Désactivation d'un joueur

Un joueur désactivé :

- conserve l'intégralité de son historique ;
- n'apparaît plus dans les nouvelles affectations automatiques ;
- ne peut plus être ajouté à une nouvelle équipe active ;
- ne participe plus aux nouvelles propositions de planning ;
- reste visible dans les événements, équipes, compétitions et remplacements historiques.

La désactivation ne supprime ni les anciennes disponibilités ni les anciennes affectations.

Le traitement des affectations futures déjà publiées au moment de la désactivation doit produire une alerte administrateur et ne doit pas être modifié silencieusement.

---

# 9. Création et activation des comptes

1. L'administrateur crée la fiche joueur.
2. L'administrateur envoie une invitation.
3. Le joueur reçoit un lien par e-mail.
4. Le joueur active son compte.
5. Le joueur choisit son mot de passe.
6. Le compte est associé à la fiche existante.

Prévoir :

- invitation expirée ;
- renvoi d'invitation ;
- mot de passe oublié ;
- changement d'e-mail ;
- joueur sans compte activé ;
- joueur désactivé ;
- administrateur également joueur.

---

# 10. Saisons et périodes

## 10.1 Saison

Une saison isole les inscriptions, équipes, périodes, compétitions, plannings et historiques.

| Champ | Description |
|---|---|
| id | Identifiant |
| name | Nom |
| start_date | Date de début |
| end_date | Date de fin |
| active | Active ou archivée |

La date de fin doit être postérieure ou égale à la date de début.

## 10.2 Appartenance d'une période

Une période appartient obligatoirement à une seule saison.

Les dates de la période doivent être comprises dans les dates de la saison, sauf dérogation administrative explicitement définie ultérieurement.

## 10.3 Chevauchement des périodes

Un chevauchement de périodes n'est pas interdit globalement, car plusieurs disciplines peuvent être planifiées en parallèle.

En revanche, l'application doit détecter et signaler un chevauchement susceptible de créer des créneaux ou des campagnes de disponibilités ambigus pour une même discipline.

La V1 ne doit pas bloquer tous les chevauchements sans distinction. La validation finale revient à l'administrateur.

---

# 11. Disciplines

Les disciplines sont configurables et jamais codées en dur.

| Champ | Description |
|---|---|
| id | Identifiant |
| name | Nom |
| description | Facultative |
| active | Active ou archivée |

Exemples : gomme pleine, gomme creuse, cuir, grosse pala.

---

# 12. Types d'installation et installations

## 12.1 Types

Exemples : place libre, mur à gauche, trinquet.

## 12.2 Installations

| Champ | Description |
|---|---|
| id | Identifiant |
| name | Nom |
| installation_type_id | Type |
| address | Facultative |
| active | Active ou archivée |

## 12.3 Compatibilité

Une discipline peut être compatible avec plusieurs types d'installation.

```text
discipline_installation_types
```

---

# 13. Séries et compatibilités

Les séries sont configurables et ordonnées.

| Champ | Description |
|---|---|
| id | Identifiant |
| name | Nom affiché |
| sort_order | Ordre |
| active | Active ou archivée |

Les compatibilités :

- sont symétriques ;
- peuvent varier selon la discipline ;
- ne sont jamais déduites automatiquement du numéro de série.

```text
series_compatibilities
```

---

# 14. Inscription d'un joueur à une discipline

La série dépend du joueur, de la discipline et de la saison.

```text
player_disciplines
```

| Champ | Description |
|---|---|
| id | Identifiant |
| player_id | Joueur |
| discipline_id | Discipline |
| season_id | Saison |
| series_id | Série |
| active | Active ou inactive |

Une seule inscription active identique est autorisée pour un joueur, une discipline et une saison.

---

# 15. Équipes

Une équipe représente normalement une paire permanente de deux joueurs, liée à une discipline, une saison et une série de référence choisie par l'administrateur.

## 15.1 Statuts

```text
ACTIVE
INCOMPLETE
ARCHIVED
```

### ACTIVE

L'équipe contient exactement deux membres actifs et peut être utilisée dans les planifications automatiques.

### INCOMPLETE

L'équipe a perdu temporairement ou définitivement un membre actif.

Une équipe `INCOMPLETE` :

- conserve son historique ;
- reste consultable ;
- ne peut pas être utilisée comme équipe complète dans une génération automatique ;
- peut être régularisée par un administrateur.

### ARCHIVED

L'équipe n'est plus utilisée mais reste dans l'historique.

## 15.2 Règles

1. Une équipe `ACTIVE` possède exactement deux membres actifs.
2. Une équipe appartient à une discipline et une saison.
3. Sa série est choisie manuellement.
4. Les membres sont inscrits dans la discipline et la saison.
5. Un joueur appartient au maximum à une équipe active pour une même discipline et saison.
6. Une composition ponctuelle ne crée aucune équipe permanente.
7. Le départ ou la désactivation d'un membre ne supprime pas l'équipe ; l'équipe passe à `INCOMPLETE` si nécessaire.

## 15.3 Historisation

```text
teams
team_members
```

| Champ `team_members` | Description |
|---|---|
| id | Identifiant |
| team_id | Équipe |
| player_id | Joueur |
| start_date | Début |
| end_date | Fin éventuelle |
| active | Appartenance active |

## 15.4 Évolution d'une équipe

Une équipe représente un partenariat historique.

Lorsqu'une composition permanente doit être modifiée
(remplacement définitif d'un des deux joueurs),
une nouvelle équipe doit être créée.

Exemple :

Équipe historique :

```text
Pierre / Jean
```

Jean quitte le club.

Nouvelle équipe :

```text
Pierre / Michel
```

Cette nouvelle composition crée une nouvelle équipe.

L'équipe historique est conservée dans l'historique
et passe au statut :

```text
ARCHIVED
```

Une équipe ne doit jamais être réutilisée pour représenter
un partenariat durable différent.

Ce principe garantit :

- la cohérence historique ;
- la traçabilité des partenaires ;
- la fiabilité des statistiques futures ;
- la lisibilité des saisons passées.

Une composition ponctuelle liée à un entraînement
ou à un remplacement n'est pas concernée par cette règle.

---

# 16. Périodes de planning

| Champ | Description |
|---|---|
| id | Identifiant |
| season_id | Saison obligatoire |
| name | Nom |
| start_date | Début |
| end_date | Fin |
| availability_opens_at | Ouverture |
| availability_closes_at | Clôture |
| status | Statut |
| created_by | Administrateur |

Statuts :

```text
PREPARATION
AVAILABILITIES_OPEN
PLANNING_IN_PROGRESS
PUBLISHED
COMPLETED
CANCELLED
```

Les statuts de période sont distincts des statuts d'événement et de version de planning.

---

# 17. Créneaux récurrents et multi-discipline

Les responsables définissent les créneaux avant l'ouverture des disponibilités.

| Champ | Description |
|---|---|
| id | Identifiant |
| training_period_id | Période |
| day_of_week | Jour |
| start_time | Début |
| end_time | Fin |
| discipline_id | Discipline |
| installation_id | Installation |
| active | Actif ou archivé |

Plusieurs disciplines peuvent disposer de créneaux simultanés.

Un joueur peut pratiquer plusieurs disciplines mais ne peut être affecté qu'à un seul événement sur une plage horaire donnée, toutes disciplines confondues.

L'heure de fin doit être postérieure à l'heure de début.

---

# 18. Événements d'entraînement

Chaque occurrence réelle devient un `training_event`.

Statuts :

```text
DRAFT
PUBLISHED
CANCELLED
COMPLETED
```

Un événement publié, annulé ou terminé n'est pas supprimé physiquement.

La distinction entre créneau récurrent et événement permet d'annuler, déplacer ou modifier une seule occurrence.

---

# 19. Disponibilités récurrentes

États enregistrés :

```text
UNAVAILABLE
AVAILABLE
PREFERRED
```

## 19.1 Signification de PREFERRED

`PREFERRED` implique que le joueur est disponible.

Pour les contrôles de disponibilité, `PREFERRED` est traité comme `AVAILABLE`.

La différence intervient uniquement dans le score du futur moteur d'optimisation afin de favoriser le créneau préféré.

## 19.2 Absence de réponse

```text
NO_RESPONSE
```

`NO_RESPONSE` est un état calculé et non une disponibilité positive enregistrée.

Le joueur n'est pas sélectionnable automatiquement.

---

# 20. Exceptions et disponibilité calculée

Types :

```text
UNAVAILABLE_EXCEPTION
AVAILABLE_EXCEPTION
```

Ordre de calcul :

```text
1. Conflit avec une autre affectation
2. Exception applicable
3. Disponibilité récurrente
4. Absence de réponse
```

Résultats possibles :

```text
AVAILABLE
PREFERRED
UNAVAILABLE
NO_RESPONSE
CONFLICT
```

Les exceptions contradictoires doivent être empêchées ou signalées.

Après clôture, le joueur ne modifie plus librement la récurrence mais peut créer une exception ou demander un remplacement. Une correction administrative est tracée.

---

# 21. Affectations et conflits

Un entraînement comporte normalement quatre joueurs, soit deux équipes de deux.

Contraintes automatiques :

1. discipline correspondante ;
2. disponibilité positive ;
3. aucun chevauchement horaire, y compris entre disciplines ;
4. compatibilité des séries ;
5. aucun doublon dans l'événement.

Si moins de quatre joueurs conviennent :

- le moteur signale le problème ;
- aucune publication automatique n'a lieu ;
- l'administrateur peut déroger après avertissement ;
- la dérogation est tracée.

---

# 22. Planning manuel

Le planning manuel est développé avant l'optimisation.

L'administrateur peut :

- générer les occurrences ;
- créer un événement exceptionnel ;
- affecter ou retirer des joueurs ;
- consulter les disponibilités ;
- détecter les conflits ;
- annuler un événement ;
- enregistrer un brouillon ;
- valider ;
- publier.

Dans l'interface normale, les actions historiques utilisent `Annuler`, `Archiver` ou `Désactiver`, et non une suppression physique.

---

# 23. Versions et publication du planning

Cycle :

```text
Construction
↓
Brouillon
↓
Contrôle
↓
Corrections
↓
Validation
↓
Publication explicite
↓
Visibilité joueur
```

```text
planning_versions
```

| Champ | Description |
|---|---|
| id | Identifiant |
| training_period_id | Période |
| version_number | Numéro |
| status | Statut |
| generated_at | Date de génération |
| generated_by | Auteur |
| published_at | Date de publication |
| published_by | Auteur de publication |
| notes | Facultatives |

Statuts :

```text
DRAFT
VALIDATED
PUBLISHED
ARCHIVED
```

## 23.1 Publication unique

Une période ne peut posséder qu'une seule version `PUBLISHED` à un instant donné.

La publication d'une nouvelle version :

1. archive automatiquement l'ancienne version publiée ;
2. publie la nouvelle version dans la même opération atomique ;
3. conserve l'historique des versions ;
4. enregistre l'auteur et la date ;
5. crée une entrée d'audit.

Cette opération doit être réalisée par une fonction SQL ou une fonction sécurisée transactionnelle afin d'éviter deux versions publiées simultanément.

Une génération ne modifie jamais directement une version publiée.

## 23.2 Relation entre les versions et les affectations

Une affectation appartient toujours à une version de planning.

Modèle conceptuel :

```text
planning_versions
    ↓
training_assignments
```

Chaque affectation possède :

- version_id ;
- training_event_id ;
- player_id.

Cette relation permet :

- la conservation des brouillons ;
- la coexistence de plusieurs versions de travail ;
- la comparaison entre versions ;
- la restauration d'une ancienne version ;
- l'audit des publications.

Une affectation visible par les joueurs appartient toujours
à une version publiée.

Une affectation d'une version brouillon ne doit jamais être visible par les joueurs.

Le schéma SQL devra garantir cette cohérence.

---

# 24. Moteur d'optimisation

Le moteur sera développé après validation du planning manuel.

Il s'agit d'une optimisation sous contraintes, exécutée sur toute la période.

## 24.1 Contraintes dures

- quatre joueurs par événement automatique ;
- même discipline ;
- disponibilité calculée positive ;
- absence de chevauchement, toutes disciplines confondues ;
- aucun doublon ;
- compatibilité des séries ;
- inscriptions valides ;
- équipe `INCOMPLETE` non utilisée comme équipe complète.

## 24.2 Préférences

- conserver les équipes habituelles ;
- former deux équipes complètes ;
- rapprocher les niveaux ;
- favoriser `PREFERRED` par rapport à `AVAILABLE` ;
- équilibrer les participations ;
- éviter les entraînements consécutifs ;
- éviter de casser les équipes ;
- limiter les compositions artificielles.

## 24.3 Hiérarchie

1. Deux équipes habituelles complètes du même niveau.
2. Deux équipes complètes de niveaux proches et compatibles.
3. Joueurs de même niveau sans deux équipes habituelles complètes.
4. Équipes complètes de niveaux différents mais compatibles.
5. Compositions ponctuelles compatibles.
6. Dernier recours : toute composition respectant les contraintes dures.

## 24.4 Équilibrage

Il n'existe pas de joueur prioritaire par défaut. L'équilibrage est calculé sur toute la période selon les événements, disciplines, équipes et disponibilités.

## 24.5 TODO optimisation

```text
TODO / À DÉFINIR
```

- poids du score ;
- bonus et pénalités ;
- traitement exact des entraînements consécutifs ;
- plusieurs entraînements non consécutifs dans la même journée ;
- méthode d'optimisation ;
- critères d'arrêt ;
- comportement sans solution complète.

---

# 25. Remplacements

Un remplacement est temporaire et ne modifie jamais l'équipe permanente.

Workflow :

```text
REQUESTED
↓
IN_REVIEW
↓
APPROVED / REJECTED
↓
CANCELLED si nécessaire
```

Règles :

1. Seul un joueur affecté peut demander un remplacement.
2. Le joueur initial reste affecté jusqu'à approbation.
3. L'administrateur choisit et valide le remplaçant.
4. La discipline et la disponibilité du remplaçant sont vérifiées.
5. Les dérogations produisent un avertissement.
6. La composition ponctuelle ne crée aucune équipe.
7. La décision est tracée.

---

# 26. Compétitions

Statuts définitifs proposés pour la conception SQL :

```text
DRAFT
PUBLISHED
COMPLETED
CANCELLED
```

## 26.1 Cohérence entre équipes et compétitions

Une équipe associée à une compétition
doit appartenir à la même saison
que la compétition.

Exemple :

Compétition :

```text
Saison 2026-2027
```

Équipe autorisée :

```text
Équipe saison 2026-2027
```

Équipe interdite :

```text
Équipe saison 2025-2026
```

Cette contrainte doit être vérifiée
au niveau PostgreSQL ou via une fonction sécurisée.

Le frontend ne doit pas être la seule protection.

### DRAFT

Compétition en préparation et invisible aux joueurs.

### PUBLISHED

Compétition visible par les équipes et joueurs concernés.

### COMPLETED

Compétition terminée et conservée dans l'historique.

### CANCELLED

Compétition annulée et conservée.

Une compétition est liée à une saison, une discipline, éventuellement une série, et peut concerner plusieurs équipes.

```text
competitions
competition_teams
competition_team_availability_view
competition_matches
```

Scores, classements, adversaires détaillés et import PDF restent hors du socle V1.

---

# 27. Disponibilités pour la ligue

Une équipe est disponible uniquement si ses deux joueurs sont disponibles.

```text
Joueur 1 disponible
ET
Joueur 2 disponible
=
Équipe disponible
```

Si un joueur est indisponible, l'équipe est indisponible. Si un joueur n'a pas répondu, la disponibilité de l'équipe est inconnue.

Les disponibilités de compétition sont distinctes de celles des entraînements.

---

# 28. Import PDF

Phase ultérieure : dépôt, extraction, rapprochement, proposition, signalement des ambiguïtés, validation humaine, création des matchs.

```text
Ne jamais importer automatiquement sans validation humaine.
```

---

# 29. Calendrier et interfaces

## 29.1 Vue joueur

Le joueur voit uniquement ses événements : entraînements, compétitions, matchs et modifications associées.

Navigation :

```text
Accueil
Mes disponibilités
Mes entraînements
Mes compétitions
Mon calendrier
Mon profil
```

## 29.2 Vue administrateur

L'administrateur gère joueurs, référentiels, équipes, périodes, disponibilités, planning, compétitions, remplacements et notifications.

Filtres du calendrier : période, date, discipline, série, joueur, équipe, installation, type et statut.

---

# 30. Notifications

Types :

- rappel d'entraînement ;
- rappel de compétition ;
- modification ;
- annulation ;
- nouvelle compétition ;
- remplacement ;
- récapitulatif hebdomadaire.

Canaux :

1. e-mail ;
2. push avec la PWA ;
3. SMS éventuel.

Statuts d'envoi :

```text
PENDING
PROCESSING
SENT
FAILED
CANCELLED
```

## 30.1 Consultation

Une notification applicative peut être marquée comme consultée grâce au champ :

```text
viewed_at
```

- `viewed_at = NULL` : non consultée ;
- `viewed_at` renseigné : consultée à cette date.

Le statut de consultation est distinct du statut technique d'envoi.

Une notification peut donc être envoyée (`SENT`) sans avoir encore été consultée.

## 30.2 Distinction entre notifications et notification_logs

La table :

```text
notifications
```

représente l'objet métier.

Exemples :

- rappel d'entraînement ;
- annulation ;
- demande de remplacement ;
- nouvelle compétition.

La table :

```text
notification_logs
```

représente les tentatives techniques d'envoi.

Exemples :

- date d'envoi ;
- canal utilisé ;
- résultat ;
- erreur éventuelle ;
- nombre de tentatives.

Une notification peut posséder plusieurs entrées
dans notification_logs.

Exemple :

```text
Notification
    ↓
Tentative 1 : échec
Tentative 2 : échec
Tentative 3 : succès
```

Cette séparation simplifie :

- l'audit ;
- le dépannage ;
- les statistiques d'envoi ;
- la reprise après erreur.

---

# 31. Historique, archivage et suppression

Politique générale :

```text
Pas de DELETE physique par défaut sur les données métier historiques.
```

Utiliser selon le cas :

```text
active
status
archived_at
start_date
end_date
cancelled_at
```

## 31.1 Suppression physique autorisée

Une suppression physique n'est autorisée que pour :

- des données techniques temporaires ;
- des brouillons jamais publiés et sans dépendance métier ;
- des données explicitement identifiées lors de la conception SQL ;
- une obligation légale ou de protection des données, traitée par un processus dédié.

Les règles exactes de suppression et les comportements des clés étrangères seront documentés dans `DATABASE_SCHEMA.md`.

Aucune suppression en cascade ne doit être introduite sur les données historiques sans validation explicite.

---

# 32. Journal d'audit

```text
audit_logs
```

| Champ | Description |
|---|---|
| id | Identifiant |
| actor_user_id | Auteur |
| action | Action métier |
| entity_type | Type d'objet |
| entity_id | Objet |
| old_data | Ancienne valeur utile |
| new_data | Nouvelle valeur utile |
| created_at | Date |

L'audit est réservé aux modifications métier importantes : publication, correction administrative, changement d'équipe, remplacement, annulation, archivage ou modification d'un événement publié.

Ne pas enregistrer :

- chaque consultation ;
- chaque requête technique ;
- les changements de cache ;
- les événements sans intérêt métier ;
- les secrets ou mots de passe.

Cette limitation évite un volume inutile et conserve un historique exploitable.

---

# 33. Sécurité Supabase

Supabase Auth gère l'authentification. Les mots de passe ne sont jamais stockés dans les tables métier.

Les contrôles critiques doivent être répartis entre :

1. contraintes PostgreSQL ;
2. index uniques ;
3. clés étrangères ;
4. politiques RLS ;
5. fonctions SQL transactionnelles ;
6. Edge Functions sécurisées si nécessaire ;
7. validations frontend uniquement pour l'expérience utilisateur.

Le frontend ne constitue jamais la seule barrière de sécurité ou de cohérence.

## 33.1 PLAYER

Le joueur peut consulter ses informations, gérer ses disponibilités autorisées, créer ses exceptions, consulter ses événements publiés, demander un remplacement et consulter ses notifications.

Le joueur ne peut pas modifier sa série, son équipe, le planning, une publication ou une décision administrative.

## 33.2 ADMIN

L'administrateur gère les données du club dans le respect des contraintes métier et de l'audit.

## 33.3 Secrets

Les clés secrètes ne figurent jamais dans le frontend, Git, les fichiers Markdown, les captures ou les journaux navigateur.

---

# 34. Schéma conceptuel initial

```text
profiles
club_settings
seasons
disciplines
series
installation_types
installations
discipline_installation_types
series_compatibilities
player_disciplines
teams
team_members
training_periods
training_slots
training_events
planning_versions
training_assignments
player_availabilities
availability_exceptions
competitions
competition_teams
competition_team_availability_view
competition_matches
replacement_requests
replacements
notifications
notification_logs
audit_logs
```

Le schéma définitif, les types SQL, contraintes, index, clés étrangères et RLS seront décrits dans `DATABASE_SCHEMA.md` et `RLS_POLICIES.md` avant la première migration.

---

# 35. Contraintes de base à prévoir

## 35.1 Unicité

- une inscription active par joueur, discipline et saison ;
- une équipe active maximum par joueur, discipline et saison ;
- une réponse par joueur et créneau ;
- une affectation par joueur et événement ;
- une seule version publiée par période ;
- noms de référentiels non dupliqués selon les règles retenues.

## 35.2 Cohérence

- dates et heures cohérentes ;
- période rattachée à une saison ;
- événement compris dans sa période ;
- équipe active avec deux membres ;
- équipe incomplète exclue comme équipe complète automatique ;
- joueur rattaché à la bonne discipline et saison ;
- aucun chevauchement d'affectation ;
- cohérence compétition, saison et équipe ;
- dernier administrateur protégé.

## 35.3 Index

Prévoir des index pour les recherches par saison, discipline, joueur, équipe, période, date d'événement, conflit horaire, disponibilité, notification et demande de remplacement.

---

# 36. Développement par phases

## Phase 1 : socle

React, TypeScript, Supabase, authentification, profils, rôles, saisons, disciplines, séries et installations.

## Phase 2 : équipes

Inscriptions, équipes, membres, statuts, historique et contraintes.

## Phase 3 : disponibilités

Périodes, créneaux, réponses, préférences, exceptions et disponibilité calculée.

## Phase 4 : planning manuel

Événements, affectations, conflits, versions, publication et calendrier.

## Phase 5 : optimisation

Contraintes, score, optimisation globale, équilibrage, proposition et validation humaine.

## Phase 6 : compétitions

Compétitions, engagements, disponibilités, matchs et calendrier.

## Phase 7 : notifications

E-mails, rappels, changements, récapitulatif, consultation et journaux.

## Phase 8 : PDF

Extraction, rapprochement, ambiguïtés, validation et import assisté.

## Phase 9 : PWA

Installation mobile et notifications push.

---

# 37. Ce qu'il ne faut pas développer au début

- moteur d'optimisation ;
- import PDF ;
- SMS ;
- statistiques avancées ;
- scores et classements ;
- multi-club ;
- application native ;
- interface excessivement sophistiquée ;
- génération complète en un seul prompt.

---

# 38. Critères de réussite de la V1

Un administrateur doit pouvoir :

1. créer les référentiels ;
2. créer et inviter les joueurs ;
3. associer les joueurs aux disciplines ;
4. créer et historiser les équipes ;
5. définir une période et ses créneaux ;
6. ouvrir et clôturer les disponibilités ;
7. permettre aux joueurs de répondre ;
8. calculer les disponibilités ;
9. créer les événements ;
10. affecter manuellement les joueurs ;
11. détecter les conflits ;
12. enregistrer et valider un brouillon ;
13. publier une version unique ;
14. permettre aux joueurs de consulter leur calendrier ;
15. traiter un remplacement ;
16. désactiver sans perdre l'historique ;
17. protéger les données par RLS et contraintes SQL ;
18. tracer les opérations importantes.

---

# 39. Registre des décisions validées

| ID | Décision | Statut |
|---|---|---|
| D-01 | Application mono-club en V1 | VALIDÉ |
| D-02 | Rôles PLAYER et ADMIN | VALIDÉ |
| D-03 | Plusieurs administrateurs autorisés | VALIDÉ |
| D-04 | Un administrateur peut être joueur | VALIDÉ |
| D-05 | Invitation administrateur, sans inscription publique | VALIDÉ |
| D-06 | Série d'équipe choisie manuellement | VALIDÉ |
| D-07 | Compatibilité des séries symétrique et configurable | VALIDÉ |
| D-08 | Plusieurs types d'installation par discipline | VALIDÉ |
| D-09 | Absence de réponse égale disponibilité inconnue | VALIDÉ |
| D-10 | PREFERRED est disponible avec bonus d'optimisation | VALIDÉ |
| D-11 | Quatre joueurs exigés automatiquement | VALIDÉ |
| D-12 | Dérogation manuelle avec avertissement | VALIDÉ |
| D-13 | Planning généré en brouillon | VALIDÉ |
| D-14 | Publication explicite par administrateur | VALIDÉ |
| D-15 | Une seule version publiée par période | VALIDÉ |
| D-16 | Nouvelle publication archive l'ancienne atomiquement | VALIDÉ |
| D-17 | Remplacement validé par un administrateur | VALIDÉ |
| D-18 | Composition ponctuelle distincte d'une équipe | VALIDÉ |
| D-19 | Une équipe active maximum par joueur, discipline et saison | VALIDÉ |
| D-20 | Statuts équipe ACTIVE, INCOMPLETE, ARCHIVED | VALIDÉ |
| D-21 | Joueur désactivé exclu des nouvelles propositions | VALIDÉ |
| D-22 | Historique du joueur désactivé conservé | VALIDÉ |
| D-23 | Aucun chevauchement d'affectation entre disciplines | VALIDÉ |
| D-24 | Protection du dernier administrateur actif | VALIDÉ |
| D-25 | Statuts compétition DRAFT, PUBLISHED, COMPLETED, CANCELLED | VALIDÉ |
| D-26 | Notification consultable via viewed_at | VALIDÉ |
| D-27 | Audit réservé aux événements métier importants | VALIDÉ |
| D-28 | Pas de suppression physique par défaut | VALIDÉ |
| D-29 | Contrôles critiques garantis côté base ou fonction sécurisée | VALIDÉ |
| D-30 | V1 française, web responsive, PWA ultérieure | VALIDÉ |
| D-31 | Une modification permanente d'équipe crée une nouvelle équipe | VALIDÉ |
| D-32 | Une affectation appartient à une version de planning | VALIDÉ |
| D-33 | Une équipe de compétition doit appartenir à la même saison | VALIDÉ |
| D-34 | notifications et notification_logs ont des responsabilités distinctes | VALIDÉ |

---

# 40. Points restant à définir

```text
TODO / À DÉFINIR
```

## Optimisation

- poids, bonus et pénalités ;
- entraînements consécutifs ;
- plusieurs entraînements dans une journée ;
- moteur de résolution ;
- solution partielle.

## Compétitions

- adversaire ;
- domicile ou extérieur ;
- report ;
- scores et classements futurs.

## Notifications

- fournisseur e-mail ;
- modèles ;
- délais ;
- récapitulatif ;
- durée de conservation.

## PDF

- format réel ;
- identification ;
- ambiguïtés ;
- fichier source ;
- références importées.

## Suppression et données personnelles

- listes exactes des tables autorisant un DELETE ;
- durées de conservation ;
- procédure dédiée aux demandes légales.

---

# 41. Méthode de développement dans VS Code

1. Un objectif précis par prompt.
2. Prompts courts.
3. Ne jamais générer tout le projet en une fois.
4. Vérifier chaque résultat.
5. Transmettre les réponses et erreurs exactes.
6. Ne pas modifier plusieurs domaines simultanément.
7. Créer des commits aux jalons stables.
8. Ne pas passer à la phase suivante avant validation.
9. Ne jamais inventer une règle sportive.
10. Mettre à jour la documentation lorsque les décisions évoluent.

---

# 42. Organisation documentaire

```text
pelote_app/
├── docs/
│   ├── CAHIER_DES_CHARGES_V1.4.md
│   ├── DECISIONS.md
│   ├── DATABASE_SCHEMA.md
│   └── RLS_POLICIES.md
├── src/
├── supabase/
├── .env.example
├── README.md
└── package.json
```

---

# 43. Prochaines actions

1. Enregistrer ce document dans le dépôt.
2. Confirmer la stack technique.
3. Définir l'architecture des dossiers.
4. Rédiger `DATABASE_SCHEMA.md`.
5. Définir les contraintes et transactions critiques.
6. Rédiger `RLS_POLICIES.md`.
7. Valider le schéma.
8. Initialiser le projet.
9. Développer l'authentification et les référentiels.

---

# 44. Règle finale

```text
L'automatisation propose.
L'administrateur contrôle.
L'administrateur modifie.
L'administrateur valide.
```

---

# 45. Validation du document

**Projet :** PELOTE_APP  
**Version :** 1.4  
**Date :** 15 septembre 2026  
**Statut :** Validé avant conception SQL  
**Fichier :** `docs/CAHIER_DES_CHARGES_V1.4.md`

---

# 46. Conclusion

Le projet est suffisamment cadré pour commencer la conception détaillée de PostgreSQL, des contraintes, des transactions critiques et des politiques RLS.

Le premier parcours à rendre fiable reste :

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
Calendrier
↓
Remplacement
```

Le moteur d'optimisation globale sera développé uniquement après validation de ce parcours avec des données réalistes.

---

**Fin du cahier des charges fonctionnel et technique PELOTE_APP, version 1.4.**
