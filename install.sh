#!/bin/bash

echo "🛋️  INSTALLATION BONNE AFFAIRE 78 - PACKAGE CLÉ EN MAIN"
echo "=================================================="

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 16+ depuis nodejs.org"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker non détecté. Installation de MongoDB via Docker recommandée."
    echo "   Vous pouvez continuer avec MongoDB local ou installer Docker."
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Création de la structure si pas déjà fait
echo "📁 Vérification de la structure..."
mkdir -p frontend/assets/css frontend/assets/js
mkdir -p backend/{models,routes,utils,middleware,scripts,uploads}

# Installation des dépendances backend
echo "📦 Installation des dépendances backend..."
cd backend
npm install --no-fund --no-audit

# Démarrage MongoDB avec Docker (optionnel)
if command -v docker &> /dev/null; then
    echo "🐳 Démarrage de MongoDB avec Docker..."
    docker run -d --name bonneaffaire78-mongodb -p 27017:27017 mongo:latest 2>/dev/null || echo "   MongoDB déjà en cours d'exécution"
    sleep 3
fi

# Initialisation de la base de données
echo "🗄️  Initialisation de la base de données..."
npm run seed

# Démarrage du serveur
echo "🚀 Démarrage du serveur..."
echo ""
echo "✅ Installation terminée !"
echo "🌐 Site accessible sur: http://localhost:3001"
echo "📡 API accessible sur: http://localhost:3001/api"
echo ""
echo "Pour arrêter le serveur: Ctrl+C"
echo "Pour redémarrer: npm run dev"
echo ""

npm run dev