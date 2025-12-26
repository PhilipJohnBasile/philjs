import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'PhilJS',
  description: 'The Universal UI Framework - JavaScript + Rust, One Codebase',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Rust', link: '/rust/introduction' },
      { text: 'Examples', link: '/examples/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is PhilJS?', link: '/guide/what-is-philjs' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ]
        },
        {
          text: 'Essentials',
          items: [
            { text: 'Reactivity', link: '/guide/reactivity' },
            { text: 'Components', link: '/guide/components' },
            { text: 'Signals', link: '/guide/signals' },
          ]
        },
      ],
      '/rust/': [
        {
          text: 'Rust Guide',
          items: [
            { text: 'Introduction', link: '/rust/introduction' },
            { text: 'Setup', link: '/rust/setup' },
            { text: 'First Component', link: '/rust/first-component' },
          ]
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/PhilipJohnBasile/philjs' },
    ],

    search: { provider: 'local' },
  }
})
