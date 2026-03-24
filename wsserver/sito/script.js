document.addEventListener('DOMContentLoaded', () => {
    const leaderboard = document.getElementById('leaderboard');

    // Use same-origin by default to avoid CORS in production.
    const url = window.API_BASE_URL || '';

    // Simulazione fetch
    async function fetchLeaderboard() {
        fetch(url + "/classeVincitrice")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Convert response to JSON
            })
            .then(data => {
                console.log(data)
                data.forEach(classe => {
                    console.log(classe.sezione, " ", classe.punteggio);
                });

                leaderboard.innerHTML = ''; // Pulisce i dati precedenti

                data.forEach((classe, index) => {
                    const li = document.createElement('li');
                    li.textContent = `${index + 1}. ${classe.sezione} - ${classe.punteggio} pt`;
                    if (index === 0) {
                        li.classList.add('first-place');
                    } else if (index === 1) {
                        li.classList.add('second-place');
                    } else if (index === 2) {
                        li.classList.add('third-place');
                    }
                    leaderboard.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }



    fetchLeaderboard();
});
