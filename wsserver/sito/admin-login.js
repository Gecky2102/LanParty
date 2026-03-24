document.addEventListener('DOMContentLoaded', () => {
    const AUTH_KEY = 'lanparty_admin_basic_auth';

    const form = document.getElementById('login-form');
    const userInput = document.getElementById('admin-user');
    const passwordInput = document.getElementById('admin-password');
    const status = document.getElementById('login-status');

    function setStatus(message, type = 'neutral') {
        status.textContent = message;
        status.classList.remove('status-neutral', 'status-success', 'status-error');
        if (type === 'success') {
            status.classList.add('status-success');
            return;
        }
        if (type === 'error') {
            status.classList.add('status-error');
            return;
        }
        status.classList.add('status-neutral');
    }

    async function verifyCredentials(username, password) {
        const response = await fetch('/admin/login-check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Errore server');
        }

        const json = await response.json();
        return Boolean(json.ok);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = userInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            setStatus('Inserisci user e password.', 'error');
            return;
        }

        const authHeader = `Basic ${btoa(`${username}:${password}`)}`;
        setStatus('Verifica credenziali in corso...', 'neutral');

        try {
            const ok = await verifyCredentials(username, password);
            if (!ok) {
                setStatus('Credenziali non valide.', 'error');
                return;
            }

            sessionStorage.setItem(AUTH_KEY, authHeader);
            setStatus('Login riuscito, reindirizzamento...', 'success');
            window.location.href = '/admin/dashboard';
        } catch (error) {
            setStatus('Errore di connessione al server.', 'error');
        }
    });

    const savedAuth = sessionStorage.getItem(AUTH_KEY);
    if (savedAuth) {
        setStatus('Sessione trovata, apertura dashboard...', 'neutral');
        window.location.href = '/admin/dashboard';
    } else {
        setStatus('Inserisci le credenziali admin.', 'neutral');
    }
});
