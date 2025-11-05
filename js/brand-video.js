// =========================================
// Brand Video Page JavaScript
// =========================================

// Video controls
const brandVideo = document.getElementById('brandVideo');

// Pause/play video when user clicks on it
if (brandVideo) {
    brandVideo.addEventListener('click', function() {
        if (this.paused) {
            this.play();
        } else {
            this.pause();
        }
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href !== '#') {
            const target = document.querySelector(href);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature items
document.querySelectorAll('.feature-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

// Back link with confirmation (optional)
const backLink = document.querySelector('.back-link');
if (backLink) {
    backLink.addEventListener('click', function(e) {
        // Let the default action happen (navigation)
        // Add custom behavior here if needed
    });
}
