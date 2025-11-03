#!/bin/bash
# Script d'arrêt de l'environnement local (Linux/Mac/Windows avec Git Bash)
# Usage: ./scripts/stop-local.sh

echo "🛑 Arrêt de l'environnement SaaS Hub..."

# Détecter le système d'exploitation
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]] || [[ -n "$WINDIR" ]]; then
    # Windows avec Git Bash
    echo "🔄 Arrêt des processus sur les ports 3000 et 4200 (Windows)..."
    
    # Arrêter les processus sur le port 3000
    PORT3000_PID=$(netstat -ano | grep -i "3000" | grep "LISTENING" | awk '{print $5}' | head -1)
    if [ -n "$PORT3000_PID" ]; then
        echo "   Arrêt du processus sur le port 3000 (PID: $PORT3000_PID)..."
        taskkill //F //PID $PORT3000_PID 2>/dev/null || kill -9 $PORT3000_PID 2>/dev/null || true
    fi
    
    # Arrêter les processus sur le port 4200
    PORT4200_PID=$(netstat -ano | grep -i "4200" | grep "LISTENING" | awk '{print $5}' | head -1)
    if [ -n "$PORT4200_PID" ]; then
        echo "   Arrêt du processus sur le port 4200 (PID: $PORT4200_PID)..."
        taskkill //F //PID $PORT4200_PID 2>/dev/null || kill -9 $PORT4200_PID 2>/dev/null || true
    fi
    
    # Arrêter les processus sur le port 4201 (frontend dev server)
    PORT4201_PID=$(netstat -ano | grep -i "4201" | grep "LISTENING" | awk '{print $5}' | head -1)
    if [ -n "$PORT4201_PID" ]; then
        echo "   Arrêt du processus sur le port 4201 (PID: $PORT4201_PID)..."
        taskkill //F //PID $PORT4201_PID 2>/dev/null || kill -9 $PORT4201_PID 2>/dev/null || true
    fi
    
    # Tuer tous les processus node.js liés à nx
    taskkill //F //IM node.exe //FI "WINDOWTITLE eq *nx*" 2>/dev/null || true
    taskkill //F //FI "WINDOWTITLE eq *hub-backend*" 2>/dev/null || true
    taskkill //F //FI "WINDOWTITLE eq *hub-frontend*" 2>/dev/null || true
    
    # Tuer via les PIDs sauvegardés
    if [ -f .backend.pid ]; then
        BACKEND_PID=$(cat .backend.pid)
        echo "   Arrêt du backend (PID: $BACKEND_PID)..."
        taskkill //F //PID $BACKEND_PID 2>/dev/null || kill -9 $BACKEND_PID 2>/dev/null || true
        rm .backend.pid
    fi

    if [ -f .frontend.pid ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        echo "   Arrêt du frontend (PID: $FRONTEND_PID)..."
        taskkill //F //PID $FRONTEND_PID 2>/dev/null || kill -9 $FRONTEND_PID 2>/dev/null || true
        rm .frontend.pid
    fi
    
    # Tuer tous les processus node.exe qui pourraient être liés
    for pid in $(tasklist //FI "IMAGENAME eq node.exe" //FO CSV | grep -v "INFO:" | cut -d',' -f2 | tr -d '"'); do
        # Vérifier si le processus est lié à nx
        tasklist //FI "PID eq $pid" //FO LIST | grep -q "nx" && taskkill //F //PID $pid 2>/dev/null || true
    done

else
    # Linux/Mac
    echo "🔄 Arrêt des processus sur les ports 3000 et 4200..."
    
    # Méthode 1: Utiliser lsof si disponible
    if command -v lsof > /dev/null 2>&1; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        lsof -ti:4200 | xargs kill -9 2>/dev/null || true
        lsof -ti:4201 | xargs kill -9 2>/dev/null || true
    # Méthode 2: Utiliser fuser si disponible (Linux)
    elif command -v fuser > /dev/null 2>&1; then
        fuser -k 3000/tcp 2>/dev/null || true
        fuser -k 4200/tcp 2>/dev/null || true
        fuser -k 4201/tcp 2>/dev/null || true
    # Méthode 3: Arrêter via les PIDs sauvegardés
    else
        if [ -f .backend.pid ]; then
            BACKEND_PID=$(cat .backend.pid)
            if ps -p $BACKEND_PID > /dev/null 2>&1; then
                echo "   Arrêt du backend (PID: $BACKEND_PID)..."
                kill -9 $BACKEND_PID 2>/dev/null || true
            fi
            rm .backend.pid
        fi

if [ -f .frontend.pid ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo "   Arrêt du frontend (PID: $FRONTEND_PID)..."
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
        rm .frontend.pid
    fi
    
    if [ -f .frontend-watch.pid ]; then
        FRONTEND_WATCH_PID=$(cat .frontend-watch.pid)
        if ps -p $FRONTEND_WATCH_PID > /dev/null 2>&1; then
            echo "   Arrêt du build watch frontend (PID: $FRONTEND_WATCH_PID)..."
            kill -9 $FRONTEND_WATCH_PID 2>/dev/null || true
        fi
        rm .frontend-watch.pid
    fi
        
        # Tuer tous les processus node liés à nx serve
        pkill -f "nx serve hub-backend" 2>/dev/null || true
        pkill -f "nx serve hub-frontend" 2>/dev/null || true
    fi
fi

# Arrêter les services Docker
echo "📦 Arrêt des services Docker..."
docker-compose -f docker/docker-compose.yml stop mysql-hub redis rabbitmq 2>/dev/null || true
docker-compose -f docker/docker-compose-dev.yml stop nginx-frontend 2>/dev/null || true

# Nettoyer les fichiers PID
echo "🧹 Nettoyage des fichiers PID..."
rm -f .backend.pid .frontend.pid 2>/dev/null || true

# Attendre un peu pour que les processus se terminent
sleep 2

# Vérifier que les ports sont libres
echo ""
echo "🔍 Vérification des ports..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]] || [[ -n "$WINDIR" ]]; then
    PORT3000_STILL=$(netstat -ano | grep -i "3000" | grep "LISTENING" | wc -l)
    PORT4200_STILL=$(netstat -ano | grep -i "4200" | grep "LISTENING" | wc -l)
else
    PORT3000_STILL=$(lsof -ti:3000 2>/dev/null | wc -l)
    PORT4200_STILL=$(lsof -ti:4200 2>/dev/null | wc -l)
fi

if [ "$PORT3000_STILL" -gt 0 ] || [ "$PORT4200_STILL" -gt 0 ]; then
    echo "⚠️  Certains ports sont encore occupés. Vous devrez peut-être les arrêter manuellement."
    echo "   Port 3000: $([ $PORT3000_STILL -gt 0 ] && echo '❌ OCCUPÉ' || echo '✅ LIBRE')"
    echo "   Port 4200: $([ $PORT4200_STILL -gt 0 ] && echo '❌ OCCUPÉ' || echo '✅ LIBRE')"
else
    echo "✅ Tous les ports sont libres"
fi

echo ""
echo "✅ Environnement arrêté !"
