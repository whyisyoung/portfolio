// Shared footer component for all pages
function createFooter() {
    const footerHTML = `
    <footer class="site-footer" role="contentinfo">
        <div class="site-footer-inner">
            <div class="footer-icons">
                <a href="mailto:whyisyoung.foto@gmail.com" aria-label="Email" title="Email" target="_blank" rel="noopener">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <path d="m22 6-10 7L2 6" />
                    </svg>
                    <span class="visually-hidden">Email</span>
                </a>
                <a href="https://instagram.com/whyisyoung" target="_blank" rel="noopener"
                    aria-label="Instagram" title="Instagram">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                    <span class="visually-hidden">Instagram</span>
                </a>
            </div>
            <small>&copy; ${new Date().getFullYear()} Limin Yang. All rights reserved.</small>
        </div>
    </footer>
  `;

    // Insert at the end of body, before closing tag
    document.body.insertAdjacentHTML('beforeend', footerHTML);
}

// Auto-initialize footer
function initSharedFooter() {
    // Avoid duplicate insertion if called twice
    if (!document.querySelector('.site-footer')) {
        createFooter();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedFooter);
} else {
    // DOM already parsed
    initSharedFooter();
}
