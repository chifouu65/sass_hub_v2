#!/bin/bash
# Script de démarrage en mode développement avec build watch + Nginx
# Usage: ./scripts/start-local-nginx.sh

set +e

echo "🚀 Démarrage de l'environnement SaaS Hub en mode dev avec Nginx..."
echo "   📦 Mode: Build Watch + Nginx"

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

# Étape 1: Démarrer les services Docker (sans Nginx d'abord)
echo ""
echo "📦 Démarrage des services Docker (MySQL, Redis, RabbitMQ)..."
docker-compose -f docker/docker-compose-dev.yml up -d mysql-hub redis rabbitmq

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
    echo "   Tentative $attempts/30..."
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

# Étape 2: Pas besoin de build initial, on utilise nx serve avec proxy Nginx
echo ""
echo "💡 Configuration: Nginx proxy vers Angular serve (port 4201) pour garder HMR"

# Étape 3: Démarrer le backend en mode watch
echo ""
echo "🔧 Démarrage du backend (hub-backend) en mode watch..."
mkdir -p logs
npx nx serve hub-backend > logs/hub-backend.log 2>&1 &
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

# Étape 4: Démarrer le serve Angular sur un port différent (4201)
echo ""
echo "🎨 Démarrage du frontend (hub-frontend) sur le port 4201..."
echo "   Nginx proxy les requêtes de 4200 → 4201 pour garder le HMR"
echo "   Le serveur écoute sur 0.0.0.0 pour être accessible depuis Docker"
npx nx serve hub-frontend --port=4201 --host=0.0.0.0 > logs/hub-frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > .frontend.pid
sleep 8

# Vérifier que le frontend démarre correctement
FRONTEND_READY=false
for i in {1..30}; do
    if netstat -tuln 2>/dev/null | grep -q ":4201 " || ss -tuln 2>/dev/null | grep -q ":4201 "; then
        FRONTEND_READY=true
        break
    fi
    sleep 1
done

if [ "$FRONTEND_READY" = true ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "✅ Frontend démarré sur http://localhost:4201 (PID: $FRONTEND_PID)"
    echo "   Accessible via Nginx sur http://localhost:4200"
    
    # Étape 4.5: Maintenant que le frontend est prêt, démarrer Nginx
    echo ""
    echo "🌐 Démarrage de Nginx (reverse proxy)..."
    sleep 2  # Attendre un peu que le frontend soit complètement prêt
    docker-compose -f docker/docker-compose-dev.yml up -d nginx-frontend
    sleep 3
    
    # Vérifier que Nginx démarre
    if docker ps | grep -q saas-hub-nginx-dev; then
        echo "✅ Nginx démarré et proxy configuré"
    else
        echo "⚠️  Nginx pourrait ne pas être démarré. Vérifiez avec: docker ps"
    fi
else
    echo "⚠️  Le frontend pourrait ne pas être prêt. Vérifiez logs/hub-frontend.log"
    tail -n 10 logs/hub-frontend.log
fi

# Étape 5: Afficher les informations
echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Environnement SaaS Hub démarré en mode dev avec Nginx !"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📋 Services disponibles :"
echo "   • Frontend (via Nginx):  http://localhost:4200"
echo "   • Backend API (via Nginx): http://localhost:4200/api"
echo "   • Backend API (direct):    http://localhost:3000/api"
echo "   • Health Check (via Nginx): http://localhost:4200/api/health"
echo "   • Health Check (direct):   http://localhost:3000/api/health"
echo "   • MySQL Hub:               localhost:3306"
echo "   • Redis:                   localhost:6379"
echo "   • RabbitMQ UI:             http://localhost:15672"
echo "   • RabbitMQ:                localhost:5672"
echo ""
echo "💡 Mode de fonctionnement :"
echo "   • Frontend : nx serve (port 4201) → Nginx proxy (port 4200) → HMR actif"
echo "   • Backend  : nx serve (port 3000) → Hot reload actif"
echo "   • Nginx    : Reverse proxy pour frontend et API"
echo ""
echo "📝 Logs disponibles dans :"
echo "   • logs/hub-backend.log"
echo "   • logs/hub-frontend.log"
echo ""
echo "💡 Pour arrêter tous les services :"
echo "   ./scripts/stop-local.sh"
echo ""
echo "🔍 Test de disponibilité des services..."
echo ""

# Test du backend
echo "   Test Backend API (via Nginx)..."
BACKEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200/api/health 2>/dev/null || echo "000")
if [ "$BACKEND_TEST" = "200" ]; then
    echo "   ✅ Backend accessible via Nginx (http://localhost:4200/api/health)"
elif [ "$BACKEND_TEST" = "000" ]; then
    echo "   ⚠️  Backend non accessible via Nginx (service peut être en cours de démarrage)"
else
    echo "   ⚠️  Backend répond mais avec le code HTTP: $BACKEND_TEST"
fi

# Test du frontend
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

# Test du frontend direct (port 4201)
echo "   Test Frontend (direct sur port 4201)..."
FRONTEND_DIRECT_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4201 2>/dev/null || echo "000")
if [ "$FRONTEND_DIRECT_TEST" = "200" ] || [ "$FRONTEND_DIRECT_TEST" = "304" ]; then
    echo "   ✅ Frontend accessible directement (http://localhost:4201)"
elif [ "$FRONTEND_DIRECT_TEST" = "000" ]; then
    echo "   ⚠️  Frontend non accessible directement"
else
    echo "   ⚠️  Frontend répond mais avec le code HTTP: $FRONTEND_DIRECT_TEST"
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
    echo "   • tail -f logs/hub-frontend.log"
fi
echo ""

