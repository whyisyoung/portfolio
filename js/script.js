class ModernGallery {
  constructor() {
    this.images = [];
    this.currentImageIndex = 0;
    this.currentFilter = 'all';
    this.init();
  }

  async init() {
    // Ensure lightbox is hidden on initialization
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
      lightbox.style.display = 'none';
    }
    
    // Reset body styles that might have been set by lightbox
    document.body.style.overflow = 'auto';
    document.body.style.position = 'relative';
    document.body.style.width = 'auto';
    document.body.style.top = '';
    
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
      console.log('Loading images...');
      const response = await fetch('config.json');
      const config = await response.json();
      this.images = this.convertConfig(config);
      console.log('Images loaded:', this.images.length);
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

    // Lightbox close - only add listener if lightbox exists
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target.id === 'lightbox' || e.target.classList.contains('close')) this.closeLightbox();
      });
    }

    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevImage());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextImage());
    }

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
    if (!gallery) {
      console.error('Gallery element not found');
      return;
    }

    console.log('Rendering gallery with', this.images.length, 'images');
    gallery.innerHTML = '';

    const filteredImages = this.getFilteredImages();
    console.log('Filtered images:', filteredImages.length);

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
        
        // Prevent layout reflow
        img.onload = () => {
          img.style.minHeight = 'auto';
          img.style.backgroundColor = 'transparent';
        };
        
        item.appendChild(img);
        item.addEventListener('click', () => {
          const globalIndex = this.images.findIndex(img => img.src === image.src);
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
    const maxHeight = 250;
    const containerEl = document.querySelector('.gallery-container');
    const containerWidth = Math.max(320, (containerEl ? containerEl.clientWidth : 1160) - 2);
    // Responsive spacing scaling
    const spacing = containerWidth < 480 ? 14 : containerWidth < 640 ? 16 : containerWidth < 900 ? 20 : 24;
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
          let targetWidth = containerWidth - (rowPhotos.length - 1) * spacing;
          let sumWidth = 0;
          for (let p of rowPhotos) sumWidth += (p.width / p.height) * maxHeight;
          let ar = sumWidth / targetWidth;
          let finalHeight = maxHeight / ar;
          rowPhotos.forEach(p => {
            p.displayWidth = Math.round((p.width / p.height) * finalHeight);
            p.displayHeight = Math.round(finalHeight);
          });
          rows.push(rowPhotos); break;
        }
        if (currentImages.length === 0) {
          const finalH = containerWidth < 640 ? Math.min(220, maxHeight) : maxHeight;
          rowPhotos.forEach(p => { p.displayWidth = Math.round((p.width / p.height) * finalH); p.displayHeight = finalH; });
          rows.push(rowPhotos); break;
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

    // Set image source directly for faster loading
    img.src = this.images[index].src;
    img.style.display = 'block';
    
    // Show lightbox
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Prevent background scrolling on mobile
    if (window.innerWidth <= 768) {
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    }
  }

  closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    
    // Reset body styles
    document.body.style.overflow = 'auto';
    
    // Reset mobile-specific styles
    if (window.innerWidth <= 768) {
      const scrollY = document.body.style.top;
      document.body.style.position = 'relative';
      document.body.style.width = 'auto';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
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
let currentGalleryInstance = null;

// Global function to reset lightbox state
function resetLightboxState() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.style.display = 'none';
  }
  
  // Reset body styles
  document.body.style.overflow = 'auto';
  document.body.style.position = 'relative';
  document.body.style.width = 'auto';
  document.body.style.top = '';
}

function initGallery() {
  console.log('initGallery called');
  
  // Always reset lightbox state first
  resetLightboxState();
  
  const galleryEl = document.getElementById('gallery');
  console.log('Gallery element found:', !!galleryEl);

  if (galleryEl) {
    // Clean up any existing instance
    if (currentGalleryInstance) {
      console.log('Cleaning up existing gallery instance');
      currentGalleryInstance = null;
    }

    // Create new instance
    console.log('Creating new gallery instance');
    currentGalleryInstance = new ModernGallery();
  }
}
window.initGallery = initGallery;

document.addEventListener('DOMContentLoaded', () => {
  initGallery();

  function adjustHeaderSpacer() {
    const header = document.querySelector('.site-header');
    const spacer = document.querySelector('.header-spacer');
    if (header && spacer) {
      spacer.style.height = header.offsetHeight + 'px';
    }
  }

  // Wait for header to be inserted by shared-header.js
  setTimeout(adjustHeaderSpacer, 10);

  // Re-render gallery and adjust spacer on resize (debounced)
  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Only re-render when width actually changes
      const currentWidth = window.innerWidth;
      if (Math.abs(currentWidth - lastWidth) > 50) {
        adjustHeaderSpacer();
        const galleryEl = document.getElementById('gallery');
        if (galleryEl && currentGalleryInstance) {
          currentGalleryInstance.renderGallery();
        }
        lastWidth = currentWidth;
      }
    }, 300); // Increase delay to reduce trigger frequency
  });
  
  // Reset lightbox when page becomes visible (handles navigation issues)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      resetLightboxState();
    }
  });
  
  // Also reset lightbox on page focus
  window.addEventListener('focus', () => {
    resetLightboxState();
  });
});

// Optimize scroll event handling
let scrollTimer;
window.addEventListener('scroll', () => {
  if (scrollTimer) return;
  
  scrollTimer = requestAnimationFrame(() => {
    const h = document.querySelector('.site-header');
    if (h) {
      h.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    scrollTimer = null;
  });
});