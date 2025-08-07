const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },
    customer: {
        firstName: { 
            type: String, 
            required: [true, 'Le prénom est requis'], 
            trim: true,
            maxlength: [50, 'Prénom trop long']
        },
        lastName: { 
            type: String, 
            required: [true, 'Le nom est requis'], 
            trim: true,
            maxlength: [50, 'Nom trop long']
        },
        email: { 
            type: String, 
            required: [true, 'L\'email est requis'], 
            lowercase: true,
            validate: {
                validator: function(v) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: 'Format email invalide'
            }
        },
        phone: { 
            type: String, 
            required: [true, 'Le téléphone est requis'],
            validate: {
                validator: function(v) {
                    return /^[\d\s\-\+\(\)]{10,}$/.test(v);
                },
                message: 'Numéro de téléphone invalide'
            }
        },
        address: {
            street: { 
                type: String, 
                required: [true, 'L\'adresse est requise'],
                maxlength: [200, 'Adresse trop longue']
            },
            city: { 
                type: String, 
                required: [true, 'La ville est requise'],
                maxlength: [100, 'Nom de ville trop long']
            },
            postalCode: { 
                type: String, 
                required: [true, 'Le code postal est requis'],
                validate: {
                    validator: function(v) {
                        return /^\d{5}$/.test(v);
                    },
                    message: 'Code postal invalide (5 chiffres requis)'
                }
            },
            country: { 
                type: String, 
                default: 'France',
                maxlength: [50, 'Nom de pays trop long']
            }
        }
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: { 
            type: String, 
            required: [true, 'Le nom du produit est requis'],
            maxlength: [200, 'Nom de produit trop long']
        },
        price: { 
            type: Number, 
            required: [true, 'Le prix est requis'],
            min: [0, 'Le prix doit être positif']
        },
        quantity: { 
            type: Number, 
            required: [true, 'La quantité est requise'],
            min: [1, 'La quantité doit être au moins 1'],
            max: [100, 'Quantité maximale dépassée']
        },
        subtotal: { 
            type: Number, 
            required: [true, 'Le sous-total est requis'],
            min: [0, 'Le sous-total doit être positif']
        }
    }],
    totals: {
        subtotal: { 
            type: Number, 
            required: [true, 'Le sous-total est requis'],
            min: [0, 'Le sous-total doit être positif']
        },
        shipping: { 
            type: Number, 
            default: 0,
            min: [0, 'Les frais de port doivent être positifs']
        },
        tax: { 
            type: Number, 
            default: 0,
            min: [0, 'Les taxes doivent être positives']
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, 'La remise doit être positive']
        },
        total: { 
            type: Number, 
            required: [true, 'Le total est requis'],
            min: [0, 'Le total doit être positif']
        }
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'],
            message: 'Statut de commande invalide'
        },
        default: 'pending',
        index: true
    },
    payment: {
        method: {
            type: String,
            enum: {
                values: ['card', 'paypal', 'bank_transfer', '3x_payment', 'cash'],
                message: 'Méthode de paiement invalide'
            },
            required: [true, 'La méthode de paiement est requise']
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'],
                message: 'Statut de paiement invalide'
            },
            default: 'pending'
        },
        transactionId: String,
        paidAt: Date,
        amount: Number
    },
    delivery: {
        method: {
            type: String,
            enum: {
                values: ['standard', 'express', 'pickup', 'appointment'],
                message: 'Méthode de livraison invalide'
            },
            default: 'standard'
        },
        estimatedDate: {
            type: Date,
            validate: {
                validator: function(v) {
                    return v > new Date();
                },
                message: 'La date de livraison doit être dans le futur'
            }
        },
        actualDate: Date,
        trackingNumber: String,
        carrier: String,
        address: {
            street: String,
            city: String,
            postalCode: String,
            instructions: String
        }
    },
    notes: {
        customer: {
            type: String,
            maxlength: [500, 'Note client trop longue']
        },
        internal: {
            type: String,
            maxlength: [1000, 'Note interne trop longue']
        }
    },
    timeline: [{
        status: String,
        date: { type: Date, default: Date.now },
        note: String,
        user: String
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// === INDEXES ===
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

// === VIRTUALS ===
orderSchema.virtual('isDelivered').get(function() {
    return this.status === 'delivered';
});

orderSchema.virtual('isPaid').get(function() {
    return this.payment.status === 'paid';
});

orderSchema.virtual('customerFullName').get(function() {
    return `${this.customer.firstName} ${this.customer.lastName}`;
});

orderSchema.virtual('itemCount').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// === MIDDLEWARE PRE-SAVE ===
orderSchema.pre('save', async function(next) {
    // Génération du numéro de commande
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Compter les commandes du jour
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        
        const count = await mongoose.model('Order').countDocuments({
            createdAt: { $gte: startOfDay, $lt: endOfDay }
        });
        
        this.orderNumber = `BA78-${year}${month}${day}-${(count + 1).toString().padStart(3, '0')}`;
    }
    
    // Validation des sous-totaux
    this.items.forEach(item => {
        if (Math.abs(item.subtotal - (item.price * item.quantity)) > 0.01) {
            item.subtotal = Math.round(item.price * item.quantity * 100) / 100;
        }
    });
    
    // Recalcul des totaux
    const calculatedSubtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    if (Math.abs(this.totals.subtotal - calculatedSubtotal) > 0.01) {
        this.totals.subtotal = Math.round(calculatedSubtotal * 100) / 100;
    }
    
    const calculatedTotal = this.totals.subtotal + this.totals.shipping + this.totals.tax - this.totals.discount;
    if (Math.abs(this.totals.total - calculatedTotal) > 0.01) {
        this.totals.total = Math.round(calculatedTotal * 100) / 100;
    }
    
    // Estimation de la date de livraison
    if (!this.delivery.estimatedDate) {
        const deliveryDays = this.delivery.method === 'express' ? 1 : 
                           this.delivery.method === 'standard' ? 3 : 0;
        if (deliveryDays > 0) {
            this.delivery.estimatedDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);
        }
    }
    
    // Ajouter à la timeline si le statut change
    if (this.isModified('status') && !this.isNew) {
        this.timeline.push({
            status: this.status,
            note: `Statut changé en ${this.status}`
        });
    }
    
    next();
});

// === MÉTHODES D'INSTANCE ===
orderSchema.methods.updateStatus = function(newStatus, note = '') {
    this.status = newStatus;
    this.timeline.push({
        status: newStatus,
        note: note || `Statut mis à jour: ${newStatus}`,
        date: new Date()
    });
    return this.save();
};

orderSchema.methods.markAsPaid = function(transactionId) {
    this.payment.status = 'paid';
    this.payment.paidAt = new Date();
    this.payment.transactionId = transactionId;
    this.payment.amount = this.totals.total;
    return this.save();
};

orderSchema.methods.addTrackingNumber = function(trackingNumber, carrier = '') {
    this.delivery.trackingNumber = trackingNumber;
    this.delivery.carrier = carrier;
    return this.updateStatus('shipped', `Expédié avec le numéro de suivi: ${trackingNumber}`);
};

orderSchema.methods.markAsDe