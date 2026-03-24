document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    const backupBtn = document.getElementById('backup-btn');
    const resetBtn = document.getElementById('reset-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const authStatus = document.getElementById('auth-status');
    const actionStatus = document.getElementById('action-status');
    const statStudents = document.getElementById('stat-students');
    const statPoints = document.getElementById('stat-points');
    const statTopClass = document.getElementById('stat-top-class');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const rowsInfo = document.getElementById('rows-info');
    const studentsBody = document.getElementById('students-body');
    const createForm = document.getElementById('create-form');
    const newUsername = document.getElementById('new-username');
    const newSezione = document.getElementById('new-sezione');
    const newPunteggio = document.getElementById('new-punteggio');

    const AUTH_KEY = 'lanparty_admin_basic_auth';
    let authHeader = sessionStorage.getItem(AUTH_KEY) || '';
    let studentsCache = [];

    function redirectToLogin() {
        window.location.href = '/admin/login';
    }

    function setAuthStatus(message) {
        authStatus.textContent = message;
    }

    function setActionStatus(message) {
        actionStatus.textContent = message;
    }

    function setActionStatusType(type) {
        actionStatus.classList.remove('message-neutral', 'message-success', 'message-error');
        if (type === 'success') {
            actionStatus.classList.add('message-success');
            return;
        }
        if (type === 'error') {
            actionStatus.classList.add('message-error');
            return;
        }
        actionStatus.classList.add('message-neutral');
    }

    function notify(message, type) {
        setActionStatus(message);
        setActionStatusType(type || 'neutral');
    }

    function updateButtonsState() {
        const loggedIn = Boolean(authHeader);
        backupBtn.disabled = !loggedIn;
        resetBtn.disabled = !loggedIn;
        reloadBtn.disabled = !loggedIn;
        createForm.querySelector('button[type="submit"]').disabled = !loggedIn;
    }

    async function adminFetch(path, options) {
        if (!authHeader) {
            throw new Error('NON_AUTHENTICATED');
        }

        const response = await fetch(path, {
            ...(options || {}),
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
                ...((options && options.headers) || {})
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
        rowsInfo.textContent = '0 record visualizzati';
        statStudents.textContent = '0';
        statPoints.textContent = '0';
        statTopClass.textContent = '-';
    }

    function updateStats(students) {
        const totalStudents = students.length;
        const totalPoints = students.reduce((sum, student) => sum + (Number(student.punteggio) || 0), 0);

        const bySection = new Map();
        students.forEach((student) => {
            const section = String(student.sezione || '').trim() || '-';
            const score = Number(student.punteggio) || 0;
            bySection.set(section, (bySection.get(section) || 0) + score);
        });

        let topClass = '-';
        let maxScore = Number.NEGATIVE_INFINITY;
        bySection.forEach((score, section) => {
            if (score > maxScore) {
                maxScore = score;
                topClass = `${section} (${score})`;
            }
        });

        statStudents.textContent = String(totalStudents);
        statPoints.textContent = String(totalPoints);
        statTopClass.textContent = topClass;
    }

    function getFilteredStudents() {
        const searchTerm = (searchInput.value || '').trim().toLowerCase();
        const sortValue = sortSelect.value;

        const filtered = studentsCache.filter((student) => {
            if (!searchTerm) {
                return true;
            }

            const username = String(student.username || '').toLowerCase();
            const sezione = String(student.sezione || '').toLowerCase();
            return username.includes(searchTerm) || sezione.includes(searchTerm);
        });

        filtered.sort((a, b) => {
            if (sortValue === 'id-desc') {
                return b.id - a.id;
            }
            if (sortValue === 'score-desc') {
                return (Number(b.punteggio) || 0) - (Number(a.punteggio) || 0);
            }
            if (sortValue === 'score-asc') {
                return (Number(a.punteggio) || 0) - (Number(b.punteggio) || 0);
            }
            if (sortValue === 'name-asc') {
                return String(a.username || '').localeCompare(String(b.username || ''), 'it');
            }

            return a.id - b.id;
        });

        return filtered;
    }

    function rowTemplate(student) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>
              <input class="username-input" type="text" value="${student.username}" />
            </td>
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
        const usernameInput = row.querySelector('.username-input');

        setButton.addEventListener('click', async () => {
            const newScore = Number(scoreInput.value);
            const usernameValue = usernameInput.value.trim();
            const sezioneValue = sezioneInput.value.trim();
            if (!usernameValue || !sezioneValue || !Number.isFinite(newScore)) {
                notify('Dati non validi: username, sezione o punteggio.', 'error');
                return;
            }

            try {
                const response = await adminFetch('/admin', {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'updateStudent',
                        id: student.id,
                        username: usernameValue,
                        sezione: sezioneValue,
                        punteggio: newScore
                    })
                });

                if (!response.ok) {
                    const errJson = await response.json();
                    throw new Error(errJson.message || 'Errore updateStudent');
                }

                notify(`Studente #${student.id} aggiornato.`, 'success');
                await loadStudents();
            } catch (error) {
                notify(`Errore: ${error.message}`, 'error');
            }
        });

        addButton.addEventListener('click', async () => {
            const delta = Number(deltaInput.value);
            if (!Number.isFinite(delta)) {
                notify('Delta non valido.', 'error');
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

                notify(`Punteggio aggiornato per #${student.id}.`, 'success');
                await loadStudents();
            } catch (error) {
                notify(`Errore: ${error.message}`, 'error');
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

                notify(`Studente #${student.id} eliminato.`, 'success');
                await loadStudents();
            } catch (error) {
                notify(`Errore: ${error.message}`, 'error');
            }
        });

        return row;
    }

    function renderStudentsTable(students) {
        studentsBody.innerHTML = '';

        if (!Array.isArray(students) || students.length === 0) {
            renderPlaceholder('Nessun risultato con i filtri correnti.');
            return;
        }

        students.forEach((student) => {
            studentsBody.appendChild(rowTemplate(student));
        });

        rowsInfo.textContent = `${students.length} record visualizzati`;
    }

    async function loadStudents() {
        if (!authHeader) {
            redirectToLogin();
            return;
        }

        try {
            const response = await adminFetch('/admin/studenti');
            if (!response.ok) {
                const errJson = await response.json();
                throw new Error(errJson.message || 'Errore caricamento studenti');
            }

            const students = await response.json();
            studentsCache = Array.isArray(students) ? students : [];
            updateStats(studentsCache);

            if (studentsCache.length === 0) {
                renderPlaceholder('Nessun studente presente.');
                return;
            }

            renderStudentsTable(getFilteredStudents());
        } catch (error) {
            if (error.message === 'UNAUTHORIZED') {
                setAuthStatus('Sessione scaduta. Reindirizzamento al login...');
                renderPlaceholder('Sessione non valida.');
                setTimeout(redirectToLogin, 700);
                return;
            }

            notify(`Errore: ${error.message}`, 'error');
            renderPlaceholder('Errore nel caricamento dati.');
        }
    }

    function logout() {
        authHeader = '';
        sessionStorage.removeItem(AUTH_KEY);
        setAuthStatus('Disconnessione...');
        notify('Sessione admin chiusa. Reindirizzamento...', 'neutral');
        updateButtonsState();
        setTimeout(redirectToLogin, 300);
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

            notify('Backup scaricato con successo.', 'success');
        } catch (error) {
            notify(`Errore backup: ${error.message}`, 'error');
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

            notify('Reset completato con successo.', 'success');
            await loadStudents();
        } catch (error) {
            notify(`Errore reset: ${error.message}`, 'error');
        }
    }

    async function createStudent(event) {
        event.preventDefault();

        const username = newUsername.value.trim();
        const sezione = newSezione.value.trim();
        const punteggio = Number(newPunteggio.value);

        if (!username || !sezione || !Number.isFinite(punteggio)) {
            notify('Inserisci dati validi per il nuovo studente.', 'error');
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
            notify('Studente aggiunto con successo.', 'success');
            await loadStudents();
        } catch (error) {
            notify(`Errore creazione: ${error.message}`, 'error');
        }
    }

    logoutBtn.addEventListener('click', logout);
    backupBtn.addEventListener('click', doBackup);
    resetBtn.addEventListener('click', doReset);
    reloadBtn.addEventListener('click', loadStudents);
    createForm.addEventListener('submit', createStudent);
    searchInput.addEventListener('input', () => {
        renderStudentsTable(getFilteredStudents());
    });
    sortSelect.addEventListener('change', () => {
        renderStudentsTable(getFilteredStudents());
    });

    updateButtonsState();

    if (authHeader) {
        setAuthStatus('Sessione admin attiva.');
        notify('Pronto.', 'neutral');
        loadStudents();
    } else {
        redirectToLogin();
    }
});
