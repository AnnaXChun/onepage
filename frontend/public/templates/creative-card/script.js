document.addEventListener('DOMContentLoaded', () => {
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
        profileCard.style.opacity = '0';
        profileCard.style.transform = 'translateY(30px) scale(0.9)';
        profileCard.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

        setTimeout(() => {
            profileCard.style.opacity = '1';
            profileCard.style.transform = 'translateY(0) scale(1)';
        }, 200);
    }

    const cards = document.querySelectorAll('.content-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 400 + index * 150);
    });

    const shapes = document.querySelectorAll('.shape');
    shapes.forEach((shape, index) => {
        shape.addEventListener('mouseenter', () => {
            shape.style.animationPlayState = 'paused';
            shape.style.transform = 'scale(1.1)';
        });
        shape.addEventListener('mouseleave', () => {
            shape.style.animationPlayState = 'running';
            shape.style.transform = 'scale(1)';
        });
    });
});
