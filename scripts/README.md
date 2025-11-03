# Scripts de démarrage pour SaaS Hub

## 📋 Scripts disponibles

### Démarrer l'environnement local
```bash
npm run start
```

Ou directement :
```bash
./scripts/start-local.sh
```

### Arrêter l'environnement local
```bash
npm run stop
```

Ou directement :
```bash
./scripts/stop-local.sh
```

### Vérifier les ports
```bash
npm run check-ports
```

Ou directement :
```bash
./scripts/check-ports.sh
```

## 🚀 Ce que font les scripts

### `start-local.sh`

1. **Vérifications** :
   - Vérifie que Docker est en cours d'exécution
   - Vérifie et crée le fichier `.env` si nécessaire

2. **Démarrage Docker** :
   - MySQL Hub (port 3306)
   - Redis (port 6379)
   - RabbitMQ (ports 5672, 15672)

3. **Attente de la disponibilité** :
   - Attend que MySQL soit prêt (max 60 secondes)
   - Vérifie Redis

4. **Nettoyage du cache** :
   - Supprime le cache Angular et Nx qui peut causer des problèmes

5. **Démarrage des applications** :
   - Backend NestJS en mode watch sur `http://localhost:3000/api`
   - Frontend Angular en mode watch sur `http://localhost:4200`
   - Les logs sont redirigés vers `logs/hub-backend.log` et `logs/hub-frontend.log`

### `stop-local.sh`

1. Arrête tous les processus Node.js liés aux serveurs (via fichiers PID)
2. Arrête les processus sur les ports 3000 et 4200
3. Arrête les services Docker
4. Nettoie les fichiers PID

### `check-ports.sh`

Vérifie l'état des ports 3000 et 4200 et affiche les processus qui les utilisent.

## 📝 Notes

- Les scripts Bash lancent les serveurs en arrière-plan avec des logs dans `logs/`
- Les fichiers PID sont créés (`.backend.pid`, `.frontend.pid`) pour faciliter l'arrêt
- Les logs sont disponibles en temps réel dans `logs/hub-backend.log` et `logs/hub-frontend.log`
- Pour voir les logs en temps réel : `tail -f logs/hub-backend.log` ou `tail -f logs/hub-frontend.log`

## 🔧 Commandes npm supplémentaires

```bash
# Démarrer seulement Docker
npm run docker:up

# Arrêter seulement Docker
npm run docker:down

# Voir les logs Docker
npm run docker:logs

# Démarrer seulement le backend (en avant-plan)
npm run dev:backend

# Démarrer seulement le frontend (en avant-plan)
npm run dev:frontend
```

## 🐛 Dépannage

Si les services ne démarrent pas :

1. Vérifiez les logs :
   ```bash
   tail -f logs/hub-backend.log
   tail -f logs/hub-frontend.log
   ```

2. Vérifiez les ports :
   ```bash
   npm run check-ports
   ```

3. Arrêtez tout et relancez :
   ```bash
   npm run stop
   npm run start
   ```

4. Nettoyez le cache manuellement :
   ```bash
   rm -rf .angular/cache .nx/cache
   ```
