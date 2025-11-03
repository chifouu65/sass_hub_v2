#!/bin/bash
# Script de vérification des ports
# Usage: ./scripts/check-ports.sh

echo "🔍 Vérification des ports 3000 et 4200..."

if command -v lsof > /dev/null 2>&1; then
    PORT3000=$(lsof -ti:3000 2>/dev/null)
    PORT4200=$(lsof -ti:4200 2>/dev/null)
    
    echo ""
    echo "📋 État des ports :"
    
    if [ -n "$PORT3000" ]; then
        echo "   Port 3000 : ❌ OCCUPÉ (PID: $PORT3000)"
        PROCESS=$(ps -p $PORT3000 -o comm= 2>/dev/null)
        if [ -n "$PROCESS" ]; then
            echo "     Processus : $PROCESS"
        fi
    else
        echo "   Port 3000 : ✅ LIBRE"
    fi
    
    if [ -n "$PORT4200" ]; then
        echo "   Port 4200 : ❌ OCCUPÉ (PID: $PORT4200)"
        PROCESS=$(ps -p $PORT4200 -o comm= 2>/dev/null)
        if [ -n "$PROCESS" ]; then
            echo "     Processus : $PROCESS"
        fi
    else
        echo "   Port 4200 : ✅ LIBRE"
    fi
    
    echo ""
    echo "💡 Pour libérer un port occupé, utilisez :"
    echo "   kill -9 <PID>"
else
    echo "⚠️  lsof n'est pas installé. Installation de netstat comme alternative..."
    if command -v netstat > /dev/null 2>&1; then
        echo ""
        echo "📋 Ports en écoute :"
        netstat -tuln | grep -E ':(3000|4200)' || echo "   Aucun processus sur les ports 3000 ou 4200"
    else
        echo "❌ Impossible de vérifier les ports (lsof et netstat non disponibles)"
    fi
fi

