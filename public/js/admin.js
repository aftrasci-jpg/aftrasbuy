// Admin authentication and API utilities

class AdminAuth {
    static SUPABASE_URL = 'https://dtvbtyaoahmqbdlsmchn.supabase.co';
    static SUPABASE_ANON_KEY = 'sb_publishable_gSMTkb6wnMQXg1BjWGWQAg_X8onYHfB';

    static supabase = null;

    static init() {
        if (!this.supabase) {
            import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) => {
                this.supabase = createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
            });
        }
    }

    static isAuthenticated() {
        const session = localStorage.getItem('supabase_session');
        if (!session) return false;

        try {
            const sessionData = JSON.parse(session);
            const now = Math.floor(Date.now() / 1000);

            // Check if token is expired
            if (sessionData.expires_at && sessionData.expires_at < now) {
                this.logout();
                return false;
            }

            return true;
        } catch (e) {
            this.logout();
            return false;
        }
    }

    static getToken() {
        const session = localStorage.getItem('supabase_session');
        if (!session) return null;

        try {
            const sessionData = JSON.parse(session);
            return sessionData.access_token;
        } catch (e) {
            return null;
        }
    }

    static logout() {
        localStorage.removeItem('supabase_session');
        if (this.supabase) {
            this.supabase.auth.signOut();
        }
    }

    static async authenticatedFetch(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        const response = await fetch(url, defaultOptions);

        if (response.status === 401) {
            this.logout();
            window.location.href = 'login.html';
            throw new Error('Session expired');
        }

        return response;
    }
}

// Initialize on load
AdminAuth.init();
