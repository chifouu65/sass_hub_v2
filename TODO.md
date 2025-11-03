# 📋 TODO - Suivi de l'avancement du projet SaaS Hub

## ✅ À faire

### 🏗️ Architecture et Infrastructure
- [x] Initialiser le workspace Nx avec preset 'apps' pour structure monorepo
- [x] Ajouter les plugins @nx/angular et @nx/nest pour support Angular et NestJS
- [x] Créer la structure de dossiers de base (apps/, services/, libs/, docker/)
- [x] Configurer TailwindCSS pour Angular
- [x] Créer les applications de base : hub-frontend et hub-backend

### 🔐 Authentification et Hub Backend
- [x] Créer le hub-backend (NestJS)
- [x] Mettre en place le service d'authentification (JWT/OAuth2/SSO)
- [x] Configurer la base de données "hub" (MySQL)
- [ ] Implémenter la gestion des organisations (tenants)
- [ ] Implémenter la gestion des utilisateurs et rôles
- [ ] Créer l'API Gateway (NestJS)

### 🗄️ Base de données Multi-Tenant
- [x] Mettre en place le système de multi-tenant MySQL (structure de base)
- [ ] Créer le tenant-service pour gestion dynamique des bases
- [ ] Implémenter le pool de connexions par organisation
- [x] Configurer la base "hub" pour les métadonnées globales

### 🎨 Hub Frontend (Angular)
- [x] Créer le hub-frontend (Angular 20)
- [x] Configurer TailwindCSS
- [ ] Mettre en place l'authentification (SSO)
- [ ] Créer le dashboard principal
- [ ] Implémenter la gestion des organisations
- [ ] Implémenter la gestion des applications souscrites
- [ ] Créer l'interface de gestion des entités

### 📦 Applications Modulaires
- [ ] Créer hotel-manager-backend (NestJS)
- [ ] Créer hotel-manager-frontend (Angular)
- [ ] Créer booking-portal-backend (NestJS)
- [ ] Créer booking-portal-frontend (Angular)
- [ ] Créer hr-manager-backend (NestJS)
- [ ] Créer hr-manager-frontend (Angular)

### 🔧 Services Microservices
- [ ] Créer auth-service (Authentification / SSO / Tokens)
- [ ] Créer tenant-service (Gestion organisations / multi-tenant)
- [ ] Créer billing-service (Paiement / abonnements)
- [ ] Créer notification-service (Mails / alertes)

### 📚 Bibliothèques Partagées
- [x] Créer libs/shared-types (Types partagés entre services)
- [x] Créer libs/utils (Fonctions utilitaires)
- [x] Créer libs/sdk (SDK front ↔ backend)

### 🐳 Docker et Infrastructure
- [x] Créer docker-compose.yml
- [x] Configurer MySQL (multi-tenant)
- [x] Configurer Redis
- [x] Configurer RabbitMQ
- [x] Créer les Dockerfiles pour les services

### 🔄 Communication Inter-Services
- [ ] Configurer gRPC pour communication inter-services
- [ ] Configurer RabbitMQ pour messaging
- [ ] Mettre en place les clients REST

### 💰 Marketplace et Facturation
- [ ] Implémenter le système de marketplace d'applications
- [ ] Créer l'interface d'activation/désactivation d'apps
- [ ] Implémenter la gestion des abonnements
- [ ] Intégrer le système de paiement

### 📝 Documentation
- [ ] Documenter l'architecture
- [ ] Créer des guides d'installation
- [ ] Documenter les APIs
- [ ] Créer des guides de développement

---

## 🚧 En cours

- Aucune tâche en cours actuellement

---

## ✅ Terminé

- [x] Création du fichier TODO.md pour suivi de l'avancement
- [x] Initialisation du workspace Nx avec preset 'apps'
- [x] Installation des plugins @nx/angular et @nx/nest
- [x] Création de la structure de dossiers (apps/, services/, libs/, docker/)
- [x] Configuration TailwindCSS pour Angular (automatique lors de la création)
- [x] Création de hub-frontend (Angular 20 avec routing, standalone, TailwindCSS)
- [x] Création de hub-backend (NestJS avec proxy configuré vers frontend)
- [x] Installation et configuration de TypeORM avec MySQL
- [x] Création des entités TypeORM (Organization, User, UserOrganization, Application, Subscription)
- [x] Configuration ConfigModule et variables d'environnement
- [x] Création de docker-compose.yml avec MySQL (hub + tenant), Redis, RabbitMQ
- [x] Création des Dockerfiles pour hub-backend et hub-frontend
- [x] Configuration Nginx pour le frontend en production
- [x] Script SQL d'initialisation de la base de données hub
- [x] Création du fichier .env.example avec toutes les variables nécessaires
- [x] Création des bibliothèques partagées (shared-types, utils, sdk)
- [x] Création des scripts de démarrage local (start-local.sh, stop-local.sh, check-ports.sh)
- [x] Configuration de l'environnement de développement sans Nginx
- [x] Correction du proxy Angular pour éviter les erreurs WebSocket sur /api/health

---

## 📝 Notes

- **Technologies principales** : Angular 20 + TailwindCSS + Signals, NestJS, MySQL multi-tenant
- **Architecture** : Microservices avec API Gateway
- **Auth** : JWT / OAuth2 / SSO centralisé
- **Containerisation** : Docker + Docker Compose
- **Nx Version** : 22.0.2

