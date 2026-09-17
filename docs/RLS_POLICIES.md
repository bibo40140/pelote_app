# RLS_POLICIES

Ce document définit les règles d'accès Supabase pour la V1. Il décrit les politiques attendues sans contenir de SQL exécutable.

## Principes généraux

- Le Row Level Security (RLS) est obligatoire sur toutes les tables du schéma `public`, y compris les tables de liaison, de journalisation et d'audit.
- Toute requête provenant d'un client est refusée par défaut ; une politique explicite doit autoriser chaque lecture, création ou modification.
- Les rôles métier sont séparés en `PLAYER` et `ADMIN`. Un administrateur peut être joueur, mais ses privilèges administratifs ne résultent que de `profiles.role = 'ADMIN'` et d'un profil actif.
- Le principe du moindre privilège s'applique : un joueur ne reçoit que les droits nécessaires à ses écrans et actions personnelles ; les écritures transversales sont réservées aux administrateurs ou à une opération sécurisée.
- Les règles critiques sont appliquées côté base, via RLS, contraintes et fonctions sécurisées. Le frontend améliore l'expérience mais ne constitue jamais une barrière de sécurité.
- Aucune politique joueur ne doit exposer les disponibilités, exceptions, notifications, demandes de remplacement, informations de contact ou données d'audit d'un autre joueur.
- Les lignes archivées ou historiques restent accessibles selon les règles de lecture ci-dessous, mais ne doivent pas être supprimées ni réactivées par un joueur.
- Le rôle `service_role`, les tâches serveur et les fonctions sécurisées ne sont jamais exposés au navigateur. Leur usage est limité aux opérations système explicitement prévues.

## Modèle d'authentification

- `auth.users` est la source d'identité d'authentification Supabase. Les mots de passe, jetons et secrets ne sont jamais copiés dans `profiles` ni dans les journaux métier.
- `profiles.auth_user_id` référence de façon unique l'utilisateur Auth correspondant. Un profil peut exister avec `auth_user_id` à `NULL` avant l'activation de l'invitation.
- Toute politique concernant un joueur identifie sa fiche par la correspondance entre `profiles.auth_user_id` et `auth.uid()`. Une identité Auth sans profil actif ne reçoit aucun droit métier.
- Le rôle est stocké dans `profiles.role`. La détermination du rôle administratif doit être réalisée par une fonction ou un mécanisme de lecture interne sûr, afin d'éviter une récursion RLS et toute dépendance à une valeur fournie par le client.
- Un joueur ne peut jamais créer, modifier ou rattacher lui-même un `auth_user_id`, ni modifier son rôle, son statut `active`, son e-mail métier sans processus sécurisé, ou le profil d'un tiers.
- L'invitation, l'association du compte Auth à une fiche existante, le changement d'e-mail et la désactivation de compte doivent employer un flux sécurisé côté serveur.
- La désactivation, la suppression logique ou la rétrogradation du dernier administrateur actif est refusée. Cette protection relève d'une fonction transactionnelle ou d'un déclencheur côté base et ne peut pas dépendre de RLS seule.

## Politique ADMIN

Un administrateur actif peut lire toutes les données métier du club, y compris les éléments brouillon, archivés, annulés et historiques. Il peut créer et modifier les référentiels, saisons, inscriptions, équipes, périodes, créneaux, événements, compétitions et notifications conformément aux contraintes métier.

L'administrateur peut archiver, annuler ou désactiver les objets prévus à cet effet. Il ne supprime pas physiquement les données métier historiques. Les modifications qui touchent à une publication, une équipe, un remplacement, une désactivation, un archivage, une annulation ou un événement publié doivent être auditées.

L'administrateur gère l'ensemble du planning : création des brouillons, affectations, contrôle, validation et publication. Il accède aux disponibilités de tous les joueurs lorsque cela est nécessaire à la construction du planning. La publication, le remplacement effectif, la désactivation d'un administrateur et les autres actions concurrentes passent toutefois par des fonctions transactionnelles sécurisées.

L'administrateur lit et gère les compétitions, équipes engagées, matchs, notifications et journaux techniques. Il peut consulter l'audit, mais ne peut ni créer, ni modifier, ni supprimer directement `audit_logs`.

## Politique PLAYER

Un joueur authentifié doté d'un profil actif peut lire et modifier uniquement son propre profil, dans la limite des champs autorisés. Il peut gérer ses réponses de disponibilité et ses exceptions, consulter ses entraînements publiés, ses compétitions et matchs concernés, ses notifications, ainsi que ses demandes de remplacement et les remplacements qui le concernent.

Il peut créer une disponibilité pour lui-même, une exception pour lui-même et une demande de remplacement portant sur l'une de ses affectations publiées. Il peut modifier sa disponibilité dans la période autorisée et son exception dans les limites définies ; après clôture, la récurrence ne peut plus être modifiée librement. Il peut annuler sa propre demande de remplacement tant qu'elle n'est pas approuvée.

Un joueur ne peut pas :

- lire ou modifier le profil, les coordonnées, les disponibilités, les exceptions, les notifications ou les demandes de remplacement d'un autre joueur ;
- modifier son rôle, son état d'activation, son `auth_user_id`, sa série, ses inscriptions, son équipe ou les membres d'une équipe ;
- créer, modifier, archiver, publier ou annuler une période, un créneau, un événement, une version, une affectation, une compétition ou un match ;
- consulter un brouillon, une version validée non publiée ou une affectation d'une version non publiée ;
- approuver ou rejeter une demande de remplacement, choisir un remplaçant ou créer un remplacement effectif ;
- accéder à `notification_logs`, `audit_logs` ou aux données de diagnostic ;
- effectuer une suppression physique de données métier.

## Politique par table

### `profiles`
#### Lecture
Administrateurs : tous les profils. Joueur : son seul profil.
#### Création
Administrateurs et flux sécurisé d'invitation uniquement.
#### Modification
Administrateurs : tous les profils. Joueur : son profil, uniquement pour les champs personnels explicitement autorisés, notamment prénom, nom, téléphone et préférences de notification.
#### Archivage
Administrateurs uniquement, par désactivation (`active = false`, `deactivated_at`).
#### Restrictions
Le joueur ne modifie ni `role`, ni `active`, ni `auth_user_id`. L'e-mail et le lien Auth suivent un flux sécurisé. Le dernier `ADMIN` actif est protégé.

### `club_settings`
#### Lecture
Tous les utilisateurs authentifiés.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Non applicable ; la table à ligne unique n'est pas archivée en V1.
#### Restrictions
Aucune suppression ou création d'une seconde ligne par le client ; les paramètres ne doivent contenir aucun secret.

### `seasons`
#### Lecture
Tous les utilisateurs authentifiés, y compris les saisons archivées utiles à l'historique.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement.
#### Restrictions
Les joueurs ne modifient jamais les bornes de saison ni son état.

### `disciplines`
#### Lecture
Tous les utilisateurs authentifiés.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement.
#### Restrictions
Les disciplines archivées restent lisibles pour l'historique ; seul un administrateur les rend inactives.

### `series`
#### Lecture
Tous les utilisateurs authentifiés.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement.
#### Restrictions
Un joueur ne peut pas modifier sa série ni l'ordre des séries.

### `installation_types`
#### Lecture
Tous les utilisateurs authentifiés.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement.
#### Restrictions
Les types archivés restent disponibles en lecture pour l'historique.

### `installations`
#### Lecture
Tous les utilisateurs authentifiés.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement.
#### Restrictions
Les joueurs ne modifient pas les installations ni leurs adresses.

### `discipline_installation_types`
#### Lecture
Tous les utilisateurs authentifiés.
#### Création
Administrateurs uniquement.
#### Modification
Non applicable ; une liaison est immuable. Toute correction est réalisée par une opération administrative contrôlée.
#### Archivage
Non applicable ; ne pas supprimer une liaison utilisée par des données historiques.
#### Restrictions
La compatibilité est réservée aux administrateurs et doit rester cohérente avec les référentiels concernés.

### `series_compatibilities`
#### Lecture
Tous les utilisateurs authentifiés.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement si le modèle final autorise la modification ; sinon recréation contrôlée de la liaison.
#### Archivage
Administrateurs uniquement, selon le mécanisme retenu au SQL final.
#### Restrictions
Le joueur ne peut ni créer ni modifier une compatibilité. La symétrie et l'ordre canonique sont contrôlés côté base.

### `player_disciplines`
#### Lecture
Administrateurs : toutes les inscriptions. Joueur : ses seules inscriptions.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement.
#### Restrictions
Un joueur ne choisit ni ne modifie sa série, sa pratique (discipline et type d'installation) ou sa saison. Les inscriptions inactives restent visibles à leur propriétaire pour l'historique.

### `teams`
#### Lecture
Administrateurs : toutes les équipes. Joueur : toutes ses équipes, toutes les équipes `ACTIVE` du club, ainsi que les équipes `ARCHIVED` liées à un événement ou une compétition visible.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement.
#### Restrictions
Une équipe ne peut pas être créée ou modifiée par un joueur. La création, régularisation et archivage appliquent les contraintes de membres (pratique et saison correspondantes) et l'audit.

### `team_members`
#### Lecture
Administrateurs : toutes les appartenances. Joueur : ses propres appartenances et les membres des équipes qu'il peut consulter.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement, par clôture d'appartenance ou désactivation.
#### Restrictions
Le joueur ne peut ni se joindre ni se retirer lui-même d'une équipe. La lecture joueur est limitée aux données strictement nécessaires à l'affichage des équipes ; les coordonnées et données personnelles non nécessaires d'autres membres ne sont pas exposées. La cohérence d'un membre avec la pratique (discipline et type d'installation) et la saison de l'équipe est vérifiée via `player_disciplines`. L'historique des membres est conservé.

### `training_periods`
#### Lecture
Administrateurs : toutes les périodes. Joueur : périodes contenant au moins un événement publié auquel il est affecté, ou nécessaires à la gestion de ses disponibilités ouvertes.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement, par statut `COMPLETED` ou `CANCELLED`.
#### Restrictions
Les périodes en préparation ou de travail sans accès disponibilité ne sont pas exposées aux joueurs.

### `training_slots`
#### Lecture
Administrateurs : tous les créneaux. Joueur : créneaux actifs de périodes dont les disponibilités sont ouvertes, ainsi que ceux nécessaires à comprendre ses événements publiés.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement.
#### Restrictions
Un joueur n'accède pas aux créneaux de brouillons ou de périodes non ouvertes qui ne le concernent pas. L'éligibilité d'un joueur à un créneau doit tenir compte de la pratique (discipline et type d'installation déduit de `installations.installation_type_id`) et de la saison, et non de la seule discipline.

### `training_events`
#### Lecture
Administrateurs : tous les événements. Joueur : tous les événements du planning publié du club, avec priorité d'affichage pour ceux auxquels il est affecté ; un événement annulé précédemment publié reste accessible.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement, par statuts `CANCELLED` ou `COMPLETED`.
#### Restrictions
Les événements `DRAFT` ne sont jamais lisibles par les joueurs. La lecture du planning publié n'ouvre pas l'accès aux disponibilités, exceptions ou autres données personnelles d'autres joueurs. L'éligibilité d'un joueur à un événement doit tenir compte de la pratique (discipline et type d'installation) et de la saison, et non de la seule discipline.

### `planning_versions`
#### Lecture
Administrateurs : toutes les versions. Joueur : versions `PUBLISHED` uniquement.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement ; une version publiée est immuable hors fonction sécurisée d'archivage et nouvelle publication.
#### Archivage
Administrateurs uniquement, via la transaction de publication ou l'opération d'archivage prévue.
#### Restrictions
Les versions `DRAFT`, `VALIDATED` et `ARCHIVED` ne sont pas accessibles aux joueurs.

### `training_assignments`
#### Lecture
Administrateurs : toutes les affectations. Joueur : ses seules affectations appartenant à une version `PUBLISHED`.
#### Création
Administrateurs ou fonction sécurisée de planification uniquement.
#### Modification
Administrateurs ou fonction sécurisée uniquement ; jamais par un joueur.
#### Archivage
Non applicable directement ; les affectations sont conservées avec leur version.
#### Restrictions
Un joueur ne peut pas connaître les coéquipiers ou autres affectations via cette table sauf données explicitement nécessaires à son événement, à définir dans une vue dédiée. Les affectations des brouillons sont strictement invisibles.

### `player_availabilities`
#### Lecture
Administrateurs : toutes les disponibilités. Joueur : ses seules disponibilités.
#### Création
Administrateurs pour correction tracée ; joueur pour lui-même, sur un créneau accessible et pendant la fenêtre de réponse autorisée.
#### Modification
Administrateurs pour correction tracée ; joueur pour lui-même avant clôture des disponibilités.
#### Archivage
Non applicable ; une réponse est mise à jour ou conservée pour l'historique selon le schéma final.
#### Restrictions
Le joueur ne peut pas renseigner la disponibilité d'un tiers, répondre à un créneau inaccessible ou modifier librement sa récurrence après clôture.

### `availability_exceptions`
#### Lecture
Administrateurs : toutes les exceptions. Joueur : ses seules exceptions.
#### Création
Administrateurs ; joueur pour lui-même, uniquement sur un événement publié auquel il est affecté ou sur lequel une exception est explicitement autorisée.
#### Modification
Administrateurs pour correction tracée ; joueur pour sa propre exception tant qu'elle n'a pas été traitée ou verrouillée.
#### Archivage
Non applicable ; annulation ou correction administrative conservée dans l'historique selon le modèle final.
#### Restrictions
`player_id` et `created_by` d'une exception joueur doivent correspondre à son profil. Une exception ne permet jamais de contourner un conflit d'affectation.

### `competitions`
#### Lecture
Administrateurs : toutes les compétitions. Joueur : compétitions `PUBLISHED`, `COMPLETED` ou `CANCELLED` auxquelles son équipe est engagée ou auxquelles il est rattaché par un match.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement, par statuts `COMPLETED` ou `CANCELLED`.
#### Restrictions
Les compétitions `DRAFT` sont invisibles aux joueurs. Une compétition appartient à une pratique (discipline et type d'installation) et une saison ; en V1, `installation_type_id` est obligatoire.

### `competition_teams`
#### Lecture
Administrateurs : toutes les liaisons. Joueur : liaisons de ses équipes pour une compétition visible.
#### Création
Administrateurs uniquement.
#### Modification
Non applicable ; liaison créée ou retirée par une opération administrative contrôlée.
#### Archivage
Non applicable ; la conservation historique suit celle de la compétition.
#### Restrictions
La liaison doit vérifier saison, discipline et type d'installation (pratique). Un joueur ne peut engager ou retirer aucune équipe.

### `competition_matches`
#### Lecture
Administrateurs : tous les matchs. Joueur : matchs liés à une de ses équipes et à une compétition visible.
#### Création
Administrateurs uniquement.
#### Modification
Administrateurs uniquement.
#### Archivage
Administrateurs uniquement, notamment en cas d'annulation.
#### Restrictions
Les statuts autorisés sont `SCHEDULED`, `COMPLETED`, `POSTPONED` et `CANCELLED`. Les informations futures sur les adversaires, domicile/extérieur et reports suivent les décisions encore en TODO.

### `replacement_requests`
#### Lecture
Administrateurs : toutes les demandes. Joueur : ses seules demandes, y compris leur statut et leur décision.
#### Création
Administrateurs pour correction tracée ; joueur uniquement pour une de ses affectations publiées, lorsque `requested_by` correspond à son profil.
#### Modification
Administrateurs : toutes les demandes et décisions. Joueur : annulation de sa demande seulement tant qu'elle n'est pas approuvée ; aucune autre transition de statut.
#### Archivage
Administrateurs uniquement, par statut `CANCELLED` ou conservation d'une décision terminale.
#### Restrictions
Le joueur ne peut ni examiner la demande d'un tiers, ni l'approuver, ni choisir un remplaçant. Les demandes de brouillon sont interdites.

### `replacements`
#### Lecture
Administrateurs : tous les remplacements. Joueur : remplacement dont il est le joueur initial ou le remplaçant.
#### Création
Fonction transactionnelle sécurisée de validation uniquement ; pas de création directe client.
#### Modification
Fonction sécurisée ou administrateur dans le cadre d'une annulation tracée uniquement.
#### Archivage
Administrateurs ou fonction sécurisée, par `cancelled_at`.
#### Restrictions
Le joueur ne peut jamais se désigner comme remplaçant ou modifier une décision. Les contrôles de disponibilité, pratique (discipline et type d'installation) et conflit sont exécutés côté base.

### `notifications`
#### Lecture
Administrateurs : toutes les notifications. Joueur : ses seules notifications.
#### Création
Administrateurs et fonctions serveur sécurisées uniquement.
#### Modification
Administrateurs et fonctions serveur pour l'état d'envoi ; joueur uniquement pour renseigner `viewed_at` sur ses propres notifications.
#### Archivage
Administrateurs ou fonctions serveur, par statut `CANCELLED`.
#### Restrictions
Le joueur ne modifie ni destinataire, ni contenu, ni statut technique, ni date de planification. Une notification ne révèle pas de donnée non accessible au destinataire.

### `notification_logs`
#### Lecture
Administrateurs uniquement.
#### Création
Fonctions serveur sécurisées ou processus technique uniquement.
#### Modification
Fonctions serveur sécurisées uniquement, si nécessaire pour finaliser une tentative.
#### Archivage
Non applicable ; conservation selon la politique de rétention à définir.
#### Restrictions
Les joueurs n'y ont aucun accès. Les journaux ne contiennent ni secrets ni contenu sensible inutile.

### `audit_logs`
#### Lecture
Administrateurs uniquement.
#### Création
Fonctions sécurisées, déclencheurs ou processus serveur uniquement.
#### Modification
Interdite pour tous les utilisateurs applicatifs ; l'audit est immuable.
#### Archivage
Non applicable ; conservation soumise à la politique de rétention.
#### Restrictions
Les joueurs n'y ont aucun accès. L'audit ne contient ni mots de passe, ni jetons, ni secrets.

## Tables publiques en lecture

Les utilisateurs authentifiés peuvent lire les référentiels partagés nécessaires à la compréhension des écrans et à la saisie de leurs disponibilités : `club_settings`, `seasons`, `disciplines`, `series`, `installation_types`, `installations`, `discipline_installation_types` et `series_compatibilities`.

Ces données sont communes, ne contiennent pas de données personnelles de joueurs et doivent être visibles pour comprendre les disciplines, séries, installations et créneaux. Leur modification demeure exclusivement administrative. Les éléments archivés restent lisibles lorsque l'historique d'un événement, d'une équipe ou d'une inscription y fait référence.

## Tables strictement personnelles

Pour un joueur, l'accès est limité à ses propres lignes dans `profiles`, `player_disciplines`, `player_availabilities`, `availability_exceptions`, `replacement_requests` et `notifications`.

`teams`, `team_members`, `training_events` et les versions `PUBLISHED` constituent des données de club consultables selon leurs filtres dédiés. Les disponibilités, exceptions et demandes d'autres joueurs ne sont jamais exposées. Les `training_assignments` et `replacements` restent filtrés aux lignes concernant directement le joueur.

## Tables administratives

Les écritures sont réservées aux administrateurs sur tous les référentiels et données de gestion. Les tables sans lecture joueur directe sont : `notification_logs` et `audit_logs`.

Les tables suivantes sont administratives en écriture et ont une lecture joueur strictement filtrée : `profiles`, `player_disciplines`, `teams`, `team_members`, `training_periods`, `training_slots`, `training_events`, `planning_versions`, `training_assignments`, `competitions`, `competition_teams`, `competition_matches`, `replacement_requests`, `replacements` et `notifications`.

Les brouillons, validations intermédiaires, résultats de contrôles, décisions administratives et historiques globaux ne sont accessibles qu'aux administrateurs.

## Fonctions sécurisées recommandées

- Création d'un profil, invitation, association avec `auth.users`, changement d'e-mail et activation de compte.
- Vérification centralisée d'un administrateur actif à partir de `auth.uid()`.
- Désactivation d'un administrateur, changement de rôle et protection du dernier administrateur actif.
- Création, régularisation, changement de statut et archivage d'une équipe avec contrôle des membres et de leurs inscriptions.
- Création ou correction administrative d'inscriptions, disponibilités et exceptions avec audit.
- Génération d'événements et création ou modification d'affectations avec vérification de disponibilité, inscription, compatibilité, doublon et conflit horaire.
- Validation et publication atomique d'une version de planning, incluant l'archivage de l'ancienne publication, l'audit et la préparation des notifications.
- Validation ou annulation d'un remplacement, incluant les contrôles de l'affectation initiale, du remplaçant (pratique et saison), de la disponibilité et des conflits.
- Création ou modification d'une compétition avec ses équipes, en garantissant cohérence de saison, discipline, type d'installation et série.
- Création de notifications, réservation des envois, écriture de `notification_logs` et mise à jour des états techniques.
- Écriture immuable et centralisée des `audit_logs`.

## Points de vigilance

- **Fuite de données** : les jointures, vues et fonctions doivent réappliquer le filtre du joueur ; une politique restrictive sur une table source ne protège pas automatiquement une vue ou une fonction exécutée avec privilèges élevés.
- **Élévation de privilèges** : ne jamais se fier à un rôle fourni dans un JWT client, un paramètre de requête ou un champ modifiable par le joueur. Vérifier le profil actif et le rôle côté base.
- **Accès à un autre joueur** : toute création ou modification personnelle doit contrôler que le propriétaire de la ligne correspond à `auth.uid()`. Les identifiants reçus du client ne suffisent jamais.
- **Version publiée** : une politique d'écriture ne doit pas permettre de modifier une version `PUBLISHED`, ses affectations ou les événements visibles sans fonction sécurisée et auditée.
- **Actions concurrentes** : deux administrateurs peuvent publier, archiver une équipe, modifier un rôle ou valider un remplacement simultanément. Les opérations critiques doivent verrouiller les lignes concernées dans une transaction unique.
- **Fonctions avec privilèges élevés** : elles doivent fixer leur chemin de recherche, contrôler l'appelant, limiter leurs paramètres, et ne renvoyer que les données que l'appelant est autorisé à connaître.
- **Accès technique** : `service_role` ne contourne RLS que dans les environnements serveur contrôlés. Il ne doit jamais être distribué au frontend, aux journaux ou à une configuration publique.
- **Archivage** : filtrer l'écriture des champs `active`, `status`, `archived_at` et `cancelled_at` afin qu'un joueur ne puisse pas modifier indirectement une donnée historique.

## TODO

- Définir les politiques SQL exactes, les fonctions de contrôle de rôle et leur stratégie pour éviter toute récursion RLS.
- Définir si les joueurs doivent voir l'identité de leurs coéquipiers sur un événement publié et, si oui, concevoir une vue minimale dédiée.
- Définir précisément les champs de `profiles` modifiables par le joueur, notamment le processus de changement d'e-mail.
- Définir les règles finales de lecture des périodes et créneaux pendant et après la fenêtre de disponibilités.
- Définir le modèle de disponibilité de compétition au niveau joueur et les droits de lecture de la vue calculée `competition_team_availability_view`.
- Définir les adversaires, domicile/extérieur, reports, scores et leurs accès joueur.
- Définir les canaux de notification réellement activés, la rétention de `notification_logs` et le niveau de détail visible dans les notifications.
- Définir les tables et conditions autorisant une suppression physique dans le cadre légal, avec des opérations serveur dédiées.
- Définir les politiques futures liées aux fichiers d'import PDF, au stockage Supabase et aux données d'import.
- Valider les vues et fonctions exposées au client avant toute migration afin qu'elles ne contournent pas les restrictions de ce document.