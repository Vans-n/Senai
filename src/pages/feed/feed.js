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

    const postAvatars = document.querySelectorAll('.user-info img');
    postAvatars.forEach(avatar => {
        avatar.src = userPhotoUrl;
    });

    const imageBtn = document.getElementById('imageBtn');
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
    const privacyPanel = document.getElementById('privacyPanel');
    const categoryPanel = document.getElementById('categoryPanel');
    const privacyRadios = document.querySelectorAll('input[name="privacy"]');
    const publishBtn = document.getElementById('publishBtn');
    const postInput = document.getElementById('postInput');
    const feedSection = document.querySelector('.feed');

    let selectedLocation = '';
    let selectedPrivacy = 'Público';
    let selectedImageBase64 = '';

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

            const newPost = document.createElement('div');
            newPost.className = 'post';
            newPost.innerHTML = `
                <div class="post-header">
                    <div class="user-info">
                        <img src="${User.getLoggedUserPhoto()}" alt="Avatar">
                        <div>
                            <h3>${User.getLoggedUserName()}</h3>
                            <span>Agora</span>
                        </div>
                    </div>
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                </div>
                <div class="post-content">
                    ${text.replace(/\n/g, '<br>')}
                    ${selectedImageBase64 ? `<img src="${selectedImageBase64}" alt="Imagem da publicação">` : ''}
                    ${selectedLocation ? `<p><strong>Localização:</strong> ${selectedLocation}</p>` : ''}
                    <p><strong>Visibilidade:</strong> ${selectedPrivacy}</p>
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

            if (feedSection) {
                const existingPost = feedSection.querySelector('.post');
                if (existingPost) {
                    feedSection.insertBefore(newPost, existingPost);
                } else {
                    feedSection.appendChild(newPost);
                }
            }

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
