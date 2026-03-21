document.addEventListener('DOMContentLoaded', () => {
    const galleryItems = document.querySelectorAll('.gallery-item, .content-block');

    galleryItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });

    const heroImage = document.querySelector('.hero-image img');
    if (heroImage) {
        let scale = 1;
        const zoomIn = setInterval(() => {
            if (scale >= 1.05) clearInterval(zoomIn);
            else {
                scale += 0.001;
                heroImage.style.transform = `scale(${scale})`;
            }
        }, 30);
    }

    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (img) {
                item.classList.toggle('expanded');
            }
        });
    });
});
