import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    id: string; // Unique ID for this specific selection (productId_weight)
    productId: string;
    weight: number;
    quantity: number;
}

interface CartContextType {
    cart: { [key: string]: CartItem };
    addToCart: (productId: string, weight?: number) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<{ [key: string]: CartItem }>({});

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

    const addToCart = (productId: string, weight: number = 0) => {
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
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems }}>
            {children}
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
