const API_BASE = "http://localhost:5002/api/auth";

// ========== FITUR LIHAT PASSWORD ==========
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function () {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input) {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            // Ganti ikon antara mata terbuka dan tertutup
            this.classList.toggle('fa-eye-slash');
        }
    });
});

// ========== LOGIN ==========
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember')?.checked || false;
        
        const messageDiv = document.getElementById('loginMessage');
        messageDiv.style.display = 'none';
        
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.status === 'success') {
                localStorage.setItem('glisia_token', data.token);
                if (remember) {
                    localStorage.setItem('glisia_user', JSON.stringify(data.user));
                }
                messageDiv.className = 'auth-message success';
                messageDiv.innerText = data.message;
                messageDiv.style.display = 'block';
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin/dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);
            } else {
                messageDiv.className = 'auth-message error';
                messageDiv.innerText = data.message;
                messageDiv.style.display = 'block';
            }
        } catch (err) {
            messageDiv.className = 'auth-message error';
            messageDiv.innerText = 'Gagal terhubung ke server. Periksa koneksi.';
            messageDiv.style.display = 'block';
        }
    });
}

// ========== REGISTER ==========
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama = document.getElementById('nama').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        const agree = document.getElementById('agreeTerms').checked;
        
        const messageDiv = document.getElementById('registerMessage');
        messageDiv.style.display = 'none';
        
        if (password !== confirm) {
            messageDiv.className = 'auth-message error';
            messageDiv.innerText = 'Konfirmasi kata sandi tidak cocok';
            messageDiv.style.display = 'block';
            return;
        }
        if (password.length < 8) {
            messageDiv.className = 'auth-message error';
            messageDiv.innerText = 'Kata sandi minimal 8 karakter';
            messageDiv.style.display = 'block';
            return;
        }
        if (!agree) {
            messageDiv.className = 'auth-message error';
            messageDiv.innerText = 'Harap setujui Syarat & Ketentuan';
            messageDiv.style.display = 'block';
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama, email, password })
            });
            const data = await res.json();
            if (data.status === 'success') {
                localStorage.setItem('glisia_token', data.token);
                messageDiv.className = 'auth-message success';
                messageDiv.innerText = data.message;
                messageDiv.style.display = 'block';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                messageDiv.className = 'auth-message error';
                messageDiv.innerText = data.message;
                messageDiv.style.display = 'block';
            }
        } catch (err) {
            messageDiv.className = 'auth-message error';
            messageDiv.innerText = 'Gagal terhubung ke server.';
            messageDiv.style.display = 'block';
        }
    });
}

// ========== CEK AKSES ADMIN ==========
async function checkAdminAccess() {
    const token = localStorage.getItem('glisia_token');
    if (!token) {
        window.location.href = '../login.html';
        return false;
    }
    try {
        const res = await fetch(`${API_BASE}/admin/check`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.admin) {
            window.location.href = '../login.html';
            return false;
        }
        return true;
    } catch (err) {
        window.location.href = '../login.html';
        return false;
    }
}