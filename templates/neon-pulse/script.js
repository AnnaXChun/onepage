document.addEventListener('DOMContentLoaded', () => {
    // Staggered reveal for blog posts
    const articles = document.querySelectorAll('.content article');
    articles.forEach((article, index) => {
        article.style.animationDelay = `${0.1 + index * 0.1}s`;
    });

    // Add typing effect to name
    const nameElement = document.querySelector('.name');
    const originalText = nameElement.textContent;
    nameElement.textContent = '';
    let charIndex = 0;

    const typeInterval = setInterval(() => {
        if (charIndex < originalText.length) {
            nameElement.textContent += originalText[charIndex];
            charIndex++;
        } else {
            clearInterval(typeInterval);
        }
    }, 80);

    // Add glow intensity variation on scroll
    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        const orb = document.querySelector('.glow-orb');
        if (orb) {
            orb.style.transform = `translateX(-50%) translateY(${scrollY * 0.1}px)`;
        }
    });

    // Add ripple effect on article hover
    articles.forEach(article => {
        article.addEventListener('mouseenter', () => {
            article.style.boxShadow = `
                0 0 40px rgba(0, 245, 255, 0.15),
                0 0 80px rgba(255, 0, 255, 0.1),
                inset 0 0 40px rgba(0, 245, 255, 0.03)
            `;
        });

        article.addEventListener('mouseleave', () => {
            article.style.boxShadow = '';
        });
    });

    // Smooth parallax for background
    const bgPattern = document.querySelector('.bg-pattern');
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (bgPattern) {
            bgPattern.style.transform = `translateY(${scrolled * 0.05}px)`;
        }
    });
});
