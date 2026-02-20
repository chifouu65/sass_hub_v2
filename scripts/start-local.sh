#!/bin/bash
# Script de démarrage principal
# Lance toute la stack via dev.sh

echo "🚀 Démarrage de SaaS Hub..."

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé. Copie de .env.example..."
    cp .env.example .env
fi

# 1. Vérifier infra (MySQL/Redis)
bash ./scripts/dev.sh infra

# 2. Lancer tous les services
bash ./scripts/dev.sh all

echo ""
echo "✅ Stack lancée !"
echo "   Gateway:  http://localhost:4000"
echo "   Frontend: http://localhost:4200"
echo ""
echo "Logs disponibles dans le dossier ./logs/"
