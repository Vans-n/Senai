// Controle do menu dropdown
const profileBtn = document.getElementById("profileBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

// Atualiza foto do perfil se disponível
if (profileBtn && typeof User !== 'undefined' && User.getLoggedUserPhoto) {
    profileBtn.src = User.getLoggedUserPhoto();
}

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
