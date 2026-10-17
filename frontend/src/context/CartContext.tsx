import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { FlyToCartOverlay, FlyingFlight } from '../components/FlyToCartOverlay';

export interface CartItem {
    id: string; // Unique ID for this specific selection (productId_weight)
    productId: string;
    weight: number;
    quantity: number;
}

interface CartContextType {
    cart: { [key: string]: CartItem };
    addToCart: (productId: string, weight?: number) => void;
    addToCartWithAnimation: (
        productId: string, 
        weight?: number, 
        startElOrRect?: HTMLElement | DOMRect | null, 
        imageUrl?: string, 
        productName?: string
    ) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<{ [key: string]: CartItem }>({});
    const [flights, setFlights] = useState<FlyingFlight[]>([]);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Trigger subtle bounce on the shopping bag icon & counter
    const triggerBagBounce = useCallback(() => {
        const counterEl = document.getElementById('cart-bag-counter');
        if (counterEl && typeof counterEl.animate === 'function') {
            counterEl.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.45) rotate(-6deg)' },
                { transform: 'scale(0.92) rotate(3deg)' },
                { transform: 'scale(1)' }
            ], {
                duration: 480,
                easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            });
        }

        const bagEl = document.getElementById('cart-bag-icon');
        if (bagEl && typeof bagEl.animate === 'function') {
            bagEl.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.18)' },
                { transform: 'scale(1)' }
            ], {
                duration: 380,
                easing: 'ease-out'
            });
        }
    }, []);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('jewelry-cart-v2');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        localStorage.setItem('jewelry-cart-v2', JSON.stringify(cart));
    }, [cart]);

    const addToCartDirect = useCallback((productId: string, weight: number = 0) => {
        const cartId = `${productId}_${weight}`;
        setCart(prev => {
            const existing = prev[cartId];
            return {
                ...prev,
                [cartId]: {
                    id: cartId,
                    productId,
                    weight,
                    quantity: (existing?.quantity || 0) + 1
                }
            };
        });
    }, []);

    const addToCart = (productId: string, weight: number = 0) => {
        addToCartDirect(productId, weight);
        triggerBagBounce();
    };

    const addToCartWithAnimation = (
        productId: string,
        weight: number = 0,
        startElOrRect?: HTMLElement | DOMRect | null,
        imageUrl: string = '/images/cat_gold.jpg',
        productName: string = 'Fine Jewellery'
    ) => {
        // Check user reduced motion preference
        const prefersReducedMotion = typeof window !== 'undefined' && 
            window.matchMedia && 
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Determine starting coordinates and dimensions from exact product image
        let startX = window.innerWidth / 2;
        let startY = window.innerHeight / 2;
        let startWidth = 140;
        let startHeight = 140;

        if (startElOrRect) {
            let rect: DOMRect | null = null;
            if (typeof (startElOrRect as HTMLElement).getBoundingClientRect === 'function') {
                const el = startElOrRect as HTMLElement;
                const imgEl = el.tagName.toLowerCase() === 'img' 
                    ? el 
                    : (el.querySelector('img') || el.closest('.group')?.querySelector('img') || el.closest('[class*="flex"]')?.querySelector('img'));
                rect = imgEl ? imgEl.getBoundingClientRect() : el.getBoundingClientRect();
            } else if ('left' in (startElOrRect as DOMRect)) {
                rect = startElOrRect as DOMRect;
            }

            if (rect && rect.width > 0 && rect.height > 0) {
                startX = rect.left + rect.width / 2;
                startY = rect.top + rect.height / 2;
                startWidth = Math.min(Math.max(rect.width, 100), 240);
                startHeight = Math.min(Math.max(rect.height, 100), 240);
            }
        }

        // Determine target coordinates (Navbar Shopping Bag)
        let targetX = window.innerWidth - 36;
        let targetY = 28;

        const cartTargetEl = document.getElementById('cart-bag-icon') || 
            document.querySelector('[data-cart-target="true"]');
        if (cartTargetEl) {
            const tRect = cartTargetEl.getBoundingClientRect();
            if (tRect.width > 0 && tRect.height > 0) {
                targetX = tRect.left + tRect.width / 2;
                targetY = tRect.top + tRect.height / 2;
            }
        }

        // If reduced-motion is requested or coordinates are identical, update immediately
        if (prefersReducedMotion || !startElOrRect) {
            addToCartDirect(productId, weight);
            triggerBagBounce();
            setToastMessage(`${productName} added to your shopping bag.`);
            setTimeout(() => setToastMessage(null), 3200);
            return;
        }

        // Generate a unique flight ID for rapid repeated clicks
        const flightId = `flight-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const newFlight: FlyingFlight = {
            id: flightId,
            imageUrl,
            productName,
            startX,
            startY,
            startWidth,
            startHeight,
            targetX,
            targetY,
            onComplete: () => {
                // Update real cart state EXACTLY ONCE upon flight completion
                addToCartDirect(productId, weight);
                triggerBagBounce();
                setToastMessage(`${productName} added to your shopping bag.`);
                setTimeout(() => setToastMessage(null), 3200);
                // Remove flight from active list
                setFlights(prev => prev.filter(f => f.id !== flightId));
            }
        };

        setFlights(prev => [...prev, newFlight]);
    };

    const removeFromCart = (cartId: string) => {
        setCart(prev => {
            const newCart = { ...prev };
            delete newCart[cartId];
            return newCart;
        });
    };

    const updateQuantity = (cartId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(cartId);
        } else {
            setCart(prev => {
                if (!prev[cartId]) return prev;
                return {
                    ...prev,
                    [cartId]: {
                        ...prev[cartId],
                        quantity
                    }
                };
            });
        }
    };

    const clearCart = () => {
        setCart({});
    };

    const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            addToCartWithAnimation, 
            removeFromCart, 
            updateQuantity, 
            clearCart, 
            totalItems 
        }}>
            {children}
            <FlyToCartOverlay 
                flights={flights} 
                toastMessage={toastMessage} 
                onDismissToast={() => setToastMessage(null)} 
            />
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
