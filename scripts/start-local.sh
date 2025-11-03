#!/bin/bash
# Script de démarrage en mode local avec watch mode (Linux/Mac)
# Usage: ./scripts/start-local.sh

set +e

echo "🚀 Démarrage de l'environnement SaaS Hub en mode local..."

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
echo "📦 Démarrage des services Docker..."
docker-compose -f docker/docker-compose.yml up -d mysql-hub redis rabbitmq

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

# Étape 2: Démarrer le backend en mode watch
echo ""
echo "🔧 Démarrage du backend (hub-backend) en mode watch..."
# Créer le dossier logs si nécessaire
mkdir -p logs
npx nx serve hub-backend --port=3000 > logs/hub-backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid
sleep 8

# Attendre que le backend soit prêt (vérifier qu'il écoute sur le port)
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

# Étape 3: Démarrer le frontend en mode watch
echo ""
echo "🎨 Démarrage du frontend (hub-frontend) en mode watch..."
npx nx serve hub-frontend --port=4200 > logs/hub-frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > .frontend.pid
sleep 8

# Vérifier que le frontend démarre correctement
FRONTEND_READY=false
for i in {1..30}; do
    if netstat -tuln 2>/dev/null | grep -q ":4200 " || ss -tuln 2>/dev/null | grep -q ":4200 "; then
        FRONTEND_READY=true
        break
    fi
    sleep 1
done

if [ "$FRONTEND_READY" = true ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "✅ Frontend démarré sur http://localhost:4200 (PID: $FRONTEND_PID)"
else
    echo "⚠️  Le frontend pourrait ne pas être prêt. Vérifiez logs/hub-frontend.log"
    tail -n 10 logs/hub-frontend.log
fi

# Étape 4: Afficher les informations
echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Environnement SaaS Hub démarré avec succès !"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📋 Services disponibles :"
echo "   • Frontend:                 http://localhost:4200"
echo "   • Backend API:              http://localhost:3000/api"
echo "   • Health Check:             http://localhost:3000/api/health"
echo "   • MySQL Hub:                localhost:3306"
echo "   • Redis:                    localhost:6379"
echo "   • RabbitMQ UI:              http://localhost:15672"
echo "   • RabbitMQ:                 localhost:5672"
echo ""
echo "💡 Pour arrêter tous les services, exécutez :"
echo "   ./scripts/stop-local.sh"
echo ""
echo "📝 Logs disponibles dans :"
echo "   • logs/hub-backend.log"
echo "   • logs/hub-frontend.log"
echo ""
echo "💡 Si les services ne démarrent pas, vérifiez:"
echo "   1. Les logs dans logs/hub-backend.log et logs/hub-frontend.log"
echo "   2. Que les ports 3000 et 4200 sont libres: ./scripts/check-ports.sh"
echo "   3. Exécutez './scripts/stop-local.sh' puis relancez"
echo ""
echo "🔍 Test de disponibilité des services..."
echo ""

# Test du backend
echo "   Test Backend API..."
BACKEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
if [ "$BACKEND_TEST" = "200" ]; then
    echo "   ✅ Backend accessible (http://localhost:3000/api/health)"
elif [ "$BACKEND_TEST" = "000" ]; then
    echo "   ⚠️  Backend non accessible (service peut être en cours de démarrage)"
else
    echo "   ⚠️  Backend répond mais avec le code HTTP: $BACKEND_TEST"
fi

# Test du frontend
echo "   Test Frontend..."
FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null || echo "000")
if [ "$FRONTEND_TEST" = "200" ] || [ "$FRONTEND_TEST" = "304" ]; then
    echo "   ✅ Frontend accessible (http://localhost:4200)"
elif [ "$FRONTEND_TEST" = "000" ]; then
    echo "   ⚠️  Frontend non accessible (service peut être en cours de démarrage)"
else
    echo "   ⚠️  Frontend répond mais avec le code HTTP: $FRONTEND_TEST"
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

