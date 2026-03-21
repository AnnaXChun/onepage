document.addEventListener('DOMContentLoaded', () => {
    // Add subtle parallax effect to background
    const inkWash = document.querySelector('.ink-wash');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (inkWash) {
            inkWash.style.transform = `translateY(${scrolled * 0.03}px)`;
        }
    });

    // Add hover effect to articles
    const articles = document.querySelectorAll('.content article');

    articles.forEach(article => {
        article.addEventListener('mouseenter', () => {
            article.style.background = 'rgba(107, 142, 107, 0.03)';
        });

        article.addEventListener('mouseleave', () => {
            article.style.background = '';
        });
    });

    // Staggered reveal on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, observerOptions);

    articles.forEach(article => {
        observer.observe(article);
    });

    // Add breathing animation to avatar
    const avatar = document.querySelector('.avatar');

    avatar.addEventListener('mouseenter', () => {
        avatar.style.animation = 'breathe 1s ease-in-out';
    });

    avatar.addEventListener('animationend', () => {
        avatar.style.animation = '';
    });

    // Add CSS for breathe animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes breathe {
            0%, 100% { transform: scale(1.05) rotate(3deg); }
            50% { transform: scale(1.1) rotate(5deg); }
        }
    `;
    document.head.appendChild(style);
});
