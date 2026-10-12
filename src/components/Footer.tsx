import React from 'react';
import { Gem, Shield, HeartHandshake, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TrustBadges } from './TrustBadges';

const Footer: React.FC = () => {
    return (
        <>
            <TrustBadges />
            <footer className="bg-[var(--bg-main)] text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-16 pb-12 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
                        {/* Brand Column */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/30">
                                    <Gem className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-lg text-[var(--text-main)] tracking-[0.15em] uppercase">
                                        RCB Jewelry’s &amp; Pawn Shop
                                    </h3>
                                    <p className="text-[11px] font-sans text-[var(--gold-primary)] tracking-widest uppercase font-semibold">
                                        Excellence in Gold, Diamonds &amp; Secured Credit
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed max-w-md">
                                Dedicated to fine craftsmanship, certified bullion, and confidential, licensed pawn services tailored to what matters most.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-display font-semibold text-xs uppercase tracking-widest text-[var(--gold-primary)] mb-4">
                                Collections &amp; Services
                            </h4>
                            <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
                                <li>
                                    <Link to="/jewelry" className="hover:text-[var(--gold-primary)] transition-colors">
                                        Fine Jewelry Collection
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/pawn" className="hover:text-[var(--gold-primary)] transition-colors">
                                        Instant Pawn Loans
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/jewelry" className="hover:text-[var(--gold-primary)] transition-colors">
                                        24K Gold &amp; Silver Bullion
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Customer Care */}
                        <div>
                            <h4 className="font-display font-semibold text-xs uppercase tracking-widest text-[var(--gold-primary)] mb-4">
                                Trust &amp; Security
                            </h4>
                            <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
                                <li className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-[var(--gold-primary)]" />
                                    <span>Licensed &amp; Insured Custody</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <HeartHandshake className="h-4 w-4 text-[var(--gold-primary)]" />
                                    <span>Confidential Pawn Valuations</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <PhoneCall className="h-4 w-4 text-[var(--gold-primary)]" />
                                    <span>Dedicated Customer Assistance</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-secondary)] gap-4">
                        <p>&copy; {new Date().getFullYear()} RCB Jewelry’s &amp; Pawn Shop. All rights reserved.</p>
                        <p className="font-sans text-[var(--text-secondary)]">
                            Crafted with precision for eternity.
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;
