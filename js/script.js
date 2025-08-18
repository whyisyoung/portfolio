class ModernGallery {
  constructor() {
    this.images = [];
    this.currentImageIndex = 0;
    this.currentFilter = 'all';
    this.init();
  }

  async init() {
    await this.loadImages();
    this.setupEventListeners();
    const galleryEl = document.getElementById('gallery');
    if (galleryEl) {
      // Apply initial hash filter if present
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        this.currentFilter = hash;
        document.querySelectorAll('.site-nav .nav-link').forEach(l => {
          if (l.dataset.filter === hash) { l.classList.add('active'); }
          else l.classList.remove('active');
        });
      }
      this.renderGallery();
    }
  }

  async loadImages() {
    try {
      const response = await fetch('config.json');
      const config = await response.json();
      this.images = this.convertConfig(config);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }

  convertConfig(config) {
    const images = [];
    for (const [category, photos] of Object.entries(config)) {
      photos.forEach(photo => {
        images.push({
          src: photo.path,
          thumb: photo.compressed_path || photo.path,
          category: category.toLowerCase(),
          width: photo.width,
          height: photo.height
        });
      });
    }
    return images;
  }

  setupEventListeners() {
    // Header nav filters
    document.querySelectorAll('.site-nav .nav-link').forEach(link => {
      if (link.dataset.filter) {
        link.addEventListener('click', e => {
          // Only intercept if staying on same page (gallery present)
          const galleryEl = document.getElementById('gallery');
          if (galleryEl) {
            e.preventDefault();
            const targetFilter = link.dataset.filter;
            window.history.replaceState(null, '', `#${targetFilter}`);
            document.querySelectorAll('.site-nav .nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            this.currentFilter = targetFilter;
            this.filterImages();
          }
        });
      }
    });

    // Lightbox close
    document.getElementById('lightbox').addEventListener('click', (e) => {
      if (e.target.id === 'lightbox' || e.target.classList.contains('close')) this.closeLightbox();
    });

    document.querySelector('.prev').addEventListener('click', () => this.prevImage());
    document.querySelector('.next').addEventListener('click', () => this.nextImage());

    document.addEventListener('keydown', (e) => {
      if (document.getElementById('lightbox').style.display !== 'block') return;
      if (e.key === 'Escape') this.closeLightbox();
      else if (e.key === 'ArrowLeft') this.prevImage();
      else if (e.key === 'ArrowRight') this.nextImage();
    });
  }

  setActiveFilter(activeBtn) {
    document.querySelectorAll('.filter-btn').forEach(btn =>
      btn.classList.remove('active')
    );
    activeBtn.classList.add('active');
  }

  renderGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    const filteredImages = this.getFilteredImages();
    const rows = this.createHorizontalRows(filteredImages);

    rows.forEach(row => {
      const rowElement = document.createElement('div');
      rowElement.className = 'gallery-row';

      row.forEach((image, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.category = image.category;
        item.style.width = `${image.displayWidth}px`;

        const img = document.createElement('img');
        img.src = image.thumb;
        img.alt = `Photo ${index + 1}`;
        img.loading = 'lazy';
        img.style.width = `${image.displayWidth}px`;
        img.style.height = `${image.displayHeight}px`;

        item.appendChild(img);

        item.addEventListener('click', () => {
          const globalIndex = this.images.findIndex(img =>
            img.src === image.src
          );
          this.openLightbox(globalIndex);
        });

        rowElement.appendChild(item);
      });

      gallery.appendChild(rowElement);
    });
  }

  getFilteredImages() {
    return this.images.filter(image =>
      this.currentFilter === 'all' || image.category === this.currentFilter
    );
  }

  createHorizontalRows(images) {
    const rows = [];
    const maxHeight = 250; // Fixed height like alicegao.com interiors
    const containerWidth = 1160; // Available width (1200 - 40px padding)
    const spacing = 24; // Tripled spacing

    let currentImages = [...images];

    while (currentImages.length > 0) {
      let maxWidth = spacing * -1;
      let rowPhotos = [];

      while (true) {
        if (currentImages.length === 0) break;

        let photo = currentImages.shift();
        let photoWidth = (photo.width / photo.height) * maxHeight;
        maxWidth += photoWidth + spacing;
        rowPhotos.push(photo);

        if (maxWidth - spacing > containerWidth) {
          // Calculate final dimensions to fit container width exactly
          let targetWidth = containerWidth - (rowPhotos.length - 1) * spacing;
          let sumWidth = 0;

          for (let photo of rowPhotos) {
            sumWidth += (photo.width / photo.height) * maxHeight;
          }

          let aspectRatio = sumWidth / targetWidth;
          let finalHeight = maxHeight / aspectRatio;

          // Apply final dimensions
          rowPhotos.forEach(photo => {
            photo.displayWidth = Math.round((photo.width / photo.height) * finalHeight);
            photo.displayHeight = Math.round(finalHeight);
          });

          rows.push(rowPhotos);
          break;
        }

        if (currentImages.length === 0) {
          // Last incomplete row - use original maxHeight
          rowPhotos.forEach(photo => {
            photo.displayWidth = Math.round((photo.width / photo.height) * maxHeight);
            photo.displayHeight = maxHeight;
          });
          rows.push(rowPhotos);
          break;
        }
      }
    }

    return rows;
  }

  filterImages() {
    this.renderGallery();
  }

  openLightbox(index) {
    this.currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');

    img.src = this.images[index].src;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  prevImage() {
    this.currentImageIndex = this.currentImageIndex > 0 ?
      this.currentImageIndex - 1 :
      this.images.length - 1;
    this.updateLightboxImage();
  }

  nextImage() {
    this.currentImageIndex = this.currentImageIndex < this.images.length - 1 ?
      this.currentImageIndex + 1 :
      0;
    this.updateLightboxImage();
  }

  updateLightboxImage() {
    const img = document.getElementById('lightbox-img');
    img.src = this.images[this.currentImageIndex].src;
  }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ModernGallery();
});

window.addEventListener('scroll', () => {
  const h = document.querySelector('.site-header');
  if (!h) return;
  h.classList.toggle('is-scrolled', window.scrollY > 8);
});