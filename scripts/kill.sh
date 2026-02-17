#!/bin/bash
# Script pour arrêter les services proprement
# Usage: ./scripts/kill.sh [service_name|all]

SERVICE=$1

function kill_service {
    S=$1
    PID_FILE=".${S}.pid"
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        echo "🛑 Arrêt de $S (PID: $PID)..."
        kill "$PID" 2>/dev/null
        rm "$PID_FILE"
        echo "✅ $S arrêté"
    else
        # Fallback: chercher par nom de process si pas de fichier PID
        PIDS=$(ps aux | grep "nx serve $S" | grep -v grep | awk '{print $2}')
        if [ ! -z "$PIDS" ]; then
            echo "🛑 Arrêt de $S via ps..."
            kill $PIDS 2>/dev/null
            echo "✅ $S arrêté"
        else
            echo "ℹ️  $S ne semble pas être en cours d'exécution"
        fi
    fi
}

if [ -z "$SERVICE" ] || [ "$SERVICE" == "all" ]; then
    echo "🛑 Arrêt de TOUS les services..."
    SERVICES=("hub-backend" "hub-frontend" "auth-service" "tenant-service" "deepnews-backend" "deepnews-frontend")
    for s in "${SERVICES[@]}"; do
        kill_service "$s"
    done
    # Nettoyage global
    echo "🧹 Nettoyage des process nx résiduels..."
    pkill -f "nx serve"
else
    kill_service "$SERVICE"
fi
