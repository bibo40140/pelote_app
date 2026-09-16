
# Compétitions

Les compétitions sont distinctes des entraînements.

Une compétition est liée à :

- une discipline ;
- une série ;
- une saison ;
- une période ;
- un lieu ;
- une ou plusieurs équipes du club.

---

## Informations principales

Une compétition possède au minimum :

| Champ | Description |
|---|---|
| id | Identifiant unique |
| name | Nom de la compétition |
| discipline_id | Discipline concernée |
| series_id | Série concernée |
| season_id | Saison concernée |
| start_date | Date ou début de la période |
| end_date | Fin éventuelle de la période |
| location | Lieu |
| status | Statut |
| active | Compétition active ou archivée |

---

## Équipes engagées

Une compétition peut concerner plusieurs équipes du club.

Une équipe peut participer à plusieurs compétitions pendant une même saison.

La relation est donc :

```text
competitions
    ↓
competition_teams
    ↓
teams
```

---

## Disponibilités demandées par la ligue

Les responsables sélectionnent les équipes engagées dans une compétition.

Pour chaque équipe, l'application collecte les disponibilités sur les dates proposées par la ligue.

Exemple :

```text
Championnat X
Période :
1er octobre au 15 décembre 2026
```

Pour une équipe :

```text
Équipe Pierre / Jean

04/10 : disponible
11/10 : indisponible
18/10 : disponible
```

---

## Calcul de disponibilité d'une équipe

Une équipe est disponible uniquement si ses deux joueurs sont disponibles.

```text
Joueur 1 disponible
ET
Joueur 2 disponible
=
Équipe disponible
```

Si un seul joueur est indisponible :

```text
Équipe indisponible
```

Si un joueur n'a pas répondu :

```text
Disponibilité de l'équipe inconnue
```

Une disponibilité inconnue ne doit jamais être considérée automatiquement comme disponible.

---

# Matchs de compétition

Une fois le calendrier établi par la ligue, les responsables enregistrent les matchs.

Un match doit pouvoir contenir au minimum :

| Champ | Description |
|---|---|
| id | Identifiant |
| competition_id | Compétition concernée |
| team_id | Équipe du club |
| date | Date du match |
| start_time | Heure du match |
| location | Lieu |
| status | Statut |
| notes | Informations complémentaires |

---

## Informations différées

Les informations suivantes ne sont pas nécessaires au démarrage de la V1 :

- équipe adverse ;
- domicile ou extérieur ;
- score ;
- résultat ;
- classement ;
- statistiques ;
- report d'un match ;
- référence provenant d'un PDF de la ligue.

Ces éléments devront être analysés pendant la phase consacrée aux compétitions.

Ils restent donc marqués :

```text
TODO / À DÉFINIR
```

---

# Import PDF de la ligue

L'import de PDF n'appartient pas à la première version fonctionnelle.

Il est prévu dans une phase ultérieure.

---

## Fonctionnement futur envisagé

Le système pourra :

1. recevoir un PDF de la ligue ;
2. analyser son contenu ;
3. extraire les rencontres ;
4. identifier les équipes du club ;
5. proposer les matchs détectés ;
6. afficher les anomalies ou incertitudes ;
7. demander une validation humaine ;
8. créer les événements validés.

---

## Règle obligatoire

Le système ne doit jamais importer automatiquement les matchs sans validation.

```text
Extraction
↓
Proposition
↓
Contrôle administrateur
↓
Validation
↓
Création des matchs
```

Toute information incertaine doit être signalée.

Elle ne doit jamais être inventée.

---

# Calendrier global

Le calendrier regroupe :

- les entraînements ;
- les compétitions ;
- les matchs ;
- éventuellement d'autres événements du club.

---

## Vue joueur

Le joueur voit uniquement :

- ses entraînements ;
- ses compétitions ;
- ses matchs ;
- les événements qui le concernent.

Le joueur ne doit pas accéder au calendrier personnel complet des autres joueurs.

---

## Vue administrateur

L'administrateur peut consulter tous les événements du club.

Le calendrier administrateur doit proposer des filtres.

---

## Filtres prévus

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

# Interface joueur

L'interface joueur doit rester simple et mobile-first.

L'objectif est de permettre les actions principales avec peu de clics.

---

## Navigation principale

```text
Accueil
Mes disponibilités
Mes entraînements
Mes compétitions
Mon calendrier
Mon profil
```

---

## Accueil joueur

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

---

## Disponibilités joueur

Le joueur voit uniquement les créneaux proposés par les responsables.

Exemple :

```text
SEPTEMBRE À OCTOBRE

Mardi
19h00 : Préféré
20h00 : Disponible

Jeudi
19h00 : Disponible
20h00 : Indisponible
```

Actions possibles :

- renseigner une disponibilité ;
- modifier une réponse tant que la période est ouverte ;
- ajouter une exception ;
- consulter la date limite de réponse.

---

## Entraînements joueur

Le joueur doit pouvoir :

- consulter ses entraînements ;
- consulter la discipline ;
- consulter l'horaire ;
- consulter l'installation ;
- consulter sa composition ;
- demander un remplacement ;
- voir si un entraînement a été modifié ou annulé.

---

## Profil joueur

Le joueur peut consulter ses informations personnelles.

Les modifications autorisées en V1 devront être définies précisément lors du développement.

Exemples possibles :

- téléphone ;
- préférences de notification ;
- mot de passe.

Les modifications ayant un impact sportif restent sous le contrôle de l'administrateur.

Exemples :

- discipline ;
- série ;
- équipe ;
- statut actif.

---

# Interface administrateur

L'administration doit permettre de gérer l'ensemble du fonctionnement du club.

---

## Tableau de bord

Le tableau de bord pourra présenter :

- périodes en cours ;
- disponibilités ouvertes ;
- joueurs n'ayant pas répondu ;
- prochains entraînements ;
- créneaux incomplets ;
- demandes de remplacement ;
- prochaines compétitions ;
- notifications en erreur.

Ces indicateurs doivent rester simples en V1.

---

## Gestion des joueurs

L'administrateur peut :

- créer un joueur ;
- modifier un joueur ;
- inviter un joueur ;
- renvoyer une invitation ;
- activer un joueur ;
- désactiver un joueur ;
- consulter ses disciplines ;
- consulter ses séries ;
- consulter ses équipes ;
- consulter ses disponibilités ;
- consulter son nombre d'entraînements.

---

## Gestion des référentiels

L'administrateur peut gérer :

- les saisons ;
- les disciplines ;
- les séries ;
- les compatibilités entre séries ;
- les types d'installation ;
- les installations ;
- les compatibilités entre disciplines et installations.

---

## Gestion des équipes

L'administrateur peut :

- créer une équipe ;
- choisir les deux joueurs ;
- choisir la discipline ;
- choisir la saison ;
- choisir la série de référence ;
- modifier la composition ;
- désactiver une équipe ;
- consulter l'historique des partenaires.

---

## Gestion du planning

L'administrateur peut :

- créer une période ;
- ouvrir les disponibilités ;
- clôturer les disponibilités ;
- créer les créneaux récurrents ;
- générer les événements réels ;
- affecter manuellement les joueurs ;
- détecter les conflits ;
- enregistrer un brouillon ;
- modifier le planning ;
- valider le planning ;
- publier le planning ;
- annuler un événement ;
- traiter les remplacements.

---

# Notifications

Un système de notifications doit être prévu dès la conception de la base.

L'envoi effectif des notifications sera développé dans une phase dédiée.

---

## Types de notification

### Rappel d'entraînement

Envoi prévu à :

```text
J-1
```

---

### Rappel de compétition

Le délai exact reste à définir.

Exemple envisagé :

```text
J-2
```

Statut :

```text
TODO / À DÉFINIR
```

---

### Changement d'événement

Une notification doit pouvoir être créée lorsqu'un administrateur modifie :

- la date ;
- l'heure ;
- l'installation ;
- la discipline ;
- la composition ;
- le statut d'un événement.

---

### Nouvelle compétition

Les joueurs concernés peuvent être informés lorsqu'une compétition ou un match est ajouté.

---

### Remplacement

Les personnes concernées peuvent être informées lors :

- de la création d'une demande ;
- de la validation d'un remplacement ;
- du refus d'une demande ;
- de l'annulation d'une demande.

---

### Récapitulatif hebdomadaire

Chaque joueur concerné pourra recevoir un récapitulatif de ses événements de la semaine.

---

# Canaux de notification

## Priorité 1

```text
E-mail
```

L'e-mail constitue le canal prioritaire pour la première version.

---

## Priorité 2

```text
Notification push
```

Les notifications push seront ajoutées avec la PWA.

---

## Priorité 3

```text
SMS
```

Le SMS n'est pas prioritaire car il est généralement payant.

L'architecture doit néanmoins permettre d'ajouter ce canal ultérieurement sans modifier les règles métier.

---

# Traçabilité des notifications

Une notification doit pouvoir conserver :

| Champ | Description |
|---|---|
| id | Identifiant |
| recipient_id | Destinataire |
| notification_type | Type de notification |
| channel | Canal utilisé |
| related_entity_type | Type d'élément concerné |
| related_entity_id | Élément concerné |
| scheduled_at | Date d'envoi prévue |
| sent_at | Date d'envoi réelle |
| status | Statut |
| attempts | Nombre de tentatives |
| error_message | Erreur éventuelle |

---

## Statuts possibles

```text
PENDING
PROCESSING
SENT
FAILED
CANCELLED
```

Les valeurs définitives seront validées lors de la conception du schéma SQL.

---

# Historique et archivage

L'application doit conserver l'historique des éléments importants.

---

## Historique obligatoire

- équipes ;
- partenaires ;
- disciplines des joueurs ;
- séries ;
- entraînements ;
- affectations ;
- compétitions ;
- matchs ;
- remplacements ;
- publications ;
- modifications importantes.

---

## Principe d'archivage

Ne pas supprimer physiquement une donnée historique lorsqu'elle n'est plus active.

Utiliser selon les cas :

```text
active
archived
start_date
end_date
cancelled_at
```

---

## Exception

La suppression physique pourra être utilisée uniquement pour les données temporaires sans valeur historique, après analyse du besoin.

Elle ne doit jamais être appliquée par défaut.

---

# Journal d'audit

Les modifications importantes doivent être enregistrées.

---

## Exemples d'actions à tracer

- création d'un joueur ;
- modification d'une série ;
- création ou modification d'une équipe ;
- ouverture des disponibilités ;
- correction d'une disponibilité par un administrateur ;
- publication d'un planning ;
- modification d'un événement publié ;
- annulation d'un entraînement ;
- validation d'un remplacement ;
- archivage d'une donnée.

---

## Structure conceptuelle

```text
audit_logs
```

| Champ | Description |
|---|---|
| id | Identifiant |
| actor_user_id | Utilisateur ayant réalisé l'action |
| action | Type d'action |
| entity_type | Type d'objet modifié |
| entity_id | Identifiant de l'objet |
| old_data | Anciennes données |
| new_data | Nouvelles données |
| created_at | Date de l'action |

Le journal d'audit ne doit pas enregistrer chaque simple consultation de page.

---

# Schéma conceptuel initial

Le schéma suivant est indicatif.

Il doit être revu et validé avant la création de la première migration SQL.

---

## Identité et configuration

```text
profiles
club_settings
```

Supabase Auth gère les comptes d'authentification.

La table `profiles` contient les informations métier liées à l'utilisateur.

---

## Référentiels

```text
seasons
disciplines
series
installation_types
installations
```

---

## Relations entre référentiels

```text
discipline_installation_types
series_compatibilities
player_disciplines
```

---

## Équipes

```text
teams
team_members
```

---

## Périodes et créneaux

```text
training_periods
training_slots
training_events
```

---

## Disponibilités

```text
player_availabilities
availability_exceptions
```

---

## Planning et affectations

```text
planning_versions
training_assignments
```

Le nom `planning_versions` pourra être remplacé par `planning_proposals` après validation du modèle exact.

---

## Compétitions

```text
competitions
competition_teams
competition_availabilities
competition_matches
```

---

## Remplacements

```text
replacement_requests
replacements
```

---

## Notifications

```text
notifications
notification_logs
```

---

## Traçabilité

```text
audit_logs
```

---

# Relations conceptuelles principales

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

# Contraintes de base de données à prévoir

La conception SQL devra notamment vérifier les contraintes suivantes.

---

## Contraintes d'unicité

- une saison ne doit pas être créée plusieurs fois avec le même nom ;
- une discipline active ne doit pas être dupliquée ;
- un joueur ne doit pas avoir deux inscriptions actives identiques pour une discipline et une saison ;
- un joueur ne doit pas appartenir à plusieurs équipes actives pour la même discipline et la même saison ;
- un joueur ne doit pas avoir plusieurs réponses contradictoires pour le même créneau et la même période ;
- une même affectation ne doit pas être créée plusieurs fois.

---

## Contraintes de cohérence

- la date de fin doit être postérieure ou égale à la date de début ;
- l'heure de fin doit être postérieure à l'heure de début ;
- un événement doit appartenir à la période concernée ;
- une équipe active doit avoir exactement deux membres ;
- un joueur affecté doit pratiquer la discipline de l'événement ;
- la saison de l'équipe doit correspondre à la saison de la compétition ;
- une composition ponctuelle ne doit pas créer automatiquement une équipe.

---

## Index à prévoir

Des index devront être prévus sur les colonnes souvent utilisées pour :

- filtrer par saison ;
- filtrer par discipline ;
- filtrer par joueur ;
- filtrer par équipe ;
- filtrer par période ;
- rechercher les événements par date ;
- contrôler les conflits horaires ;
- calculer les disponibilités ;
- rechercher les notifications en attente.

Les index exacts seront définis pendant la conception SQL.

---

# Sécurité Supabase

Supabase Auth est utilisé pour l'authentification.

Les politiques Row Level Security sont obligatoires.

---

## Principes PLAYER

Un joueur doit pouvoir :

- consulter son profil ;
- modifier uniquement les champs personnels autorisés ;
- consulter ses disciplines et ses équipes ;
- consulter et modifier ses disponibilités pendant la période autorisée ;
- créer ses exceptions ;
- consulter ses événements publiés ;
- créer une demande de remplacement pour un événement qui le concerne ;
- consulter ses notifications.

Un joueur ne doit pas pouvoir :

- modifier sa série ;
- modifier son équipe ;
- consulter les disponibilités privées des autres joueurs ;
- modifier un planning ;
- publier un planning ;
- valider un remplacement ;
- accéder aux fonctions d'administration.

---

## Principes ADMIN

Un administrateur doit pouvoir :

- consulter les données du club ;
- créer et modifier les référentiels ;
- gérer les joueurs ;
- gérer les équipes ;
- consulter les disponibilités ;
- corriger une disponibilité avec traçabilité ;
- gérer les périodes ;
- gérer les créneaux ;
- construire le planning ;
- publier le planning ;
- gérer les compétitions ;
- traiter les remplacements ;
- gérer les notifications.

---

## Clés Supabase

Le frontend peut utiliser uniquement la clé publique prévue pour le client.

Les clés secrètes ou privilégiées ne doivent jamais apparaître dans :

- le code frontend ;
- le dépôt Git ;
- le fichier Markdown ;
- les captures d'écran ;
- les journaux envoyés au navigateur.

Les opérations nécessitant des droits élevés doivent être exécutées dans un environnement sécurisé.

---

# Paramètres généraux de la V1

| Paramètre | Valeur validée |
|---|---|
| Nombre de clubs | Un seul |
| Langue | Français |
| Fuseau horaire | Europe/Paris |
| Format horaire | 24 heures |
| Premier jour de la semaine | Lundi |
| Interface | Mobile-first |
| Application native | Non |
| PWA | Phase ultérieure |
| Authentification | Supabase Auth |
| Inscription publique | Non |
| Création des comptes | Invitation administrateur |
| Nombre d'administrateurs | Plusieurs autorisés |
| Suppression des historiques | Non |
| Canal de notification initial | E-mail |

---

# Développement par phases

## Phase 1 : socle

Contenu :

- initialisation du projet frontend ;
- configuration TypeScript ;
- configuration de l'interface ;
- création du projet Supabase ;
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
gestion fonctionnelle des référentiels principaux
```

---

## Phase 2 : équipes

Contenu :

- inscriptions des joueurs aux disciplines ;
- séries par discipline et saison ;
- création des équipes ;
- association des joueurs ;
- historique des membres ;
- contrôles d'unicité.

Critère de sortie :

```text
Équipes permanentes fiables et historisées
```

---

## Phase 3 : disponibilités

Contenu :

- périodes ;
- créneaux récurrents ;
- ouverture des réponses ;
- disponibilités ;
- préférences ;
- exceptions ;
- calcul de disponibilité.

Critère de sortie :

```text
Disponibilité calculée et testée
```

---

## Phase 4 : planning manuel

Contenu :

- création des événements réels ;
- affectation manuelle des joueurs ;
- détection des conflits ;
- calendrier ;
- brouillon ;
- validation ;
- publication.

Critère de sortie :

```text
Planning manuel utilisable avec les données réelles du club
```

Cette phase doit obligatoirement être validée avant l'automatisation.

---

## Phase 5 : moteur d'optimisation

Contenu :

- contraintes dures ;
- préférences ;
- score ;
- équilibrage global ;
- conservation des équipes ;
- proposition de planning ;
- explication des anomalies ;
- validation humaine.

Critère de sortie :

```text
Brouillon cohérent
+
modifiable
+
explicable
```

---

## Phase 6 : compétitions

Contenu :

- création des compétitions ;
- équipes engagées ;
- disponibilités ;
- matchs ;
- calendrier.

Critère de sortie :

```text
Gestion opérationnelle des compétitions sans import PDF
```

---

## Phase 7 : notifications

Contenu :

- e-mails ;
- rappels ;
- changements ;
- remplacements ;
- récapitulatif hebdomadaire ;
- journal des envois.

Critère de sortie :

```text
Notifications tracées et contrôlables
```

---

## Phase 8 : import PDF

Contenu :

- dépôt du PDF ;
- extraction ;
- rapprochement avec les équipes ;
- affichage des incertitudes ;
- validation humaine ;
- création des matchs.

Critère de sortie :

```text
Import assisté
mais jamais automatique
```

---

## Phase 9 : PWA

Contenu :

- installation sur téléphone ;
- mode PWA ;
- notifications push.

Critère de sortie :

```text
Application installable
+
notifications push fonctionnelles
```

---

# Fonctionnalités à ne pas développer au début

Ne pas commencer par :

- le moteur d'optimisation complexe ;
- l'import PDF ;
- les notifications SMS ;
- les statistiques avancées ;
- les scores et classements ;
- une interface très sophistiquée ;
- le multi-club ;
- une application mobile native.

Le premier objectif fonctionnel est :

```text
Joueur
↓
Disponibilité
↓
Équipe
↓
Entraînement
↓
Calendrier
```

---

# Critères de réussite de la V1

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
15. construire manuellement un planning ;
16. détecter les conflits ;
17. valider le planning ;
18. publier le planning ;
19. permettre aux joueurs de consulter leur calendrier ;
20. traiter une demande de remplacement ;
21. conserver l'historique ;
22. protéger les données avec les politiques RLS.

---

# Registre des décisions validées

| ID | Décision | Statut |
|---|---|---|
| D-01 | Application mono-club en V1 | VALIDÉ |
| D-02 | Rôles PLAYER et ADMIN, avec plusieurs administrateurs autorisés | VALIDÉ |
| D-03 | Création des comptes par invitation d'un administrateur | VALIDÉ |
| D-04 | Série d'une équipe choisie manuellement | VALIDÉ |
| D-05 | Compatibilité des séries symétrique et configurable par discipline | VALIDÉ |
| D-06 | Une discipline peut accepter plusieurs types d'installation | VALIDÉ |
| D-07 | Absence de réponse égale disponibilité inconnue | VALIDÉ |
| D-08 | Quatre joueurs exigés automatiquement, avec dérogation manuelle | VALIDÉ |
| D-09 | Génération en brouillon puis publication explicite | VALIDÉ |
| D-10 | Remplacement traité et validé par un administrateur | VALIDÉ |
| D-11 | V1 compétition sans scores, classement, statistiques ni PDF | VALIDÉ |
| D-12 | V1 en français | VALIDÉ |
| D-13 | Application web responsive mobile-first | VALIDÉ |
| D-14 | PWA et notifications push développées ultérieurement | VALIDÉ |
| D-15 | Archivage des données historiques sans suppression physique | VALIDÉ |
| D-16 | Une seule équipe active par joueur, discipline et saison | VALIDÉ |

---

# Points différés ou restant à définir

Ces points ne bloquent pas le démarrage.

Ils ne doivent toutefois pas être inventés pendant le développement.

---

## Phase 5

```text
TODO / À DÉFINIR
```

- formule finale du score ;
- valeur des bonus ;
- valeur des pénalités ;
- traitement exact des entraînements consécutifs ;
- traitement de plusieurs entraînements le même jour ;
- méthode d'optimisation ;
- comportement lorsqu'aucune solution complète n'existe.

---

## Phase 6

```text
TODO / À DÉFINIR
```

- championnat ;
- équipe adverse ;
- domicile ou extérieur ;
- statut détaillé des matchs ;
- report ou annulation ;
- gestion éventuelle des résultats.

---

## Phase 7

```text
TODO / À DÉFINIR
```

- fournisseur d'envoi d'e-mails ;
- délai exact des rappels de compétition ;
- contenu final des modèles d'e-mail ;
- fréquence et jour du récapitulatif hebdomadaire ;
- durée de conservation des journaux.

---

## Phase 8

```text
TODO / À DÉFINIR
```

- format réel des PDF de la ligue ;
- règles de reconnaissance des équipes ;
- traitement des lignes ambiguës ;
- conservation du fichier original ;
- informations source à enregistrer.

---

## Hors V1

```text
TODO / À DÉFINIR
```

- multi-club ;
- SMS ;
- application mobile native ;
- statistiques avancées ;
- scores et classements détaillés.

---

# Méthode de développement avec VS Code

Le développement sera réalisé étape par étape.

L'objectif est de limiter la consommation de crédits et d'éviter les générations inutiles.

---

## Règles de collaboration

1. Un seul objectif précis par prompt.
2. Ne jamais demander de générer l'ensemble du projet en une fois.
3. Vérifier chaque résultat avant le prompt suivant.
4. Transmettre les erreurs et les réponses de VS Code.
5. Ne pas modifier plusieurs domaines métier en même temps.
6. Créer un commit Git aux jalons stables.
7. Ne pas passer à la phase suivante tant que la phase actuelle n'est pas validée.
8. Ne jamais inventer une règle sportive.
9. Utiliser `TODO / À DÉFINIR` lorsqu'une décision manque.
10. Mettre à jour le présent document lorsqu'une nouvelle règle est validée.

---

# Organisation documentaire recommandée

```text
pelote_app/
├── docs/
│   ├── CAHIER_DES_CHARGES_V1.md
│   ├── DECISIONS.md
│   ├── DATABASE_SCHEMA.md
│   └── RLS_POLICIES.md
├── src/
├── supabase/
└── README.md
```

Ces fichiers seront créés progressivement.

Le présent fichier constitue la référence fonctionnelle initiale.

---

# Ordre des prochaines actions

Avant de développer les écrans métier :

1. relire et valider le présent cahier des charges ;
2. confirmer la stack technique ;
3. définir l'architecture des dossiers ;
4. concevoir le schéma SQL ;
5. vérifier les relations ;
6. définir les contraintes ;
7. définir les politiques RLS ;
8. valider le schéma ;
9. initialiser le projet ;
10. développer l'authentification et le socle.

---

# Règle finale du projet

```text
L'automatisation propose.
L'administrateur contrôle.
L'administrateur modifie.
L'administrateur valide.
```

Aucun automatisme ne doit imposer une décision sportive.

Toute règle inconnue doit être conservée sous la forme :

```text
TODO / À DÉFINIR
```

---

# Validation du document

**Version :** 1.1  
**Date :** 15 septembre 2026  
**Statut :** Cahier des charges validé avant développement  
**Dépôt :** `pelote_app`  
**Document :** `docs/CAHIER_DES_CHARGES_V1.md`

---

# Conclusion

Le projet est suffisamment défini pour commencer la conception technique.

Le développement ne doit pas commencer par le moteur d'optimisation.

Le premier objectif est de rendre fiable le parcours suivant :

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
```

Une fois ce parcours validé avec des données réalistes, le moteur d'optimisation globale pourra être développé.

---

**Fin du cahier des charges fonctionnel et technique PELOTE_APP, version 1.1.**