import { FAQ_DATA } from './faq-data.js';

/**
 * Metadata Component
 * Injects meta tags and site-wide JSON-LD schema into the document head.
 */
export function injectMetadata(config) {
  const head = document.head;

  // Set Title
  if (config.title) {
    document.title = config.title;
  }

  // Set Standard Meta Tags
  const metaTags = [
    { name: 'description', content: config.description },
    { property: 'og:title', content: config.title || document.title },
    { property: 'og:description', content: config.description },
    { property: 'og:type', content: config.ogType || 'website' },
    { property: 'og:url', content: config.canonical || window.location.href },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: config.title || document.title },
    { name: 'twitter:description', content: config.description },
  ];

  metaTags.forEach(tag => {
    if (!tag.content) return;
    const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[property="${tag.property}"]`;
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      if (tag.name) element.setAttribute('name', tag.name);
      if (tag.property) element.setAttribute('property', tag.property);
      head.appendChild(element);
    }
    element.setAttribute('content', tag.content);
  });

  // Set Canonical Link
  if (config.canonical) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', config.canonical);
  }

  // Inject Site-wide Schema (if Aussie-Prop-Money/Caskworth specific)
  if (config.injectSiteSchema) {
    injectSiteSchema();
  }
}

function injectSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Caskworth Premium Whisky",
    "url": "https://caskworth.com",
    "logo": "https://caskworth.com/assets/images/favicon-512.png",
    "description": "Caskworth is the premier destination for premium whisky and spirits in the USA. Specializing in bourbon, Scotch whisky, Macallan 18, Angel's Envy, and rare allocations.",
    "sameAs": [
      "https://wa.me/14482348667"
    ],
    "knowsAbout": [
      "Bourbon", "Scotch Whisky", "Japanese Whisky", "Irish Whiskey", "Rye Whiskey", "Canadian Whisky", "Cognac", "Armagnac", "Brandy", "Tequila", "Whiskey Price", "Best Bourbon", "Macallan 18", "Angel's Envy", "Maker's Mark", "Pappy Van Winkle", "Blanton's Bourbon", "High Rye Bourbon", "Rare Spirits", "Allocated Whiskey", "Whiskey Delivery USA"
    ]
  };
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'site-organization-schema';
  script.textContent = JSON.stringify(schema);
  
  // Remove existing site schema if present
  const existing = document.getElementById('site-organization-schema');
  if (existing) existing.remove();
  
  document.head.appendChild(script);
}

/**
 * FAQ Component
 * Dynamically injects FAQPage JSON-LD schema based on FAQ_DATA.
 */
export function injectFAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_DATA.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'dynamic-faq-schema';
  script.textContent = JSON.stringify(schema);
  
  // Remove existing dynamic FAQ schema if present
  const existing = document.getElementById('dynamic-faq-schema');
  if (existing) existing.remove();
  
  document.head.appendChild(script);
}

/**
 * Render FAQ HTML
 * Renders the FAQ items into a specified container.
 */
export function renderFAQ(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = FAQ_DATA.map((faq, index) => `
    <div class="faq-item">
      <button class="faq-q" onclick="toggleFaq(this)">
        <span>${faq.question}</span>
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-a">
        <div class="faq-a-inner">
          ${faq.answer}
        </div>
      </div>
    </div>
  `).join('');
}
