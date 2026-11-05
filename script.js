// 새로고침 시 스크롤 복원 방지 + 항상 맨 위
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const lerp = (a, b, t) => a + (b - a) * t;

window.addEventListener("load", () => window.scrollTo(0, 0));
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("loaded")));

/* ---------- 테마 토글 ---------- */
const themeBtn = document.querySelector(".theme-toggle");
const isDark = () =>
  root.dataset.theme
    ? root.dataset.theme === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;

themeBtn.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
});

/* ---------- 요소 리빌 ---------- */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = el.getAttribute("data-reveal-delay");
    if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
    el.classList.add("in");
    // 리빌 후에는 지연을 없애 호버/틸트가 즉시 반응하도록
    setTimeout(() => el.style.setProperty("--reveal-delay", "0ms"), Number(delay || 0) + 950);
    obs.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));

/* ---------- 숫자 카운트업 ---------- */
const countObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.count);
    const start = performance.now();
    const dur = reduceMotion ? 0 : 1200;
    const tick = (now) => {
      const t = dur ? Math.min((now - start) / dur, 1) : 1;
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    obs.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));

/* ---------- 타이핑 ---------- */
const typingEl = document.querySelector(".typing");
if (typingEl) {
  const words = typingEl.dataset.words.split("|");
  if (reduceMotion) {
    typingEl.textContent = words[words.length - 1];
  } else {
    let w = 0, i = 0, deleting = false;
    const step = () => {
      const word = words[w];
      i += deleting ? -1 : 1;
      typingEl.textContent = word.slice(0, i);
      let wait = deleting ? 35 : 70;
      if (!deleting && i === word.length) { deleting = true; wait = 1800; }
      else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; wait = 400; }
      setTimeout(step, wait);
    };
    setTimeout(step, 1100);
  }
}

/* ---------- 내비게이션: 스크롤 상태, 진행 바, 활성 섹션 ---------- */
const nav = document.querySelector(".nav");
const progress = document.querySelector(".progress span");
const navLinks = [...document.querySelectorAll(".nav-links a")];
const indicator = document.querySelector(".nav-indicator");

function moveIndicator(link) {
  if (!link) { indicator.style.opacity = 0; return; }
  indicator.style.opacity = 1;
  indicator.style.width = `${link.offsetWidth}px`;
  indicator.style.transform = `translateX(${link.offsetLeft}px)`;
}

function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle("scrolled", y > 8);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.setProperty("--p", max > 0 ? y / max : 0);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    let active = null;
    navLinks.forEach((a) => {
      const on = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("active", on);
      if (on) active = a;
    });
    moveIndicator(active);
  });
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));
window.addEventListener("resize", () => moveIndicator(navLinks.find((a) => a.classList.contains("active"))));

/* ---------- 이메일 복사 ---------- */
const toast = document.querySelector(".toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}
document.querySelector(".email-copy").addEventListener("click", async (e) => {
  const email = e.currentTarget.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    showToast("이메일 주소를 복사했어요");
  } catch (err) {
    window.location.href = `mailto:${email}`;
  }
});

document.querySelector(".year").textContent = new Date().getFullYear();

/* ---------- 카드 스포트라이트 (터치에서도 동작) ---------- */
document.querySelectorAll(".spot").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

/* ---------- 이하 마우스 전용 인터랙션 ---------- */
if (finePointer && !reduceMotion) {
  root.classList.add("has-cursor");

  // 커서: 점은 즉시, 링은 부드럽게 따라옴
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

  window.addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    root.classList.remove("cursor-hidden");
  }, { passive: true });
  document.addEventListener("pointerleave", () => root.classList.add("cursor-hidden"));
  window.addEventListener("pointerdown", () => root.classList.add("cursor-down"));
  window.addEventListener("pointerup", () => root.classList.remove("cursor-down"));

  (function loop() {
    rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll("[data-cursor]").forEach((el) => {
    const cls = el.dataset.cursor === "view" ? "cursor-view" : "cursor-hover";
    el.addEventListener("pointerenter", () => root.classList.add(cls));
    el.addEventListener("pointerleave", () => root.classList.remove(cls));
  });

  // 마그네틱 버튼
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
  });

  // 3D 틸트 (프로젝트 카드, 프로필 카드)
  document.querySelectorAll(".project, .tilt").forEach((card) => {
    const max = card.classList.contains("tilt") ? 4 : 5;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-py * max}deg) rotateY(${px * max}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  // 히어로: 배경 오브 패럴랙스 + 그리드 마스크가 커서를 따라감
  const hero = document.querySelector(".hero");
  const orbs = [...document.querySelectorAll(".orb")];
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    orbs.forEach((o) => {
      const d = Number(o.dataset.depth);
      o.style.transform = `translate(${px * d * 2}px, ${py * d * 2}px)`;
    });
    hero.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
    hero.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
  });

  // Contact: Thank You 그라데이션이 커서를 따라감
  const thanks = document.querySelector(".thanks");
  document.querySelector(".contact").addEventListener("pointermove", (e) => {
    const r = thanks.getBoundingClientRect();
    thanks.style.setProperty("--tx", `${e.clientX - r.left}px`);
    thanks.style.setProperty("--ty", `${e.clientY - r.top}px`);
  });
}
