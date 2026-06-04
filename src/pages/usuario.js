// Gerencia o usuário logado, token JWT e helpers de API
const User = {
    // Salva o usuário e token
    setAuth(user, token) {
        localStorage.setItem('usuarioLogado', JSON.stringify(this.normalizeUser(user)));
        if (token) localStorage.setItem('authToken', token);
    },

    // Normaliza o objeto de usuário antes de salvar
    normalizeUser(user) {
        if (!user) return null;
        return {
            ...user,
            profileCompleted: user.profileCompleted === true
        };
    },

    // Salva apenas o usuário (mantém o token)
    setLoggedUser(user) {
        localStorage.setItem('usuarioLogado', JSON.stringify(this.normalizeUser(user)));
    },

    // Obtém o usuário logado
    getLoggedUser() {
        const user = localStorage.getItem('usuarioLogado');
        return user ? JSON.parse(user) : null;
    },

    // Atualiza o usuário logado a partir do backend
    async fetchCurrentUser() {
        try {
            const res = await this.apiFetch('/api/users/me');
            if (!res.ok) return null;
            const user = await res.json();
            this.setLoggedUser(user);
            return user;
        } catch (error) {
            return null;
        }
    },

    // Token JWT
    setToken(token) {
        if (token) localStorage.setItem('authToken', token);
    },

    getToken() {
        return localStorage.getItem('authToken');
    },

    getBackendOrigin() {
        return 'http://127.0.0.1:3000';
    },

    getAppOrigin() {
        const currentPort = window.location.port;
        const currentProtocol = window.location.protocol;
        if (currentProtocol === 'file:' || (currentPort && currentPort !== '3000')) {
            return this.getBackendOrigin();
        }
        return window.location.origin;
    },

    getAppUrl(path) {
        return new URL(path, this.getAppOrigin()).toString();
    },

    // Remove auth
    logout() {
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('authToken');
    },

    isProfileComplete() {
        const user = this.getLoggedUser();
        return user && user.profileCompleted === true;
    },

    setProfileCompleted(completed = true) {
        const user = this.getLoggedUser();
        if (user) {
            user.profileCompleted = completed;
            this.setLoggedUser(user);
        }
    },

    requireAuth() {
        const token = this.getToken();
        if (!token) {
            window.location.href = '/login.html';
            return false;
        }

        const currentPath = window.location.pathname.replace(/\\/g, '/');
        const isCompletarPerfilPage = currentPath.includes('/perfil/completar-perfil.html');
        const isFeedPage = currentPath.includes('/feed/feed.html');

        if (!this.isProfileComplete()) {
            if (!isCompletarPerfilPage) {
                window.location.href = this.getAppUrl('/perfil/completar-perfil.html');
                return false;
            }
        } else {
            if (isCompletarPerfilPage) {
                window.location.href = this.getAppUrl('/feed/feed.html');
                return false;
            }
        }

        return true;
    },

    // Obtém o nome do usuário logado
    getLoggedUserName() {
        const user = this.getLoggedUser();
        return user ? user.nome || user.name : 'Usuário';
    },

    // Obtém a foto do usuário logado
    getLoggedUserPhoto() {
        const user = this.getLoggedUser();
        return user && (user.foto || user.photo) ? (user.foto || user.photo) : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    },

    // Atualiza a foto do usuário logado
    async updateUserPhoto(photoBase64) {
        const user = this.getLoggedUser();
        if (!user) return;

        user.foto = photoBase64;
        this.setLoggedUser(user);

        try {
            const res = await this.apiFetch('/api/users/me', {
                method: 'PATCH',
                body: JSON.stringify({ photo: photoBase64 })
            });
            if (res.ok) {
                const updatedUser = await res.json();
                this.setLoggedUser(updatedUser);
            }
        } catch (error) {
            console.error('Falha ao salvar foto de perfil no servidor', error);
        }
    },

    updateUserProfile(profile = {}) {
        const user = this.getLoggedUser();
        if (user) {
            const updatedUser = {
                ...user,
                ...profile
            };
            this.setLoggedUser(updatedUser);
        }
    },

    // Wrapper fetch que anexa Authorization quando houver token
    async apiFetch(path, options = {}) {
        const currentPort = window.location.port;
        const currentProtocol = window.location.protocol;
        const currentOrigin = window.location.origin;
        const backendOrigin = 'http://127.0.0.1:3000';
        const base = (currentProtocol === 'file:' || (currentPort && currentPort !== '3000'))
            ? backendOrigin
            : currentOrigin;
        const url = new URL(path, base).toString();
        const headers = options.headers || {};
        const token = this.getToken();
        if (token) headers['Authorization'] = 'Bearer ' + token;
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';

        try {
            const res = await fetch(url, {
                ...options,
                headers
            });

            if (!res.ok) {
                let payload = null;
                try { payload = await res.json(); } catch (e) { /* ignore */ }
                const message = (payload && (payload.error || payload.message)) || ('Erro: ' + res.status);
                this.showToast(message, 'error');

                if (res.status === 401) {
                    this.logout();
                    const currentPath = window.location.pathname;
                    if (!currentPath.endsWith('/login.html')) {
                        setTimeout(() => {
                            window.location.href = '/login.html';
                        }, 1400);
                    }
                }
            }

            return res;
        } catch (error) {
            console.error('API fetch failed:', url, error);
            this.showToast('Erro ao conectar com o servidor', 'error');
            throw error;
        }
    },

    showToast(message, type = 'info') {
        try {
            const id = 'app-toast';
            let container = document.getElementById(id);
            if (!container) {
                container = document.createElement('div');
                container.id = id;
                container.style.position = 'fixed';
                container.style.right = '20px';
                container.style.top = '20px';
                container.style.zIndex = 9999;
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '10px';
                container.style.maxWidth = '320px';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.background = type === 'error' ? '#dc3545' : '#28a745';
            toast.style.color = '#fff';
            toast.style.padding = '13px 16px';
            toast.style.borderRadius = '12px';
            toast.style.marginTop = '0';
            toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.18)';
            toast.style.fontSize = '0.95rem';
            toast.style.lineHeight = '1.4';
            toast.style.maxWidth = '100%';
            toast.style.opacity = '1';

            container.appendChild(toast);

            setTimeout(() => {
                toast.style.transition = 'opacity 300ms ease, transform 300ms ease';
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(10px)';
                setTimeout(() => toast.remove(), 350);
            }, 4500);
        } catch (e) { console.error('Toast error', e); }
    }
};
