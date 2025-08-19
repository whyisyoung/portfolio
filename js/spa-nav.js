document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    const updateStylesheets = (doc) => {
        const head = document.head;
        const newStyles = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
        const oldStyles = Array.from(head.querySelectorAll('link[rel="stylesheet"]'));

        const newHrefs = new Set(newStyles.map(link => link.href));
        const oldHrefs = new Set(oldStyles.map(link => link.href));

        // Remove old styles that are not in the new page
        oldStyles.forEach(link => {
            if (!newHrefs.has(link.href)) {
                link.remove();
            }
        });

        // Add new styles that are not in the old page
        newStyles.forEach(link => {
            if (!oldHrefs.has(link.href)) {
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = link.href;
                head.appendChild(newLink);
            }
        });
    };

    // Function to fetch and display content
    const loadPage = async (url, pushState = true) => {
        try {
            const response = await fetch(url.split('#')[0]); // Fetch page without hash
            if (!response.ok) {
                window.location.href = url; // Fallback to traditional navigation
                return;
            }
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const newMain = doc.querySelector('main');
            const newTitle = doc.querySelector('title').innerText;

            if (newMain) {
                // Fade out
                mainContent.style.opacity = 0;

                // IMPORTANT: Update URL before content/scripts
                if (pushState) {
                    history.pushState({ path: url }, '', url);
                }

                setTimeout(() => {
                    updateStylesheets(doc);
                    mainContent.innerHTML = newMain.innerHTML;
                    mainContent.className = newMain.className;
                    document.title = newTitle;

                    // Now that URL is updated, init the gallery
                    const pagePath = new URL(url).pathname;
                    if (pagePath.endsWith('index.html') || pagePath === '/') {
                        // Clear any existing gallery content first
                        const galleryEl = document.getElementById('gallery');
                        if (galleryEl) {
                            galleryEl.innerHTML = '';
                        }

                        // Force re-evaluation of scripts for gallery page
                        const scripts = doc.querySelectorAll('script[src]');
                        const loadedScripts = new Set();

                        scripts.forEach(script => {
                            const src = script.getAttribute('src');
                            if (src && !loadedScripts.has(src) && !document.querySelector(`script[src="${src}"]`)) {
                                const newScript = document.createElement('script');
                                newScript.src = src;
                                if (script.defer) newScript.defer = true;
                                document.head.appendChild(newScript);
                                loadedScripts.add(src);
                            }
                        });

                        // Longer delay to ensure scripts are loaded and gallery can initialize
                        setTimeout(() => {
                            if (window.initGallery) {
                                console.log('Calling initGallery from SPA navigation');
                                window.initGallery();
                            } else {
                                console.error('initGallery function not available');
                            }
                        }, 200);
                    }

                    // Update active nav link
                    document.querySelectorAll('.site-nav .nav-link').forEach(link => {
                        link.classList.remove('active');
                        const linkUrl = new URL(link.href);
                        const currentUrl = new URL(window.location.href);
                        if (linkUrl.pathname === currentUrl.pathname && linkUrl.hash === currentUrl.hash) {
                            link.classList.add('active');
                        } else if (link.href === window.location.href) {
                            link.classList.add('active');
                        }
                    });

                    // Fade in
                    mainContent.style.opacity = 1;
                }, 200); // match transition time
            } else if (pushState) { // Fallback if main not found
                history.pushState({ path: url }, '', url);
            }

        } catch (error) {
            console.error('Failed to load page:', error);
            window.location.href = url; // Fallback
        }
    };

    // Hijack navigation links
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');

        if (link && link.hostname === window.location.hostname) {
            const currentUrl = new URL(window.location.href);
            const linkUrl = new URL(link.href);

            // If it's a hash link for the current page path, let other scripts handle it
            if (linkUrl.hash && linkUrl.pathname === currentUrl.pathname) {
                return;
            }

            // Skip SPA navigation for main gallery page to avoid issues
            if (linkUrl.pathname.endsWith('index.html') || linkUrl.pathname === '/') {
                // Let the browser handle this normally
                return;
            }

            e.preventDefault();
            loadPage(link.href);
        }
    });

    // Handle back/forward buttons
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.path) {
            loadPage(e.state.path, false);
        }
    });

    // Store initial state
    history.replaceState({ path: window.location.href }, '', window.location.href);

    // Add transition to main element
    mainContent.style.transition = 'opacity 0.2s ease-in-out';
});
