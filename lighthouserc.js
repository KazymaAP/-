export default {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npx vite preview --port 4173',
      url: [
        'http://localhost:4173',
        'http://localhost:4173/cases/stomatology-clinic/',
      ],
      settings: {
        headless: 'new',
        staticDistDir: './dist',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'interaction-to-next-paint': ['error', { maxNumericValue: 200 }],
        'color-contrast': ['error', { minScore: 0.5 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};