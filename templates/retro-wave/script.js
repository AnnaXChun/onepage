document.addEventListener('DOMContentLoaded', () => {
    // Animate grid scroll
    const grid = document.querySelector('.grid');

    // Add scanline effect
    const synthwaveBg = document.querySelector('.synthwave-bg');
    const scanline = document.createElement('div');
    scanline.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
        );
        pointer-events: none;
        z-index: 10;
    `;
    synthwaveBg.appendChild(scanline);

    // Add hover effect to articles
    const articles = document.querySelectorAll('.content article');

    articles.forEach(article => {
        article.addEventListener('mouseenter', () => {
            article.style.textShadow = '0 0 20px rgba(255, 107, 157, 0.3)';
        });

        article.addEventListener('mouseleave', () => {
            article.style.textShadow = '';
        });
    });

    // Parallax effect on scroll
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const sun = document.querySelector('.sun');
        const mountains = document.querySelector('.mountains');

        if (sun) {
            sun.style.transform = `translateX(-50%) translateY(${currentScrollY * 0.1}px)`;
        }

        if (mountains) {
            mountains.style.transform = `translateY(${currentScrollY * 0.05}px)`;
        }

        lastScrollY = currentScrollY;
    });

    // Glitch effect on name hover
    const name = document.querySelector('.name');

    name.addEventListener('mouseenter', () => {
        name.style.animation = 'glitch 0.3s ease-in-out';
    });

    name.addEventListener('animationend', () => {
        name.style.animation = '';
    });

    // Add CSS for glitch animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes glitch {
            0%, 100% { transform: translate(0); filter: hue-rotate(0deg); }
            20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
            40% { transform: translate(2px, -2px); filter: hue-rotate(180deg); }
            60% { transform: translate(-2px, -2px); filter: hue-rotate(270deg); }
            80% { transform: translate(2px, 2px); filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});
