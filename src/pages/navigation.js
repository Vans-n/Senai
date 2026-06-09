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
                link.href = base + 'agenda/agenda.html';
            } else if (normalized.includes('avali')) {
                link.href = base + 'avaliacoes/avaliacoes.html';
            } else if (normalized.includes('perfil')) {
                link.href = base + 'perfil/perfil.html';
            }

            // para melhor UX em ambientes estáticos
            link.style.cursor = 'pointer';
        });
    }

    const themeStorageKey = 'siteThemeMode';
    const lightModeIcon = '<i class="fa-solid fa-moon"></i>';
    const darkModeIcon = '<i class="fa-solid fa-sun"></i>';
    const themeMenuItemId = 'profileThemeToggle';

    // Atualiza o tema atual e ajusta o texto do item de menu/ botão de fallback
    function applyTheme(theme) {
        const isDark = theme === 'dark';
        document.documentElement.classList.toggle('dark-mode', isDark);
        document.documentElement.classList.toggle('light-mode', !isDark);
        document.body.classList.toggle('dark-mode', isDark);
        document.body.classList.toggle('light-mode', !isDark);

        const themeLabel = isDark ? 'Modo claro' : 'Modo escuro';
        const themeIcon = isDark ? darkModeIcon : lightModeIcon;

        const themeMenuItem = document.getElementById(themeMenuItemId);
        if (themeMenuItem) {
            themeMenuItem.innerHTML = `${themeIcon}${themeLabel}`;
        }

        const floating = document.querySelector('.theme-toggle-floating');
        if (floating) {
            floating.innerHTML = themeIcon;
        }
    }

    // Detecta a preferência salva ou a preferência do sistema
    function initTheme() {
        const savedTheme = localStorage.getItem(themeStorageKey);
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        applyTheme(initialTheme);
    }

    function toggleTheme() {
        const currentTheme = (document.documentElement.classList.contains('dark-mode') || document.body.classList.contains('dark-mode')) ? 'light' : 'dark';
        applyTheme(currentTheme);
        localStorage.setItem(themeStorageKey, currentTheme);
    }

    // Insere a opção de modo claro/escuro no dropdown do perfil
    function createThemeMenuItem() {
        const dropdown = document.querySelector('#dropdownMenu');
        if (!dropdown) {
            return null;
        }

        let item = document.getElementById(themeMenuItemId);
        if (item) {
            return item;
        }

        item = document.createElement('a');
        item.href = '#';
        item.id = themeMenuItemId;
        item.className = 'dropdown-theme-toggle';
        item.addEventListener('click', function(event) {
            event.preventDefault();
            toggleTheme();
        });

        const logoutLink = dropdown.querySelector('a.logout');
        if (logoutLink) {
            dropdown.insertBefore(item, logoutLink);
        } else {
            dropdown.appendChild(item);
        }

        return item;
    }

    // Caso a página não tenha dropdown de perfil, usa um botão flutuante
    function createThemeButtonFallback() {
        const existing = document.querySelector('.theme-toggle-floating');
        if (existing) {
            return existing;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'theme-toggle-floating';
        button.title = 'Alternar modo';
        button.addEventListener('click', toggleTheme);
        document.body.appendChild(button);
        return button;
    }

    function normalizeText(text) {
        return String(text || '').trim().toLowerCase().normalize ?
            String(text || '').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') :
            String(text || '').trim().toLowerCase();
    }

    function highlightCurrentSidebarItem() {
        const currentPage = window.location.pathname.split('/').pop().toLowerCase();
        const currentKey = currentPage.replace(/\.html$/, '');

        const items = document.querySelectorAll('.sidebar .menu-item');
        if (!items.length) {
            return;
        }

        items.forEach(item => {
            item.classList.remove('active');

            const itemHref = item.getAttribute('href');
            let itemKey = '';

            if (itemHref) {
                itemKey = itemHref.split('/').pop().replace(/\.html$/, '').toLowerCase();
            } else {
                const span = item.querySelector('span');
                itemKey = normalizeText(span ? span.textContent : '');
            }

            if (!itemKey && item.textContent) {
                itemKey = normalizeText(item.textContent);
            }

            const normalizedCurrent = normalizeText(currentKey);
            const normalizedItem = normalizeText(itemKey);

            if (normalizedCurrent && normalizedItem.includes(normalizedCurrent)) {
                item.classList.add('active');
            } else if (normalizedCurrent === 'feed' && normalizedItem.includes('feed')) {
                item.classList.add('active');
            }
        });
    }

    const themeMenuItem = createThemeMenuItem();
    if (!themeMenuItem) {
        createThemeButtonFallback();
    }

    initTheme();
    highlightCurrentSidebarItem();
});
