document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('admin-user');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const backupBtn = document.getElementById('backup-btn');
    const resetBtn = document.getElementById('reset-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const authStatus = document.getElementById('auth-status');
    const actionStatus = document.getElementById('action-status');
    const rowsInfo = document.getElementById('rows-info');
    const studentsBody = document.getElementById('students-body');
    const createForm = document.getElementById('create-form');
    const newUsername = document.getElementById('new-username');
    const newSezione = document.getElementById('new-sezione');
    const newPunteggio = document.getElementById('new-punteggio');

    const AUTH_KEY = 'lanparty_admin_basic_auth';
    let authHeader = sessionStorage.getItem(AUTH_KEY) || '';

    function setAuthStatus(message) {
        authStatus.textContent = message;
    }

    function setActionStatus(message) {
        actionStatus.textContent = message;
    }

    function updateButtonsState() {
        const loggedIn = Boolean(authHeader);
        backupBtn.disabled = !loggedIn;
        resetBtn.disabled = !loggedIn;
        reloadBtn.disabled = !loggedIn;
        createForm.querySelector('button[type="submit"]').disabled = !loggedIn;
    }

    function buildAuthHeader() {
        const username = userInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            setAuthStatus('Inserisci user e password admin.');
            return '';
        }

        return `Basic ${btoa(`${username}:${password}`)}`;
    }

    async function adminFetch(path, options = {}) {
        if (!authHeader) {
            throw new Error('NON_AUTHENTICATED');
        }

        const response = await fetch(path, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
                ...(options.headers || {})
            }
        });

        if (response.status === 401) {
            authHeader = '';
            sessionStorage.removeItem(AUTH_KEY);
            updateButtonsState();
            throw new Error('UNAUTHORIZED');
        }

        return response;
    }

    function renderPlaceholder(text) {
        studentsBody.innerHTML = `
            <tr>
              <td colspan="5" class="placeholder">${text}</td>
            </tr>
        `;
        rowsInfo.textContent = '0 record';
    }

    function rowTemplate(student) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.username}</td>
            <td>
              <input class="sezione-input" type="text" value="${student.sezione}" />
            </td>
            <td>
              <input class="score-input" type="number" value="${student.punteggio}" />
            </td>
            <td>
              <div class="small-actions">
                <button data-action="set-score">Salva</button>
                <input class="delta-input" type="number" value="1" />
                <button data-action="add-score" class="secondary">+/-</button>
                <button data-action="delete" class="danger">Elimina</button>
              </div>
            </td>
        `;

        const setButton = row.querySelector('[data-action="set-score"]');
        const addButton = row.querySelector('[data-action="add-score"]');
        const deleteButton = row.querySelector('[data-action="delete"]');
        const scoreInput = row.querySelector('.score-input');
        const deltaInput = row.querySelector('.delta-input');
        const sezioneInput = row.querySelector('.sezione-input');

        setButton.addEventListener('click', async () => {
            const newScore = Number(scoreInput.value);
            const newUsername = String(student.username || '').trim();
            const newSezioneValue = sezioneInput.value.trim();
            if (!newUsername || !newSezioneValue || !Number.isFinite(newScore)) {
                setActionStatus('Dati non validi: username, sezione o punteggio.');
                return;
            }

            try {
                const response = await adminFetch('/admin', {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'updateStudent',
                        id: student.id,
                        username: newUsername,
                        sezione: newSezioneValue,
                        punteggio: newScore
                    })
                });

                if (!response.ok) {
                    const errJson = await response.json();
                    throw new Error(errJson.message || 'Errore updateStudent');
                }

                setActionStatus(`Studente #${student.id} aggiornato.`);
                await loadStudents();
            } catch (error) {
                setActionStatus(`Errore: ${error.message}`);
            }
        });

        addButton.addEventListener('click', async () => {
            const delta = Number(deltaInput.value);
            if (!Number.isFinite(delta)) {
                setActionStatus('Delta non valido.');
                return;
            }

            try {
                const response = await adminFetch('/admin', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'addScore', id: student.id, delta })
                });

                if (!response.ok) {
                    const errJson = await response.json();
                    throw new Error(errJson.message || 'Errore addScore');
                }

                setActionStatus(`Punteggio aggiornato per #${student.id}.`);
                await loadStudents();
            } catch (error) {
                setActionStatus(`Errore: ${error.message}`);
            }
        });

        deleteButton.addEventListener('click', async () => {
            const confirmed = confirm(`Eliminare lo studente #${student.id}?`);
            if (!confirmed) {
                return;
            }

            try {
                const response = await adminFetch('/admin', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'deleteStudent', id: student.id })
                });

                if (!response.ok) {
                    const errJson = await response.json();
                    throw new Error(errJson.message || 'Errore deleteStudent');
                }

                setActionStatus(`Studente #${student.id} eliminato.`);
                await loadStudents();
            } catch (error) {
                setActionStatus(`Errore: ${error.message}`);
            }
        });

        return row;
    }

    async function loadStudents() {
        if (!authHeader) {
            renderPlaceholder('Accedi come admin per gestire i dati.');
            return;
        }

        try {
            const response = await adminFetch('/admin/studenti');
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(errJson.message || 'Errore caricamento studenti');
            }

            const students = await response.json();
            studentsBody.innerHTML = '';

            if (!Array.isArray(students) || students.length === 0) {
                renderPlaceholder('Nessun studente presente.');
                return;
            }

            students.forEach((student) => {
                studentsBody.appendChild(rowTemplate(student));
            });

            rowsInfo.textContent = `${students.length} record`;
        } catch (error) {
            if (error.message === 'UNAUTHORIZED') {
                setAuthStatus('Sessione scaduta o credenziali non valide.');
                renderPlaceholder('Accedi di nuovo per visualizzare i dati.');
                return;
            }

            setActionStatus(`Errore: ${error.message}`);
            renderPlaceholder('Errore nel caricamento dati.');
        }
    }

    async function login() {
        const candidateAuth = buildAuthHeader();
        if (!candidateAuth) {
            return;
        }

        try {
            authHeader = candidateAuth;
            const response = await adminFetch('/admin');

            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(errJson.message || 'Credenziali non valide');
            }

            sessionStorage.setItem(AUTH_KEY, authHeader);
            setAuthStatus('Autenticato come admin.');
            setActionStatus('Login eseguito.');
            updateButtonsState();
            await loadStudents();
        } catch (error) {
            authHeader = '';
            sessionStorage.removeItem(AUTH_KEY);
            updateButtonsState();
            setAuthStatus(`Login fallito: ${error.message}`);
            renderPlaceholder('Accesso admin richiesto.');
        }
    }

    function logout() {
        authHeader = '';
        sessionStorage.removeItem(AUTH_KEY);
        setAuthStatus('Disconnesso.');
        setActionStatus('Sessione admin chiusa.');
        updateButtonsState();
        renderPlaceholder('Accedi come admin per gestire i dati.');
    }

    async function doBackup() {
        try {
            const response = await adminFetch('/admin', {
                method: 'POST',
                body: JSON.stringify({ action: 'backup' })
            });

            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(errJson.message || 'Errore backup');
            }

            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            const headerFilename = response.headers.get('Content-Disposition');
            const match = /filename="?([^";]+)"?/i.exec(headerFilename || '');
            const filename = match ? match[1] : `lanparty-backup-${Date.now()}.json`;

            anchor.href = downloadUrl;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(downloadUrl);

            setActionStatus('Backup scaricato con successo.');
        } catch (error) {
            setActionStatus(`Errore backup: ${error.message}`);
        }
    }

    async function doReset() {
        const confirmed = confirm('Confermi il reset totale della tabella studenti?');
        if (!confirmed) {
            return;
        }

        try {
            const response = await adminFetch('/admin', {
                method: 'POST',
                body: JSON.stringify({ action: 'reset' })
            });

            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(errJson.message || 'Errore reset');
            }

            setActionStatus('Reset completato con successo.');
            await loadStudents();
        } catch (error) {
            setActionStatus(`Errore reset: ${error.message}`);
        }
    }

    async function createStudent(event) {
        event.preventDefault();

        const username = newUsername.value.trim();
        const sezione = newSezione.value.trim();
        const punteggio = Number(newPunteggio.value);

        if (!username || !sezione || !Number.isFinite(punteggio)) {
            setActionStatus('Inserisci dati validi per il nuovo studente.');
            return;
        }

        try {
            const response = await adminFetch('/admin', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'createStudent',
                    username,
                    sezione,
                    punteggio
                })
            });

            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(errJson.message || 'Errore creazione studente');
            }

            createForm.reset();
            newPunteggio.value = 0;
            setActionStatus('Studente aggiunto con successo.');
            await loadStudents();
        } catch (error) {
            setActionStatus(`Errore creazione: ${error.message}`);
        }
    }

    loginBtn.addEventListener('click', login);
    logoutBtn.addEventListener('click', logout);
    backupBtn.addEventListener('click', doBackup);
    resetBtn.addEventListener('click', doReset);
    reloadBtn.addEventListener('click', loadStudents);
    createForm.addEventListener('submit', createStudent);

    updateButtonsState();

    if (authHeader) {
        setAuthStatus('Sessione admin ripristinata.');
        loadStudents();
    } else {
        renderPlaceholder('Accedi come admin per gestire i dati.');
    }
});
