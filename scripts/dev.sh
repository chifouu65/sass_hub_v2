#!/bin/bash
# Script de démarrage granulaire
# Usage: ./scripts/dev.sh [service_name]

SERVICE=$1

# Liste des services valides
VALID_SERVICES=("hub-backend" "hub-frontend" "auth-service" "tenant-service" "deepnews-backend" "deepnews-frontend")

function show_help {
    echo "Usage: ./scripts/dev.sh [service_name]"
    echo ""
    echo "Services disponibles :"
    for s in "${VALID_SERVICES[@]}"; do
        echo "  - $s"
    done
    echo "  - all (lance les 4 services de base : backend, frontend, auth, tenant)"
    echo "  - infra (vérifie MySQL, Redis, RabbitMQ)"
}

if [ -z "$SERVICE" ]; then
    show_help
    exit 1
fi

# Dossier logs
mkdir -p logs

case $SERVICE in
    "infra")
        echo "🔍 Vérification de l'infrastructure..."
        mysqladmin -u root ping > /dev/null 2>&1 && echo "✅ MySQL prêt" || echo "❌ MySQL absent"
        redis-cli ping > /dev/null 2>&1 && echo "✅ Redis prêt" || echo "❌ Redis absent"
        ;;
    "all")
        echo "🚀 Lancement de la stack de base (Hub + Auth + Tenant)..."
        ./scripts/dev.sh auth-service
        ./scripts/dev.sh tenant-service
        ./scripts/dev.sh hub-backend
        ./scripts/dev.sh hub-frontend
        ;;
    *)
        # Vérifier si le service est valide
        found=false
        for s in "${VALID_SERVICES[@]}"; do
            if [ "$s" == "$SERVICE" ]; then
                found=true
                break
            fi
        done

        if [ "$found" = true ]; then
            echo "🔧 Lancement de $SERVICE..."
            # Tuer l'ancien processus s'il existe
            PID_FILE=".${SERVICE}.pid"
            if [ -f "$PID_FILE" ]; then
                OLD_PID=$(cat "$PID_FILE")
                kill "$OLD_PID" 2>/dev/null && echo "♻️  Ancien process ($SERVICE) arrêté"
            fi
            
            # Lancer le service
            npx nx serve "$SERVICE" > "logs/${SERVICE}.log" 2>&1 &
            NEW_PID=$!
            echo $NEW_PID > "$PID_FILE"
            echo "✅ $SERVICE lancé (PID: $NEW_PID, Logs: logs/${SERVICE}.log)"
        else
            echo "❌ Service inconnu : $SERVICE"
            show_help
            exit 1
        fi
        ;;
esac
