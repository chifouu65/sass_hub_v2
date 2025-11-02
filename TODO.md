# 📋 TODO - Suivi de l'avancement du projet SaaS Hub

## ✅ À faire

### 🏗️ Architecture et Infrastructure
- [x] Initialiser le workspace Nx avec preset 'apps' pour structure monorepo
- [ ] Ajouter les plugins @nx/angular et @nx/nest pour support Angular et NestJS
- [ ] Créer la structure de dossiers de base (apps/, services/, libs/, docker/)
- [ ] Configurer TailwindCSS pour Angular
- [ ] Créer les applications de base : hub-frontend et hub-backend

### 🔐 Authentification et Hub Backend
- [ ] Créer le hub-backend (NestJS)
- [ ] Mettre en place le service d'authentification (JWT/OAuth2/SSO)
- [ ] Configurer la base de données "hub" (MySQL)
- [ ] Implémenter la gestion des organisations (tenants)
- [ ] Implémenter la gestion des utilisateurs et rôles
- [ ] Créer l'API Gateway (NestJS)

### 🗄️ Base de données Multi-Tenant
- [ ] Mettre en place le système de multi-tenant MySQL
- [ ] Créer le tenant-service pour gestion dynamique des bases
- [ ] Implémenter le pool de connexions par organisation
- [ ] Configurer la base "hub" pour les métadonnées globales

### 🎨 Hub Frontend (Angular)
- [ ] Créer le hub-frontend (Angular 20)
- [ ] Configurer TailwindCSS
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
- [ ] Créer libs/shared-types (Types partagés entre services)
- [ ] Créer libs/utils (Fonctions utilitaires)
- [ ] Créer libs/sdk (SDK front ↔ backend)

### 🐳 Docker et Infrastructure
- [ ] Créer docker-compose.yml
- [ ] Configurer MySQL (multi-tenant)
- [ ] Configurer Redis
- [ ] Configurer RabbitMQ
- [ ] Créer les Dockerfiles pour les services

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

- Installation des plugins Nx (Angular et NestJS)

---

## ✅ Terminé

- [x] Création du fichier TODO.md pour suivi de l'avancement
- [x] Initialisation du workspace Nx avec preset 'apps'

---

## 📝 Notes

- **Technologies principales** : Angular 20 + TailwindCSS + Signals, NestJS, MySQL multi-tenant
- **Architecture** : Microservices avec API Gateway
- **Auth** : JWT / OAuth2 / SSO centralisé
- **Containerisation** : Docker + Docker Compose
- **Nx Version** : 22.0.2

