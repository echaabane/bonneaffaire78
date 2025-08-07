// Configuration et état global
const CONFIG = {
    API_BASE: 'http://localhost:3001/api',
    STORAGE_KEY: 'bonneaffaire78_cart',
    FALLBACK_MODE: false
};

let state = {
    cart: [],
    products: [],
    cartCount: 0,
    isLoading: false
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛋️ Bonne Affaire 78 - Initialisation...');
    initializeApp();
});

async function initializeApp() {
    try {
        loadCartFromStorage();
        setupEventListeners();
        await loadProducts();
        showWelcomeMessage();
        console.log('✅ Application initialisée avec succès');
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        showError('Erreur lors de l\'initialisation');
    }
}

// === GESTION DES PRODUITS ===
async function loadProducts() {
    try {
        showLoading();
        console.log('📡 Chargement des produits depuis l\'API...');
        
        const response = await fetch(`${CONFIG.API_BASE}/products?featured=true`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            state.products = data.data;
            renderProducts(state.products);
            console.log(`✅ ${data.data.length} produits chargés depuis l'API`);
        } else {
            throw new Error('Aucun produit reçu de l\'API');
        }
        
    } catch (error) {
        console.warn('⚠️ API indisponible, chargement des données de démonstration:', error.message);
        CONFIG.FALLBACK_MODE = true;
        loadFallbackProducts();
    } finally {
        hideLoading();
    }
}

function loadFallbackProducts() {
    console.log('🔄 Chargement des produits de démonstration...');
    
    const fallbackProducts = [
        {
            _id: '1',
            name: 'Canapé-Lit 3 Places Convertible',
            description: 'Canapé-lit moderne en tissu, conversion facile, matelas confort inclus.',
            price: 649,
            oldPrice: 999,
            category: 'salon',
            discountPercentage: 35,
            stock: 8,
            featured: true
        },
        {
            _id: '2',
            name: 'Table + 6 Chaises Design Moderne',
            description: 'Ensemble complet table rectangulaire avec 6 chaises assorties.',
            price: 449,
            oldPrice: 640,
            category: 'cuisine',
            discountPercentage: 30,
            stock: 5,
            featured: true
        },
        {
            _id: '3',
            name: 'Set 3 Tables Gigognes Tendance',
            description: 'Trio de tables gigognes au design épuré, parfait gain de place.',
            price: 169,
            oldPrice: 309,
            category: 'gigogne',
            discountPercentage: 45,
            stock: 12,
            featured: true
        },
        {
            _id: '4',
            name: 'Lit Double 160x200 + Sommier',
            description: 'Lit double avec tête de lit et sommier à lattes inclus.',
            price: 359,
            oldPrice: 599,
            category: 'chambre',
            discountPercentage: 40,
            stock: 6,
            featured: true
        },
        {
            _id: '5',
            name: 'Canapé-Lit d\'Angle XXL',
            description: 'Grand canapé d\'angle convertible avec rangement intégré.',
            price: 799,
            oldPrice: 1065,
            category: 'salon',
            discountPercentage: 25,
            stock: 3,
            featured: true
        },
        {
            _id: '6',
            name: 'Table Ronde + 6 Chaises',
            description: 'Table ronde extensible en bois massif avec 6 chaises.',
            price: 389,
            oldPrice: 599,
            category: 'cuisine',
            discountPercentage: 35,
            stock: 4,
            featured: true
        },
        {
            _id: '7',
            name: 'Tables Gigognes Marbre & Or (Set de 2)',
            description: 'Duo de tables gigognes avec plateau effet marbre et pieds dorés.',
            price: 119,
            oldPrice: 199,
            category: 'gigogne',
            discountPercentage: 40,
            stock: 15,
            featured: true
        },
        {
            _id: '8',
            name: 'Lit Simple 90x200 Ado',
            description: 'Lit simple moderne pour chambre d\'ado. Structure robuste.',
            price: 179,
            oldPrice: 359,
            category: 'chambre',
            discountPercentage: 50,
            stock: 10,
            featured: true
        }
    ];
    
    state.products = fallbackProducts;
    renderProducts(state.products);
    console.log(`✅ ${fallbackProducts.length} produits de démonstration chargés`);
    
    // Afficher message mode démo
    setTimeout(() => {
        showNotification('📱 Mode démonstration - Connectez l\'API pour un fonctionnement complet', 'info');
    }, 2000);
}

function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (!productsToRender || productsToRender.length === 0) {
        grid.innerHTML = `
            <div class="loading-products">
                <div style="font-size: 3rem;">📦</div>
                <p>Aucun produit disponible pour le moment</p>
            </div>
        `;
        return;
    }

    productsToRender.forEach((product, index) => {
        const productCard = createProductCard(product, index);
        grid.appendChild(productCard);
    });
    
    // Observer pour animations
    observeElements();
}

function createProductCard(product, index) {
    const div = document.createElement('div');
    div.className = 'product-card animate-in';
    div.setAttribute('data-category', product.category);
    div.style.animationDelay = `${index * 0.1}s`;

    const categoryIcons = {
        salon: '🛋️',
        chambre: '🛏️',
        cuisine: '🍽️',
        gigogne: '📐'
    };

    const discount = product.discountPercentage || 
        (product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 25);

    div.innerHTML = `
        <div class="product-image">
            ${categoryIcons[product.category] || '🛋️'}
            <div class="discount-badge">-${discount}%</div>
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <div class="product-price">
                <span class="current-price">${product.price}€</span>
                ${product.oldPrice ? `<span class="old-price">${product.oldPrice}€</span>` : ''}
            </div>
            <button class="add-to-cart" onclick="addToCart('${product._id}', '${escapeHtml(product.name)}', ${product.price})">
                ✨ Ajouter au Panier
            </button>
        </div>
    `;

    return div;
}

// === GESTION DU PANIER ===
function addToCart(productId, productName, price) {
    try {
        const existingItem = state.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            state.cart.push({ 
                id: productId, 
                name: productName, 
                price: price, 
                quantity: 1 
            });
        }
        
        updateCartUI();
        saveCartToStorage();
        animateCartButton();
        
        const total = calculateCartTotal();
        showNotification(`🎉 ${productName} ajouté ! Total: ${total}€`, 'success');
        
        console.log('🛒 Produit ajouté au panier:', { productName, price, cartSize: state.cart.length });
        
    } catch (error) {
        console.error('❌ Erreur ajout panier:', error);
        showNotification('❌ Erreur lors de l\'ajout au panier', 'error');
    }
}

function removeFromCart(index) {
    if (index >= 0 && index < state.cart.length) {
        const removedItem = state.cart.splice(index, 1)[0];
        updateCartUI();
        saveCartToStorage();
        
        showNotification(`🗑️ ${removedItem.name} retiré du panier`, 'info');
        
        // Rafraîchir le modal si ouvert
        const modal = document.querySelector('.cart-modal');
        if (modal) {
            document.body.removeChild(modal);
            if (state.cart.length > 0) {
                showCartModal();
            }
        }
    }
}

function updateCartUI() {
    state.cartCount = state.cart.reduce((total, item) => total + item.quantity, 0);
    const countElement = document.getElementById('cart-count-floating');
    if (countElement) {
        countElement.textContent = state.cartCount;
    }
}

function calculateCartTotal() {
    return state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function animateCartButton() {
    const cartBtn = document.querySelector('.cart-floating');
    if (cartBtn) {
        cartBtn.style.transform = 'translateY(-5px) scale(1.2)';
        setTimeout(() => {
            cartBtn.style.transform = 'translateY(-5px) scale(1.1)';
        }, 200);
    }
}

// === MODAL PANIER ===
function toggleCart() {
    if (state.cart.length === 0) {
        showNotification('🛒 Votre panier est vide ! Découvrez nos offres 🔥', 'info');
        return;
    }
    
    showCartModal();
}

function showCartModal() {
    const modal = document.createElement('div');
    modal.className = 'cart-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    const cartContent = document.createElement('div');
    cartContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 20px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    `;

    const total = calculateCartTotal();
    let cartHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="color: #2D3436; margin: 0;">🛒 Votre Panier</h2>
            <button onclick="document.body.removeChild(this.closest('.cart-modal'))" 
                    style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">✕</button>
        </div>
    `;
    
    state.cart.forEach((item, index) => {
        cartHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
                <div style="flex: 1;">
                    <strong>${item.name}</strong><br>
                    <span style="color: #666;">Quantité: ${item.quantity}</span>
                </div>
                <div style="text-align: right; margin-left: 1rem;">
                    <span style="font-weight: bold; color: #FF6B6B;">${item.price * item.quantity}€</span><br>
                    <button onclick="removeFromCart(${index})" 
                            style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.2rem;" 
                            title="Supprimer">🗑️</button>
                </div>
            </div>
        `;
    });

    cartHTML += `
        <div style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 10px; text-align: center;">
            <strong style="font-size: 1.2rem; color: #2D3436;">Total: ${total}€</strong>
            <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">
                ${CONFIG.FALLBACK_MODE ? 'Mode démonstration' : 'Livraison gratuite dans le 78 !'}
            </p>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button onclick="document.body.removeChild(this.closest('.cart-modal'))" 
                    style="flex: 1; padding: 1rem; border: 1px solid #ddd; background: white; border-radius: 10px; cursor: pointer;">
                Continuer mes achats
            </button>
            <button onclick="proceedToCheckout()" 
                    style="flex: 1; padding: 1rem; background: linear-gradient(45deg, #FF6B6B, #FD79A8); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">
                Commander (${total}€)
            </button>
        </div>
    `;

    cartContent.innerHTML = cartHTML;
    modal.appendChild(cartContent);
    document.body.appendChild(modal);

    // Fermer en cliquant à côté
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// === COMMANDE ===
async function proceedToCheckout() {
    if (state.cart.length === 0) {
        showNotification('❌ Votre panier est vide', 'error');
        return;
    }

    const customerData = prompt(`🛒 FINALISER VOTRE COMMANDE

Veuillez entrer vos informations au format:
Prénom,Nom,Email,Téléphone,Adresse,Ville,Code Postal

Exemple: Jean,Dupont,jean@email.com,0123456789,123 rue de la Paix,Versailles,78000`);

    if (!customerData) return;

    const [firstName, lastName, email, phone, street, city, postalCode] = customerData.split(',').map(s => s.trim());

    if (!firstName || !lastName || !email || !phone || !street || !city || !postalCode) {
        showNotification('❌ Veuillez remplir tous les champs correctement', 'error');
        return;
    }

    // Validation email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification('❌ Format email invalide', 'error');
        return;
    }

    const orderData = {
        customer: {
            firstName,
            lastName,
            email,
            phone,
            address: { street, city, postalCode, country: 'France' }
        },
        items: state.cart.map(item => ({
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        payment: { method: 'card' }
    };

    try {
        showLoading();
        
        if (!CONFIG.FALLBACK_MODE) {
            // Mode API normal
            const response = await fetch(`${CONFIG.API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (result.success) {
                showSuccessOrder(result.data);
            } else {
                throw new Error(result.message || 'Erreur lors de la commande');
            }
        } else {
            // Mode démonstration
            const demoOrder = {
                orderNumber: `BA78-DEMO-${Date.now().toString().slice(-6)}`,
                total: calculateCartTotal(),
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            };
            
            // Simulation d'attente
            await new Promise(resolve => setTimeout(resolve, 1500));
            showSuccessOrder(demoOrder, true);
        }
        
    } catch (error) {
        console.error('❌ Erreur commande:', error);
        showNotification('❌ Erreur lors de la commande: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function showSuccessOrder(orderData, isDemo = false) {
    const message = `🎉 Commande ${isDemo ? 'simulée' : 'validée'} !

Numéro: ${orderData.orderNumber}
Total: ${orderData.total}€
Livraison estimée: ${new Date(orderData.estimatedDelivery).toLocaleDateString('fr-FR')}

${isDemo ? 
    '(Mode démonstration - Connectez l\'API pour un fonctionnement complet)' : 
    'Vous recevrez un email de confirmation sous peu !'
}`;

    alert(message);
    
    // Vider le panier
    state.cart = [];
    updateCartUI();
    saveCartToStorage();
    
    // Fermer le modal
    const modal = document.querySelector('.cart-modal');
    if (modal) document.body.removeChild(modal);
    
    showNotification('🎉 Merci pour votre commande !', 'success');
}

// === FILTRAGE ===
function filterProducts(category) {
    const filteredProducts = category === 'all' 
        ? state.products 
        : state.products.filter(p => p.category === category);
    
    renderProducts(filteredProducts);
    
    // Scroll vers les produits
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    const categoryNames = {
        salon: 'Canapés-Lits',
        chambre: 'Lits',
        cuisine: 'Tables + 6 Chaises',
        gigogne: 'Tables Gigognes'
    };
    
    showNotification(`🎯 Filtrage: ${categoryNames[category] || 'Tous les produits'}`, 'info');
}

// === STOCKAGE LOCAL ===
function saveCartToStorage() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.cart));
    } catch (error) {
        console.warn('⚠️ Impossible de sauvegarder le panier:', error);
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (savedCart) {
            state.cart = JSON.parse(savedCart);
            updateCartUI();
            console.log('📦 Panier restauré:', state.cart.length, 'articles');
        }
    } catch (error) {
        console.warn('⚠️ Impossible de charger le panier:', error);
        state.cart = [];
    }
}

// === NOTIFICATIONS ===
function showNotification(message, type = 'info') {
    const colors = {
        success: 'linear-gradient(45deg, #00b894, #4ECDC4)',
        error: 'linear-gradient(45deg, #e74c3c, #c0392b)',
        info: 'linear-gradient(45deg, #3498db, #2980b9)',
        warning: 'linear-gradient(45deg, #f39c12, #e67e22)'
    };

    const notification = document.createElement('div');
    notification.innerHTML = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 15px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: all 0.4s ease;
        max-width: 300px;
        font-size: 0.9rem;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, 4000);
}

// === CHARGEMENT ===
function showLoading() {
    if (state.isLoading) return;
    state.isLoading = true;
    
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 2rem;
        border-radius: 20px;
        z-index: 10000;
        text-align: center;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    `;
    loader.innerHTML = `
        <div style="font-size: 2rem; animation: spin 1s linear infinite; margin-bottom: 1rem;">🔄</div>
        <p style="margin: 0; color: #2D3436;">Chargement...</p>
    `;
    
    document.body.appendChild(loader);
}

function hideLoading() {
    state.isLoading = false;
    const loader = document.getElementById('global-loader');
    if (loader) {
        document.body.removeChild(loader);
    }
}

function showError(message) {
    showNotification(`❌ ${message}`, 'error');
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Effet parallax sur le hero
    window.addEventListener('scroll', throttle(() => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    }, 10));

    // Gestion du clavier
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.querySelector('.cart-modal');
            if (modal) {
                document.body.removeChild(modal);
            }
        }
    });
}

function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.animate-in').forEach(el => {
        observer.observe(el);
    });
}

// === UTILITAIRES ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// === MESSAGES D'ACCUEIL ===
function showWelcomeMessage() {
    setTimeout(() => {
        const mode = CONFIG.FALLBACK_MODE ? ' (Mode Démo)' : '';
        showNotification(`🔥 Bienvenue chez Bonne Affaire 78${mode} ! Découvrez nos meubles nouvelle génération 🛋️✨`, 'success');
    }, 1500);

    // Animation du titre
    setTimeout(() => {
        const title = document.querySelector('.hero-title');
        if (title) {
            title.style.background = 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #FFE66D, #A29BFE)';
            title.style.backgroundSize = '400% 400%';
            title.style.animation = 'gradientShift 4s ease infinite';
        }
    }, 2000);
}

// Exposition globale pour les onclick dans le HTML
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.filterProducts = filterProducts;
window.proceedToCheckout = proceedToCheckout;

// Debug mode
if (window.location.search.includes('debug')) {
    console.log('🔧 Mode debug activé');
    window.state = state;
    window.CONFIG = CONFIG;
}

console.log('🛋️ Bonne Affaire 78 - Application chargée !');