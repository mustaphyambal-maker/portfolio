/* ============================================================
   MUSTAPHA AMBALI — PORTFOLIO SCRIPTS
   File: script.js
   Handles: Dark mode, Mobile Menu, Smooth Scroll, Form Validation
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ----------------------------------------------------------
     1. DARK / LIGHT MODE
     ---------------------------------------------------------- */
  const THEME_KEY = "ma-theme";
  const body = document.body;

  function applyTheme(theme) {
    if (theme === "dark") {
      body.classList.add("dark");
    } else {
      body.classList.remove("dark");
    }
    $$(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}

    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(systemDark ? "dark" : "light");
    }

    $$(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const isDark = body.classList.toggle("dark");
        try { localStorage.setItem(THEME_KEY, isDark ? "dark" : "light"); } catch (e) {}
        applyTheme(isDark ? "dark" : "light");
      });
    });
  }

  /* ----------------------------------------------------------
     2. STICKY NAVBAR
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
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
  }

  /* ----------------------------------------------------------
     3. MOBILE MENU
     ---------------------------------------------------------- */
  function initMobileMenu() {
    const menu = $("#mobileMenu");
    const openBtn = $(".hamburger");
    if (!menu || !openBtn) return;

    const panel = $(".mobile-menu-panel", menu);
    const closeBtns = $$("[data-close-menu]");
    let lastFocused = null;

    function openMenu() {
      lastFocused = document.activeElement;
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      openBtn.setAttribute("aria-expanded", "true");
      body.classList.add("menu-open");
      setTimeout(() => {
        const firstLink = $(".mobile-nav-links a", panel);
        if (firstLink) firstLink.focus();
      }, 100);
    }

    function closeMenu() {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      openBtn.setAttribute("aria-expanded", "false");
      body.classList.remove("menu-open");
      if (lastFocused) lastFocused.focus();
    }

    openBtn.addEventListener("click", openMenu);
    closeBtns.forEach((btn) => btn.addEventListener("click", closeMenu));
    
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) closeMenu();
    });

    $$(".mobile-nav-links a").forEach((link) => {
      link.addEventListener("click", () => setTimeout(closeMenu, 60));
    });
  }

  /* ----------------------------------------------------------
     4. SMOOTH SCROLL (For anchor links)
     ---------------------------------------------------------- */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (history.pushState) history.pushState(null, "", href);
      });
    });
  }

  /* ----------------------------------------------------------
     5. CONTACT FORM VALIDATION (Formspree)
     ---------------------------------------------------------- */
  function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;

    const status = $("#formStatus");
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
        if (group && group.classList.contains("has-error")) clearFieldError(group);
        clearStatus();
      });
    });

    form.addEventListener("submit", (e) => {
      clearStatus();
      let isValid = true;

      $$("[required]", form).forEach((field) => {
        const group = field.closest(".form-group");
        if (!field.value.trim()) {
          setFieldError(group, "This field is required.");
          isValid = false;
        }
      });

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

      // If valid, show a loading state while Formspree submits
      showStatus("success", "Sending your message...");
      
      // Formspree will handle the actual submission natively.
      // After submission, Formspree redirects to its own "Thank You" page.
    });
  }

  /* ----------------------------------------------------------
     6. FOOTER YEAR
     ---------------------------------------------------------- */
  function initFooterYear() {
    $$("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ----------------------------------------------------------
     7. BOOT
     ---------------------------------------------------------- */
  function boot() {
    initTheme();
    initStickyNav();
    initMobileMenu();
    initSmoothScroll();
    initContactForm();
    initFooterYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
