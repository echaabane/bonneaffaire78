const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Le nom du produit est requis'],
        trim: true,
        maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
        index: true
    },
    description: {
        type: String,
        required: [true, 'La description est requise'],
        maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    category: {
        type: String,
        required: [true, 'La catégorie est requise'],
        enum: {
            values: ['salon', 'chambre', 'cuisine', 'gigogne'],
            message: 'Catégorie invalide'
        },
        lowercase: true,
        index: true
    },
    price: {
        type: Number,
        required: [true, 'Le prix est requis'],
        min: [0, 'Le prix doit être positif'],
        validate: {
            validator: Number.isFinite,
            message: 'Le prix doit être un nombre valide'
        }
    },
    oldPrice: {
        type: Number,
        min: [0, 'L\'ancien prix doit être positif'],
        validate: {
            validator: function(value) {
                return !value || value > this.price;
            },
            message: 'L\'ancien prix doit être supérieur au prix actuel'
        }
    },
    images: [{
        url: {
            type: String,
            validate: {
                validator: function(v) {
                    return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
                },
                message: 'URL d\'image invalide'
            }
        },
        alt: String,
        isPrimary: { type: Boolean, default: false }
    }],
    specifications: {
        dimensions: {
            length: { type: Number, min: 0 },
            width: { type: Number, min: 0 },
            height: { type: Number, min: 0 },
            unit: { type: String, default: 'cm', enum: ['cm', 'm', 'mm'] }
        },
        material: {
            type: String,
            maxlength: [200, 'Matériau trop long']
        },
        colors: [{
            type: String,
            maxlength: [50, 'Nom de couleur trop long']
        }],
        weight: {
            type: Number,
            min: [0, 'Le poids doit être positif']
        }
    },
    stock: {
        type: Number,
        required: [true, 'Le stock est requis'],
        min: [0, 'Le stock ne peut pas être négatif'],
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    tags: [{
        type: String,
        lowercase: true,
        trim: true,
        maxlength: [50, 'Tag trop long']
    }],
    seo: {
        metaTitle: {
            type: String,
            maxlength: [60, 'Meta title trop long']
        },
        metaDescription: {
            type: String,
            maxlength: [160, 'Meta description trop longue']
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-z0-9-]+$/, 'Slug invalide']
        }
    },
    analytics: {
        views: { type: Number, default: 0 },
        addedToCart: { type: Number, default: 0 },
        purchased: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// === INDEXES ===
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1, featured: -1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// === VIRTUALS ===
productSchema.virtual('discountPercentage').get(function() {
    if (this.oldPrice && this.oldPrice > this.price) {
        return Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
    }
    return 0;
});

productSchema.virtual('isInStock').get(function() {
    return this.stock > 0;
});

productSchema.virtual('primaryImage').get(function() {
    return this.images.find(img => img.isPrimary) || this.images[0];
});

// === MIDDLEWARE PRE-SAVE ===
productSchema.pre('save', function(next) {
    // Génération automatique du slug
    if (this.isModified('name') && !this.seo.slug) {
        this.seo.slug = this.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
            .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
            .replace(/\s+/g, '-') // Remplacer espaces par tirets
            .replace(/-+/g, '-') // Réduire tirets multiples
            .replace(/^-|-$/g, ''); // Supprimer tirets début/fin
    }
    
    // Validation cohérence prix
    if (this.oldPrice && this.oldPrice <= this.price) {
        this.oldPrice = undefined;
    }
    
    // Limiter le nombre d'images
    if (this.images && this.images.length > 10) {
        this.images = this.images.slice(0, 10);
    }
    
    next();
});

// === MÉTHODES D'INSTANCE ===
productSchema.methods.incrementViews = function() {
    this.analytics.views += 1;
    return this.save();
};

productSchema.methods.addToCartCount = function() {
    this.analytics.addedToCart += 1;
    return this.save();
};

productSchema.methods.incrementPurchased = function(quantity = 1) {
    this.analytics.purchased += quantity;
    return this.save();
};

productSchema.methods.updateStock = function(quantity) {
    this.stock = Math.max(0, this.stock + quantity);
    return this.save();
};

// === MÉTHODES STATIQUES ===
productSchema.statics.findByCategory = function(category) {
    return this.find({ category, isActive: true }).sort('-featured -createdAt');
};

productSchema.statics.findFeatured = function() {
    return this.find({ featured: true, isActive: true }).sort('-createdAt');
};

productSchema.statics.searchProducts = function(searchTerm) {
    return this.find(
        { 
            $text: { $search: searchTerm },
            isActive: true 
        },
        { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Product', productSchema);