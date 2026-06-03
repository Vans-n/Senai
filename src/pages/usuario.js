// Gerencia o usuário logado e seus dados
const User = {
    // Salva o usuário logado
    setLoggedUser(user) {
        localStorage.setItem('usuarioLogado', JSON.stringify(user));
    },

    // Obtém o usuário logado
    getLoggedUser() {
        const user = localStorage.getItem('usuarioLogado');
        return user ? JSON.parse(user) : null;
    },

    // Obtém o nome do usuário logado
    getLoggedUserName() {
        const user = this.getLoggedUser();
        return user ? user.nome : 'Usuário';
    },

    // Obtém a foto do usuário logado
    getLoggedUserPhoto() {
        const user = this.getLoggedUser();
        return user && user.foto ? user.foto : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    },

    // Atualiza a foto do usuário logado
    updateUserPhoto(photoBase64) {
        const user = this.getLoggedUser();
        if (user) {
            user.foto = photoBase64;
            this.setLoggedUser(user);
        }
    },

    // Faz logout
    logout() {
        localStorage.removeItem('usuarioLogado');
    }
};
