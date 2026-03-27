const api = "";

const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');

// SIGNUP LOGIC
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const charityId = document.getElementById('charitySelect').value;

        const response = await fetch(`${api}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, charityId })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Account created! Proceeding to Login.');
            window.location.href = 'login.html';
        } else {
            alert('Signup Error: ' + data.error);
        }
    });
}

// LOGIN LOGIC
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const response = await fetch(`${api}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.session.access_token);
            localStorage.setItem('userId', data.user.id);
            window.location.href = 'dashboard.html';
        } else {
            alert('Login Error: ' + data.error);
        }
    });
}
