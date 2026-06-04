// Carrega os dados do usuário no feed
function initFeed() {
    const profileBtn = document.getElementById("profileBtn");
    const createPostAvatar = document.getElementById("createPostAvatar");
    const userPhotoUrl = User.getLoggedUserPhoto();

    if (profileBtn) {
        profileBtn.src = userPhotoUrl;
    }

    if (createPostAvatar) {
        createPostAvatar.src = userPhotoUrl;
    }

    const currentUser = User.getLoggedUser();
    const postsStorageKey = currentUser && currentUser.id ? `userPosts_${currentUser.id}` : 'userPosts_anonymous';
    const allPostsStorageKey = 'allPosts';

    const postAvatars = document.querySelectorAll('.user-info img');
    postAvatars.forEach(avatar => {
        avatar.src = userPhotoUrl;
    });

    const imageBtn = document.getElementById('imageBtn');

    function getLegacyUserPosts() {
        try {
            const saved = localStorage.getItem(postsStorageKey);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Erro ao ler posts antigos do usuário', error);
            return [];
        }
    }

    function getStoredPosts() {
        try {
            const saved = localStorage.getItem(allPostsStorageKey);
            if (saved) {
                return JSON.parse(saved);
            }
            const legacy = getLegacyUserPosts();
            if (legacy && legacy.length) {
                const migrated = legacy.map(post => ({
                    ...post,
                    authorId: currentUser ? currentUser.id : null,
                    authorName: User.getLoggedUserName(),
                    authorPhoto: userPhotoUrl
                }));
                saveStoredPosts(migrated);
                return migrated;
            }
            return [];
        } catch (error) {
            console.error('Erro ao ler posts salvos', error);
            return [];
        }
    }

    function saveStoredPosts(posts) {
        try {
            localStorage.setItem(allPostsStorageKey, JSON.stringify(posts));
        } catch (error) {
            console.error('Erro ao salvar posts', error);
        }
    }

    function canEditPost(post) {
        if (!post || !post.createdAt) return false;
        const ageMs = Date.now() - post.createdAt;
        return ageMs <= 24 * 60 * 60 * 1000;
    }

    // Simple reverse-geocode by proximity to known city centers (fallback when stored value contains coords)
    function haversineKm(lat1, lon1, lat2, lon2) {
        const toRad = v => v * Math.PI / 180;
        const R = 6371; // km
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
        // look for patterns like (lat, lon)
        const coordMatch = raw.match(/\(?\s*([-+]?\d{1,2}\.\d+),\s*([-+]?\d{1,3}\.\d+)\s*\)?/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lon = parseFloat(coordMatch[2]);
            const city = reverseGeocode(lat, lon);
            if (city) return city;
            // fall back to a simpler label
            return 'Minha localização';
        }
        // if user typed a place name just return it
        return raw;
    }

    function createPostElement(post) {
        const newPost = document.createElement('div');
        newPost.className = 'post';
        newPost.dataset.postId = post.id;
        const imageHtml = post.image ? `<div class="post-image-wrapper" data-post-id="${post.id}"><img class="post-image" src="${post.image}" alt="Imagem da publicação"></div>` : '';
        const canManagePost = currentUser && post.authorId && String(currentUser.id) === String(post.authorId);
        const editButton = canManagePost && canEditPost(post) ? `<button class="edit-post" data-post-id="${post.id}"><i class="fa-solid fa-pen"></i> Editar</button>` : '';
        const deleteButton = canManagePost ? `<button class="delete-post" data-post-id="${post.id}"><i class="fa-solid fa-trash"></i> Excluir</button>` : '';
        const authorName = post.authorName || User.getLoggedUserName();
        const authorPhoto = post.authorPhoto || User.getLoggedUserPhoto();
        const visibilityIcon = post.privacy === 'Público' ? '<i class="fa-solid fa-earth-americas" aria-hidden="true"></i>' : (post.privacy === 'Apenas amigos' ? '<i class="fa-solid fa-user-friends" aria-hidden="true"></i>' : '');
        const subtitleParts = [];
        if (post.location) {
            const formatted = formatLocation(post.location);
            if (formatted) subtitleParts.push(`<span class="post-location">${formatted}</span>`);
        }
        if (post.privacy) subtitleParts.push(`<span class="post-visibility">${visibilityIcon} <span class="vis-text">${post.privacy}</span></span>`);

        newPost.innerHTML = `
            <div class="post-header">
                <div class="user-info">
                    <img src="${authorPhoto}" alt="Avatar">
                    <div>
                        <h3>${authorName}</h3>
                        <span class="post-meta">${post.createdAtFormatted || 'Agora'}</span>
                        <div class="post-subtitle">${subtitleParts.join('<span class="dot-sep"> • </span>')}</div>
                    </div>
                </div>
                ${canManagePost ? `
                <div class="post-menu-icon">
                    <button type="button" class="post-menu-trigger" data-post-id="${post.id}">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    <div class="post-menu-options hidden" data-post-id="${post.id}">
                        ${editButton}
                        ${deleteButton}
                    </div>
                </div>
                ` : ''}
            </div>
            <div class="post-content">
                ${post.text.replace(/\n/g, '<br>')}
                ${imageHtml}
            </div>
            <div class="post-actions">
                <button>
                    <i class="fa-solid fa-plus"></i>
                    Ajudar
                </button>
                <button>
                    <i class="fa-solid fa-xmark"></i>
                    Preciso de ajuda
                </button>
                <button>
                    <i class="fa-solid fa-minus"></i>
                    Dica
                </button>
                <button>
                    <i class="fa-solid fa-share-nodes"></i>
                    Compartilhar
                </button>
            </div>
        `;
        return newPost;
    }

    function renderStoredPosts() {
        const posts = getStoredPosts();
        if (!feedSection) return;
        const insertAfter = createPostSection ? createPostSection.nextSibling : null;
        const existingContent = feedSection.querySelectorAll('.post, .empty-state');
        existingContent.forEach(el => el.remove());
        if (!posts.length) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'Nenhuma publicação ainda. Crie algo ou aguarde seus amigos compartilharem no feed.';
            if (insertAfter) {
                feedSection.insertBefore(emptyState, insertAfter);
            } else {
                feedSection.appendChild(emptyState);
            }
            return;
        }
        posts.slice().reverse().forEach(post => {
            const postElement = createPostElement(post);
            if (insertAfter) {
                feedSection.insertBefore(postElement, insertAfter);
            } else {
                feedSection.appendChild(postElement);
            }
        });
    }
    const locationBtn = document.getElementById('locationBtn');
    const categoryBtn = document.getElementById('categoryBtn');
    const privacyBtn = document.getElementById('privacyBtn');

    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const optionPopup = document.getElementById('optionPopup');
    const optionCloseBtn = document.getElementById('optionCloseBtn');
    const locationPanel = document.getElementById('locationPanel');
    const locationInput = document.getElementById('locationInput');
    const locationSaveBtn = document.getElementById('locationSaveBtn');
    const locationCurrentBtn = document.getElementById('locationCurrentBtn');
    const privacyPanel = document.getElementById('privacyPanel');
    const categoryPanel = document.getElementById('categoryPanel');
    const privacyRadios = document.querySelectorAll('input[name="privacy"]');
    const publishBtn = document.getElementById('publishBtn');
    const postInput = document.getElementById('postInput');
    const feedSection = document.querySelector('.feed');
    const createPostSection = feedSection ? feedSection.querySelector('.create-post') : null;
    const imageModal = document.getElementById('imageModal');
    const imageModalClose = document.getElementById('imageModalClose');
    const imageModalImg = document.getElementById('imageModalImg');
    const imageModalPrivacyText = document.getElementById('imageModalPrivacyText');
    const imageModalLocationText = document.getElementById('imageModalLocationText');
    const commentsList = document.getElementById('commentsList');
    const commentInput = document.getElementById('commentInput');
    const commentSubmit = document.getElementById('commentSubmit');

    let selectedLocation = '';
    let selectedPrivacy = 'Público';
    let selectedImageBase64 = '';
    let currentModalPostId = null;

    if (feedSection) {
        renderStoredPosts();
    }

    function openImageModal(postId) {
        const posts = getStoredPosts();
        const post = posts.find(p => String(p.id) === String(postId));
        if (!post || !post.image) return;

        currentModalPostId = postId;
        imageModalImg.src = post.image;
        imageModalPrivacyText.textContent = `Visibilidade: ${post.privacy}`;
        imageModalLocationText.textContent = post.location ? `Localização: ${post.location}` : '';
        renderComments(post);
        imageModal.classList.remove('hidden');
    }

    function closeImageModal() {
        if (imageModal) {
            imageModal.classList.add('hidden');
        }
        currentModalPostId = null;
        if (commentInput) {
            commentInput.value = '';
        }
    }

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
    let actionModalTempImage = null; // base64 or null
    let actionModalRemoveFlag = false;

    function openActionModal(action, postId) {
        const posts = getStoredPosts();
        const post = posts.find(p => String(p.id) === String(postId));
        if (!post) return;

        currentModalPostId = postId;
        currentAction = action;

        if (!actionModal || !actionModalTitle || !actionModalMessage || !actionModalConfirm || !actionModalCancel) return;

        if (action === 'edit') {
            actionModalTitle.textContent = 'Editar publicação';
            actionModalMessage.textContent = 'Altere o texto da publicação e clique em salvar.';
            actionModalTextarea.value = post.text || '';
            actionModalTextarea.classList.remove('hidden');
            // image handling
            actionModalTempImage = null;
            actionModalRemoveFlag = false;
            if (actionModalImagePreview) {
                if (post.image) {
                    actionModalImagePreview.src = post.image;
                    actionModalImagePreview.classList.remove('hidden');
                } else {
                    actionModalImagePreview.src = '';
                    actionModalImagePreview.classList.add('hidden');
                }
            }
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
            const posts = getStoredPosts();
            const index = posts.findIndex(p => String(p.id) === String(currentModalPostId));
            if (index === -1) return;
            posts[index].text = text;
            // image: if a new image selected, use it; if remove flag true, clear image; otherwise keep existing
            if (actionModalTempImage !== null) {
                posts[index].image = actionModalTempImage;
            } else if (actionModalRemoveFlag) {
                posts[index].image = '';
            }
            saveAndRerenderPosts(posts);
        } else if (currentAction === 'delete') {
            deletePost(currentModalPostId);
        }
        closeActionModal();
    }

    function getComments(post) {
        return post.comments && Array.isArray(post.comments) ? post.comments : [];
    }

    function renderComments(post) {
        if (!commentsList) return;
        const comments = getComments(post);
        if (!comments.length) {
            commentsList.innerHTML = '<p class="empty-state">Seja o primeiro a comentar.</p>';
            return;
        }
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <strong>${comment.author}</strong>
                <p>${comment.text}</p>
                <span>${comment.createdAtFormatted}</span>
            </div>
        `).join('');
    }

    function addCommentToPost(postId, text) {
        const posts = getStoredPosts();
        const index = posts.findIndex(p => String(p.id) === String(postId));
        if (index === -1) return;
        const post = posts[index];
        const comments = getComments(post);
        comments.push({
            author: User.getLoggedUserName(),
            text,
            createdAtFormatted: new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
        });
        post.comments = comments;
        posts[index] = post;
        saveStoredPosts(posts);
        renderComments(post);
    }

    function updatePrivacyButtonLabel() {
        if (privacyBtn) {
            privacyBtn.innerHTML = `
                <i class="fa-solid fa-earth-americas"></i>
                ${selectedPrivacy}
            `;
        }
    }

    function hidePanels() {
        if (locationPanel) {
            locationPanel.classList.add('hidden');
        }
        if (privacyPanel) {
            privacyPanel.classList.add('hidden');
        }
        if (categoryPanel) {
            categoryPanel.classList.add('hidden');
        }
    }

    function closePopup() {
        if (optionPopup) {
            optionPopup.classList.add('hidden');
        }
        hidePanels();
    }

    if (imageBtn && imageInput) {
        imageBtn.addEventListener('click', function() {
            imageInput.click();
            hidePanels();
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', function() {
            const file = imageInput.files && imageInput.files[0];
            if (!file) {
                selectedImageBase64 = '';
                if (imagePreview) {
                    imagePreview.classList.add('hidden');
                    imagePreview.innerHTML = '';
                }
                return;
            }

            const maxUploadBytes = 8 * 1024 * 1024; // 8MB
            if (file.size > maxUploadBytes) {
                alert('Arquivo muito grande. Limite: 8MB.');
                imageInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', function() {
                selectedImageBase64 = reader.result;
                if (imagePreview) {
                    imagePreview.classList.remove('hidden');
                    imagePreview.innerHTML = `
                        <img src="${reader.result}" alt="Prévia da imagem">
                        <div>
                            <strong>Imagem selecionada:</strong>
                            <p>${file.name}</p>
                        </div>
                    `;
                }
            });
            reader.readAsDataURL(file);
        });
    }

    if (locationBtn && optionPopup) {
        locationBtn.addEventListener('click', function() {
            if (optionPopup) {
                optionPopup.classList.remove('hidden');
            }
            if (locationPanel) {
                locationPanel.classList.remove('hidden');
            }
            if (privacyPanel) {
                privacyPanel.classList.add('hidden');
            }
        });
    }

    if (locationSaveBtn && locationInput) {
        locationSaveBtn.addEventListener('click', function() {
            const value = locationInput.value.trim();
            if (!value) {
                alert('Digite uma localização antes de salvar.');
                return;
            }
            selectedLocation = value;
            closePopup();
        });
    }

    if (locationCurrentBtn) {
        locationCurrentBtn.addEventListener('click', function() {
            if (!navigator.geolocation) {
                alert('Geolocalização não suportada pelo navegador.');
                return;
            }
            navigator.geolocation.getCurrentPosition(function(position) {
                selectedLocation = `Minha localização atual (${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)})`;
                closePopup();
            }, function() {
                alert('Não foi possível obter sua localização atual.');
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });
    }

    if (privacyBtn && optionPopup) {
        privacyBtn.addEventListener('click', function() {
            if (optionPopup) {
                optionPopup.classList.remove('hidden');
            }
            if (privacyPanel) {
                privacyPanel.classList.remove('hidden');
            }
            if (locationPanel) {
                locationPanel.classList.add('hidden');
            }
            if (categoryPanel) {
                categoryPanel.classList.add('hidden');
            }
        });
    }

    if (categoryBtn && optionPopup) {
        categoryBtn.addEventListener('click', function() {
            if (optionPopup) {
                optionPopup.classList.remove('hidden');
            }
            if (categoryPanel) {
                categoryPanel.classList.remove('hidden');
            }
            if (locationPanel) {
                locationPanel.classList.add('hidden');
            }
            if (privacyPanel) {
                privacyPanel.classList.add('hidden');
            }
        });
    }

    if (privacyRadios.length > 0) {
        privacyRadios.forEach(function(radio) {
            radio.addEventListener('change', function() {
                if (radio.checked) {
                    selectedPrivacy = radio.value;
                    updatePrivacyButtonLabel();
                }
            });
        });
    }

    updatePrivacyButtonLabel();

    if (optionCloseBtn) {
        optionCloseBtn.addEventListener('click', closePopup);
    }

    if (optionPopup) {
        optionPopup.addEventListener('click', function(event) {
            if (event.target === optionPopup) {
                closePopup();
            }
        });
    }

    if (imageModalClose) {
        imageModalClose.addEventListener('click', closeImageModal);
    }

    if (imageModal) {
        imageModal.addEventListener('click', function(event) {
            if (event.target === imageModal || event.target === document.querySelector('.image-modal-overlay')) {
                closeImageModal();
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

    // Compress dataURL using canvas to target size (bytes)
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
        actionModalImageInput.addEventListener('change', async function(event) {
            const file = actionModalImageInput.files && actionModalImageInput.files[0];
            if (!file) return;
            // validate size (reject very large files)
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
            if (actionModalImageInput) {
                actionModalImageInput.value = '';
            }
        });
    }

    if (commentSubmit && commentInput) {
        commentSubmit.addEventListener('click', function() {
            const text = commentInput.value.trim();
            if (!text || !currentModalPostId) return;
            addCommentToPost(currentModalPostId, text);
            commentInput.value = '';
        });
    }

    if (publishBtn && postInput) {
        publishBtn.addEventListener('click', function() {
            const currentPrivacyRadio = document.querySelector('input[name="privacy"]:checked');
            if (currentPrivacyRadio) {
                selectedPrivacy = currentPrivacyRadio.value;
            }

            const text = postInput.value.trim();
            if (!text && !selectedImageBase64) {
                alert('Escreva algo ou selecione uma imagem antes de publicar.');
                return;
            }

            const postObject = {
                id: Date.now(),
                authorId: currentUser ? currentUser.id : null,
                authorName: User.getLoggedUserName(),
                authorPhoto: userPhotoUrl,
                text,
                image: selectedImageBase64,
                location: selectedLocation,
                privacy: selectedPrivacy,
                createdAt: Date.now(),
                createdAtFormatted: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            };

            const publishBusy = document.getElementById('publishBusy');
            const proceedSave = async () => {
                const postElement = createPostElement(postObject);
                if (feedSection && createPostSection) {
                    feedSection.insertBefore(postElement, createPostSection.nextSibling);
                } else if (feedSection) {
                    feedSection.appendChild(postElement);
                }

                const savedPosts = getStoredPosts();
                savedPosts.push(postObject);
                saveStoredPosts(savedPosts);

                postInput.value = '';
                selectedLocation = '';
                selectedPrivacy = 'Público';
                selectedImageBase64 = '';
                if (imageInput) {
                    imageInput.value = '';
                }
                if (imagePreview) {
                    imagePreview.classList.add('hidden');
                    imagePreview.innerHTML = '';
                }
                if (locationInput) {
                    locationInput.value = '';
                }
                if (locationPanel) {
                    locationPanel.classList.add('hidden');
                }
                if (privacyPanel) {
                    privacyPanel.classList.add('hidden');
                }
                closePopup();
                if (publishBusy) {
                    publishBusy.classList.add('hidden');
                }
            };

            // If there is a base64 image, compress and upload it to server first
            (async () => {
                const publishBusyEl = document.getElementById('publishBusy');
                try {
                    if (selectedImageBase64 && selectedImageBase64.startsWith('data:')) {
                        if (publishBusyEl) publishBusyEl.classList.remove('hidden');
                        // compress
                        const compressed = await compressDataURL(selectedImageBase64, 1200, 2 * 1024 * 1024);
                        // upload
                        const url = await uploadDataURLToServer(compressed, `post_${Date.now()}.jpg`);
                        postObject.image = url;
                    }
                    await proceedSave();
                } catch (err) {
                    console.error('Erro no upload:', err);
                    alert('Falha ao enviar imagem: ' + err.message);
                    if (publishBusyEl) publishBusyEl.classList.add('hidden');
                }
            })();
            if (feedSection && createPostSection) {
                feedSection.insertBefore(postElement, createPostSection.nextSibling);
            } else if (feedSection) {
                feedSection.appendChild(postElement);
            }

            const savedPosts = getStoredPosts();
            savedPosts.push(postObject);
            saveStoredPosts(savedPosts);

            postInput.value = '';
            selectedLocation = '';
            selectedPrivacy = 'Público';
            selectedImageBase64 = '';
            if (imageInput) {
                imageInput.value = '';
            }
            if (imagePreview) {
                imagePreview.classList.add('hidden');
                imagePreview.innerHTML = '';
            }
            if (locationInput) {
                locationInput.value = '';
            }
            if (locationPanel) {
                locationPanel.classList.add('hidden');
            }
            if (privacyPanel) {
                privacyPanel.classList.add('hidden');
            }
            closePopup();
        });
    }

    function findPostIndex(postId) {
        const posts = getStoredPosts();
        return posts.findIndex(p => String(p.id) === String(postId));
    }

    function saveAndRerenderPosts(posts) {
        saveStoredPosts(posts);
        const existingPosts = feedSection ? Array.from(feedSection.querySelectorAll('.post, .empty-state')) : [];
        existingPosts.forEach(post => post.remove());
        if (feedSection) renderStoredPosts();
    }

    function editPost(postId) {
        const posts = getStoredPosts();
        const index = posts.findIndex(post => String(post.id) === String(postId));
        if (index === -1) return;
        const post = posts[index];
        if (!canEditPost(post)) {
            alert('A edição só é permitida nas primeiras 24 horas.');
            return;
        }
        // Open the custom edit modal instead of prompt
        openActionModal('edit', postId);
    }

    function deletePost(postId) {
        const posts = getStoredPosts();
        const updated = posts.filter(post => String(post.id) !== String(postId));
        saveAndRerenderPosts(updated);
    }

    if (feedSection) {
        feedSection.addEventListener('click', function(event) {
            const menuTrigger = event.target.closest('.post-menu-trigger');
            const imageTarget = event.target.closest('.post-image, .post-image-wrapper');
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
            if (imageTarget) {
                event.preventDefault();
                openImageModal(imageTarget.dataset.postId);
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
}

window.addEventListener('load', function() {
    initFeed();
});

// Controle do menu dropdown
const profileBtn = document.getElementById("profileBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

if (profileBtn && dropdownMenu) {
    profileBtn.addEventListener("click", function(event) {
        event.stopPropagation();
        dropdownMenu.classList.toggle("show");
    });
}

document.addEventListener("click", function() {
    if (dropdownMenu) {
        dropdownMenu.classList.remove("show");
    }
});

if (dropdownMenu) {
    dropdownMenu.addEventListener("click", function(event) {
        event.stopPropagation();
    });
}
