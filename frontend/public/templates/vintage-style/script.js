document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('.content');
    const elements = content.querySelectorAll('h2, p, img, blockquote');

    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.8s ease';

        setTimeout(() => {
            el.style.opacity = '1';
        }, 200 + index * 200);
    });

    const avatar = document.querySelector('.avatar');
    if (avatar) {
        avatar.style.transition = 'transform 0.5s ease';
        avatar.addEventListener('mouseenter', () => {
            avatar.style.transform = 'scale(1.05) rotate(2deg)';
        });
        avatar.addEventListener('mouseleave', () => {
            avatar.style.transform = 'scale(1) rotate(0deg)';
        });
    }

    const headings = document.querySelectorAll('.content h2');
    headings.forEach(h2 => {
        const text = h2.textContent;
        h2.textContent = '';
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                h2.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        setTimeout(typeWriter, 500);
    });
});
