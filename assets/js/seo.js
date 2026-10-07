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
    "sameAs": [
      "https://wa.me/14482348667"
    ]
  };
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
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
    <div class="faq-item reveal" style="border-bottom: 1px solid #eee; padding: 20px 0;">
      <button class="faq-toggle" style="width: 100%; text-align: left; background: none; border: none; font-size: 18px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.nextElementSibling.classList.toggle('open'); this.querySelector('.faq-icon').style.transform = this.nextElementSibling.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)'">
        <span>${faq.question}</span>
        <span class="faq-icon" style="transition: transform 0.3s;">▼</span>
      </button>
      <div class="faq-answer" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; color: #666; line-height: 1.6;">
        <p style="padding-top: 15px;">${faq.answer}</p>
      </div>
    </div>
  `).join('');

  // Add CSS for open state
  if (!document.getElementById('faq-style')) {
    const style = document.createElement('style');
    style.id = 'faq-style';
    style.textContent = `
      .faq-answer.open { max-height: 200px; }
    `;
    document.head.appendChild(style);
  }
}
