const { createClient } = require('@supabase/supabase-js');

// Utilisez les nouvelles credentials Supabase
const supabaseUrl = 'https://dtvbtyaoahmqbdlsmchn.supabase.co';
const supabaseKey = 'sb_secret_Gbo94d0gFV4KGbHzJx5c9A_aZaGXWRy'; // Clé secrète pour l'administration

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
    try {
        console.log('Création du compte administrateur...');

        const { data, error } = await supabase.auth.signUp({
            email: 'admin@aftras.com',
            password: 'Admin123!',
            options: {
                data: {
                    role: 'admin',
                    name: 'Administrateur'
                }
            }
        });

        if (error) {
            console.error('Erreur lors de la création:', error.message);
            return;
        }

        console.log('✅ Compte administrateur créé avec succès!');
        console.log('📧 Email:', data.user.email);
        console.log('🔑 Mot de passe: Admin123!');
        console.log('');
        console.log('🔗 Pour accéder au tableau de bord:');
        console.log('1. Allez sur http://localhost:3000/admin/login.html');
        console.log('2. Connectez-vous avec ces credentials');

    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

createAdminUser();
