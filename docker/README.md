# Docker Configuration pour SaaS Hub

Ce dossier contient la configuration Docker pour l'environnement de développement et de production.

## 🚀 Démarrage rapide

### Prérequis
- Docker et Docker Compose installés
- Ports disponibles : 3000, 3306, 3307, 4200, 6379, 5672, 15672

### Démarrage de l'environnement complet

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v
```

## 📦 Services inclus

### MySQL Hub (Port 3306)
- Base de données principale pour les métadonnées du hub
- Base : `hub_db`
- Utilisateur : `hub_user` / Mot de passe : `hub_password`
- Root : `root` / Mot de passe : `rootpassword`

### MySQL Tenant (Port 3307)
- Base de données pour les tenants (multi-tenant)
- Utilisée pour créer des bases par organisation

### Redis (Port 6379)
- Cache et gestion des sessions
- Persistence activée (AOF)

### RabbitMQ (Ports 5672, 15672)
- Messaging et communication inter-services
- Interface web de gestion : http://localhost:15672
- Utilisateur : `admin` / Mot de passe : `admin`

### Hub Backend (Port 3000)
- API NestJS
- Connecté à MySQL Hub, Redis et RabbitMQ

### Hub Frontend (Port 4200)
- Application Angular
- Nginx en production

## 🔧 Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env` et ajustez les valeurs :

```bash
cp .env.example .env
```

### Scripts SQL d'initialisation

Les scripts SQL dans `mysql/init/` sont exécutés automatiquement au premier démarrage du conteneur MySQL.

## 🐳 Build des images Docker

### Backend
```bash
docker build -f docker/Dockerfile.hub-backend -t saas-hub-backend .
```

### Frontend
```bash
docker build -f docker/Dockerfile.hub-frontend -t saas-hub-frontend .
```

## 📝 Notes

- Les volumes Docker persistent les données même après `docker-compose down`
- Utilisez `docker-compose down -v` pour tout supprimer (⚠️ données perdues)
- En développement, les fichiers source sont montés comme volumes pour le hot-reload

