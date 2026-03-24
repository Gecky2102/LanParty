document.addEventListener('DOMContentLoaded', () => {
    const teamsPodium = document.getElementById('teams-podium');
    const playersPodium = document.getElementById('players-podium');
    const teamsTable = document.getElementById('teams-table');
    const playersTable = document.getElementById('players-table');
    const status = document.getElementById('status');
    const lastUpdated = document.getElementById('last-updated');
    const REFRESH_INTERVAL_MS = 5000;
    let isFetching = false;

    // Use same-origin by default to avoid CORS in production.
    const url = window.API_BASE_URL || '';

    function setStatus(message) {
        status.textContent = message;
    }

    function formatNow() {
        return new Date().toLocaleTimeString('it-IT');
    }

    function showSingleRow(target, text, className) {
        target.innerHTML = '';
        const li = document.createElement('li');
        li.className = className;
        li.textContent = text;
        target.appendChild(li);
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

    function buildRow(item, index, labelKey) {
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
        section.textContent = item[labelKey];

        const points = document.createElement('span');
        points.className = 'points';
        points.textContent = `${item.punteggio} pt`;

        rankWrap.appendChild(rankBadge);
        rankWrap.appendChild(section);

        li.appendChild(rankWrap);
        li.appendChild(points);

        return li;
    }

    function buildPodiumRow(item, index, labelKey) {
        const li = buildRow(item, index, labelKey);
        const rankWrap = li.querySelector('.rank-wrap');
        const label = document.createElement('span');
        label.className = 'podium-label';
        label.textContent = index === 0 ? '1° posto' : index === 1 ? '2° posto' : '3° posto';
        rankWrap.prepend(label);
        return li;
    }

    function normalizeTeams(rawTeams) {
        return (Array.isArray(rawTeams) ? rawTeams : [])
            .map((team) => ({
                sezione: normalizeSectionName(team.sezione),
                punteggio: Number(team.punteggio) || 0
            }))
            .filter((team) => team.sezione.length > 0)
            .sort((a, b) => b.punteggio - a.punteggio);
    }

    function normalizePlayers(rawPlayers) {
        return (Array.isArray(rawPlayers) ? rawPlayers : [])
            .map((player) => ({
                username: String(player.username || '').trim().slice(0, 24),
                punteggio: Number(player.punteggio) || 0
            }))
            .filter((player) => player.username.length > 0)
            .sort((a, b) => b.punteggio - a.punteggio);
    }

    function renderRanking(tableTarget, podiumTarget, data, labelKey, emptyText) {
        tableTarget.innerHTML = '';
        podiumTarget.innerHTML = '';

        if (data.length === 0) {
            showSingleRow(tableTarget, emptyText, 'empty-row');
            showSingleRow(podiumTarget, `Nessun podio disponibile`, 'empty-row');
            return;
        }

        data.forEach((item, index) => {
            tableTarget.appendChild(buildRow(item, index, labelKey));
        });

        data.slice(0, 3).forEach((item, index) => {
            podiumTarget.appendChild(buildPodiumRow(item, index, labelKey));
        });
    }

    async function fetchLeaderboard() {
        if (isFetching) {
            return;
        }

        isFetching = true;
        setStatus('Aggiornamento in corso...');
        if (teamsTable.children.length === 0 || teamsTable.querySelector('.error-row')) {
            showSingleRow(teamsTable, 'Caricamento classifica squadre...', 'loading-row');
            showSingleRow(playersTable, 'Caricamento classifica giocatori...', 'loading-row');
            showSingleRow(teamsPodium, 'Caricamento podio squadre...', 'loading-row');
            showSingleRow(playersPodium, 'Caricamento podio giocatori...', 'loading-row');
        }

        try {
            const response = await fetch(url + '/classifiche');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            const teamRanking = normalizeTeams(data.teams);
            const playerRanking = normalizePlayers(data.players);

            renderRanking(teamsTable, teamsPodium, teamRanking, 'sezione', 'Nessuna squadra disponibile');
            renderRanking(playersTable, playersPodium, playerRanking, 'username', 'Nessun giocatore disponibile');

            setStatus(`Classifiche aggiornate: ${teamRanking.length} squadre, ${playerRanking.length} giocatori`);
            lastUpdated.textContent = formatNow();
        } catch (error) {
            console.error('Fetch error:', error);
            showSingleRow(teamsTable, 'Impossibile caricare classifica squadre', 'error-row');
            showSingleRow(playersTable, 'Impossibile caricare classifica giocatori', 'error-row');
            showSingleRow(teamsPodium, 'Podio non disponibile', 'error-row');
            showSingleRow(playersPodium, 'Podio non disponibile', 'error-row');
            setStatus('Errore di connessione al server classifiche');
        } finally {
            isFetching = false;
        }
    }

    fetchLeaderboard();
    setInterval(fetchLeaderboard, REFRESH_INTERVAL_MS);
});
