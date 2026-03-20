document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('.content');

    const items = content.querySelectorAll('h2, p, img');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 100 + index * 150);
    });

    const profileImage = document.querySelector('.profile-image');
    if (profileImage) {
        profileImage.addEventListener('mouseenter', () => {
            profileImage.style.transform = 'scale(1.05)';
        });
        profileImage.addEventListener('mouseleave', () => {
            profileImage.style.transform = 'scale(1)';
        });
    }
});
