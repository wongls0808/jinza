// =========================================
// 导航栏滚动效果
// =========================================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// =========================================
// 导航链接激活状态
// =========================================
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

function updateActiveLink() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveLink);

// =========================================
// 平滑滚动到锚点
// =========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// =========================================
// 返回顶部按钮
// =========================================
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// =========================================
// 品牌卡片悬停效果
// =========================================
const brandCards = document.querySelectorAll('.brand-card');

brandCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.05)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// =========================================
// 滚动动画 - 元素进入视口时添加动画
// =========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// 观察所有需要动画的元素
const animateElements = document.querySelectorAll(
    '.product-card, .service-item, .news-card, .about-image-item, .stat-item, .contact-item'
);

animateElements.forEach(el => {
    observer.observe(el);
});

// =========================================
// 表单提交处理
// =========================================
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 获取表单数据
    const formData = new FormData(contactForm);
    
    // 这里可以添加实际的表单提交逻辑
    // 例如使用 fetch API 发送到服务器
    
    // Show success message
    alert('Thank you for your message! We will contact you as soon as possible.');
    
    // Reset form
    contactForm.reset();
});

// =========================================
// 数字滚动动画（统计数据）
// =========================================
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value + '+';
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// 当统计区域进入视口时触发动画
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const text = stat.textContent;
                const value = parseInt(text);
                animateValue(stat, 0, value, 2000);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const csrStats = document.querySelector('.csr-stats');
if (csrStats) {
    statsObserver.observe(csrStats);
}

// =========================================
// 页面加载完成后的初始化
// =========================================
window.addEventListener('load', () => {
    // 添加页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // 初始化第一个滑块
    showSlide(0);
});

// =========================================
// 键盘导航支持
// =========================================
document.addEventListener('keydown', (e) => {
    // 左箭头键 - 上一张幻灯片
    if (e.key === 'ArrowLeft') {
        prevSlide();
        resetSlideInterval();
    }
    // 右箭头键 - 下一张幻灯片
    if (e.key === 'ArrowRight') {
        nextSlide();
        resetSlideInterval();
    }
});

// =========================================
// 防止快速点击
// =========================================
let isAnimating = false;

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =========================================
// 懒加载图片（如果需要）
// =========================================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// =========================================
// Console Information
// =========================================
console.log('%cWelcome to 3TREES Official Website!', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%cBuilt with Modern Technology', 'color: #764ba2; font-size: 14px;');
console.log('%cAuthorized Distributor for Malaysia', 'color: #667eea; font-size: 12px;');

// =========================================
// WeChat QR Code Modal
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const wechatBtn = document.getElementById('wechatBtn');
    const wechatModal = document.getElementById('wechatModal');
    const wechatClose = document.querySelector('.wechat-close');

    if (wechatBtn) {
        wechatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('WeChat button clicked'); // Debug
            wechatModal.classList.add('show');
        });
    } else {
        console.error('WeChat button not found');
    }

    if (wechatClose) {
        wechatClose.addEventListener('click', () => {
            wechatModal.classList.remove('show');
        });
    }

    // 点击模态框外部关闭
    if (wechatModal) {
        wechatModal.addEventListener('click', (e) => {
            if (e.target === wechatModal) {
                wechatModal.classList.remove('show');
            }
        });
    }

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && wechatModal && wechatModal.classList.contains('show')) {
            wechatModal.classList.remove('show');
        }
    });
});
