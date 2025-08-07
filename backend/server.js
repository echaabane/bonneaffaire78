const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Chargement de la configuration
dotenv.config();

// Import des routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Démarrage du serveur Bonne Affaire 78...');

// === MIDDLEWARE DE SÉCURITÉ ===
app.use(helmet({
    contentSecurityPolicy: false, // Désactivé pour permettre les inline styles
    crossOriginEmbedderPolicy: false
}));

app.use(compression()); // Compression gzip

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: 'Trop de requêtes, veuillez réessayer plus tard'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api', limiter);

// === MIDDLEWARE CORS ===
app.use(cors({
    origin: [
        'http://localhost:3001',
        'http://localhost:3000', 
        'http://127.0.0.1:3001',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// === MIDDLEWARE DE BASE ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === CONNEXION BASE DE DONNÉES ===
const connectDB = async () => {
    try {
        const mongoOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bonneaffaire78', mongoOptions);
        
        console.log('✅ MongoDB connecté:', mongoose.connection.name);
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ Erreur MongoDB:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB déconnecté');
        });

    } catch (error) {
        console.error('❌ Impossible de se connecter à MongoDB:', error.message);
        if (isProduction) {
            process.exit(1);
        } else {
            console.warn('⚠️ Continuons en mode développement sans BD');
        }
    }
};

connectDB();

// === MIDDLEWARE LOGGING ===
if (!isProduction) {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}

// === ROUTES API ===
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// === ROUTES FRONTEND ===
// Route racine - servir le frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Route de santé de l'API
app.get('/api', (req, res) => {
    res.json({
        message: '🛋️ API Bonne Affaire 78 - Nouvelle Génération',
        version: '1.0.0',
        status: 'active',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Route de test
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ API opérationnelle',
        data: {
            server: 'Bonne Affaire 78',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }
    });
});

// === GESTION DES ERREURS ===
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err.stack);
    
    // Erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Erreur de validation',
            errors: errors
        });
    }
    
    // Erreurs de cast Mongoose
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Format d\'ID invalide'
        });
    }
    
    // Erreur générique
    res.status(500).json({
        success: false,
        message: isProduction ? 'Erreur serveur interne' : err.message,
        ...(isProduction ? {} : { stack: err.stack })
    });
});

// === ROUTE 404 ===
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(404).json({
            success: false,
            message: 'Route API non trouvée'
        });
    } else {
        // Pour toutes les autres routes, servir le frontend (SPA)
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

// === GESTION GRACEFUL SHUTDOWN ===
process.on('SIGINT', async () => {
    console.log('\n⏹️ Arrêt du serveur...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB déconnecté');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'arrêt:', error);
        process.exit(1);
    }
});

// === DÉMARRAGE SERVEUR ===
const server = app.listen(PORT, () => {
    console.log(`
🎉 SERVEUR BONNE AFFAIRE 78 DÉMARRÉ !
===========================================
🌐 Site web: http://localhost:${PORT}
📡 API: http://localhost:${PORT}/api
🔧 Test: http://localhost:${PORT}/api/test
📊 Mode: ${process.env.NODE_ENV || 'development'}
🗄️ MongoDB: ${mongoose.connection.readyState === 1 ? 'connecté' : 'en attente'}
===========================================
    `);
});

// Gestion des erreurs serveur
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PORT} est déjà utilisé`);
        process.exit(1);
    } else {
        console.error('❌ Erreur serveur:', error);
    }
});

module.exports = app;