# DATABASE_SCHEMA

Ce document décrit le schéma cible PostgreSQL de PELOTE_APP pour la V1. Il ne contient pas de SQL exécutable. Tous les identifiants métier `id` sont de type `uuid`. Les dates et heures d'audit sont de type `timestamptz`, stockées en UTC et affichées dans le fuseau `Europe/Paris`.

## Terminologie

Une pratique sportive est le couple :

```text
discipline_id + installation_type_id
```

Le type d'installation seul ne constitue pas une pratique : on ne pratique pas simplement le Trinquet ou le Mur à gauche. On pratique par exemple la Gomme pleine en Trinquet, la Gomme creuse en Trinquet, la Gomme pleine en Mur à gauche ou la Gomme creuse en Mur à gauche.

Les tables `disciplines`, `installation_types` et `discipline_installation_types` sont conservées telles quelles. Aucune table `practice` dédiée n'est créée en V1 : `discipline_installation_types` reste la source des couples discipline / type d'installation autorisés, et les tables qui définissent une inscription, une équipe ou une compétition référencent ce couple via une clé étrangère composite `(discipline_id, installation_type_id)`.

## Tables

### Identité et paramétrage

#### `profiles`
Fiche métier d'un joueur, associée facultativement à un compte Supabase Auth.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK ; identifiant de la fiche joueur |
| auth_user_id | uuid | UNIQUE ; référence au compte Auth ; NULL tant que l'invitation n'est pas activée |
| first_name | text | NOT NULL |
| last_name | text | NOT NULL |
| email | text | NOT NULL ; UNIQUE, comparaison insensible à la casse recommandée |
| phone | text | NULL |
| role | text | NOT NULL ; valeurs `PLAYER`, `ADMIN` |
| active | boolean | NOT NULL ; défaut `true` |
| notification_preferences | jsonb | NOT NULL ; défaut objet vide ; préférences de canaux et de types de notification |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deactivated_at | timestamptz | NULL |

#### `club_settings`
Paramètres du club unique de la V1.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| club_name | text | NOT NULL |
| timezone | text | NOT NULL ; défaut `Europe/Paris` |
| locale | text | NOT NULL ; défaut `fr-FR` |
| week_starts_on | smallint | NOT NULL ; valeur `1` pour lundi |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

La table doit contenir au plus une ligne en V1.

#### `seasons`

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| name | text | NOT NULL ; UNIQUE |
| start_date | date | NOT NULL |
| end_date | date | NOT NULL ; `end_date >= start_date` |
| active | boolean | NOT NULL ; défaut `true` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| archived_at | timestamptz | NULL |

#### `disciplines`

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| name | text | NOT NULL ; UNIQUE, insensible à la casse recommandée |
| description | text | NULL |
| active | boolean | NOT NULL ; défaut `true` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| archived_at | timestamptz | NULL |

#### `series`

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| name | text | NOT NULL ; UNIQUE, insensible à la casse recommandée |
| sort_order | integer | NOT NULL ; UNIQUE ; supérieur ou égal à zéro |
| active | boolean | NOT NULL ; défaut `true` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| archived_at | timestamptz | NULL |

#### `installation_types`

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| name | text | NOT NULL ; UNIQUE, insensible à la casse recommandée |
| description | text | NULL |
| active | boolean | NOT NULL ; défaut `true` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| archived_at | timestamptz | NULL |

#### `installations`

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| name | text | NOT NULL ; UNIQUE, insensible à la casse recommandée |
| installation_type_id | uuid | NOT NULL ; FK vers `installation_types.id` |
| address | text | NULL |
| active | boolean | NOT NULL ; défaut `true` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| archived_at | timestamptz | NULL |

#### `discipline_installation_types`
Table de liaison entre disciplines et types d'installation compatibles.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| discipline_id | uuid | PK composite ; FK vers `disciplines.id` |
| installation_type_id | uuid | PK composite ; FK vers `installation_types.id` |
| created_at | timestamptz | NOT NULL |

#### `series_compatibilities`
Compatibilités de séries par discipline. Une paire est stockée une seule fois dans un ordre canonique.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| discipline_id | uuid | NOT NULL ; FK vers `disciplines.id` |
| series_a_id | uuid | NOT NULL ; FK vers `series.id` |
| series_b_id | uuid | NOT NULL ; FK vers `series.id` |
| created_at | timestamptz | NOT NULL |
| created_by | uuid | NOT NULL ; FK vers `profiles.id` |

Contrainte UNIQUE sur `(discipline_id, series_a_id, series_b_id)`. L'ordre canonique sera assuré au niveau SQL à l'aide d'une fonction basée sur `LEAST` / `GREATEST` ou équivalent. Une compatibilité d'une série avec elle-même est implicite ou reste à confirmer.

### Joueurs, inscriptions et équipes

#### `player_disciplines`
Inscription d'un joueur pour une pratique (discipline et type d'installation) et une saison, avec sa série.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| player_id | uuid | NOT NULL ; FK vers `profiles.id` |
| discipline_id | uuid | NOT NULL ; FK vers `disciplines.id` |
| installation_type_id | uuid | NOT NULL ; FK vers `installation_types.id` ; avec `discipline_id`, FK composite vers `discipline_installation_types(discipline_id, installation_type_id)` |
| season_id | uuid | NOT NULL ; FK vers `seasons.id` |
| series_id | uuid | NOT NULL ; FK vers `series.id` |
| active | boolean | NOT NULL ; défaut `true` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| archived_at | timestamptz | NULL |

Contrainte UNIQUE partielle sur `(player_id, discipline_id, installation_type_id, season_id)` lorsque `active = true`. Un joueur peut ainsi avoir plusieurs inscriptions actives pour une même discipline et une même saison dès lors que le type d'installation diffère ; la série est définie pour chaque pratique et chaque saison.

#### `teams`
Partenariat permanent historisé ; une nouvelle composition durable crée une nouvelle ligne. Une équipe appartient à une saison, une pratique (discipline et type d'installation) et une série de référence.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| season_id | uuid | NOT NULL ; FK vers `seasons.id` |
| discipline_id | uuid | NOT NULL ; FK vers `disciplines.id` |
| installation_type_id | uuid | NOT NULL ; FK vers `installation_types.id` ; avec `discipline_id`, FK composite vers `discipline_installation_types(discipline_id, installation_type_id)` |
| series_id | uuid | NOT NULL ; FK vers `series.id` ; série de référence choisie par l'administrateur |
| status | text | NOT NULL ; valeurs `ACTIVE`, `INCOMPLETE`, `ARCHIVED` |
| created_at | timestamptz | NOT NULL |
| created_by | uuid | NOT NULL ; FK vers `profiles.id` |
| updated_at | timestamptz | NOT NULL |
| archived_at | timestamptz | NULL |

Les deux membres d'une équipe doivent posséder une inscription `player_disciplines` active correspondant exactement à `season_id`, `discipline_id` et `installation_type_id` de l'équipe. La série individuelle de chaque membre n'est pas encore contrainte d'être strictement égale à la série de référence de l'équipe, cette règle n'étant pas explicitement validée.

Une équipe `ARCHIVED` :

- ne peut plus être utilisée pour un entraînement automatique ;
- ne peut plus être engagée dans une compétition ;
- ne peut plus être utilisée par le moteur d'optimisation ;
- reste entièrement consultable dans l'historique.

#### `team_members`
Historique des membres d'une équipe.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| team_id | uuid | NOT NULL ; FK vers `teams.id` |
| player_id | uuid | NOT NULL ; FK vers `profiles.id` |
| start_date | date | NOT NULL |
| end_date | date | NULL ; doit être postérieure ou égale à `start_date` |
| active | boolean | NOT NULL ; défaut `true` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Contrainte UNIQUE partielle sur `(team_id, player_id)` lorsque `active = true`. La cohérence avec la pratique (discipline et type d'installation) et la saison de l'équipe dépend de `player_disciplines` actif.

### Disponibilités et entraînements

Le type d'installation d'un créneau ou d'un événement s'obtient via `installation_id → installations.installation_type_id`. L'éligibilité d'un joueur à un créneau ou à un événement doit être vérifiée avec `season_id`, `discipline_id` et ce type d'installation, et non plus seulement avec `discipline_id` et `season_id`.

#### `training_periods`

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| season_id | uuid | NOT NULL ; FK vers `seasons.id` |
| name | text | NOT NULL |
| start_date | date | NOT NULL |
| end_date | date | NOT NULL ; `end_date >= start_date` |
| availability_opens_at | timestamptz | NULL |
| availability_closes_at | timestamptz | NULL ; postérieure à l'ouverture |
| status | text | NOT NULL ; `PREPARATION`, `AVAILABILITIES_OPEN`, `PLANNING_IN_PROGRESS`, `PUBLISHED`, `COMPLETED`, `CANCELLED` |
| created_by | uuid | NOT NULL ; FK vers `profiles.id` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| cancelled_at | timestamptz | NULL |

#### `training_slots`
Créneaux récurrents utilisés pour recueillir les disponibilités et générer les occurrences.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| training_period_id | uuid | NOT NULL ; FK vers `training_periods.id` |
| day_of_week | smallint | NOT NULL ; de `1` (lundi) à `7` (dimanche) |
| start_time | time | NOT NULL |
| end_time | time | NOT NULL ; postérieure à `start_time` |
| discipline_id | uuid | NOT NULL ; FK vers `disciplines.id` |
| installation_id | uuid | NOT NULL ; FK vers `installations.id` |
| active | boolean | NOT NULL ; défaut `true` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| archived_at | timestamptz | NULL |

#### `training_events`
Occurrence réelle d'un entraînement, issue d'un créneau ou exceptionnelle.

Les `training_events` représentent les occurrences réelles. Le versionnement porte exclusivement sur les `training_assignments`. Un même `training_event` peut donc apparaître dans plusieurs versions de planning avec des affectations différentes.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| training_period_id | uuid | NOT NULL ; FK vers `training_periods.id` |
| training_slot_id | uuid | NULL ; FK vers `training_slots.id` |
| discipline_id | uuid | NOT NULL ; FK vers `disciplines.id` |
| installation_id | uuid | NOT NULL ; FK vers `installations.id` |
| starts_at | timestamptz | NOT NULL |
| ends_at | timestamptz | NOT NULL ; postérieure à `starts_at` |
| status | text | NOT NULL ; `DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED` |
| created_by | uuid | NOT NULL ; FK vers `profiles.id` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| cancelled_at | timestamptz | NULL |
| cancellation_reason | text | NULL |

#### `player_availabilities`
Réponse récurrente d'un joueur à un créneau d'entraînement.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| player_id | uuid | NOT NULL ; FK vers `profiles.id` |
| training_slot_id | uuid | NOT NULL ; FK vers `training_slots.id` |
| status | text | NOT NULL ; `UNAVAILABLE`, `AVAILABLE`, `PREFERRED` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Contrainte UNIQUE sur `(player_id, training_slot_id)`. `NO_RESPONSE` et `CONFLICT` ne sont pas enregistrés dans cette table.

#### `availability_exceptions`
Exception ponctuelle à la réponse récurrente d'un joueur.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| player_id | uuid | NOT NULL ; FK vers `profiles.id` |
| training_event_id | uuid | NOT NULL ; FK vers `training_events.id` |
| exception_type | text | NOT NULL ; `UNAVAILABLE_EXCEPTION`, `AVAILABLE_EXCEPTION` |
| reason | text | NULL |
| created_by | uuid | NOT NULL ; FK vers `profiles.id` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Contrainte UNIQUE sur `(player_id, training_event_id)` afin d'empêcher les exceptions contradictoires.

#### `planning_versions`

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| training_period_id | uuid | NOT NULL ; FK vers `training_periods.id` |
| version_number | integer | NOT NULL ; strictement positif |
| status | text | NOT NULL ; `DRAFT`, `VALIDATED`, `PUBLISHED`, `ARCHIVED` |
| generated_at | timestamptz | NOT NULL |
| generated_by | uuid | NOT NULL ; FK vers `profiles.id` |
| published_at | timestamptz | NULL |
| published_by | uuid | NULL ; FK vers `profiles.id` |
| notes | text | NULL |
| archived_at | timestamptz | NULL |

Contrainte UNIQUE sur `(training_period_id, version_number)` et UNIQUE partielle sur `training_period_id` lorsque `status = 'PUBLISHED'`.

#### `training_assignments`
Affectation d'un joueur à un événement dans une version de planning.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| planning_version_id | uuid | NOT NULL ; FK vers `planning_versions.id` |
| training_event_id | uuid | NOT NULL ; FK vers `training_events.id` |
| player_id | uuid | NOT NULL ; FK vers `profiles.id` |
| assigned_by | uuid | NOT NULL ; FK vers `profiles.id` |
| override_reason | text | NULL ; obligatoire en cas de dérogation aux contrôles automatiques |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Contrainte UNIQUE sur `(planning_version_id, training_event_id, player_id)`.

### Compétitions et remplacements

#### `competitions`

Une compétition appartient à une pratique précise (discipline et type d'installation) et à une saison.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| season_id | uuid | NOT NULL ; FK vers `seasons.id` |
| discipline_id | uuid | NOT NULL ; FK vers `disciplines.id` |
| installation_type_id | uuid | NOT NULL ; FK vers `installation_types.id` ; avec `discipline_id`, FK composite vers `discipline_installation_types(discipline_id, installation_type_id)` |
| series_id | uuid | NULL ; FK vers `series.id` ; série optionnelle de la compétition |
| name | text | NOT NULL |
| status | text | NOT NULL ; `DRAFT`, `PUBLISHED`, `COMPLETED`, `CANCELLED` |
| starts_at | timestamptz | NULL |
| ends_at | timestamptz | NULL ; postérieure à `starts_at` si renseignée |
| created_by | uuid | NOT NULL ; FK vers `profiles.id` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| published_at | timestamptz | NULL |
| cancelled_at | timestamptz | NULL |

Contrainte UNIQUE recommandée sur `(season_id, discipline_id, name)` tant que la règle de nommage n'est pas précisée.

#### `competition_teams`
Table de liaison entre une compétition et les équipes engagées.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| competition_id | uuid | PK composite ; FK vers `competitions.id` |
| team_id | uuid | PK composite ; FK vers `teams.id` |
| created_at | timestamptz | NOT NULL |

### Disponibilités de compétition

Aucune table dédiée aux disponibilités de compétition n'est créée en V1.

Une vue calculée pourra être utilisée : `competition_team_availability_view`.

Règles :

- `AVAILABLE` si les deux joueurs sont disponibles ;
- `UNAVAILABLE` si un joueur est indisponible ;
- `NO_RESPONSE` si au moins un joueur n'a pas répondu.

#### `competition_matches`
Match rattaché à une compétition et éventuellement à une équipe du club.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| competition_id | uuid | NOT NULL ; FK vers `competitions.id` |
| team_id | uuid | NULL ; FK vers `teams.id` |
| starts_at | timestamptz | NOT NULL |
| ends_at | timestamptz | NULL ; postérieure à `starts_at` si renseignée |
| status | text | NOT NULL ; `SCHEDULED`, `COMPLETED`, `POSTPONED`, `CANCELLED` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| cancelled_at | timestamptz | NULL |

#### `replacement_requests`
Demande initiée par un joueur affecté à un entraînement.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| training_assignment_id | uuid | NOT NULL ; FK vers `training_assignments.id` |
| requested_by | uuid | NOT NULL ; FK vers `profiles.id` |
| reason | text | NULL |
| status | text | NOT NULL ; `REQUESTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED` |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| reviewed_at | timestamptz | NULL |
| reviewed_by | uuid | NULL ; FK vers `profiles.id` |
| cancelled_at | timestamptz | NULL |

Une seule demande non terminale (`REQUESTED` ou `IN_REVIEW`) est admise par affectation.

#### `replacements`
Décision effective de remplacement temporaire.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| replacement_request_id | uuid | NOT NULL ; UNIQUE ; FK vers `replacement_requests.id` |
| original_assignment_id | uuid | NOT NULL ; FK vers `training_assignments.id` |
| replacement_player_id | uuid | NOT NULL ; FK vers `profiles.id` |
| approved_by | uuid | NOT NULL ; FK vers `profiles.id` |
| override_reason | text | NULL |
| approved_at | timestamptz | NOT NULL |
| cancelled_at | timestamptz | NULL |

### Notifications et audit

#### `notifications`
Objet métier de notification destiné à un joueur.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| recipient_id | uuid | NOT NULL ; FK vers `profiles.id` |
| type | text | NOT NULL ; rappel, modification, annulation, compétition, remplacement ou récapitulatif |
| title | text | NOT NULL |
| body | text | NOT NULL |
| related_entity_type | text | NULL |
| related_entity_id | uuid | NULL |
| status | text | NOT NULL ; `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `CANCELLED` |
| viewed_at | timestamptz | NULL |
| scheduled_at | timestamptz | NULL |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| cancelled_at | timestamptz | NULL |

#### `notification_logs`
Tentatives techniques d'envoi d'une notification.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| notification_id | uuid | NOT NULL ; FK vers `notifications.id` |
| attempt_number | integer | NOT NULL ; strictement positif |
| channel | text | NOT NULL ; `EMAIL`, `PUSH`, `SMS` |
| status | text | NOT NULL ; `PENDING`, `PROCESSING`, `SENT`, `FAILED`, `CANCELLED` |
| attempted_at | timestamptz | NOT NULL |
| provider_message_id | text | NULL |
| error_message | text | NULL |
| created_at | timestamptz | NOT NULL |

Contrainte UNIQUE sur `(notification_id, attempt_number, channel)`.

#### `audit_logs`
Historique des opérations métier importantes uniquement.

| Champ | Type SQL | Contraintes / description |
|---|---|---|
| id | uuid | PK |
| actor_user_id | uuid | NULL ; FK vers `profiles.id` ; NULL pour une action système |
| action | text | NOT NULL |
| entity_type | text | NOT NULL |
| entity_id | uuid | NOT NULL |
| old_data | jsonb | NULL ; sans secrets |
| new_data | jsonb | NULL ; sans secrets |
| created_at | timestamptz | NOT NULL |

## Relations

- `profiles` est référencée par les inscriptions, équipes, disponibilités, créations, affectations, remplacements, notifications et audit. Un profil ne doit pas être supprimé physiquement tant qu'il possède des données métier.
- Une `season` possède des `player_disciplines`, `teams`, `training_periods` et `competitions`.
- Une `discipline` possède des compatibilités d'installations, compatibilités de séries, inscriptions, équipes, créneaux, événements et compétitions.
- `discipline_installation_types` réalise la relation plusieurs-à-plusieurs entre disciplines et types d'installation.
- `series_compatibilities` réalise la relation symétrique plusieurs-à-plusieurs entre séries pour une discipline.
- `player_disciplines` relie un joueur, une pratique (discipline et type d'installation), une saison et une série.
- Une `team` appartient à une saison, une pratique (discipline et type d'installation) et une série de référence ; `team_members` en conserve les membres historiques.
- Une `training_period` appartient à une saison ; elle contient des `training_slots`, `training_events` et `planning_versions`.
- Un `training_slot` peut générer plusieurs `training_events` ; un événement exceptionnel n'a pas de créneau parent.
- `player_availabilities` relie un joueur à un créneau ; `availability_exceptions` relie un joueur à une occurrence précise.
- Une `planning_version` contient des `training_assignments`. Une affectation référence obligatoirement un événement de la même période que sa version.
- `competition_teams` relie les équipes engagées aux compétitions. La disponibilité d'une équipe engagée est calculée par `competition_team_availability_view`.
- Une `competition` possède des `competition_matches` ; un match peut référencer l'équipe du club concernée.
- Une `replacement_request` cible une affectation ; une demande approuvée possède au plus un `replacement`.
- Une `notification` possède zéro à plusieurs `notification_logs`.

Les clés étrangères doivent employer `RESTRICT` ou un comportement équivalent par défaut. Aucun `CASCADE DELETE` ne doit être appliqué aux données métier historiques sans décision explicite.

## Contraintes

### Contraintes structurelles

- Les valeurs de statut et de rôle sont limitées aux énumérations documentées, au moyen de types énumérés PostgreSQL ou de contraintes `CHECK`.
- Les dates de fin sont postérieures ou égales aux dates de début ; les heures de fin sont strictement postérieures aux heures de début.
- Les dates d'une période doivent appartenir à sa saison, sauf dérogation administrative explicitement tracée.
- Les occurrences d'entraînement doivent se situer dans leur période ; un créneau parent doit appartenir à cette même période.
- Une installation utilisée par un créneau ou un événement doit avoir un type compatible avec la discipline concernée.
- Les noms des référentiels actifs doivent être uniques selon les règles indiquées dans les tables ; l'archivage ne doit pas casser l'historique.

### Joueurs et équipes

- `profiles.email` est unique, normalisé et distinct de l'identifiant Auth ; aucun mot de passe n'est stocké dans les tables métier.
- La désactivation ou la rétrogradation du dernier profil `ADMIN` actif est interdite.
- Une inscription active est unique pour un joueur, une pratique (discipline et type d'installation) et une saison ; un joueur peut avoir plusieurs inscriptions actives pour une même discipline et une même saison si le type d'installation diffère.
- Un membre actif d'équipe doit disposer d'une inscription active cohérente avec la pratique (discipline et type d'installation) et la saison de l'équipe.
- Un joueur ne peut appartenir qu'à une équipe `ACTIVE` par pratique (discipline et type d'installation) et saison. Cette règle doit inclure les membres actifs des équipes actives.
- Une équipe `ACTIVE` doit avoir exactement deux membres actifs ; une équipe `INCOMPLETE` ne peut pas être traitée comme une équipe complète automatique.
- Une nouvelle composition permanente doit créer une nouvelle équipe ; il est interdit de réutiliser une équipe archivée pour un partenariat différent.
- La désactivation d'un joueur doit empêcher ses nouvelles inscriptions, affectations et intégrations à une équipe active, sans supprimer ses données historiques. Les affectations futures publiées doivent seulement déclencher une alerte et une décision administrateur tracée.

### Disponibilités, affectations et planning

- Une réponse est unique par joueur et créneau ; une exception est unique par joueur et événement.
- La disponibilité calculée respecte l'ordre : conflit d'affectation, exception, disponibilité récurrente, puis `NO_RESPONSE`.
- `PREFERRED` est considéré disponible pour les contraintes dures ; `NO_RESPONSE` ne l'est jamais.
- Toute affectation doit concerner un joueur inscrit à la pratique de l'événement (discipline et type d'installation déduit de `installations.installation_type_id`) et à la saison de l'événement.
- Un joueur ne peut être affecté qu'une fois par événement et ne peut avoir deux affectations qui se chevauchent, toutes disciplines confondues, dans une même version de planning. La base doit contrôler le chevauchement des plages `starts_at` / `ends_at`.
- Une version ne peut affecter un joueur qu'à des événements de sa propre période. Une affectation visible par un joueur doit appartenir à une version `PUBLISHED`.
- Une version publiée est unique par période. La génération ou l'édition d'un brouillon ne modifie jamais les affectations d'une version publiée.
- Les contrôles automatiques imposent quatre joueurs, disponibilité positive, compatibilité de séries et absence de doublon ; une dérogation manuelle reste possible uniquement avec motif et audit.
- Les événements publiés, annulés ou terminés, ainsi que les versions publiées ou archivées, ne sont pas supprimés physiquement.

### Compétitions, remplacements et notifications

- Une équipe engagée dans une compétition doit appartenir à la même saison et à la même discipline ; la compatibilité avec la série de compétition doit être vérifiée si elle est renseignée.
- Une équipe engagée doit appartenir à la même saison.
- Une équipe engagée doit appartenir à la même discipline.
- Une équipe engagée doit appartenir au même type d'installation (même pratique) que la compétition.
- Une équipe `ARCHIVED` ne peut pas être engagée.
- Une équipe `INCOMPLETE` ne peut pas être engagée automatiquement.
- La disponibilité de compétition d'une équipe est calculée par `competition_team_availability_view` : disponible si les deux membres sont disponibles, indisponible si l'un ne l'est pas, `NO_RESPONSE` si au moins un joueur n'a pas répondu.
- Un match de compétition possède l'un des statuts `SCHEDULED`, `COMPLETED`, `POSTPONED` ou `CANCELLED`.
- Seul le joueur correspondant à l'affectation peut créer une demande de remplacement. L'affectation initiale demeure effective tant que la demande n'est pas approuvée.
- Le remplaçant doit être inscrit à la pratique (discipline et type d'installation de l'événement) et à la saison, disponible, distinct du joueur remplacé et sans conflit horaire. Toute dérogation est motivée et auditée.
- Une approbation de remplacement ne modifie jamais `teams` ni `team_members`.
- `viewed_at` est indépendant du statut technique d'envoi d'une notification.
- Les journaux techniques ne contiennent aucun secret ; les données d'audit excluent mots de passe, jetons et informations sensibles inutiles.

## Index

- `profiles` : index unique sur l'e-mail normalisé et sur `auth_user_id` ; index sur `(active, role)` pour l'administration et le contrôle du dernier administrateur.
- `player_disciplines` : index sur `(season_id, discipline_id, installation_type_id, active)` et sur `(player_id, season_id, active)` ; index unique partiel de l'inscription active.
- `teams` : index sur `(season_id, discipline_id, installation_type_id, status)` et `(series_id, status)` ; `team_members` sur `(player_id, active)`, `(team_id, active)` et un index unique partiel nécessaire à l'équipe active par joueur, pratique et saison.
- `training_periods` : index sur `(season_id, status)` et sur l'intervalle de dates ; `training_slots` sur `(training_period_id, active)`, `(discipline_id, day_of_week)` et `installation_id`.
- `training_events` : index sur `(training_period_id, starts_at)`, `(discipline_id, starts_at)`, `(installation_id, starts_at)` et un index de plage temporelle adapté à la détection de chevauchements.
- `player_availabilities` : index unique `(player_id, training_slot_id)` et index `(training_slot_id, status)` ; `availability_exceptions` : index unique `(player_id, training_event_id)` et index sur `training_event_id`.
- `planning_versions` : index unique `(training_period_id, version_number)`, index unique partiel de publication, index `(training_period_id, status)` ; `training_assignments` : index unique d'affectation et index `(player_id, planning_version_id)` ainsi qu'un index sur `training_event_id`.
- `competitions` : index `(season_id, discipline_id, installation_type_id, status)` et `(starts_at)` ; `competition_teams` et `competition_matches` : index sur leurs clés étrangères de recherche.
- `replacement_requests` : index `(status, created_at)`, `(requested_by, status)` et index unique partiel sur l'affectation pour les demandes non terminales ; `replacements` : index sur `replacement_player_id` et `original_assignment_id`.
- `notifications` : index `(recipient_id, viewed_at)`, `(recipient_id, created_at DESC)`, `(status, scheduled_at)` ; `notification_logs` : index `(notification_id, attempted_at)` et `(status, attempted_at)`.
- `audit_logs` : index `(entity_type, entity_id, created_at DESC)`, `(actor_user_id, created_at DESC)` et `(created_at DESC)`.

Les index de plage temporelle pour les conflits doivent être conçus avec les opérateurs PostgreSQL adaptés aux plages de temps et aux exclusions ; leur définition SQL précise sera arrêtée lors de la migration.

## Transactions critiques

1. **Publication d'une version de planning** : verrouiller la période, archiver l'unique version publiée existante, publier la nouvelle version, renseigner l'auteur et les dates, mettre à jour les événements nécessaires, créer l'audit et préparer les notifications dans une seule transaction atomique.
2. **Création ou modification d'une affectation** : vérifier l'inscription active, la disponibilité calculée, l'absence de chevauchement inter-disciplines, l'absence de doublon, les quatre joueurs et les compatibilités. En cas de dérogation, exiger le motif et écrire l'audit dans la même transaction.
3. **Création, régularisation ou archivage d'équipe** : vérifier les inscriptions actives pour la pratique et la saison concernées, empêcher une seconde équipe active incompatible pour le joueur sur cette même pratique et saison, contrôler le nombre de membres, mettre à jour le statut et conserver l'historique des membres avec audit.
4. **Désactivation d'un joueur ou changement de rôle** : vérifier qu'il reste au moins un administrateur actif, bloquer les nouvelles affectations, rechercher les affectations futures publiées, créer l'alerte et l'audit sans modifier silencieusement l'historique.
5. **Validation d'un remplacement** : verrouiller la demande et l'affectation, confirmer que le demandeur est bien le joueur affecté, vérifier l'inscription active du remplaçant pour la pratique (discipline et type d'installation) de l'événement et la saison de la période, contrôler le remplaçant et les conflits, enregistrer le remplacement, modifier la représentation effective de l'affectation selon le modèle retenu, passer la demande à `APPROVED`, auditer et notifier atomiquement.
6. **Création ou modification d'une compétition et de ses équipes** : garantir en transaction la cohérence saison, discipline, type d'installation et série entre compétition et équipes engagées.
7. **Traitement d'une notification** : réserver une notification `PENDING`, créer le journal de tentative, mettre à jour son statut technique et conserver les échecs sans créer de doublons de tentatives.

## Points à définir

- Définir la stratégie d'identifiants : UUID généré côté PostgreSQL, et références exactes à la table Supabase Auth.
- Confirmer les règles d'unicité des noms archivés des référentiels et des compétitions.
- Décider si l'auto-compatibilité d'une série est implicite ou stockée dans `series_compatibilities`.
- Définir le mécanisme PostgreSQL retenu pour les contraintes inter-tables : déclencheurs différés, fonctions transactionnelles sécurisées et contraintes d'exclusion pour les chevauchements.
- Définir le comportement exact lorsqu'une équipe active perd un membre : passage automatique à `INCOMPLETE` ou action administrative obligatoire.
- Définir si un événement peut accueillir plus ou moins de quatre joueurs en dérogation manuelle, et comment cette dérogation est matérialisée au-delà de `override_reason`.
- Définir la conservation et l'archivage des affectations lorsqu'une nouvelle version est publiée, ainsi que le statut exact des `training_events` partagés entre versions.
- Définir le modèle de disponibilité de compétition au niveau joueur, les échéances de réponse et l'implémentation de `competition_team_availability_view`.
- Définir les adversaires, domicile/extérieur, reports, scores et classements de `competition_matches`.
- Définir si certaines compétitions peuvent regrouper plusieurs types d'installation pour une même discipline ; dans l'attente, la V1 considère qu'une compétition correspond à une seule pratique et que `installation_type_id` est obligatoire.
- Définir les types de notification, les canaux effectivement disponibles en V1, le fournisseur e-mail, les modèles, les délais, les reprises et les durées de conservation.
- Définir les tables pouvant faire l'objet d'une suppression physique, les délais de rétention et le processus légal de suppression des données personnelles.
- Définir le stockage éventuel des fichiers d'import PDF, leur traçabilité et les références aux données importées.
- Définir les paramètres du moteur d'optimisation : poids, bonus, pénalités, entraînements consécutifs, plusieurs entraînements par jour, solution partielle et méthode de résolution.
