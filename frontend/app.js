const api = "";
const userId = localStorage.getItem('userId');

if (!userId) {
    window.location.href = 'login.html';
}

document.getElementById('scoreForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const score = document.getElementById('score').value;
    const datePlayed = document.getElementById('datePlayed').value;

    const response = await fetch(`${api}/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, score, datePlayed })
    });

    const data = await response.json();

    if (response.ok) {
        alert('Score submitted successfully');
    } else {
        alert('Error: ' + (data.error || 'Failed to submit'));
    }
});
