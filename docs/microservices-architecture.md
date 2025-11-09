## Architecture Microservices SaaS Hub

### Vision globale

La plateforme est organisée autour de trois blocs principaux :

- **Hub Frontend** (`apps/hub-frontend`)  
  Le client Angular qui expose l’interface. Il parle exclusivement avec le `hub-backend`.

- **Hub Backend** (`apps/hub-backend`)  
  Rôle de façade / BFF (Backend for Frontend). Il reçoit les requêtes du front, orchestre les appels vers les microservices spécialisés, applique les règles de sécurité et renvoie une réponse consolidée.

- **Microservices spécialisés**
  - **auth-service** : gère comptes, tokens, rafraîchissement, OAuth.
  - **tenant-service** : gère les organisations, membres, rôles et permissions.
  Chaque microservice est autonome (NestJS), possède sa propre configuration Nest + TypeORM, et écoute sur un port dédié (3001 / 3002 en dev).

### Pourquoi une façade hub-backend ?

1. **Sécurité**  
   - Secrets (refresh tokens, clés OAuth) restent côté serveur.  
   - Les microservices ne sont pas exposés publiquement ; seule la façade est accessible depuis Internet.  
   - Centralisation des protections (CORS, rate limiting, audit).

2. **Orchestration et agrégation**  
   - Une page front peut nécessiter des données `auth + tenant + billing`. Hub-backend fait le fan-out, gère la cohérence et renvoie une réponse unique.  
   - Possibilité d’implémenter du caching, des fallback ou des workflows multi-services.

3. **Contrat API stable**  
   - Le front consomme un langage métier (`/api/organizations`, `/api/dashboard`) sans connaître le découpage interne.  
   - On peut faire évoluer, renommer ou redéployer les microservices sans impacter directement le front.

4. **Gestion centralisée des permissions**  
   - Les décisions d’accès (rôles, scopes) sont évaluées dans la façade.  
   - On évite de dupliquer la logique de sécurité dans chaque client ou service.

5. **Observabilité et conformité**  
   - Traçabilité des requêtes, corrélation des logs, quotas et métriques centralisés au niveau du hub-backend.  
   - Simplifie la mise en place de règles de conformité (facturation, RGPD, etc.).

### Flux de requêtes (dev)

| Client | Route              | Proxy Angular       | Façade | Microservice cible | Port |
|--------|--------------------|---------------------|--------|--------------------|------|
| Front  | `/api/auth/*`      | -> `http://localhost:3001` | (direct) | `auth-service`      | 3001 |
| Front  | `/api/tenant/*`    | -> `http://localhost:3002` | (direct) | `tenant-service`    | 3002 |
| Front  | `/api/*` (reste)   | -> `http://localhost:3000` | hub-backend | (orchestration)  | 3000 |

> En production, les microservices seraient derrière le réseau interne ; le front n’atteint que la façade.

### Pattern recommandé en production

1. Le front envoie toutes les requêtes à `hub-backend`.
2. `hub-backend` décide quel microservice appeler (auth, tenant, billing, etc.) en interne.
3. Les microservices ne sont accessibles qu’au réseau interne / aux autres services.  
4. On peut ajouter des protocoles spécifiques (gRPC, messages Rabbit) sans impacter le front.

### Avantages du découpage actuel

- **auth-service** et **tenant-service** sont déjà isolés : facile à scaler, à déployer ou à tester indépendamment.  
- Les modules (DTO, services, entités) ont été recopiés depuis hub-backend, préparant la transition complète.  
- Proxy Angular redirige vers les ports dédiés en dev, ce qui simplifie le test local avant de brancher le hub-backend.

### Étapes suivantes

- Finaliser l’intégration dans `hub-backend` (clients HTTP pour auth/tenant).  
- Centraliser les vérifications d’accès au niveau de la façade.  
- Introduire des tests contractuels (front ↔ hub-backend) pour garantir la stabilité de l’API.

---

Ce document sert de référence rapide pour comprendre la structure actuelle et le rôle de la surcouche hub-backend. MàJ à effectuer si de nouveaux microservices ou patterns d’orchestration sont introduits.

