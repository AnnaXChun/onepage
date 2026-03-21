document.addEventListener('DOMContentLoaded', () => {
    const posts = document.querySelector('.posts');
    const elements = posts.querySelectorAll('h2, p, img, a');

    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.animation = `slideUp 0.6s ease forwards`;
        el.style.animationDelay = `${0.3 + index * 0.15}s`;
    });

    const photo = document.querySelector('.photo');
    if (photo) {
        photo.style.opacity = '0';
        photo.style.transform = 'scale(0.9)';
        photo.style.transition = 'transform 0.4s ease, opacity 0.4s ease';

        setTimeout(() => {
            photo.style.opacity = '1';
            photo.style.transform = 'scale(1)';
        }, 200);
    }
});
