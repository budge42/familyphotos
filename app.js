const galleryEl = document.getElementById("gallery");
const emptyStateEl = document.getElementById("emptyState");
const fileInputEl = document.getElementById("fileInput");
const photoCardTemplate = document.getElementById("photoCardTemplate");

const galleryItems = [];

function captionFromSrc(src, fallback) {
  if (typeof src !== "string" || !src) return fallback;

  const lastSegment = src.split("/").pop() || src;
  const withoutExtension = lastSegment.replace(/\.[a-z0-9]+$/i, "");
  const decoded = decodeURIComponent(withoutExtension);

  return decoded.replace(/[_-]+/g, " ").trim() || fallback;
}

function normalizePhoto(photo, index) {
  const fallback = `Photo ${index + 1}`;

  if (typeof photo === "string") {
    const caption = captionFromSrc(photo, fallback);
    return {
      src: photo,
      caption,
      alt: caption,
    };
  }

  const caption = photo.caption || captionFromSrc(photo.src, fallback);

  return {
    src: photo.src,
    caption,
    alt: photo.alt || caption,
  };
}

function renderGallery() {
  galleryEl.innerHTML = "";

  if (!galleryItems.length) {
    emptyStateEl.hidden = false;
    return;
  }

  emptyStateEl.hidden = true;

  galleryItems.forEach((photo, index) => {
    const card = photoCardTemplate.content.firstElementChild.cloneNode(true);
    card.style.animationDelay = `${Math.min(index * 35, 420)}ms`;

    const img = card.querySelector("img");
    const caption = card.querySelector("figcaption");

    img.src = photo.src;
    img.alt = photo.alt;
    caption.textContent = photo.caption;

    galleryEl.appendChild(card);
  });
}

function addManifestPhotos(sourcePhotos) {
  sourcePhotos.forEach((photo, index) => {
    const normalized = normalizePhoto(photo, index);
    if (normalized.src) galleryItems.push(normalized);
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

fileInputEl.addEventListener("change", (event) => {
  const { files } = event.target;
  if (!files || !files.length) return;
  loadDevicePhotos(files);
  fileInputEl.value = "";
});

loadManifestPhotos();
