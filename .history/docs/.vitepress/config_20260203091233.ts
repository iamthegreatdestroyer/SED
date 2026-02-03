import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'SED',
  description: 'Semantic Entropy Differencing - Understand code changes through information theory',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'SED - Semantic Entropy Differencing' }],
    [
      'meta',
      { property: 'og:description', content: 'Understand code changes through information theory' },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'CLI', link: '/cli/' },
      {
        text: 'Packages',
        items: [
          { text: '@sed/core', link: '/packages/core/' },
          { text: '@sed/git', link: '/packages/git/' },
          { text: '@sed/shared', link: '/packages/shared/' },
        ],
      },
      {
        text: 'Apps',
        items: [
          { text: 'CLI', link: '/apps/cli/' },
          { text: 'VS Code Extension', link: '/apps/vscode/' },
          { text: 'Web Dashboard', link: '/apps/web/' },
          { text: 'GitHub Action', link: '/apps/action/' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is SED?', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/concepts' },
          ],
        },
        {
          text: 'Usage',
          items: [
            { text: 'CLI Usage', link: '/guide/cli-usage' },
            { text: 'VS Code Extension', link: '/guide/vscode-extension' },
            { text: 'GitHub Action', link: '/guide/github-action' },
            { text: 'Web Dashboard', link: '/guide/web-dashboard' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Classification Thresholds', link: '/guide/thresholds' },
            { text: 'Custom Parsers', link: '/guide/custom-parsers' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Core API', link: '/api/core' },
            { text: 'Git API', link: '/api/git' },
            { text: 'Types', link: '/api/types' },
          ],
        },
      ],
      '/packages/': [
        {
          text: 'Packages',
          items: [
            { text: '@sed/core', link: '/packages/core/' },
            { text: '@sed/git', link: '/packages/git/' },
            { text: '@sed/shared', link: '/packages/shared/' },
            { text: '@sed/config', link: '/packages/config/' },
          ],
        },
      ],
      '/apps/': [
        {
          text: 'Applications',
          items: [
            { text: 'CLI', link: '/apps/cli/' },
            { text: 'VS Code Extension', link: '/apps/vscode/' },
            { text: 'Web Dashboard', link: '/apps/web/' },
            { text: 'GitHub Action', link: '/apps/action/' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/sgbilod/sed' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Stevo (sgbilod)',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/sgbilod/sed/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },

  markdown: {
    lineNumbers: true,
  },
});
