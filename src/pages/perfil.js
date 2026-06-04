// Gerencia o upload de foto de perfil
document.addEventListener('DOMContentLoaded', function() {
    if (!User.requireAuth()) return;

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

    const profileName = document.getElementById('profileName');
    const profileTitle = document.getElementById('profileTitle');
    const profileBio = document.getElementById('profileBio');
    const teachSkillsTags = document.getElementById('teachSkillsTags');
    const learnSkillsTags = document.getElementById('learnSkillsTags');
    const profileAvailability = document.getElementById('profileAvailability');
    const postAuthorName = document.getElementById('postAuthorName');

    const profilePostsContainer = document.getElementById('profilePosts');
    const profileImageModal = document.getElementById('profileImageModal');
    const profileModalClose = document.getElementById('profileModalClose');
    const profileImageModalImg = document.getElementById('profileImageModalImg');
    const actionModal = document.getElementById('actionModal');
    const actionModalOverlay = document.getElementById('actionModalOverlay');
    const actionModalClose = document.getElementById('actionModalClose');
    const actionModalTitle = document.getElementById('actionModalTitle');
    const actionModalMessage = document.getElementById('actionModalMessage');
    const actionModalTextarea = document.getElementById('actionModalTextarea');
    const actionModalImageInput = document.getElementById('actionModalImageInput');
    const actionModalImagePreview = document.getElementById('actionModalImagePreview');
    const actionModalRemoveImage = document.getElementById('actionModalRemoveImage');
    const actionModalConfirm = document.getElementById('actionModalConfirm');
    const actionModalCancel = document.getElementById('actionModalCancel');

    let currentAction = null;
    let actionModalTempImage = null;
    let actionModalRemoveFlag = false;
    let currentModalPostId = null;

    function getAllPosts() {
        try {
            const saved = localStorage.getItem('allPosts');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Falha ao ler posts do feed', error);
            return [];
        }
    }

    // Simple reverse-geocode by proximity to known city centers
    function haversineKm(lat1, lon1, lat2, lon2) {
        const toRad = v => v * Math.PI / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function reverseGeocode(lat, lon) {
        const cities = [
            { name: 'Belo Horizonte', state: 'MG', lat: -19.9208, lon: -43.9378, r: 60 },
            { name: 'São Paulo', state: 'SP', lat: -23.5505, lon: -46.6333, r: 80 },
            { name: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lon: -43.1729, r: 80 },
            { name: 'Brasília', state: 'DF', lat: -15.7939, lon: -47.8828, r: 80 },
            { name: 'Salvador', state: 'BA', lat: -12.9777, lon: -38.5016, r: 80 },
            { name: 'Curitiba', state: 'PR', lat: -25.4284, lon: -49.2733, r: 60 },
            { name: 'Fortaleza', state: 'CE', lat: -3.7172, lon: -38.5434, r: 60 },
            { name: 'Porto Alegre', state: 'RS', lat: -30.0346, lon: -51.2177, r: 60 }
        ];
        for (const city of cities) {
            const d = haversineKm(lat, lon, city.lat, city.lon);
            if (d <= city.r) return `${city.name}, ${city.state}`;
        }
        return null;
    }

    function formatLocation(raw) {
        if (!raw) return '';
        const coordMatch = raw.match(/\(?\s*([-+]?\d{1,2}\.\d+),\s*([-+]?\d{1,3}\.\d+)\s*\)?/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lon = parseFloat(coordMatch[2]);
            const city = reverseGeocode(lat, lon);
            if (city) return city;
            return 'Minha localização';
        }
        return raw;
    }

    function getArchivedUserPosts(userId) {
        try {
            const saved = localStorage.getItem(`userPosts_${userId}`);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Falha ao ler posts antigos do usuário', error);
            return [];
        }
    }

    function getUserPosts(userId) {
        const allPosts = getAllPosts();
        if (allPosts.length) {
            return allPosts.filter(post => String(post.authorId) === String(userId));
        }
        return getArchivedUserPosts(userId);
    }

    function renderUserPosts(userId) {
        if (!profilePostsContainer) return;
        const posts = getUserPosts(userId);
        if (!posts.length) {
            profilePostsContainer.innerHTML = '<p class="empty-state">Você ainda não publicou nada. Vá ao feed e crie sua primeira postagem.</p>';
            return;
        }

        profilePostsContainer.innerHTML = posts.map(post => {
            const visibilityIcon = post.privacy === 'Público' ? '<i class="fa-solid fa-earth-americas" aria-hidden="true"></i>' : (post.privacy === 'Apenas amigos' ? '<i class="fa-solid fa-user-friends" aria-hidden="true"></i>' : '');
            const subtitleParts = [];
            if (post.location) {
                const formatted = formatLocation(post.location);
                if (formatted) subtitleParts.push(`<span class="post-location">${formatted}</span>`);
            }
            if (post.privacy) subtitleParts.push(`<span class="post-visibility">${visibilityIcon} <span class="vis-text">${post.privacy}</span></span>`);
            return `
            <div class="post">
                <div class="post-header">
                    <div class="user-info">
                        <img src="${User.getLoggedUserPhoto()}" alt="Avatar">
                        <div>
                            <h3>${User.getLoggedUserName()}</h3>
                            <span class="post-meta">${post.createdAtFormatted || 'Agora'}</span>
                            <div class="post-subtitle">${subtitleParts.join('<span class="dot-sep"> • </span>')}</div>
                        </div>
                    </div>
                    <div class="post-menu-icon">
                        <button type="button" class="post-menu-trigger" data-post-id="${post.id}">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        <div class="post-menu-options hidden" data-post-id="${post.id}">
                            <button class="edit-post" data-post-id="${post.id}">
                                <i class="fa-solid fa-pen"></i>
                                Editar
                            </button>
                            <button class="delete-post" data-post-id="${post.id}">
                                <i class="fa-solid fa-trash"></i>
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    ${post.text.replace(/\n/g, '<br>')}
                    ${post.image ? `<div class="post-image-wrapper" data-image-src="${post.image}" data-post-id="${post.id}"><img class="post-image" src="${post.image}" alt="Imagem da publicação"></div>` : ''}
                </div>
            </div>
        `}).join('');
    }

    async function renderProfile() {
        const user = await User.fetchCurrentUser() || User.getLoggedUser();
        if (!user) return;

        if (profileName) {
            profileName.textContent = User.getLoggedUserName();
        }

        if (profileTitle) {
            profileTitle.textContent = user.title || 'Estudante de Contabilidade';
        }

        if (postAuthorName) {
            postAuthorName.textContent = User.getLoggedUserName();
        }

        if (profileBio && user.about) {
            profileBio.textContent = user.about;
        }

        if (profileAvailability && Array.isArray(user.availability) && user.availability.length > 0) {
            profileAvailability.textContent = user.availability.join(', ');
        }

        if (teachSkillsTags && user.teachSkills) {
            teachSkillsTags.innerHTML = user.teachSkills.split(',').map(skill => skill.trim()).filter(Boolean).map(skill => `<span>${skill}</span>`).join('');
        }

        if (learnSkillsTags && user.learnSkills) {
            learnSkillsTags.innerHTML = user.learnSkills.split(',').map(skill => skill.trim()).filter(Boolean).map(skill => `<span>${skill}</span>`).join('');
        }

        if (user.id) {
            renderUserPosts(user.id);
        }
    }

    renderProfile();

    function openProfileImageModal(src) {
        if (!profileImageModal || !profileImageModalImg) return;
        profileImageModalImg.src = src;
        profileImageModal.classList.remove('hidden');
    }

    function openActionModal(action, postId) {
        const user = User.getLoggedUser();
        if (!user || !user.id) return;
        const allPosts = getAllPosts();
        const post = allPosts.find(p => String(p.id) === String(postId));
        if (!post) return;

        currentAction = action;
        currentModalPostId = postId;

        if (!actionModal || !actionModalTitle || !actionModalMessage || !actionModalConfirm || !actionModalCancel || !actionModalTextarea) return;

        if (action === 'edit') {
            actionModalTitle.textContent = 'Editar publicação';
            actionModalMessage.textContent = 'Edite o texto da publicação e clique em salvar.';
            actionModalTextarea.value = post.text || '';
            actionModalTextarea.classList.remove('hidden');
            actionModalConfirm.textContent = 'Salvar';
        } else {
            actionModalTitle.textContent = 'Excluir publicação';
            actionModalMessage.textContent = 'Tem certeza de que deseja excluir esta publicação? Esta ação não pode ser desfeita.';
            actionModalTextarea.value = '';
            actionModalTextarea.classList.add('hidden');
            actionModalConfirm.textContent = 'Excluir';
        }

        actionModal.classList.remove('hidden');
    }

    function closeActionModal() {
        if (!actionModal) return;
        actionModal.classList.add('hidden');
        currentAction = null;
        currentModalPostId = null;
    }

    function submitActionModal() {
        if (!currentAction || !currentModalPostId) return;
        if (currentAction === 'edit') {
            const text = actionModalTextarea.value.trim();
            if (!text) {
                alert('O texto não pode ficar vazio.');
                return;
            }
            const allPosts = getAllPosts();
            const index = allPosts.findIndex(p => String(p.id) === String(currentModalPostId));
            if (index === -1) return;
            const busyEl = document.getElementById('actionModalBusy');
            const finalize = () => {
                saveAllPosts(allPosts);
                renderUserPosts(User.getLoggedUser().id);
                if (busyEl) busyEl.classList.add('hidden');
            };

            (async () => {
                try {
                    allPosts[index].text = text;
                    if (actionModalTempImage !== null) {
                        // if it's a data url, compress and upload
                        if (String(actionModalTempImage).startsWith('data:')) {
                            if (busyEl) busyEl.classList.remove('hidden');
                            const compressed = await compressDataURL(actionModalTempImage, 1200, 2 * 1024 * 1024);
                            const url = await uploadDataURLToServer(compressed, `post_${Date.now()}.jpg`);
                            allPosts[index].image = url;
                        } else {
                            allPosts[index].image = actionModalTempImage;
                        }
                    } else if (actionModalRemoveFlag) {
                        allPosts[index].image = '';
                    }
                    finalize();
                } catch (err) {
                    console.error('Erro ao enviar imagem:', err);
                    alert('Falha ao enviar imagem: ' + err.message);
                    if (busyEl) busyEl.classList.add('hidden');
                }
            })();
        } else if (currentAction === 'delete') {
            deleteUserPost(currentModalPostId);
        }
        closeActionModal();
    }

    function closeProfileImageModal() {
        if (!profileImageModal) return;
        profileImageModal.classList.add('hidden');
        if (profileImageModalImg) {
            profileImageModalImg.src = '';
        }
    }

    if (profileModalClose) {
        profileModalClose.addEventListener('click', closeProfileImageModal);
    }

    if (profileImageModal) {
        profileImageModal.addEventListener('click', function(event) {
            if (event.target === profileImageModal || event.target.classList.contains('profile-modal-overlay')) {
                closeProfileImageModal();
            }
        });
    }

    if (actionModal && actionModalOverlay) {
        actionModalOverlay.addEventListener('click', closeActionModal);
    }

    if (actionModalClose) {
        actionModalClose.addEventListener('click', closeActionModal);
    }

    if (actionModalCancel) {
        actionModalCancel.addEventListener('click', closeActionModal);
    }

    if (actionModalConfirm) {
        actionModalConfirm.addEventListener('click', submitActionModal);
    }

    // helper to read file as base64
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.toString());
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Convert dataURL to blob
    async function dataURLToBlob(dataURL) {
        const res = await fetch(dataURL);
        return await res.blob();
    }

    async function dataURLSize(dataURL) {
        const blob = await dataURLToBlob(dataURL);
        return blob.size;
    }

    async function compressDataURL(dataURL, maxWidth = 1200, targetBytes = 2 * 1024 * 1024) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async function() {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.9;
                let out = canvas.toDataURL('image/jpeg', quality);
                let size = await dataURLSize(out);
                while (size > targetBytes && quality > 0.5) {
                    quality -= 0.1;
                    out = canvas.toDataURL('image/jpeg', Math.max(quality, 0.5));
                    // eslint-disable-next-line no-await-in-loop
                    size = await dataURLSize(out);
                }
                resolve(out);
            };
            img.onerror = reject;
            img.src = dataURL;
        });
    }

    async function uploadDataURLToServer(dataURL, filename) {
        const resp = await fetch('/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: dataURL, filename })
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || 'Upload failed');
        }
        const body = await resp.json();
        return body.url;
    }

    if (actionModalImageInput) {
        actionModalImageInput.addEventListener('change', async function() {
            const file = actionModalImageInput.files && actionModalImageInput.files[0];
            if (!file) return;
            const maxUploadBytes = 8 * 1024 * 1024; // 8MB
            if (file.size > maxUploadBytes) {
                alert('Arquivo muito grande. Limite: 8MB.');
                actionModalImageInput.value = '';
                return;
            }
            try {
                const dataUrl = await readFileAsDataURL(file);
                actionModalTempImage = dataUrl;
                actionModalRemoveFlag = false;
                if (actionModalImagePreview) {
                    actionModalImagePreview.src = dataUrl;
                    actionModalImagePreview.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Falha ao ler imagem', err);
            }
        });
    }

    if (actionModalRemoveImage) {
        actionModalRemoveImage.addEventListener('click', function() {
            actionModalTempImage = null;
            actionModalRemoveFlag = true;
            if (actionModalImagePreview) {
                actionModalImagePreview.src = '';
                actionModalImagePreview.classList.add('hidden');
            }
            if (actionModalImageInput) actionModalImageInput.value = '';
        });
    }

    function saveAllPosts(posts) {
        try {
            localStorage.setItem('allPosts', JSON.stringify(posts));
        } catch (error) {
            console.error('Falha ao salvar posts do feed', error);
        }
    }

    function editUserPost(postId) {
        const user = User.getLoggedUser();
        if (!user || !user.id) return;
        const allPosts = getAllPosts();
        const index = allPosts.findIndex(post => String(post.id) === String(postId));
        if (index === -1) return;
        const post = allPosts[index];
        if (String(post.authorId) !== String(user.id)) return;
        post.text = actionModalTextarea.value.trim() || post.text;
        allPosts[index] = post;
        saveAllPosts(allPosts);
        renderUserPosts(user.id);
    }

    function deleteUserPost(postId) {
        const user = User.getLoggedUser();
        if (!user || !user.id) return;
        const allPosts = getAllPosts();
        const updatedPosts = allPosts.filter(post => String(post.id) !== String(postId));
        saveAllPosts(updatedPosts);
        renderUserPosts(user.id);
    }

    if (profilePostsContainer) {
        profilePostsContainer.addEventListener('click', function(event) {
            const menuTrigger = event.target.closest('.post-menu-trigger');
            const imageWrapper = event.target.closest('.post-image-wrapper');
            const editButton = event.target.closest('.edit-post');
            const deleteButton = event.target.closest('.delete-post');
            if (menuTrigger) {
                event.stopPropagation();
                const menu = menuTrigger.parentElement.querySelector('.post-menu-options');
                if (menu) {
                    menu.classList.toggle('hidden');
                }
                return;
            }
            if (imageWrapper) {
                event.preventDefault();
                const src = imageWrapper.dataset.imageSrc || imageWrapper.querySelector('img')?.src;
                if (src) {
                    openProfileImageModal(src);
                }
                return;
            }

            if (editButton) {
                event.preventDefault();
                openActionModal('edit', editButton.dataset.postId);
                document.querySelectorAll('.post-menu-options').forEach(menu => menu.classList.add('hidden'));
                return;
            }

            if (deleteButton) {
                event.preventDefault();
                openActionModal('delete', deleteButton.dataset.postId);
                document.querySelectorAll('.post-menu-options').forEach(menu => menu.classList.add('hidden'));
                return;
            }
        });
    }

    document.addEventListener('click', function(event) {
        if (!event.target.closest('.post-menu-icon')) {
            document.querySelectorAll('.post-menu-options').forEach(menu => menu.classList.add('hidden'));
        }
    });

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
