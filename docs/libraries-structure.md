# Structure des bibliothèques partagées

Ce document décrit l’utilité de chaque bibliothèque partagée du workspace et comment les utiliser.  
Il sert de guide rapide pour les nouveaux contributeurs afin de réemployer les briques existantes sans réinventer la roue.

---

## `libs/shared-types`

- **Contenu**  
  Modèles de domaine, DTO, énumérations et types utilitaires communs aux services backend et au frontend Angular.
- **Exports clés**  

  `OrganizationSummary`, `OrganizationRoleView`, `PermissionView`, DTO membres, `ISODateString`, etc.
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

## `libs/contracts`

- **Contenu**  
  Définitions des contrats REST (payloads requêtes/réponses), helpers de pagination, alias des DTO tenant/auth.
- **Objectif**  
  Servir de référence contractuelle pour les SDKs et intégrateurs externes.
- **Exemples**  
  `AuthLoginRequest`, `TenantListOrganizationsResponse`, `normalizePageRequest`.

---

## `libs/sdk`

- **Contenu**  
  SDK front ↔ backend avec client HTTP (`FetchHttpClient`), client Auth, client Tenant et fabrique `createSaasHubSdk`.
- **Cas d’usage**  
  Applications frontend, scripts d’intégration ou outils ayant besoin d’un client typé pour appeler les APIs Hub/Tenant.
- **Exemple**

```ts
import { createSaasHubSdk } from '@sass-hub-v2/sdk';

const sdk = createSaasHubSdk({ baseUrl: 'https://hub.local', fetch });
const session = await sdk.auth.login({ email, password });
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


