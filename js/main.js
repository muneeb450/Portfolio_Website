(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  /* ===== Navigation ===== */
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  const navbar = document.querySelector('.navbar');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const scrollTopBtn = document.getElementById('scrollTop');

  toggle.addEventListener('click', () => {
    menu.classList.toggle('active');
    toggle.classList.toggle('active');
    toggle.setAttribute('aria-expanded', menu.classList.contains('active'));
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      menu.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) {
      menu.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  function updateNavOnScroll() {
    let current = 'hero';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  }

  window.addEventListener('scroll', updateNavOnScroll, { passive: true });
  updateNavOnScroll();

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* ===== Typing Effect ===== */
  const phrases = [
    'BS Computer Science',
    'Aspiring AI Developer',
    'Python & Data Science',
    'System Administrator'
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typingElement = document.querySelector('.typing-text');

  function typeEffect() {
    if (!typingElement || prefersReducedMotion) {
      if (typingElement) typingElement.textContent = phrases[0];
      return;
    }
    const currentPhrase = phrases[phraseIndex];
    if (isDeleting) {
      typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }
    let delay = isDeleting ? 30 : 60;
    if (!isDeleting && charIndex === currentPhrase.length) {
      delay = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 500;
    }
    setTimeout(typeEffect, delay);
  }
  typeEffect();

  /* ===== Spotlight & Cursor Glow ===== */
  const spotlight = document.getElementById('spotlight');
  const cursorGlow = document.getElementById('cursor-glow');
  if (!isTouchDevice && !prefersReducedMotion) {
    let glowX = 0;
    let glowY = 0;
    let targetX = 0;
    let targetY = 0;

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      document.body.classList.add('cursor-active', 'spotlight-active');
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-active', 'spotlight-active');
    });

    function animateGlow() {
      glowX += (targetX - glowX) * 0.08;
      glowY += (targetY - glowY) * 0.08;
      const pos = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;
      if (cursorGlow) cursorGlow.style.transform = pos;
      if (spotlight) spotlight.style.transform = pos;
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }

  /* ===== Particles ===== */
  const canvas = document.getElementById('particles-canvas');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = window.innerWidth < 768 ? 25 : 40;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.4 + 0.1
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108, 99, 255, ${p.opacity})`;
        ctx.fill();
      });
      requestAnimationFrame(drawParticles);
    }

    resizeCanvas();
    initParticles();
    drawParticles();
    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    }, { passive: true });
  }

  /* ===== Magnetic Buttons & Ripple ===== */
  function initMagneticButtons() {
    if (prefersReducedMotion || isTouchDevice) return;

    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });

      btn.addEventListener('click', function (e) {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const size = Math.max(rect.width, rect.height) * 0.6;
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  initMagneticButtons();

  /* ===== 3D Tilt Cards ===== */
  function initTiltCards() {
    if (prefersReducedMotion || isTouchDevice || window.innerWidth < 768) return;

    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }
  initTiltCards();

  /* ===== Skill Bars ===== */
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const width = bar.getAttribute('data-width');
        bar.style.setProperty('--width', width + '%');
        bar.classList.add('animated');
        skillObserver.unobserve(bar);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.skill-progress').forEach(bar => {
    skillObserver.observe(bar);
  });

  /* ===== Animated Counters ===== */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;

    const duration = 2000;
    const start = performance.now();

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOutQuart(progress) * target);
      el.innerHTML = value + (suffix ? `<span class="suffix">${suffix}</span>` : '');
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number[data-count]').forEach(el => {
    counterObserver.observe(el);
  });

  /* ===== Contact Form ===== */
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      contactForm.querySelector('.form-submit').disabled = true;
      setTimeout(() => {
        contactForm.reset();
        formSuccess.hidden = false;
        formSuccess.classList.add('visible');
        contactForm.querySelector('.form-submit').disabled = false;
        if (!prefersReducedMotion && typeof gsap !== 'undefined') {
          gsap.from(formSuccess, { scale: 0.9, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
        }
      }, 800);
    });
  }

  /* ===== GSAP Animations ===== */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  if (prefersReducedMotion) {
    gsap.set('.hero-reveal, .reveal-item', { opacity: 1, y: 0, x: 0, clearProps: 'all' });
    document.querySelectorAll('.timeline-item').forEach(item => item.classList.add('revealed'));
    return;
  }

  /* Hero entrance */
  gsap.to('.hero-reveal', {
    opacity: 1,
    y: 0,
    duration: 0.7,
    stagger: 0.1,
    ease: 'power3.out',
    delay: 0.15
  });

  /* Floating particles around hero heading */
  const heroHeading = document.querySelector('.hero h1');
  if (heroHeading) {
    const parent = heroHeading.parentElement;
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('span');
      dot.className = 'txt-particle';
      const size = 2 + Math.random() * 3;
      const startX = (Math.random() - 0.5) * 100;
      const startY = (Math.random() - 0.5) * 60;
      dot.style.cssText = `width:${size}px;height:${size}px;left:${50 + startX}%;top:${50 + startY}%;opacity:0;`;
      parent.appendChild(dot);

      gsap.to(dot, {
        opacity: 0.6,
        scale: 1.5,
        duration: 1 + Math.random(),
        delay: 0.8 + Math.random() * 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });

      gsap.to(dot, {
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 30,
        duration: 3 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random(),
      });
    }
  }

  /* Hero stats staggered reveal */
  gsap.from('.hero-stats .stat-item', {
    scrollTrigger: {
      trigger: '.hero-stats',
      start: 'top 92%',
      toggleActions: 'play none none none',
      once: true,
    },
    opacity: 0,
    y: 30,
    stagger: 0.12,
    duration: 0.6,
    ease: 'power3.out',
  });

  /* Scroll-triggered section reveals */
  document.querySelectorAll('.reveal-section').forEach((section, sectionIndex) => {
    const items = section.querySelectorAll('.reveal-item');
    items.forEach((item, itemIndex) => {
      const fromLeft = (sectionIndex + itemIndex) % 2 === 0;
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 88%',
          toggleActions: 'play none none none',
          once: true
        },
        opacity: 0,
        y: 40,
        x: fromLeft ? -30 : 30,
        duration: 0.7,
        ease: 'power3.out'
      });
    });
  });

  /* Staggered skill cards */
  gsap.from('.skill-category', {
    scrollTrigger: {
      trigger: '.skills-grid',
      start: 'top 80%',
      once: true
    },
    opacity: 0,
    y: 50,
    stagger: 0.15,
    duration: 0.7,
    ease: 'power3.out'
  });

  /* Staggered cert cards */
  gsap.from('.cert-card', {
    scrollTrigger: {
      trigger: '.cert-grid',
      start: 'top 80%',
      once: true
    },
    opacity: 0,
    y: 40,
    stagger: 0.1,
    duration: 0.6,
    ease: 'power3.out'
  });

  /* Project card reveals */
  gsap.from('.project-card', {
    scrollTrigger: {
      trigger: '.projects-grid',
      start: 'top 80%',
      once: true
    },
    opacity: 0,
    y: 60,
    stagger: 0.15,
    duration: 0.8,
    ease: 'power3.out'
  });

  /* Contact cards stagger */
  gsap.from('.contact-card', {
    scrollTrigger: {
      trigger: '.contact-grid',
      start: 'top 85%',
      once: true
    },
    opacity: 0,
    y: 30,
    stagger: 0.08,
    duration: 0.6,
    ease: 'power3.out'
  });

  /* Contact form fields stagger */
  gsap.from('.contact-form .reveal-item', {
    scrollTrigger: {
      trigger: '.contact-form',
      start: 'top 85%',
      once: true
    },
    opacity: 0,
    y: 25,
    stagger: 0.1,
    duration: 0.6,
    ease: 'power3.out'
  });

  /* Timeline sequential reveal + progress line */
  document.querySelectorAll('[data-timeline]').forEach(timeline => {
    const items = timeline.querySelectorAll('.timeline-item');
    const progressLine = timeline.querySelector('.timeline-progress');

    items.forEach((item, index) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none none',
          once: true,
          onEnter: () => item.classList.add('revealed')
        },
        opacity: 0,
        x: -40,
        duration: 0.7,
        delay: index * 0.15,
        ease: 'power3.out'
      });

      gsap.from(item.querySelector('.timeline-icon'), {
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          once: true
        },
        scale: 0,
        rotation: -180,
        duration: 0.6,
        delay: index * 0.15 + 0.1,
        ease: 'back.out(1.7)'
      });
    });

    if (progressLine) {
      gsap.to(progressLine, {
        scrollTrigger: {
          trigger: timeline,
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: 0.5
        },
        height: '100%',
        ease: 'none'
      });
    }
  });

  /* Project parallax on scroll */
  document.querySelectorAll('[data-parallax]').forEach(visual => {
    const inner = visual.querySelector('.project-visual-inner');
    if (!inner) return;

    gsap.to(inner, {
      scrollTrigger: {
        trigger: visual,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      },
      y: -20,
      ease: 'none'
    });
  });

  /* Marquee pause on hover */
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    marqueeTrack.addEventListener('mouseenter', () => {
      marqueeTrack.style.animationPlayState = 'paused';
    });
    marqueeTrack.addEventListener('mouseleave', () => {
      marqueeTrack.style.animationPlayState = 'running';
    });
  }
})();
