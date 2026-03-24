document.addEventListener('DOMContentLoaded', () => {
    const AUTH_KEY = 'lanparty_admin_basic_auth';

    const form = document.getElementById('login-form');
    const userInput = document.getElementById('admin-user');
    const passwordInput = document.getElementById('admin-password');
    const status = document.getElementById('login-status');

    function setStatus(message) {
        status.textContent = message;
    }

    async function verifyCredentials(authHeader) {
        const response = await fetch('/admin', {
            method: 'GET',
            headers: {
                Authorization: authHeader
            }
        });

        return response;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = userInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            setStatus('Inserisci user e password.');
            return;
        }

        const authHeader = `Basic ${btoa(`${username}:${password}`)}`;
        setStatus('Verifica credenziali in corso...');

        try {
            const response = await verifyCredentials(authHeader);
            if (!response.ok) {
                setStatus('Credenziali non valide.');
                return;
            }

            sessionStorage.setItem(AUTH_KEY, authHeader);
            setStatus('Login riuscito, reindirizzamento...');
            window.location.href = '/admin/dashboard';
        } catch (error) {
            setStatus('Errore di connessione al server.');
        }
    });

    const savedAuth = sessionStorage.getItem(AUTH_KEY);
    if (savedAuth) {
        setStatus('Sessione trovata, apertura dashboard...');
        window.location.href = '/admin/dashboard';
    }
});
