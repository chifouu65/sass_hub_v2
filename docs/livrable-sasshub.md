Group seul: LHOTE Noah

---

# Livrable projet – SaaS Hub V2

## 1) Contexte et objectifs
Le projet **SaaS Hub V2** répond au brief « Projet Master DEV » en proposant un prototype professionnel, multi-tenant, sécurisé et évolutif.  
Il couvre les exigences principales : application web moderne, backend structuré, base de données, documentation technique/fonctionnelle, et une expérience mobile via **responsive design**.

## 2) Périmètre fonctionnel
### Fonctionnalités principales
- Authentification complète (email/mot de passe, OAuth Google/GitHub/Microsoft).
- Gestion multi-tenant :
  - Organisations (création, modification, suppression).
  - Membres (ajout, retrait, mise à jour du rôle).
  - Rôles et permissions (création, édition, suppression).
- Gestion des applications (souscription/désinstallation).
- Notifications (succès/erreur/information).
- Tableau de bord d’accueil.

### Interface utilisateur
- UI Angular + Tailwind CSS.
- Design responsive (desktop/tablette/mobile).
- Actions rapides via boutons et icônes (MDI).
- Feedback utilisateur : loaders, erreurs, confirmations.

## 3) Architecture technique
### Monorepo Nx
- **apps/** : front et services.
- **libs/** : types partagés, modules backend, utilitaires.

### Backend (microservices)
- **hub-backend** : BFF (orchestration).
- **auth-service** : authentification/autorisation.
- **tenant-service** : gestion des organisations, membres, rôles.

### Frontend
- **hub-frontend** : Angular 20 + Vite + Tailwind.

## 4) Stack technologique
### Frontend
- Angular 20
- Tailwind CSS
- Vite
- MDI Icons

### Backend
- NestJS 11
- TypeORM
- MySQL (multi-tenant)
- Redis (cache/sessions)
- JWT + OAuth

### DevOps & tooling
- Nx 22
- Docker/Docker Compose
- Jest / Playwright
- ESLint / Prettier

## 5) Base de données
- Modèle relationnel (MySQL).
- Gestion des contraintes d’intégrité via ORM.
- Préparé pour montée en charge (pooling + séparation des tenants).

## 6) Sécurité
- JWT + OAuth.
- Séparation BFF / services.
- Validation et contrôle des droits.
- Protection des endpoints sensibles.

## 7) Livrables demandés
| Exigence | Statut | Détails |
|---|---|---|
| Application web | ✅ | Angular + Tailwind |
| Backend structuré | ✅ | Microservices NestJS |
| Base de données | ✅ | MySQL |
| Application mobile native | ⚠️ | Non fournie, **responsive web** à la place |
| Documentation fonctionnelle/technique | ✅ | README + docs + présent livrable |
| Démo | ✅ | Démarrage local (voir section 9) |

> Remarque : une application mobile native n’est pas incluse. Le front est **responsive**, ce qui couvre les usages mobiles dans ce prototype.

## 8) Points forts
- Architecture microservices claire, découplée.
- Multi-tenant réel (une DB par organisation).
- Authentification robuste (JWT + OAuth).
- UI moderne et responsive, avec composants réutilisables.
- Documentation structurée.

## 9) Démarrage & démo
### Prérequis
- Node.js >= 18
- Docker + Docker Compose

### Lancement rapide
```bash
npm install
npm run docker:up
npm start
```

### Accès
- Frontend : http://localhost:4200  
- Hub Backend : http://localhost:3000  
- Auth Service : http://localhost:3001  
- Tenant Service : http://localhost:3002

## 10) Limites & évolutions possibles
- Application mobile native (iOS/Android) à développer.
- Ajout d’un module facturation.
- Amélioration observabilité (logs centralisés, tracing).
- Tests E2E plus poussés pour parcours critiques.

## 11) Conclusion
SaaS Hub V2 apporte une réponse complète au brief « Projet Master DEV » avec un prototype réaliste, maintenable et évolutif.  
Le projet démontre la maîtrise du cycle complet (frontend, backend, base de données, sécurité, documentation) dans une architecture moderne.
