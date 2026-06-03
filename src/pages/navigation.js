// Gerencia navegação do ícone de casa
document.addEventListener('DOMContentLoaded', function() {
    const homeIcon = document.getElementById('homeIcon');

    if (homeIcon) {
        homeIcon.style.cursor = 'pointer';
        homeIcon.addEventListener('click', function() {
            const currentPath = window.location.pathname;

            // Se já está no feed, permanece na página
            if (/\/feed\/feed\.html$/i.test(currentPath)) {
                return;
            }

            // Redireciona sempre para a página do feed dentro de src/pages/feed/
            const match = currentPath.match(/(.*\/src\/pages\/)/i);
            if (match) {
                window.location.href = match[1] + 'feed/feed.html';
                return;
            }

            // Fallback relativo se a estrutura de pastas não puder ser detectada
            window.location.href = '../feed/feed.html';
        });
    }
});
