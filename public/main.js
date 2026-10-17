/* Toufiq EL-Dik — portfolio
   Everything here is progressive enhancement: with JS off the page still
   renders, the first hero screenshot stays visible and all content is readable.
   Under prefers-reduced-motion the hero still rotates through the three
   projects, but swaps without the cross-fade (see styles.css). */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── footer year ─────────────────────────────────────────── */
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ── reveal on scroll ────────────────────────────────────── */
  const reveals = [...document.querySelectorAll("[data-reveal]")];
  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        const shown = entries.filter((e) => e.isIntersecting);
        shown.forEach((entry, i) => {
          entry.target.style.setProperty("--reveal-delay", `${i * 70}ms`);
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ── hero: cycle through the three live projects ─────────── */
  const preview = document.querySelector("[data-preview]");
  if (!preview) return;

  const shots = [...preview.querySelectorAll("[data-preview-shot]")];
  const urlEl = preview.querySelector("[data-preview-url]");
  const nameEl = preview.querySelector("[data-preview-name]");
  const roleEl = preview.querySelector("[data-preview-role]");

  const projects = [
    {
      url: "toufiqeldik.github.io/burgerbox",
      name: "BurgerBox",
      role: "Fictional burger brand, built like a real one",
      alt: "The BurgerBox homepage: a bold headline beside hand-drawn SVG burger, fries and drink artwork.",
    },
    {
      url: "barbershop-seven-sable.vercel.app",
      name: "The Cut Barbershop",
      role: "Barbershop site with a priced service menu",
      alt: "The Cut Barbershop homepage: a gold headline over a dark photographic hero.",
    },
    {
      url: "flowule.vercel.app",
      name: "FlowUle",
      role: "Student organiser with real accounts",
      alt: "The FlowUle sign-in screen: a Welcome back card with an email and password form.",
    },
  ];

  let index = 0;
  let timer = null;

  // Hydrate the two later screenshots only once they are about to be needed,
  // so the first paint carries a single image request.
  const load = (i) => {
    const img = shots[i];
    if (!img || img.dataset.loaded === "1") return;
    if (img.dataset.src) img.src = img.dataset.src;
    img.dataset.loaded = "1";
  };

  const show = (next) => {
    index = (next + shots.length) % shots.length;
    load(index);
    load((index + 1) % shots.length);
    shots.forEach((img, i) => {
      const active = i === index;
      img.classList.toggle("is-active", active);
      if (active) {
        img.alt = projects[i].alt;
        img.removeAttribute("aria-hidden");
      } else {
        img.alt = "";
        img.setAttribute("aria-hidden", "true");
      }
    });
    const p = projects[index];
    if (urlEl) urlEl.textContent = p.url;
    if (nameEl) nameEl.textContent = p.name;
    if (roleEl) roleEl.textContent = p.role;
  };

  const start = () => {
    if (timer) return;
    timer = window.setInterval(() => show(index + 1), 4600);
  };
  const stop = () => {
    window.clearInterval(timer);
    timer = null;
  };

  // Preload the next frame shortly after load, then start cycling.
  window.addEventListener("load", () => window.setTimeout(() => load(1), 700));
  start();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  preview.addEventListener("mouseenter", stop);
  preview.addEventListener("mouseleave", start);
  preview.addEventListener("focusin", stop);
})();
