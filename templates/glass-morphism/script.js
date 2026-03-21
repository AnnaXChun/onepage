document.addEventListener('DOMContentLoaded', () => {
    // Parallax effect on mouse move
    const container = document.querySelector('.container');
    const shapes = document.querySelectorAll('.shape');

    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.clientX) / 50;
        const y = (window.innerHeight / 2 - e.clientY) / 50;

        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;
            shape.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });

    // Intersection observer for animations
    const articles = document.querySelectorAll('.content article');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    articles.forEach(article => {
        observer.observe(article);
    });

    // Add hover effect to cards
    const glassCards = document.querySelectorAll('.glass-card');

    glassCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // Smooth scroll reveal
    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        const newScrollY = window.scrollY;
        const diff = newScrollY - scrollY;

        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.3;
            shape.style.transform += ` translateY(${diff * speed * 0.1}px)`;
        });

        scrollY = newScrollY;
    });
});
