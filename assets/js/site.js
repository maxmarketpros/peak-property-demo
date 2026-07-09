// Peak Property Electric — shared site behavior.

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// Scroll fade-in
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.svc-card,.why-item,.step,.review-card,.work-card,.area-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease, background .2s';
  obs.observe(el);
});

// Mobile nav toggle
(function () {
  var t = document.querySelector('.nav-toggle'), l = document.querySelector('.nav-links');
  if (!t || !l) return;
  t.addEventListener('click', function () {
    var open = l.classList.toggle('open');
    t.classList.toggle('open', open);
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  l.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      l.classList.remove('open');
      t.classList.remove('open');
      t.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Mobile dropdown accordions (desktop uses CSS :hover/:focus-within)
document.querySelectorAll('.has-drop .drop-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.parentElement.querySelector('.drop-panel');
    if (!panel) return;
    const open = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});
