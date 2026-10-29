import React from 'react';
import { ShieldCheck, Award, Truck, CreditCard } from 'lucide-react';

export const TrustBadges: React.FC = () => {
    const badges = [
        {
            icon: <Award className="h-7 w-7 text-amber-400" />,
            title: "BIS Hallmarked",
            description: "100% Certified Purity"
        },
        {
            icon: <ShieldCheck className="h-7 w-7 text-amber-400" />,
            title: "GIA Certified",
            description: "Natural Diamonds & Gems"
        },
        {
            icon: <CreditCard className="h-7 w-7 text-amber-400" />,
            title: "Secure Checkout",
            description: "Encrypted Transactions"
        },
        {
            icon: <Truck className="h-7 w-7 text-amber-400" />,
            title: "Insured Transit",
            description: "Safe & Tracked Delivery"
        }
    ];

    return (
        <section className="bg-[var(--bg-secondary)] py-14 border-t border-b border-[var(--border-color)] transition-colors duration-200" aria-label="Trust and Quality Guarantees">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {badges.map((badge, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center group transition-transform duration-300 hover:-translate-y-1">
                            <div className="mb-4 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] group-hover:border-[var(--gold-primary)] group-hover:shadow-[var(--shadow-card)] transition-all duration-300">
                                {badge.icon}
                            </div>
                            <h3 className="font-inter font-semibold text-sm sm:text-base text-[var(--text-main)] tracking-wider mb-1">{badge.title}</h3>
                            <p className="text-xs text-[var(--text-secondary)] font-sans tracking-wide">{badge.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
