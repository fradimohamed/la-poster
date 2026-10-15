// Gestion du menu mobile (clic sur le bouton hamburger)
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show');
    });
}

// Simulation simple d'envoi de formulaire de contact
const contactForm = document.getElementById('contact-form');
const formMsg = document.getElementById('form-msg');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Empêche la page de se recharger réellement
        formMsg.style.display = 'block';
        contactForm.reset();
    });
}
