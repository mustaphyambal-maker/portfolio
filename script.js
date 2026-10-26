/* ============================================================
   MUSTAPHA AMBALI — PORTFOLIO SCRIPTS
   File: script.js
   Shared across index.html, projects.html, about.html, contact.html
   No libraries. Vanilla JS only.
   ============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     0. HELPERS
     ---------------------------------------------------------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------------------------------------
     1. DARK / LIGHT MODE TOGGLE
     - Reads saved preference from localStorage
     - Falls back to system preference
     - Persists every toggle
     ---------------------------------------------------------- */
  const THEME_KEY = "ma-theme";
  const body = document.body;

  function applyTheme(theme) {
    if (theme === "dark") {
      body.classList.add("dark");
    } else {
      body.classList.remove("dark");
    }
    // Update the aria-pressed state on all theme toggle buttons
    $$(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (e) {
      /* localStorage may be blocked — ignore */
    }

    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
    } else {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      applyTheme(systemDark ? "dark" : "light");
    }

    $$(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const isDark = body.classList.toggle("dark");
        try {
          localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
        } catch (e) {
          /* ignore */
        }
        applyTheme(isDark ? "dark" : "light");
      });
    });
  }

  /* ----------------------------------------------------------
     2. STICKY NAVBAR — add .is-scrolled after scroll
     ---------------------------------------------------------- */
  function initStickyNav() {
    const navbar = $(".navbar");
    if (!navbar) return;

    const toggle = () => {
      if (window.scrollY > 8) {
        navbar.classList.add("is-scrolled");
      } else {
        navbar.classList.remove("is-scrolled");
      }
    };
    toggle(); // run once on load
    window.addEventListener("scroll", toggle, { passive: true });
  }

  /* ----------------------------------------------------------
     3. MOBILE MENU (hamburger)
     - Opens a slide-in panel
     - Closes on: X button, backdrop click, Escape key, link click
     - Locks body scroll while open
     - Traps focus inside the panel (basic)
     ---------------------------------------------------------- */
  function initMobileMenu() {
    const menu = $("#mobileMenu");
    const openBtn = $(".hamburger");
    if (!menu || !openBtn) return;

    const panel = $(".mobile-menu-panel", menu);
    const backdrop = $(".mobile-menu-backdrop", menu);
    const closeBtn = $(".mobile-menu-close", menu);
    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    let lastFocused = null;

    function openMenu() {
      lastFocused = document.activeElement;
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      openBtn.setAttribute("aria-expanded", "true");
      body.classList.add("menu-open");

      // Move focus to close button for screen reader users
      requestAnimationFrame(() => {
        if (closeBtn) closeBtn.focus();
      });

      document.addEventListener("keydown", onKeydown);
    }

    function closeMenu() {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      openBtn.setAttribute("aria-expanded", "false");
      body.classList.remove("menu-open");

      document.removeEventListener("keydown", onKeydown);

      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    function onKeydown(e) {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key !== "Tab") return;

      // Simple focus trap
      const focusables = $$(focusableSelector, panel).filter(
        (el) => el.offsetParent !== null
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    openBtn.addEventListener("click", openMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    if (backdrop) backdrop.addEventListener("click", closeMenu);

    // Close when any link inside the menu is clicked
    $$("a", panel).forEach((link) => {
      link.addEventListener("click", () => {
        // Small delay so the click registers before we close
        setTimeout(closeMenu, 60);
      });
    });

    // Close menu if viewport resizes to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 900 && menu.classList.contains("is-open")) {
        closeMenu();
      }
    });
  }

  /* ----------------------------------------------------------
     4. SMOOTH SCROLL for in-page anchor links
     (CSS scroll-behavior handles most cases; this adds an
      offset-aware fallback for browsers that don't support it)
     ---------------------------------------------------------- */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });

        // Update URL hash without jumping
        if (history.pushState) {
          history.pushState(null, "", href);
        }
      });
    });
  }

  /* ----------------------------------------------------------
     5. REVEAL ON SCROLL — adds .is-visible to .reveal elements
     ---------------------------------------------------------- */
  function initReveal() {
    const items = $$(".reveal");
    if (items.length === 0) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ----------------------------------------------------------
     6. ANIMATE SKILL BARS
     Reads data-level="85" and sets --level after it enters view
     ---------------------------------------------------------- */
  function initSkillBars() {
    const bars = $$(".skill-fill");
    if (bars.length === 0) return;

    const animate = (el) => {
      const level = el.getAttribute("data-level") || "0";
      el.style.setProperty("--level", level + "%");
      el.classList.add("is-animated");
    };

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      bars.forEach(animate);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    bars.forEach((el) => observer.observe(el));
  }

  /* ----------------------------------------------------------
     7. ACTIVE NAV LINK — highlight current page
     Works for both desktop nav and mobile menu
     ---------------------------------------------------------- */
  function initActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    const map = {
      "index.html": "home",
      "": "home",
      "projects.html": "projects",
      "about.html": "about",
      "contact.html": "contact",
    };
    const current = map[path];

    $$(".nav-links a, .mobile-nav-links a").forEach((link) => {
      const href = (link.getAttribute("href") || "").split("/").pop();
      if (href === path || (path === "" && href === "index.html")) {
        link.classList.add("active");
      }
    });
    // Fallback: if nothing matched but we know the key
    if (current) {
      $$(`[data-nav="${current}"]`).forEach((el) =>
        el.classList.add("active")
      );
    }
  }

  /* ----------------------------------------------------------
     8. CONTACT FORM VALIDATION
     - Client-side checks
     - Shows success message on submit (before Formspree redirect)
     - If Formspree ID is still the placeholder, block submission
       and show a friendly note
     ---------------------------------------------------------- */
  function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;

    const status = $("#formStatus");
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // If the action still contains the placeholder, don't let it submit
    const action = form.getAttribute("action") || "";
    const isPlaceholder = action.includes("YOUR_FORM_ID_HERE");

    function setFieldError(group, message) {
      group.classList.add("has-error");
      const err = group.querySelector(".form-error");
      if (err) err.textContent = message;
    }

    function clearFieldError(group) {
      group.classList.remove("has-error");
      const err = group.querySelector(".form-error");
      if (err) err.textContent = "";
    }

    function showStatus(type, message) {
      if (!status) return;
      status.className = "form-status is-" + type;
      status.textContent = message;
    }

    function clearStatus() {
      if (!status) return;
      status.className = "form-status";
      status.textContent = "";
    }

    // Live validation on blur
    $$("input, textarea", form).forEach((input) => {
      input.addEventListener("blur", () => {
        const group = input.closest(".form-group");
        if (!group) return;

        if (input.hasAttribute("required") && !input.value.trim()) {
          setFieldError(group, "This field is required.");
        } else if (input.type === "email" && input.value && !emailRe.test(input.value)) {
          setFieldError(group, "Please enter a valid email address.");
        } else {
          clearFieldError(group);
        }
      });

      input.addEventListener("input", () => {
        const group = input.closest(".form-group");
        if (group && group.classList.contains("has-error")) {
          clearFieldError(group);
        }
        clearStatus();
      });
    });

    form.addEventListener("submit", (e) => {
      clearStatus();
      let isValid = true;

      // Check required fields
      $$("[required]", form).forEach((field) => {
        const group = field.closest(".form-group");
        if (!field.value.trim()) {
          setFieldError(group, "This field is required.");
          isValid = false;
        }
      });

      // Check email format
      const emailField = form.querySelector('input[type="email"]');
      if (emailField && emailField.value && !emailRe.test(emailField.value)) {
        setFieldError(emailField.closest(".form-group"), "Please enter a valid email address.");
        isValid = false;
      }

      if (!isValid) {
        e.preventDefault();
        const firstError = form.querySelector(".has-error input, .has-error textarea");
        if (firstError) firstError.focus();
        showStatus("error", "Please fix the highlighted fields and try again.");
        return;
      }

      // Block submission if Formspree ID hasn't been set yet
      if (isPlaceholder) {
        e.preventDefault();
        showStatus(
          "error",
          "Form isn't connected yet. Please email me directly at hello@example.com (edit this in script.js)."
        );
        return;
      }

      // Real Formspree submission — show a loading message
      showStatus("success", "Sending your message…");
      // Formspree will handle the redirect / response natively.
    });
  }

  /* ----------------------------------------------------------
     9. CURRENT YEAR IN FOOTER
     ---------------------------------------------------------- */
  function initFooterYear() {
    $$("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ----------------------------------------------------------
     10. BOOT
     ---------------------------------------------------------- */
  function boot() {
    initTheme();
    initStickyNav();
    initMobileMenu();
    initSmoothScroll();
    initReveal();
    initSkillBars();
    initActiveNav();
    initContactForm();
    initFooterYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();