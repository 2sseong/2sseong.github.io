// 새로고침 시 스크롤 복원 방지 + 항상 맨 위
if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
window.addEventListener('load', () => window.scrollTo(0, 0));

// TypeIt (서브 카피)
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#typeit")) {
    new TypeIt("#typeit", { speed: 50, startDelay: 300 })
      .type("Thanks for visiting.", { delay: 1000 })
      .delete(null, { delay: 100 })
      .type("exploring my portfolio", { delay: 800 })
      .go();
  }
});

// 요소 단위 IntersectionObserver
const ro = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = el.getAttribute('data-reveal-delay');
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
    el.classList.add('in');
    obs.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });

document.querySelectorAll('[data-reveal]').forEach(el => ro.observe(el));

// 부드러운 앵커 스크롤
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const el = document.querySelector(a.getAttribute('href'));
    if(!el) return;
    e.preventDefault();
    el.scrollIntoView({behavior:'smooth', block:'start'});
  });
});
