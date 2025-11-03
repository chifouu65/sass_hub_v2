# 📋 Modes de démarrage disponibles

## 🚀 Mode 1 : Classique (sans Nginx)
**Commande :** `npm run start`

**Fonctionnement :**
- ✅ Angular `nx serve` sur `http://localhost:4200` (HMR actif)
- ✅ Backend `nx serve` sur `http://localhost:3000` (hot reload actif)
- ✅ Docker : MySQL, Redis, RabbitMQ
- ❌ Pas de Nginx

**Avantages :**
- Simple et rapide
- HMR complet fonctionnel
- Moins de complexité

**URLs :**
- Frontend : http://localhost:4200
- Backend API : http://localhost:3000/api
- Health Check : http://localhost:3000/api/health

---

## 🌐 Mode 2 : Avec Nginx (proxy, HMR actif)
**Commande :** `npm run start:nginx`

**Fonctionnement :**
- ✅ Angular `nx serve` sur port **4201** (HMR actif)
- ✅ Nginx proxy **4200 → 4201** (reverse proxy)
- ✅ Backend `nx serve` sur `http://localhost:3000`
- ✅ Nginx proxy `/api` → backend (port 3000)
- ✅ Docker : MySQL, Redis, RabbitMQ, **Nginx**

**Avantages :**
- Environnement proche de la production
- Reverse proxy centralisé
- HMR toujours actif
- WebSocket supporté

**URLs :**
- Frontend (via Nginx) : http://localhost:4200
- Backend API (via Nginx) : http://localhost:4200/api
- Backend API (direct) : http://localhost:3000/api
- Health Check (via Nginx) : http://localhost:4200/api/health
- Health Check (direct) : http://localhost:3000/api/health

---

## 🏗️ Mode 3 : Production-like (Nginx + build watch, SANS HMR)
**Commande :** `npm run start:nginx:build`

**Fonctionnement :**
- ✅ Angular `nx build --watch` compile dans `dist/`
- ✅ Nginx sert les fichiers compilés depuis `dist/apps/hub-frontend/browser`
- ✅ Backend `nx serve` sur `http://localhost:3000`
- ✅ Nginx proxy `/api` → backend (port 3000)
- ✅ Docker : MySQL, Redis, RabbitMQ, **Nginx**
- ❌ **PAS de HMR** (rechargement manuel nécessaire)

**Avantages :**
- Très proche de la production
- Test des fichiers compilés
- Recompilation automatique (sans HMR)

**Inconvénients :**
- Pas de HMR (rechargement manuel de la page)

**URLs :**
- Frontend (via Nginx) : http://localhost:4200
- Backend API (via Nginx) : http://localhost:4200/api
- Backend API (direct) : http://localhost:3000/api
- Health Check (via Nginx) : http://localhost:4200/api/health
- Health Check (direct) : http://localhost:3000/api/health

---

## 📊 Comparaison

| Fonctionnalité | `npm run start` | `npm run start:nginx` | `npm run start:nginx:build` |
|----------------|-----------------|----------------------|----------------------------|
| **HMR** | ✅ Oui | ✅ Oui | ❌ Non |
| **Nginx** | ❌ Non | ✅ Oui (proxy) | ✅ Oui (serve files) |
| **WebSocket** | ✅ Oui | ✅ Oui | ❌ Non |
| **Environnement** | Dev simple | Dev proche prod | Production-like |
| **Frontend Port** | 4200 | 4200 (via Nginx) | 4200 (via Nginx) |
| **Backend Port** | 3000 | 3000 | 3000 |
| **Recompilation** | Automatique | Automatique | Automatique |
| **Rechargement** | Automatique | Automatique | Manuel |

---

## 💡 Recommandations

- **Développement quotidien** : `npm run start` (simple, rapide, HMR)
- **Test de production** : `npm run start:nginx` (HMR + proxy Nginx)
- **Validation avant déploiement** : `npm run start:nginx:build` (fichiers compilés)

---

## 🛑 Arrêter tous les modes

Tous les modes utilisent le même script d'arrêt :
```bash
npm run stop
```

