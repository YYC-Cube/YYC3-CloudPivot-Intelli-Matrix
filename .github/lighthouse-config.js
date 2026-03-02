module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  audits: [
    'first-meaningful-paint',
    'first-contentful-paint',
    'speed-index',
    'largest-contentful-paint',
    'interactive',
    'total-blocking-time',
    'cumulative-layout-shift',
    'cumulative-layout-shift',
  ],
  categories: {
    performance: {
      title: 'Performance',
      description: 'These audits evaluate the overall performance of your application.',
      auditRefs: [
        { id: 'first-contentful-paint', weight: 10 },
        { id: 'largest-contentful-paint', weight: 25 },
        { id: 'total-blocking-time', weight: 30 },
        { id: 'cumulative-layout-shift', weight: 25 },
        { id: 'speed-index', weight: 10 },
      ],
    },
    accessibility: {
      title: 'Accessibility',
      description: 'These audits check the accessibility of your application.',
      auditRefs: [
        { id: 'aria-labels', weight: 10 },
        { id: 'color-contrast', weight: 15 },
        { id: 'button-name', weight: 15 },
        { id: 'link-name', weight: 10 },
        { id: 'image-alt', weight: 10 },
      ],
    },
    bestPractices: {
      title: 'Best Practices',
      description: 'These audits check for best practices in web development.',
      auditRefs: [
        { id: 'uses-http2', weight: 10 },
        { id: 'uses-text-compression', weight: 15 },
        { id: 'image-size-responsive', weight: 15 },
        { id: 'deprecations', weight: 10 },
        { id: 'doctype', weight: 10 },
      ],
    },
    seo: {
      title: 'SEO',
      description: 'These audits check for search engine optimization.',
      auditRefs: [
        { id: 'meta-description', weight: 10 },
        { id: 'http-status-code', weight: 15 },
        { id: 'link-text', weight: 10 },
        { id: 'crawlable-anchors', weight: 10 },
        { id: 'is-crawlable', weight: 15 },
      ],
    },
  },
};
