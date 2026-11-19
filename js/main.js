(function () {
  "use strict";

  // Lets the stylesheet know JavaScript is running, so reveal animations can be used.
  document.documentElement.classList.add("js");

  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  const scrollProgress = document.getElementById("scrollProgress");
  const toTop = document.getElementById("toTop");
  const copyEmailButton = document.getElementById("copyEmail");
  const copyLabel = document.getElementById("copyLabel");
  const toast = document.getElementById("toast");

  let toastTimer;

  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  }

  // Theme: use the saved preference when available; otherwise keep the HTML default.
  function getSavedTheme() {
    try {
      const savedTheme = window.localStorage.getItem("theme");
      return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
    } catch (error) {
      return null;
    }
  }

  function setTheme(theme, savePreference) {
    root.setAttribute("data-theme", theme);

    if (themeToggle) {
      const nextTheme = theme === "dark" ? "light" : "dark";
      themeToggle.setAttribute("aria-label", "Switch to " + nextTheme + " theme");
      themeToggle.setAttribute("title", "Switch to " + nextTheme + " theme");
    }

    if (savePreference) {
      try {
        window.localStorage.setItem("theme", theme);
      } catch (error) {
        // The theme still works for this page view if storage is unavailable.
      }
    }
  }

  const savedTheme = getSavedTheme();
  if (savedTheme) setTheme(savedTheme, false);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const currentTheme = root.getAttribute("data-theme") || "dark";
      setTheme(currentTheme === "dark" ? "light" : "dark", true);
    });
  }

  // Mobile navigation.
  function closeMenu() {
    if (!navLinks || !menuToggle) return;
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      const isOpen = navLinks.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", function (event) {
      const clickedInsideMenu = navLinks.contains(event.target);
      const clickedToggle = menuToggle.contains(event.target);
      if (!clickedInsideMenu && !clickedToggle) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });
  }

  // Update the reading progress bar and back-to-top button.
  function updateScrollUI() {
    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop =
      window.scrollY || document.documentElement.scrollTop || 0;
    const progress =
      scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;

    if (scrollProgress) {
      scrollProgress.style.width = Math.min(progress, 100) + "%";
    }

    if (toTop) {
      toTop.classList.toggle("visible", scrollTop > 500);
    }
  }

  window.addEventListener("scroll", updateScrollUI, { passive: true });
  window.addEventListener("resize", updateScrollUI);
  updateScrollUI();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Reveal sections as they enter the viewport.
  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  // Animate the statistics when they become visible.
  const counters = document.querySelectorAll("[data-count]");

  function animateCounter(element) {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";

    const target = Number(element.getAttribute("data-count"));
    if (!Number.isFinite(target)) return;

    const duration = 900;
    const startTime = performance.now();

    function updateCounter(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * easedProgress));

      if (progress < 1) {
        window.requestAnimationFrame(updateCounter);
      } else {
        element.textContent = String(target);
      }
    }

    window.requestAnimationFrame(updateCounter);
  }

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  } else {
    counters.forEach(animateCounter);
  }

  // Highlight the navigation link for the section currently in view.
  const sections = document.querySelectorAll("main section[id]");
  const sectionLinks = document.querySelectorAll(".nav-links a[data-link]");

  if ("IntersectionObserver" in window && sections.length && sectionLinks.length) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          sectionLinks.forEach(function (link) {
            const isCurrent = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("active", isCurrent);

            if (isCurrent) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      {
        rootMargin: "-25% 0px -60% 0px",
        threshold: 0
      }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  // Copy the email address to the clipboard.
  if (copyEmailButton) {
    copyEmailButton.addEventListener("click", async function () {
      const email = copyEmailButton.getAttribute("data-email");
      if (!email) return;

      try {
        await navigator.clipboard.writeText(email);
        if (copyLabel) copyLabel.textContent = "Email copied!";
        showToast("Email address copied to clipboard.");
      } catch (error) {
        // Fallback for browsers that don't support the Clipboard API.
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = email;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();

        let copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (copyError) {
          copied = false;
        }

        temporaryInput.remove();

        if (copied) {
          if (copyLabel) copyLabel.textContent = "Email copied!";
          showToast("Email address copied to clipboard.");
        } else {
          showToast("Copy failed. Please use the email address shown below.");
        }
      }

      window.setTimeout(function () {
        if (copyLabel) copyLabel.textContent = "Copy email address";
      }, 2200);
    });
  }

  // Keep the footer year current.
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());



    /* ============ DELIVERED PLATFORMS CAROUSEL ============ */

      /* ============ DELIVERED PLATFORMS CAROUSEL (AUTO-SLIDE) ============ */
  (function initSystemsCarousel() {
    const carousel = document.getElementById("systemsCarousel");
    const track = document.getElementById("systemsTrack");
    const prevBtn = document.getElementById("sysPrev");
    const nextBtn = document.getElementById("sysNext");
    const dotsContainer = document.getElementById("systemsDots");
    const counterEl = document.getElementById("systemsCounter");
    const viewport = document.getElementById("systemsViewport");

    if (!carousel || !track || !prevBtn || !nextBtn || !dotsContainer || !viewport) return;

    const cards = Array.from(track.children);
    const AUTOPLAY_DELAY = 4500;
    let currentIndex = 0;
    let autoTimer = null;
    let isPaused = false;

    function getVisibleCount() {
      return window.innerWidth <= 920 ? 1 : 2;
    }

    function getMaxIndex() {
      return Math.max(0, cards.length - getVisibleCount());
    }

    function restartDotAnimation() {
      const activeDot = dotsContainer.querySelector(".carousel-dot.active");
      if (!activeDot) return;
      activeDot.classList.remove("active");
      void activeDot.offsetWidth;
      activeDot.classList.add("active");
    }

    function buildDots() {
      dotsContainer.innerHTML = "";
      const totalPositions = getMaxIndex() + 1;
      for (let i = 0; i < totalPositions; i++) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot" + (i === currentIndex ? " active" : "");
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        dot.setAttribute("aria-selected", i === currentIndex ? "true" : "false");
        dot.addEventListener("click", function () {
          goTo(i, true);
        });
        dotsContainer.appendChild(dot);
      }
    }

    function updateCarousel() {
      const maxIndex = getMaxIndex();
      if (currentIndex > maxIndex) currentIndex = maxIndex;

      const gap = parseFloat(getComputedStyle(track).gap) || 18;
      const cardWidth = cards[0].getBoundingClientRect().width;
      const offset = currentIndex * (cardWidth + gap);

      track.style.transform = "translateX(-" + offset + "px)";

      const dots = dotsContainer.querySelectorAll(".carousel-dot");
      dots.forEach(function (dot, idx) {
        const active = idx === currentIndex;
        dot.classList.toggle("active", active);
        dot.setAttribute("aria-selected", active ? "true" : "false");
      });

      restartDotAnimation();

      if (counterEl) {
        const currentStr = String(currentIndex + 1).padStart(2, "0");
        const totalStr = String(maxIndex + 1).padStart(2, "0");
        counterEl.textContent = currentStr + " / " + totalStr;
      }
    }

    function goTo(index, resetTimer) {
      const maxIndex = getMaxIndex();
      if (index > maxIndex) currentIndex = 0;
      else if (index < 0) currentIndex = maxIndex;
      else currentIndex = index;

      updateCarousel();
      if (resetTimer) startAutoPlay();
    }

    function startAutoPlay() {
      stopAutoPlay();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      autoTimer = window.setInterval(function () {
        if (!isPaused && !document.hidden) {
          goTo(currentIndex + 1, false);
        }
      }, AUTOPLAY_DELAY);
    }

    function stopAutoPlay() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function setPaused(paused) {
      isPaused = paused;
      carousel.classList.toggle("is-paused", paused);
    }

    prevBtn.addEventListener("click", function () {
      goTo(currentIndex - 1, true);
    });

    nextBtn.addEventListener("click", function () {
      goTo(currentIndex + 1, true);
    });

    carousel.addEventListener("mouseenter", function () {
      setPaused(true);
    });

    carousel.addEventListener("mouseleave", function () {
      setPaused(false);
    });

    carousel.addEventListener("focusin", function () {
      setPaused(true);
    });

    carousel.addEventListener("focusout", function () {
      setPaused(false);
    });

    viewport.setAttribute("tabindex", "0");
    viewport.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(currentIndex - 1, true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(currentIndex + 1, true);
      }
    });

    let touchStartX = 0;
    viewport.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.changedTouches[0].screenX;
        setPaused(true);
      },
      { passive: true }
    );

    viewport.addEventListener(
      "touchend",
      function (e) {
        const delta = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(delta) > 45) {
          if (delta > 0) goTo(currentIndex + 1, true);
          else goTo(currentIndex - 1, true);
        }
        setPaused(false);
      },
      { passive: true }
    );

    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildDots();
        updateCarousel();
      }, 100);
    });

    buildDots();
    updateCarousel();
    startAutoPlay();
  })();

})();