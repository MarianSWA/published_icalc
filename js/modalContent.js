// Single source of truth - loads from modal-content.html
let modalContentCache = null;

const loadModalContent = async () => {
  if (modalContentCache) return modalContentCache;

  try {
    const response = await fetch('/js/modal-content.html');
    const html = await response.text();

    // Parse HTML and extract content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    modalContentCache = {
      terms: {
        title: "Termeni și Condiții",
        content: doc.getElementById('terms-content').innerHTML
      },
      cookies: {
        title: "Politica Cookie-uri",
        content: doc.getElementById('cookies-content').innerHTML
      }
    };

    return modalContentCache;
  } catch (error) {
    console.error('Failed to load modal content:', error);
    // Fallback content
    modalContentCache = {
      terms: {
        title: "Termeni și Condiții",
        content: "<p>Conținutul termenilor nu a putut fi încărcat.</p>"
      },
      cookies: {
        title: "Politica Cookie-uri",
        content: "<p>Conținutul politicii cookie nu a putut fi încărcat.</p>"
      }
    };
    return modalContentCache;
  }
};

// Make available globally for static pages
if (typeof window !== 'undefined') {
  window.loadModalContent = loadModalContent;

  // Modal functionality for static pages
  const COOKIE_CONSENT_KEY = 'cookie-consent-preference';
  const THEME_STORAGE_KEY = 'calculator-inflatie-theme';
  const LAST_CALCULATION_KEY = 'calculator-inflatie-last-calculation';

  // Global functions for cookie consent
  window.checkCookieConsent = () => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    return consent === 'accepted';
  };

  window.requestCookieConsentForTheme = null;
  window.onCookieConsentAccepted = null;
  window.resetThemeToSystem = null;

  // Modal state
  let showTermsModal = false;
  let showCookiesModal = false;
  let showCookieBanner = false;
  let cookieConsent = null;
  let bannerMessage = 'default';
  let modalContentStatic = null;

  // DOM elements
  let modalContainer = null;
  let bannerContainer = null;

  // Load modal content for static pages
  async function loadModalContentStatic() {
    modalContentStatic = await loadModalContent();
  }

  // Initialize modal system
  async function initModalSystem() {
    await loadModalContentStatic();

    // Create modal container
    modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm hidden';
    modalContainer.onclick = closeAllModals;
    document.body.appendChild(modalContainer);

    // Create banner container
    bannerContainer = document.createElement('div');
    bannerContainer.id = 'cookie-banner';
    bannerContainer.className = 'fixed bottom-2 left-2 right-2 sm:bottom-3 sm:left-auto sm:right-3 sm:max-w-sm z-50 animate-slide-up hidden';
    document.body.appendChild(bannerContainer);

    // Check cookie consent on load
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedConsent !== null) {
      cookieConsent = savedConsent === 'accepted';
    }

    // Update footer links visibility
    updateFooterLinks();
  }

  // Update footer links based on cookie consent
  function updateFooterLinks() {
    const preferencesLink = document.getElementById('cookie-preferences-link');
    const separator = document.getElementById('cookie-preferences-separator');

    if (preferencesLink && separator) {
      if (cookieConsent !== null) {
        preferencesLink.style.display = 'inline';
        separator.style.display = 'inline';
      } else {
        preferencesLink.style.display = 'none';
        separator.style.display = 'none';
      }
    }
  }

  // Modal component
  function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'bg-white/80 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden';
    modal.onclick = (e) => e.stopPropagation();

    modal.innerHTML = `
      <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 dark:brightness-110 px-6 py-4 flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-bold text-white">${title}</h2>
        <button onclick="closeAllModals()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all" aria-label="Închide">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
        ${content}
      </div>
    `;

    return modal;
  }

  // Cookie banner content
  function createCookieBanner() {
    const banner = document.createElement('div');
    banner.className = 'bg-white/80 dark:bg-slate-800/60 backdrop-blur-md rounded-xl shadow-2xl border-2 border-blue-500/50 dark:border-blue-400/50 overflow-hidden';

    const message = bannerMessage === 'theme'
      ? `<p class="text-gray-800 dark:text-slate-300 text-xs sm:text-sm mb-3">
          <span class="font-semibold">🌙 Pentru a salva tema dark/light</span>, trebuie să accepți cookie-urile esențiale. Fără acestea, tema nu poate fi salvată.{' '}
          <button onclick="openCookiesModal()" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">Detalii</button>
        </p>`
      : `<p class="text-gray-800 dark:text-slate-300 text-xs sm:text-sm mb-3">
          Folosim cookie-uri pentru a-ți îmbunătăți experiența. Nicio informație personală colectată.{' '}
          <button onclick="openCookiesModal()" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">Detalii</button>
        </p>`;

    banner.innerHTML = `
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 dark:brightness-110 px-3 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-2">
        <svg class="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        <h3 class="text-white font-semibold text-xs sm:text-sm flex-1">Cookie-uri</h3>
        <button onclick="closeCookieBanner()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all" aria-label="Închide">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="p-3 sm:p-3.5">
        ${message}
        <div class="flex gap-2">
          <button onclick="acceptCookies()" class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all shadow-md hover:shadow-lg">
            Accept
          </button>
          <button onclick="declineCookies()" class="flex-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all">
            Refuz
          </button>
        </div>
      </div>
    `;

    return banner;
  }

  // Modal functions
  function openTermsModal() {
    if (modalContainer && modalContentStatic) {
      modalContainer.innerHTML = '';
      const modal = createModal(modalContentStatic.terms.title, modalContentStatic.terms.content);
      modalContainer.appendChild(modal);
      modalContainer.classList.remove('hidden');
    }
  }

  function openCookiesModal() {
    if (modalContainer && modalContentStatic) {
      modalContainer.innerHTML = '';
      const modal = createModal(modalContentStatic.cookies.title, modalContentStatic.cookies.content);
      modalContainer.appendChild(modal);
      modalContainer.classList.remove('hidden');
    }
  }

  function openCookieBanner() {
    if (bannerContainer) {
      bannerContainer.innerHTML = '';
      const banner = createCookieBanner();
      bannerContainer.appendChild(banner);
      bannerContainer.classList.remove('hidden');
    }
  }

  function closeAllModals() {
    if (modalContainer) {
      modalContainer.classList.add('hidden');
    }
  }

  function closeCookieBanner() {
    if (bannerContainer) {
      bannerContainer.classList.add('hidden');
    }
    bannerMessage = 'default';
  }

  function acceptCookies() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    cookieConsent = true;
    closeCookieBanner();
    updateFooterLinks();

    // Update Google Analytics if available
    if (typeof window.updateGoogleAnalyticsConsent === 'function') {
      window.updateGoogleAnalyticsConsent(true);
    } else if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }

    if (typeof window.onCookieConsentAccepted === 'function') {
      window.onCookieConsentAccepted();
    }
  }

  function declineCookies() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    cookieConsent = false;
    closeCookieBanner();
    updateFooterLinks();

    // Clear stored preferences
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(LAST_CALCULATION_KEY);

    if (typeof window.resetThemeToSystem === 'function') {
      window.resetThemeToSystem();
    }

    // Update Google Analytics if available
    if (typeof window.updateGoogleAnalyticsConsent === 'function') {
      window.updateGoogleAnalyticsConsent(false);
    } else if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  }

  // Global functions for onclick handlers
  window.openTermsModal = openTermsModal;
  window.openCookiesModal = openCookiesModal;
  window.openCookieBanner = openCookieBanner;
  window.closeAllModals = closeAllModals;
  window.closeCookieBanner = closeCookieBanner;
  window.acceptCookies = acceptCookies;
  window.declineCookies = declineCookies;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModalSystem);
  } else {
    initModalSystem();
  }
}