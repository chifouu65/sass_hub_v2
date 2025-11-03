# 🧪 Tests - Environnement SaaS Hub avec Nginx

## 📋 Checklist de tests

### 🔴 Phase 1 : Arrêt complet de l'environnement
- [ ] Arrêter tous les services : `npm run stop:windows`
- [ ] Vérifier que les ports 3000, 4200, 4201 sont libres
- [ ] Vérifier que les conteneurs Docker sont arrêtés

### 🟢 Phase 2 : Démarrage des services
- [ ] Démarrer avec Nginx : `npm run start:nginx`
- [ ] Vérifier que les logs de démarrage s'affichent correctement
- [ ] Vérifier que le script se termine sans erreur

### 🐳 Phase 3 : Services Docker
- [ ] Vérifier que MySQL démarre : `docker ps | findstr mysql`
- [ ] Vérifier que Redis démarre : `docker ps | findstr redis`
- [ ] Vérifier que RabbitMQ démarre : `docker ps | findstr rabbitmq`
- [ ] Vérifier que Nginx démarre : `docker ps | findstr nginx`
- [ ] Vérifier la santé des conteneurs : `docker ps` (STATUS = Up)

### 🌐 Phase 4 : Services applicatifs (ports d'écoute)
- [ ] Backend écoute sur le port 3000 : `netstat -ano | findstr ":3000" | findstr "LISTENING"`
- [ ] Frontend écoute sur le port 4201 : `netstat -ano | findstr ":4201" | findstr "LISTENING"`
- [ ] Frontend écoute sur **0.0.0.0:4201** (pas seulement localhost)
- [ ] Nginx écoute sur le port 4200 : `netstat -ano | findstr ":4200" | findstr "LISTENING"`

### 🔌 Phase 5 : Tests de connexion directe (sans Nginx)
- [ ] Backend direct : `curl http://localhost:3000/api/health` → doit retourner `{"status":"ok",...}`
- [ ] Frontend direct : `curl http://localhost:4201` → doit retourner du HTML
- [ ] Frontend accessible depuis Docker : `docker exec saas-hub-nginx-dev wget -O- http://host.docker.internal:4201` → doit fonctionner

### 🚀 Phase 6 : Tests via Nginx (reverse proxy)
- [ ] Frontend via Nginx : `curl http://localhost:4200` → doit retourner du HTML (pas 502)
- [ ] Backend via Nginx : `curl http://localhost:4200/api` → doit retourner une réponse
- [ ] Health check via Nginx : `curl http://localhost:4200/api/health` → doit retourner `{"status":"ok",...}`
- [ ] Vérifier les logs Nginx : `docker logs saas-hub-nginx-dev` → pas d'erreur 502

### 🌐 Phase 7 : Tests dans le navigateur
- [ ] Ouvrir http://localhost:4200 dans le navigateur
- [ ] Vérifier que la page Angular se charge
- [ ] Vérifier la console du navigateur (F12) → pas d'erreur de connexion
- [ ] Tester le HMR (Hot Module Replacement) : modifier un fichier → doit se recharger automatiquement
- [ ] Vérifier que les WebSockets fonctionnent (pour HMR)

### 📊 Phase 8 : Vérifications finales
- [ ] Vérifier les fichiers PID : `.backend.pid` et `.frontend.pid` existent
- [ ] Vérifier les logs backend : `Get-Content logs/hub-backend.log -Tail 10`
- [ ] Vérifier les logs frontend : `Get-Content logs/hub-frontend.log -Tail 10`
- [ ] Vérifier qu'il n'y a pas d'erreurs dans les logs

---

## ✅ Commandes de test rapides

### Test complet en une fois
```powershell
# 1. Arrêt
npm run stop:windows

# 2. Démarrage
npm run start:nginx

# 3. Vérifier les ports (après 20 secondes)
Start-Sleep -Seconds 20
netstat -ano | findstr ":3000 :4200 :4201" | findstr "LISTENING"

# 4. Tests HTTP
curl http://localhost:3000/api/health
curl http://localhost:4201
curl http://localhost:4200
curl http://localhost:4200/api/health

# 5. Test depuis Docker
docker exec saas-hub-nginx-dev wget -O- http://host.docker.internal:4201
```

### Vérification des services Docker
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Vérification des logs
```powershell
# Logs Docker
docker logs saas-hub-nginx-dev --tail 20
docker logs saas-hub-mysql-hub --tail 10

# Logs applicatifs
Get-Content logs/hub-backend.log -Tail 10
Get-Content logs/hub-frontend.log -Tail 10
```

---

## 🎯 Résultats attendus

### ✅ Succès
- Tous les ports sont en écoute
- Les tests HTTP retournent du contenu (pas d'erreur 502, 500, etc.)
- Le frontend est accessible via Nginx (port 4200)
- Le backend est accessible via Nginx (port 4200/api)
- Les services Docker sont en état "Up"

### ❌ Échecs possibles
- **Port déjà utilisé** : un autre processus utilise le port
- **502 Bad Gateway** : Nginx ne peut pas joindre le backend/frontend
- **Connection refused** : le service n'écoute pas ou sur la mauvaise interface
- **Docker containers stopped** : problème de démarrage Docker

---

## 🔍 Debug en cas de problème

### Port 4201 non accessible depuis Docker
```powershell
# Vérifier que le frontend écoute sur 0.0.0.0 (toutes interfaces)
netstat -ano | findstr ":4201"

# Si seulement [::1] ou 127.0.0.1, le problème est que --host=0.0.0.0 n'a pas été appliqué
```

### 502 Bad Gateway
```powershell
# Vérifier les logs Nginx
docker logs saas-hub-nginx-dev

# Tester la connexion depuis le conteneur
docker exec saas-hub-nginx-dev ping host.docker.internal
docker exec saas-hub-nginx-dev wget -O- http://host.docker.internal:4201
```

### Service ne démarre pas
```powershell
# Vérifier les logs du service
Get-Content logs/hub-backend.log -Tail 20
Get-Content logs/hub-frontend.log -Tail 20

# Vérifier les processus
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

