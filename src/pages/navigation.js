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

    // Configura links do cabeçalho para redirecionarem para suas páginas
    const navLinks = document.querySelectorAll('header nav a');
    if (navLinks && navLinks.length > 0) {
        // tenta detectar o caminho base até src/pages/
        const currentPath = window.location.pathname;
        const match = currentPath.match(/(.*\/src\/pages\/)/i);
        const base = match ? match[1] : '../';

        navLinks.forEach(link => {
            const text = (link.textContent || '').trim().toLowerCase();

            // normaliza para facilitar comparação (remove acentos)
            const normalized = text.normalize ? text.normalize('NFD').replace(/\p{Diacritic}/gu, '') : text;

            if (normalized.includes('início') || normalized.includes('inicio')) {
                link.href = base + 'feed/feed.html';
            } else if (normalized.includes('sugest')) {
                link.href = base + 'sugestoes/sugestoes.html';
            } else if (normalized.includes('estud')) {
                link.href = base + 'estudantes/estudantes.html';
            } else if (normalized.includes('agenda')) {
                link.href = base + 'agenda/agendas.html';
            } else if (normalized.includes('avali')) {
                link.href = base + 'avaliacoes/avaliacoes.html';
            } else if (normalized.includes('perfil')) {
                link.href = base + 'perfil/perfil.html';
            }

            // para melhor UX em ambientes estáticos
            link.style.cursor = 'pointer';
        });
    }
});
