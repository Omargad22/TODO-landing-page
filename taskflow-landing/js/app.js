/* ================================
   TaskFlow Landing Page JavaScript
   ================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all features
    initNavbar();
    initMobileMenu();
    initScrollAnimations();
    initFormHandler();
    initProgressAnimation();
});

/* ================================
   Navbar Scroll Effect
   ================================ */
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;

                // Add/remove scrolled class
                if (currentScrollY > 50) {
                    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                    navbar.style.boxShadow = '0 4px 20px rgba(100, 116, 139, 0.1)';
                } else {
                    navbar.style.background = 'rgba(255, 255, 255, 0.8)';
                    navbar.style.boxShadow = 'none';
                }

                lastScrollY = currentScrollY;
                ticking = false;
            });
            ticking = true;
        }
    });
}

/* ================================
   Mobile Menu Toggle
   ================================ */
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navButtons = document.querySelector('.nav-buttons');

    if (!mobileMenuBtn) return;

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');

        // Toggle menu visibility
        if (navLinks) {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = 'rgba(255, 255, 255, 0.98)';
            navLinks.style.padding = '24px';
            navLinks.style.gap = '16px';
        }

        // Animate hamburger icon
        const spans = mobileMenuBtn.querySelectorAll('span');
        if (mobileMenuBtn.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // Close menu when clicking links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            if (navLinks) navLinks.style.display = '';
        });
    });
}

/* ================================
   Scroll Animations (CSS is in stylesheet)
   ================================ */
function initScrollAnimations() {
    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Just make everything visible immediately
        document.querySelectorAll('section').forEach(section => {
            section.style.opacity = '1';
            section.style.transform = 'none';
        });
        return;
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Stagger animation for grid items
                const items = entry.target.querySelectorAll('.feature-card, .step, .pricing-card, .testimonial-card');
                items.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('visible');
                    }, index * 80); // Slightly faster stagger
                });

                // Unobserve after animating
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('animate-on-scroll');
        observer.observe(section);
    });
}

/* ================================
   Form Handler
   ================================ */
function initFormHandler() {
    const form = document.getElementById('signup-form');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const input = form.querySelector('.form-input');
        const email = input.value;

        if (email && isValidEmail(email)) {
            // Show success message
            showNotification('🎉 Thanks for signing up! Check your email to get started.', 'success');
            input.value = '';
        } else {
            showNotification('Please enter a valid email address.', 'error');
        }
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNotification(message, type) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'};
        color: white;
        border-radius: 12px;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/* ================================
   Progress Bar Animation
   ================================ */
function initProgressAnimation() {
    const progressFill = document.querySelector('.progress-fill');

    if (!progressFill) return;

    // Animate progress on load
    setTimeout(() => {
        progressFill.style.width = '40%';
    }, 1000);

    // Add task completion simulation
    const taskItems = document.querySelectorAll('.task-item:not(.completed)');
    taskItems.forEach((item, index) => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const check = item.querySelector('.task-check');
            if (!item.classList.contains('completed')) {
                item.classList.add('completed');
                check.textContent = '✓';

                // Update progress
                const completedCount = document.querySelectorAll('.task-item.completed').length;
                const totalCount = document.querySelectorAll('.task-item').length;
                const progress = (completedCount / totalCount) * 100;

                progressFill.style.width = `${progress}%`;

                const progressText = document.querySelector('.progress-text');
                if (progressText) {
                    progressText.textContent = `${completedCount} of ${totalCount} tasks completed today`;
                }
            }
        });
    });
}

/* ================================
   Smooth Scroll for Anchor Links
   ================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

/* ================================
   Parallax Effect for Hero (Optimized)
   ================================ */
(function () {
    // Skip parallax if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const hero = document.querySelector('.hero-bg');
    const orbs = document.querySelectorAll('.gradient-orb');

    // Early exit if no hero section (not on landing page)
    if (!hero || orbs.length === 0) return;

    let parallaxTicking = false;

    window.addEventListener('scroll', () => {
        if (!parallaxTicking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                // Early bailout if scrolled past hero
                if (scrollY < 800) {
                    orbs.forEach((orb, index) => {
                        const speed = 0.05 + (index * 0.02); // Reduced speed for smoother feel
                        orb.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
                    });
                }
                parallaxTicking = false;
            });
            parallaxTicking = true;
        }
    }, { passive: true });
})();
