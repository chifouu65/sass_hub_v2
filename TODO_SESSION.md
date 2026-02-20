# TODO Session - 20 Février 2026

## ✅ Objectifs de la session

On se concentre sur l'avancement du **Hub Frontend** et de l'**Architecture** globale.

### 1. 🎨 Hub Frontend - Gestion des Applications
- [x] Créer une branche `feat/hub-apps-management`
- [x] Implémenter l'interface de liste des applications disponibles (Marketplace view)
- [x] Ajouter l'interface de gestion des applications souscrites (Mes Apps)
- [x] Connecter au backend (mock ou réel via `hub-backend`)
- [x] Commit & PR : `feat(hub): add applications management interface`

### 2. 🏗️ Architecture - API Gateway
- [x] Créer une branche `feat/api-gateway`
- [x] Générer une nouvelle application NestJS `api-gateway`
- [x] Configurer le proxy vers les microservices (`auth-service`, `tenant-service`, `hub-backend`)
- [x] Tester le routage basique (build OK)
- [x] Commit & PR : `feat(arch): init api-gateway service`

### 3. 📦 Nouveaux Services - Billing Service (Skeleton)
- [ ] Créer une branche `feat/billing-service-init`
- [ ] Générer une application NestJS `billing-service`
- [ ] Configurer la base de données (entités de base : `Subscription`, `Invoice`)
- [ ] Commit & PR : `feat(billing): init billing-service`

### 4. 📚 Libs - Shared UI Kit
- [ ] Créer une branche `feat/shared-ui-kit`
- [ ] Générer une librairie Angular `ui-kit`
- [ ] Créer un composant bouton et un composant card réutilisables
- [ ] Intégrer dans `hub-frontend` pour tester
- [ ] Commit & PR : `feat(libs): init shared ui-kit`

---

## 📝 Notes

- Lancer le projet avec `npm start` ou `nx serve <app>` pour tester.
- Me pinger pour les tests ou blocages.
