#!/bin/bash
# Script de démarrage en mode production-like avec build watch + Nginx
# Usage: ./scripts/start-local-nginx-build.sh
# NOTE: Ce mode n'a PAS de HMR, seulement recompilation automatique

set +e

echo "🚀 Démarrage de l'environnement SaaS Hub en mode production-like..."
echo "   ⚠️  Mode: Build Watch + Nginx (SANS HMR)"
echo "   💡 Pour HMR, utilisez: npm run start:nginx"

# Vérifier si Docker est en cours d'exécution
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
fi

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé. Copie de .env.example..."
    cp .env.example .env
fi

# Étape 1: Démarrer les services Docker
echo ""
echo "📦 Démarrage des services Docker (MySQL, Redis, RabbitMQ, Nginx)..."
docker-compose -f docker/docker-compose-dev.yml up -d mysql-hub redis rabbitmq nginx-frontend

# Attendre que les services soient prêts
echo "⏳ Attente de la disponibilité des services..."
sleep 10

# Vérifier que MySQL est prêt
echo "   Vérification de MySQL..."
attempts=0
while [ $attempts -lt 30 ]; do
    if docker exec saas-hub-mysql-hub mysqladmin ping -h localhost -u root -prootpassword > /dev/null 2>&1; then
        echo "✅ MySQL est prêt"
        break
    fi
    attempts=$((attempts + 1))
    sleep 2
done

if [ $attempts -eq 30 ]; then
    echo "❌ MySQL n'est pas prêt après 60 secondes"
    exit 1
fi

# Vérifier Redis
if docker exec saas-hub-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis est prêt"
fi

echo "✅ Services Docker démarrés"

# Nettoyer le cache Angular qui peut causer des problèmes
echo ""
echo "🧹 Nettoyage du cache..."
rm -rf .angular/cache 2>/dev/null || true
rm -rf .nx/cache 2>/dev/null || true
echo "✅ Cache nettoyé"

# Étape 2: Build initial du frontend
echo ""
echo "🏗️  Build initial du frontend..."
mkdir -p dist/apps/hub-frontend/browser
npx nx build hub-frontend --configuration=development
if [ $? -eq 0 ]; then
    echo "✅ Build initial du frontend terminé"
else
    echo "❌ Erreur lors du build initial du frontend"
    exit 1
fi

# Étape 3: Démarrer le backend en mode watch
echo ""
echo "🔧 Démarrage du backend (hub-backend) en mode watch..."
mkdir -p logs
npx nx serve hub-backend --port=3000 > logs/hub-backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid
sleep 8

# Vérifier que le backend démarre correctement
BACKEND_READY=false
for i in {1..30}; do
    if netstat -tuln 2>/dev/null | grep -q ":3000 " || ss -tuln 2>/dev/null | grep -q ":3000 "; then
        BACKEND_READY=true
        break
    fi
    sleep 1
done

if [ "$BACKEND_READY" = true ] && ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "✅ Backend démarré sur http://localhost:3000/api (PID: $BACKEND_PID)"
else
    echo "⚠️  Le backend pourrait ne pas être prêt. Vérifiez logs/hub-backend.log"
    tail -n 10 logs/hub-backend.log
fi

# Étape 4: Démarrer le build watch du frontend
echo ""
echo "🎨 Démarrage du build watch du frontend (hub-frontend)..."
echo "   Le frontend sera servi via Nginx sur http://localhost:4200"
npx nx build hub-frontend --watch --configuration=development > logs/hub-frontend-watch.log 2>&1 &
FRONTEND_WATCH_PID=$!
echo $FRONTEND_WATCH_PID > .frontend-watch.pid
sleep 5

if ps -p $FRONTEND_WATCH_PID > /dev/null 2>&1; then
    echo "✅ Build watch du frontend démarré (PID: $FRONTEND_WATCH_PID)"
    echo "   ⚠️  Les fichiers sont compilés dans dist/apps/hub-frontend/browser"
    echo "   ⚠️  Nginx sert automatiquement les fichiers à chaque nouveau build"
    echo "   ⚠️  PAS de HMR - rechargement manuel de la page nécessaire"
else
    echo "❌ Erreur lors du démarrage du build watch. Vérifiez logs/hub-frontend-watch.log"
    tail -n 10 logs/hub-frontend-watch.log
fi

# Étape 5: Afficher les informations
echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Environnement SaaS Hub démarré en mode production-like !"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📋 Services disponibles :"
echo "   • Frontend (via Nginx):   http://localhost:4200"
echo "   • Backend API (via Nginx): http://localhost:4200/api"
echo "   • Backend API (direct):    http://localhost:3000/api"
echo "   • Health Check (via Nginx): http://localhost:4200/api/health"
echo "   • Health Check (direct):   http://localhost:3000/api/health"
echo ""
echo "⚠️  Mode Production-like:"
echo "   • Build watch : Recompilation automatique"
echo "   • Nginx       : Sert les fichiers compilés"
echo "   • PAS de HMR  : Rechargement manuel de la page nécessaire"
echo ""
echo "💡 Pour HMR (Hot Module Replacement), utilisez :"
echo "   npm run start:nginx (proxy vers nx serve)"
echo ""
echo "🔍 Test de disponibilité des services..."
echo ""

# Test du backend via Nginx
echo "   Test Backend API (via Nginx)..."
BACKEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200/api/health 2>/dev/null || echo "000")
if [ "$BACKEND_TEST" = "200" ]; then
    echo "   ✅ Backend accessible via Nginx (http://localhost:4200/api/health)"
elif [ "$BACKEND_TEST" = "000" ]; then
    echo "   ⚠️  Backend non accessible via Nginx (service peut être en cours de démarrage)"
else
    echo "   ⚠️  Backend répond mais avec le code HTTP: $BACKEND_TEST"
fi

# Test du frontend via Nginx
echo "   Test Frontend (via Nginx)..."
FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null || echo "000")
if [ "$FRONTEND_TEST" = "200" ] || [ "$FRONTEND_TEST" = "304" ]; then
    echo "   ✅ Frontend accessible via Nginx (http://localhost:4200)"
elif [ "$FRONTEND_TEST" = "000" ]; then
    echo "   ⚠️  Frontend non accessible via Nginx (service peut être en cours de démarrage)"
else
    echo "   ⚠️  Frontend répond mais avec le code HTTP: $FRONTEND_TEST"
fi

# Test direct du backend
echo "   Test Backend API (direct)..."
BACKEND_DIRECT_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
if [ "$BACKEND_DIRECT_TEST" = "200" ]; then
    echo "   ✅ Backend accessible directement (http://localhost:3000/api/health)"
elif [ "$BACKEND_DIRECT_TEST" = "000" ]; then
    echo "   ⚠️  Backend non accessible directement"
else
    echo "   ⚠️  Backend répond mais avec le code HTTP: $BACKEND_DIRECT_TEST"
fi

echo ""
if [ "$BACKEND_TEST" = "200" ] && [ "$FRONTEND_TEST" = "200" ]; then
    echo "✅ Tous les services sont disponibles !"
elif [ "$BACKEND_TEST" = "200" ] || [ "$FRONTEND_TEST" = "200" ]; then
    echo "⚠️  Certains services sont en cours de démarrage..."
else
    echo "⏳ Les services démarrent, attendez quelques secondes..."
    echo "   Vérifiez les logs si les problèmes persistent :"
    echo "   • tail -f logs/hub-backend.log"
    echo "   • tail -f logs/hub-frontend-watch.log"
fi
echo ""

