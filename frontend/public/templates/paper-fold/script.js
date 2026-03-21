document.addEventListener('DOMContentLoaded', () => {
    // Add paper fold animation on scroll
    const articles = document.querySelectorAll('.content article');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, {
        threshold: 0.1
    });

    articles.forEach(article => {
        observer.observe(article);
    });

    // Add slight tilt effect to profile card
    const profileCard = document.querySelector('.profile-card');

    profileCard.addEventListener('mousemove', (e) => {
        const rect = profileCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        profileCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    profileCard.addEventListener('mouseleave', () => {
        profileCard.style.transform = '';
    });

    // Stagger article animations
    articles.forEach((article, index) => {
        article.style.setProperty('--index', index);
    });

    // Add subtle paper rustle effect
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const paperTexture = document.querySelector('.paper-texture');
        if (paperTexture) {
            paperTexture.style.transform = `translateY(${scrolled * 0.02}px)`;
        }
    });
});
