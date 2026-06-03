// Gerencia o upload de foto de perfil
document.addEventListener('DOMContentLoaded', function() {
    const profileAvatarContainer = document.getElementById('profileAvatarContainer');
    const profileInput = document.getElementById('profileInput');
    const profileImage = document.getElementById('profileImage');
    const profileBtn = document.getElementById("profileBtn");
    const userPhotoUrl = User.getLoggedUserPhoto();

    // Atualiza avatar no header
    if (profileBtn) {
        profileBtn.src = userPhotoUrl;
    }

    // Carrega a imagem salva quando a página inicia
    profileImage.src = userPhotoUrl;

    // Clique no avatar para abrir o seletor de arquivo
    profileAvatarContainer.addEventListener('click', function() {
        profileInput.click();
    });

    // Quando um arquivo é selecionado
    profileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];

        if (file) {
            // Valida se é uma imagem
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione uma imagem válida');
                return;
            }

            // Valida tamanho (máx 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('A imagem não pode ter mais de 5MB');
                return;
            }

            // Lê o arquivo e exibe a imagem
            const reader = new FileReader();
            reader.onload = function(e) {
                profileImage.src = e.target.result;

                // Salva a imagem vinculada ao usuário
                User.updateUserPhoto(e.target.result);

                // Atualiza o header também
                if (profileBtn) {
                    profileBtn.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }

        // Limpa o input para permitir selecionar a mesma imagem novamente
        profileInput.value = '';
    });
});
