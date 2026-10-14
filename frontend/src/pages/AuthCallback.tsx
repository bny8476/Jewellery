import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Gem } from 'lucide-react';

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                navigate('/');
            }
        });

        // Check if we already have a session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate('/');
            }
        });

        // Fallback timer
        const timer = setTimeout(() => {
            navigate('/login');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
            <Gem className="h-12 w-12 text-purple-600 animate-bounce mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Finalizing sign in...</h2>
            <p className="text-gray-500 mt-2">You will be redirected automatically.</p>
        </div>
    );
}
