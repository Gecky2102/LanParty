document.addEventListener('DOMContentLoaded', () => {
    const leaderboard = document.getElementById('leaderboard');
    const status = document.getElementById('status');
    const lastUpdated = document.getElementById('last-updated');
    const REFRESH_INTERVAL_MS = 15000;
    let isFetching = false;

    // Use same-origin by default to avoid CORS in production.
    const url = window.API_BASE_URL || '';

    function setStatus(message) {
        status.textContent = message;
    }

    function formatNow() {
        return new Date().toLocaleTimeString('it-IT');
    }

    function showSingleRow(text, className) {
        leaderboard.innerHTML = '';
        const li = document.createElement('li');
        li.className = className;
        li.textContent = text;
        leaderboard.appendChild(li);
    }

    function normalizeSectionName(rawValue) {
        const value = String(rawValue ?? '').trim();
        if (!value) {
            return '';
        }

        // Ignore accidental pasted code fragments or invalid labels.
        const forbiddenPattern = /func\s+_on_area_2d_area_entered|area2d|->\s*void|\{|\}/i;
        if (forbiddenPattern.test(value)) {
            return '';
        }

        return value.slice(0, 20);
    }

    function buildRow(classe, index) {
        const li = document.createElement('li');

        if (index === 0) {
            li.classList.add('first-place');
        } else if (index === 1) {
            li.classList.add('second-place');
        } else if (index === 2) {
            li.classList.add('third-place');
        }

        const rankWrap = document.createElement('div');
        rankWrap.className = 'rank-wrap';

        const rankBadge = document.createElement('span');
        rankBadge.className = 'rank-badge';
        rankBadge.textContent = index + 1;

        const section = document.createElement('span');
        section.className = 'section';
        section.textContent = classe.sezione;

        const points = document.createElement('span');
        points.className = 'points';
        points.textContent = `${classe.punteggio} pt`;

        rankWrap.appendChild(rankBadge);
        rankWrap.appendChild(section);

        li.appendChild(rankWrap);
        li.appendChild(points);

        return li;
    }

    async function fetchLeaderboard() {
        if (isFetching) {
            return;
        }

        isFetching = true;
        setStatus('Aggiornamento in corso...');
        if (leaderboard.children.length === 0 || leaderboard.querySelector('.error-row')) {
            showSingleRow('Caricamento classifica...', 'loading-row');
        }

        try {
            const response = await fetch(url + '/classeVincitrice');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            leaderboard.innerHTML = '';

            const cleanData = (Array.isArray(data) ? data : [])
                .map((classe) => ({
                    sezione: normalizeSectionName(classe.sezione),
                    punteggio: Number(classe.punteggio) || 0
                }))
                .filter((classe) => classe.sezione.length > 0)
                .sort((a, b) => b.punteggio - a.punteggio);

            if (cleanData.length === 0) {
                showSingleRow('Nessun punteggio disponibile', 'empty-row');
                setStatus('Classifica vuota');
                lastUpdated.textContent = formatNow();
                return;
            }

            cleanData.forEach((classe, index) => {
                leaderboard.appendChild(buildRow(classe, index));
            });

            setStatus(`Classifica aggiornata: ${cleanData.length} classi`);
            lastUpdated.textContent = formatNow();
        } catch (error) {
            console.error('Fetch error:', error);
            showSingleRow('Impossibile caricare la classifica', 'error-row');
            setStatus('Errore di connessione al server');
        } finally {
            isFetching = false;
        }
    }

    fetchLeaderboard();
    setInterval(fetchLeaderboard, REFRESH_INTERVAL_MS);
});
