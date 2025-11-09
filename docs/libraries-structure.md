# Structure des bibliothèques partagées

Ce document décrit l’utilité de chaque bibliothèque partagée du workspace et comment les utiliser.  
Il sert de guide rapide pour les nouveaux contributeurs afin de réemployer les briques existantes sans réinventer la roue.

---

## `libs/shared-types`

- **Contenu**  
  Modèles de domaine, DTO, contrats REST (auth/tenant), types de pagination et énumérations partagés entre services backend et frontend.
- **Exports clés**  

  `OrganizationSummary`, `OrganizationRoleView`, `PermissionView`, `AuthLoginResponse`, `PaginatedResult`, `ISODateString`, etc.
- **Quand l’utiliser**  
  Dès que des données typées traversent les frontières entre services ou entre backend et frontend.

---

## `libs/utils`

- **Contenu**  
  Fonctions TypeScript utilitaires pures : `slugify`, `normalizeEmail`, helpers stateless.
- **Bonnes pratiques**  
  Garder ces helpers agnostiques du framework (pas d’import NestJS/Angular) pour les réutiliser partout.

---

## `libs/backend`

Bibliothèque de briques backend communes, destinées aux services NestJS.

- **Module tenant**  
  `TenantDbModule` et `TenantDatabaseService` gèrent les bases MySQL dynamiques et les pools par organisation.
- **Module auth** (`@sass-hub-v2/backend/auth`)  
  Fournit `BackendAuthModule`, guard et stratégie JWT, décorateur `CurrentUser` et interfaces partagées pour l’utilisateur authentifié.

Exemple d’usage :

```ts
import { TenantDbModule } from '@sass-hub-v2/backend';
import { BackendAuthModule } from '@sass-hub-v2/backend/auth';
```

---

## Bibliothèque à venir : `libs/ui`

- **Portée prévue**  
  Composants Angular partagés (tables, modales, éléments de layout) pour uniformiser Hub Frontend.
- **Statut**  
  Non créée pour l’instant — reste à faire dans le TODO.

---

### Contribuer aux bibliothèques

1. Ajouter de nouveaux exports dans la bibliothèque existante adaptée plutôt que créer un nouveau package.  
2. Mettre à jour ce document dès qu’une bibliothèque évolue ou qu’une nouvelle est ajoutée.  
3. Garder un périmètre clair : ne pas mélanger du code frontend-only avec des dépendances backend, et inversement.


