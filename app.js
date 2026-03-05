const galleryEl = document.getElementById("gallery");
const emptyStateEl = document.getElementById("emptyState");
const fileInputEl = document.getElementById("fileInput");
const photoCardTemplate = document.getElementById("photoCardTemplate");
const birthdayOverlayEl = document.getElementById("birthdayOverlay");
const birthdayImageEl = document.getElementById("birthdayImage");
const birthdayCloseEl = document.getElementById("birthdayClose");
const confettiCanvasEl = document.getElementById("confettiCanvas");
const lightboxEl = document.getElementById("lightbox");
const lightboxImageEl = document.getElementById("lightboxImage");
const lightboxCounterEl = document.getElementById("lightboxCounter");
const lightboxCloseEl = document.getElementById("lightboxClose");
const lightboxPrevEl = document.getElementById("lightboxPrev");
const lightboxNextEl = document.getElementById("lightboxNext");

const galleryItems = [];
let lightboxIndex = 0;
let confettiAnimationId = null;
let confettiResizeHandler = null;
let lastWheelAt = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchDeltaX = 0;
let touchDeltaY = 0;
let touchDragging = false;

function on(el, event, handler, options) {
  if (!el) return;
  el.addEventListener(event, handler, options);
}

function isViewportZoomed() {
  return Boolean(window.visualViewport && window.visualViewport.scale > 1.01);
}

function captionFromSrc(src, fallback) {
  if (typeof src !== "string" || !src) return fallback;

  const lastSegment = src.split("/").pop() || src;
  const withoutExtension = lastSegment.replace(/\.[a-z0-9]+$/i, "");
  let decoded = withoutExtension;
  try {
    decoded = decodeURIComponent(withoutExtension);
  } catch {
    decoded = withoutExtension;
  }

  return decoded.replace(/[_-]+/g, " ").trim() || fallback;
}

function normalizePhoto(photo, index) {
  const fallback = `Photo ${index + 1}`;

  if (typeof photo === "string") {
    const label = captionFromSrc(photo, fallback);
    return {
      src: photo,
      caption: "",
      alt: label,
    };
  }

  const label = photo.caption || captionFromSrc(photo.src, fallback);

  return {
    src: photo.src,
    caption: photo.caption || "",
    alt: photo.alt || label,
  };
}

function renderGallery() {
  if (!galleryEl) return;
  galleryEl.innerHTML = "";

  if (!galleryItems.length) {
    emptyStateEl.hidden = false;
    return;
  }

  emptyStateEl.hidden = true;

  galleryItems.forEach((photo, index) => {
    const card = photoCardTemplate.content.firstElementChild.cloneNode(true);
    card.style.animationDelay = `${Math.min(index * 35, 420)}ms`;
    card.setAttribute("aria-label", `Open photo ${index + 1}`);

    const img = card.querySelector("img");

    img.src = photo.src;
    img.alt = photo.alt;
    card.addEventListener("click", () => openLightbox(index));

    galleryEl.appendChild(card);
  });
}

function clampIndex(index) {
  if (!galleryItems.length) return 0;
  return (index + galleryItems.length) % galleryItems.length;
}

function updateLightbox(index) {
  if (!galleryItems.length || !lightboxImageEl || !lightboxCounterEl) return;
  lightboxIndex = clampIndex(index);
  const current = galleryItems[lightboxIndex];
  lightboxImageEl.src = current.src;
  lightboxImageEl.alt = current.alt || `Photo ${lightboxIndex + 1}`;
  lightboxCounterEl.textContent = `${lightboxIndex + 1} / ${galleryItems.length}`;
}

function openLightbox(index) {
  if (!galleryItems.length || !lightboxEl) return;
  updateLightbox(index);
  lightboxEl.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.hidden = true;
  document.body.style.overflow = "";
}

function showNextPhoto(step) {
  updateLightbox(lightboxIndex + step);
}

function resetLightboxImagePosition(animated = true) {
  if (!lightboxImageEl) return;
  lightboxImageEl.style.transition = animated ? "transform 220ms ease, opacity 220ms ease" : "none";
  lightboxImageEl.style.transform = "translateX(0)";
  lightboxImageEl.style.opacity = "1";
}

function animatePhotoChange(direction) {
  if (!lightboxImageEl) {
    showNextPhoto(direction);
    return;
  }

  const outX = direction > 0 ? -window.innerWidth : window.innerWidth;
  const inX = direction > 0 ? window.innerWidth * 0.22 : -window.innerWidth * 0.22;

  lightboxImageEl.style.transition = "transform 180ms ease, opacity 180ms ease";
  lightboxImageEl.style.transform = `translateX(${outX}px)`;
  lightboxImageEl.style.opacity = "0.2";

  window.setTimeout(() => {
    showNextPhoto(direction);
    lightboxImageEl.style.transition = "none";
    lightboxImageEl.style.transform = `translateX(${inX}px)`;
    lightboxImageEl.style.opacity = "0.2";

    requestAnimationFrame(() => {
      lightboxImageEl.style.transition = "transform 220ms ease, opacity 220ms ease";
      lightboxImageEl.style.transform = "translateX(0)";
      lightboxImageEl.style.opacity = "1";
    });
  }, 170);
}

function findBirthdayImage() {
  const preferred = galleryItems.find((item) => /100[ _-]?0022/i.test(item.src));
  if (preferred) return preferred.src;
  return galleryItems[0]?.src || "";
}

function startConfetti(durationMs = 3400) {
  if (!confettiCanvasEl || !birthdayOverlayEl) return;
  const canvas = confettiCanvasEl;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const colors = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#ffffff"];
  const particles = [];
  const targetCount = Math.max(120, Math.floor(window.innerWidth / 8));
  const endAt = performance.now() + durationMs;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  confettiResizeHandler = resize;
  window.addEventListener("resize", confettiResizeHandler);

  for (let i = 0; i < targetCount; i += 1) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: 3 + Math.random() * 6,
      speedY: 1.2 + Math.random() * 3.6,
      speedX: -1.2 + Math.random() * 2.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: -0.08 + Math.random() * 0.16,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const particle of particles) {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.rotation += particle.rotationSpeed;
      if (particle.y > canvas.height + 20) {
        particle.y = -20;
        particle.x = Math.random() * canvas.width;
      }

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
    }

    if (now < endAt && !birthdayOverlayEl.hidden) {
      confettiAnimationId = requestAnimationFrame(frame);
    } else {
      confettiAnimationId = null;
    }
  }

  confettiAnimationId = requestAnimationFrame(frame);
}

function stopConfetti() {
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
  }
  if (confettiResizeHandler) {
    window.removeEventListener("resize", confettiResizeHandler);
    confettiResizeHandler = null;
  }
}

function showBirthdayIntro() {
  if (!birthdayOverlayEl || !birthdayImageEl) return;

  const birthdaySrc = findBirthdayImage();
  birthdayImageEl.src = birthdaySrc;
  birthdayImageEl.hidden = !birthdaySrc;
  birthdayOverlayEl.hidden = false;
  document.body.style.overflow = "hidden";
  startConfetti();
}

function closeBirthdayIntro() {
  if (!birthdayOverlayEl) return;
  birthdayOverlayEl.hidden = true;
  stopConfetti();
  if (lightboxEl.hidden) {
    document.body.style.overflow = "";
  }
}

function addManifestPhotos(sourcePhotos) {
  sourcePhotos.forEach((photo, index) => {
    try {
      const normalized = normalizePhoto(photo, index);
      if (normalized.src) galleryItems.push(normalized);
    } catch {
      // Skip malformed entries instead of breaking the full gallery.
    }
  });
}

async function loadManifestPhotos() {
  const inlineManifest = window.FAMILY_PHOTOS_MANIFEST;
  if (Array.isArray(inlineManifest)) {
    addManifestPhotos(inlineManifest);
    renderGallery();
    return;
  }

  try {
    const res = await fetch("photos/photos.json", { cache: "no-cache" });
    if (!res.ok) {
      renderGallery();
      return;
    }

    const data = await res.json();
    const sourcePhotos = Array.isArray(data) ? data : data.photos;
    if (!Array.isArray(sourcePhotos)) {
      renderGallery();
      return;
    }

    addManifestPhotos(sourcePhotos);
  } catch {
    // No manifest yet is expected for first-time setup.
  }

  renderGallery();
}

function loadDevicePhotos(files) {
  const startIndex = galleryItems.length;

  Array.from(files).forEach((file, offset) => {
    if (!file.type.startsWith("image/")) return;
    galleryItems.push({
      src: URL.createObjectURL(file),
      caption: file.name.replace(/\.[a-z0-9]+$/i, ""),
      alt: `Uploaded photo ${startIndex + offset + 1}`,
    });
  });

  renderGallery();
}

on(fileInputEl, "change", (event) => {
  const { files } = event.target;
  if (!files || !files.length) return;
  loadDevicePhotos(files);
  fileInputEl.value = "";
});

on(lightboxCloseEl, "click", closeLightbox);
on(lightboxPrevEl, "click", () => showNextPhoto(-1));
on(lightboxNextEl, "click", () => showNextPhoto(1));
on(lightboxEl, "click", (event) => {
  if (event.target === lightboxEl) closeLightbox();
});
on(
  lightboxEl,
  "wheel",
  (event) => {
    if (!lightboxEl || lightboxEl.hidden || isViewportZoomed() || Math.abs(event.deltaY) < 8) return;
    event.preventDefault();
    const now = Date.now();
    if (now - lastWheelAt < 180) return;
    lastWheelAt = now;
    showNextPhoto(event.deltaY > 0 ? 1 : -1);
  },
  { passive: false }
);

on(lightboxEl, "touchstart", (event) => {
  if (!lightboxEl || lightboxEl.hidden || event.touches.length !== 1) return;
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchDeltaX = 0;
  touchDeltaY = 0;
  touchDragging = false;
  if (isViewportZoomed()) return;
  if (lightboxImageEl) {
    lightboxImageEl.style.transition = "none";
  }
});

on(
  lightboxEl,
  "touchmove",
  (event) => {
    if (!lightboxEl || lightboxEl.hidden || event.touches.length !== 1) return;
    if (isViewportZoomed()) return;
    const touch = event.touches[0];
    touchDeltaX = touch.clientX - touchStartX;
    touchDeltaY = touch.clientY - touchStartY;

    // Prevent page pan when user is clearly swiping across photos.
    if (Math.abs(touchDeltaX) > Math.abs(touchDeltaY) + 12) {
      touchDragging = true;
      event.preventDefault();
      if (lightboxImageEl) {
        const limitedX = Math.max(-window.innerWidth * 0.9, Math.min(window.innerWidth * 0.9, touchDeltaX));
        const opacity = Math.max(0.45, 1 - Math.abs(limitedX) / (window.innerWidth * 1.2));
        lightboxImageEl.style.transform = `translateX(${limitedX}px)`;
        lightboxImageEl.style.opacity = String(opacity);
      }
    }
  },
  { passive: false }
);

on(lightboxEl, "touchend", () => {
  if (!lightboxEl || lightboxEl.hidden) return;
  if (isViewportZoomed()) {
    resetLightboxImagePosition(false);
    return;
  }

  const minSwipeDistance = Math.max(90, window.innerWidth * 0.18);
  const isHorizontalSwipe = Math.abs(touchDeltaX) > Math.abs(touchDeltaY) + 16;

  if (!touchDragging || !isHorizontalSwipe || Math.abs(touchDeltaX) < minSwipeDistance) {
    resetLightboxImagePosition(true);
    return;
  }

  // Swipe left -> next image, swipe right -> previous image.
  animatePhotoChange(touchDeltaX < 0 ? 1 : -1);
});

on(lightboxEl, "touchcancel", () => {
  resetLightboxImagePosition(true);
});

on(birthdayCloseEl, "click", closeBirthdayIntro);
on(birthdayOverlayEl, "click", (event) => {
  if (event.target === birthdayOverlayEl) closeBirthdayIntro();
});

document.addEventListener("keydown", (event) => {
  if (birthdayOverlayEl && !birthdayOverlayEl.hidden && event.key === "Escape") {
    closeBirthdayIntro();
    return;
  }

  if (!lightboxEl || lightboxEl.hidden) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowRight") showNextPhoto(1);
  if (event.key === "ArrowLeft") showNextPhoto(-1);
});

loadManifestPhotos().finally(showBirthdayIntro);
