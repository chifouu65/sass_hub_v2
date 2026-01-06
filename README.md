# SaaS Hub V2

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

Plateforme SaaS multi-tenant moderne construite avec **NestJS**, **Angular** et **Nx** dans une architecture microservices.

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture](#-architecture)
- [Structure du projet](#-structure-du-projet)
- [Technologies utilisées](#-technologies-utilisées)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Démarrage](#-démarrage)
- [Scripts disponibles](#-scripts-disponibles)
- [Documentation](#-documentation)

## 🎯 Vue d'ensemble

**SaaS Hub V2** est une plateforme SaaS complète conçue pour gérer plusieurs organisations (tenants) avec une architecture microservices robuste. Le projet implémente :

- 🔐 **Authentification complète** : JWT, OAuth (Google, GitHub, Microsoft), refresh tokens
- 🏢 **Gestion multi-tenant** : Organisations, membres, rôles et permissions
- 🎨 **Interface moderne** : Frontend Angular avec Tailwind CSS
- 🔄 **Architecture découplée** : Microservices spécialisés avec façade BFF
- 🗄️ **Bases de données dynamiques** : MySQL par organisation avec pooling avancé
- 📦 **Monorepo Nx** : Gestion optimisée des dépendances et du code partagé

## 🏗 Architecture

Le projet suit une **architecture microservices** avec un pattern **BFF (Backend for Frontend)** :

```
┌─────────────────┐
│  Hub Frontend   │ (Angular - Port 4200)
│    (Client)     │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Hub Backend    │ (NestJS - Port 3000)
│     (Façade)    │ ◄── Orchestration, Sécurité, Agrégation
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌──────────────┐
│  Auth   │ │   Tenant     │
│ Service │ │   Service    │
│ :3001   │ │   :3002      │
└─────────┘ └──────────────┘
```

### Avantages de cette architecture

1. **Sécurité renforcée** : Les secrets et tokens sensibles restent côté serveur
2. **Orchestration centralisée** : Le hub-backend agrège les données de multiples services
3. **Contrat API stable** : Le frontend consomme une API unifiée sans connaître le découpage interne
4. **Évolutivité** : Chaque service peut évoluer et scaler indépendamment
5. **Observabilité** : Traçabilité centralisée des requêtes et des logs

👉 Pour plus de détails : [Architecture microservices](docs/microservices-architecture.md)

## 📁 Structure du projet

```
sass_hub_v2/
│
├── apps/                          # Applications
│   ├── hub-frontend/             # 🎨 Application Angular (Client SaaS)
│   ├── hub-backend/              # 🔄 Façade BFF (Orchestration)
│   ├── auth-service/             # 🔐 Microservice d'authentification
│   ├── tenant-service/           # 🏢 Microservice de gestion des tenants
│   └── *-e2e/                    # Tests end-to-end
│
├── libs/                          # Bibliothèques partagées
│   ├── shared-types/             # 📦 Types TypeScript partagés (DTO, modèles)
│   ├── backend/                  # 🔧 Modules backend communs (auth, tenant DB)
│   └── utils/                    # 🛠️ Utilitaires purs (slugify, normalizeEmail)
│
├── docker/                        # 🐳 Configuration Docker
│   ├── docker-compose.yml        # MySQL, Redis, RabbitMQ
│   ├── Dockerfile.*              # Images de build
│   └── nginx*.conf               # Configuration nginx pour le reverse proxy
│
├── scripts/                       # 📜 Scripts d'automatisation
│   ├── start-local.sh            # Démarrage de tous les services
│   ├── stop-local.sh             # Arrêt de tous les services
│   └── check-ports.sh            # Vérification des ports disponibles
│
└── docs/                          # 📚 Documentation
    ├── microservices-architecture.md
    └── libraries-structure.md
```

### Applications principales

| Application | Port | Description |
|------------|------|-------------|
| **hub-frontend** | 4200 | Interface Angular avec Tailwind CSS |
| **hub-backend** | 3000 | Façade BFF, orchestrateur des microservices |
| **auth-service** | 3001 | Gestion des comptes, tokens JWT, OAuth |
| **tenant-service** | 3002 | Gestion des organisations, membres, rôles |

### Bibliothèques partagées

- **`@sass-hub-v2/shared-types`** : Modèles de domaine, DTO, contrats REST partagés
- **`@sass-hub-v2/backend`** : Modules NestJS réutilisables (TenantDbModule, BackendAuthModule)
- **`@sass-hub-v2/utils`** : Fonctions utilitaires pures (framework-agnostic)

👉 Détails complets : [Structure des bibliothèques](docs/libraries-structure.md)

## 🛠 Technologies utilisées

### Frontend
- **Angular** 20.3 - Framework frontend
- **Tailwind CSS** - Framework CSS utility-first
- **Vite** - Build tool rapide

### Backend
- **NestJS** 11.0 - Framework Node.js progressif
- **TypeORM** - ORM pour TypeScript
- **Passport JWT** - Authentification
- **MySQL** - Base de données relationnelle
- **Redis** - Cache et sessions
- **RabbitMQ** - Message broker (prévu)

### DevOps & Tooling
- **Nx** 22.0 - Monorepo intelligent
- **Docker & Docker Compose** - Containerisation
- **Jest & Playwright** - Tests unitaires et E2E
- **ESLint & Prettier** - Linting et formatage

## ✅ Prérequis

- **Node.js** >= 18.x
- **npm** ou **yarn**
- **Docker** & **Docker Compose** (pour MySQL, Redis, RabbitMQ)
- **Git**

## 📦 Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd sass_hub_v2
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   
   Créer les fichiers `.env` nécessaires dans chaque application :
   - `apps/hub-backend/.env`
   - `apps/auth-service/.env`
   - `apps/tenant-service/.env`

   Voir [OAuth_SETUP.md](OAuth_SETUP.md) pour la configuration OAuth.

4. **Démarrer les services Docker**
   ```bash
   npm run docker:up
   ```

## 🚀 Démarrage

### Démarrage rapide (tous les services)

```bash
npm start
```

Cette commande démarre automatiquement :
- Hub Frontend (port 4200)
- Hub Backend (port 3000)
- Auth Service (port 3001)
- Tenant Service (port 3002)

### Démarrage manuel par service

```bash
# Frontend uniquement
npm run dev:frontend

# Backend uniquement
npm run dev:backend

# Auth service
npm run dev:auth-service

# Tenant service
npm run dev:tenant-service
```

### Accès aux applications

- **Frontend** : http://localhost:4200
- **Hub Backend API** : http://localhost:3000
- **Auth Service API** : http://localhost:3001
- **Tenant Service API** : http://localhost:3002

## 📜 Scripts disponibles

### Développement
```bash
npm start                    # Démarre tous les services
npm run dev:all             # Alternative avec Nx parallel
npm run stop                # Arrête tous les services (Linux/Mac)
npm run stop:windows        # Arrête tous les services (Windows)
npm run check-ports         # Vérifie la disponibilité des ports
```

### Docker
```bash
npm run docker:up           # Démarre MySQL, Redis, RabbitMQ
npm run docker:down         # Arrête les conteneurs Docker
npm run docker:logs         # Affiche les logs des conteneurs
```

### Tests
```bash
npx nx test <project>       # Tests unitaires d'un projet
npx nx e2e <project>-e2e    # Tests E2E d'un projet
npx nx run-many -t test     # Tests de tous les projets
```

### Build
```bash
npx nx build <project>               # Build d'un projet
npx nx run-many -t build --all       # Build de tous les projets
```

### Nx utilities
```bash
npx nx graph                # Visualise le graphe des dépendances
npx nx list                 # Liste les plugins installés
npx nx affected:test        # Teste uniquement les projets affectés
```

## 📚 Documentation

- [Architecture microservices](docs/microservices-architecture.md) - Détails de l'architecture et flux de données
- [Structure des bibliothèques](docs/libraries-structure.md) - Guide d'utilisation des libs partagées
- [Configuration OAuth](OAuth_SETUP.md) - Setup Google, GitHub, Microsoft OAuth
- [TODO](TODO.md) - Tâches en cours et roadmap

## 🔗 Ressources Nx

- [Documentation Nx](https://nx.dev)
- [Nx Console pour VS Code](https://nx.dev/getting-started/editor-setup)
- [Communauté Nx Discord](https://go.nx.dev/community)

## 📄 Licence

MIT
