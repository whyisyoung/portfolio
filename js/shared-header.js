// Shared header component for index.html and about.html
function createHeader(isAboutPage = false) {
    const headerHTML = `
    <header class="site-header">
      <div class="site-header-inner">
        <h1 class="site-title"><a href="index.html" class="site-title-link">LIMIN YANG</a></h1>
        <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav class="site-nav">
          <a href="index.html#lifestyle" class="nav-link" data-filter="lifestyle">Lifestyle</a>
          <a href="index.html#architecture" class="nav-link" data-filter="architecture">Architecture</a>
          <a href="about.html" class="nav-link${isAboutPage ? ' active' : ''}">About</a>
        </nav>
      </div>
    </header>
    <div class="header-spacer"></div>
  `;

    // Insert at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    // Setup hamburger menu functionality
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.site-nav');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const open = toggle.classList.toggle('open');
            nav.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            if (window.innerWidth <= 640) {
                toggle.classList.remove('open');
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        }));
    }
}

// Auto-detect page type and create header. Ensure it still runs even if the
// script is loaded after DOMContentLoaded (e.g. script tag placed at end of body).
function initSharedHeader() {
    const isAboutPage = window.location.pathname.includes('about') || document.title.includes('About');
    // Avoid duplicate insertion if called twice.
    if (!document.querySelector('.site-header')) {
        createHeader(isAboutPage);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedHeader);
} else {
    // DOM already parsed
    initSharedHeader();
}
