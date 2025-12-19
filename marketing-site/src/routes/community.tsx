import { defineLoader } from "philjs-ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const loader = defineLoader(async () => {
  return {
    title: "Community - PhilJS"
  };
});

export default function CommunityPage() {
  const channels = [
    {
      name: "Discord",
      icon: "💬",
      description: "Join our Discord server to chat with the community, get help, and share your projects.",
      link: "https://discord.gg/philjs",
      members: "2,500+",
      color: "#5865F2"
    },
    {
      name: "GitHub",
      icon: "🐙",
      description: "Contribute to PhilJS, report issues, or request features on our GitHub repository.",
      link: "https://github.com/philjs/philjs",
      members: "5,000+ stars",
      color: "#24292e"
    },
    {
      name: "Twitter",
      icon: "🐦",
      description: "Follow us on Twitter for announcements, tips, and community highlights.",
      link: "https://twitter.com/philjs",
      members: "3,200+ followers",
      color: "#1DA1F2"
    },
    {
      name: "Stack Overflow",
      icon: "📚",
      description: "Ask and answer questions about PhilJS on Stack Overflow.",
      link: "https://stackoverflow.com/questions/tagged/philjs",
      members: "500+ questions",
      color: "#F48024"
    }
  ];

  const contributors = [
    { name: "Phil Dev", role: "Creator & Maintainer", github: "phildev" },
    { name: "Sarah Chen", role: "Core Team", github: "sarahchen" },
    { name: "Michael Rodriguez", role: "Core Team", github: "mrodriguez" },
    { name: "Emma Johnson", role: "Core Team", github: "ejohnson" },
    { name: "David Park", role: "Core Team", github: "dpark" }
  ];

  const resources = [
    {
      title: "Contributing Guide",
      description: "Learn how to contribute to PhilJS core, documentation, or examples.",
      link: "https://github.com/philjs/philjs/blob/main/CONTRIBUTING.md"
    },
    {
      title: "Code of Conduct",
      description: "Our community guidelines for respectful and inclusive collaboration.",
      link: "https://github.com/philjs/philjs/blob/main/CODE_OF_CONDUCT.md"
    },
    {
      title: "Governance",
      description: "How decisions are made in the PhilJS project.",
      link: "https://github.com/philjs/philjs/blob/main/GOVERNANCE.md"
    }
  ];

  return html`
    <div class="page">
      ${Header({ currentPath: "/community" })}
      <main class="main-content">
        <section class="page-hero" data-animate>
          <h1>Join the PhilJS Community</h1>
          <p class="lead">
            Connect with developers building amazing things with PhilJS.
            Get help, share your work, and contribute to the project.
          </p>
        </section>

        <section class="channels-section">
          <h2 data-animate>Connect With Us</h2>
          <div class="channels-grid">
            ${channels.map(
              (channel) => html`
                <a
                  href="${channel.link}"
                  class="channel-card"
                  data-animate
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div class="channel-icon" style="background: ${channel.color}">${channel.icon}</div>
                  <h3>${channel.name}</h3>
                  <p>${channel.description}</p>
                  <div class="channel-members">${channel.members}</div>
                </a>
              `
            )}
          </div>
        </section>

        <section class="contributors-section" data-animate>
          <h2>Core Team</h2>
          <p>Meet the people who maintain and develop PhilJS.</p>
          <div class="contributors-grid">
            ${contributors.map(
              (contributor) => html`
                <a
                  href="https://github.com/${contributor.github}"
                  class="contributor-card"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div class="contributor-avatar">
                    ${contributor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div class="contributor-info">
                    <div class="contributor-name">${contributor.name}</div>
                    <div class="contributor-role">${contributor.role}</div>
                  </div>
                </a>
              `
            )}
          </div>
          <p class="contributors-note">
            Plus <strong>100+ contributors</strong> from around the world.
            <a href="https://github.com/philjs/philjs/graphs/contributors" target="_blank">View all →</a>
          </p>
        </section>

        <section class="resources-section" data-animate>
          <h2>Community Resources</h2>
          <div class="resources-grid">
            ${resources.map(
              (resource) => html`
                <a href="${resource.link}" class="resource-card" target="_blank" rel="noopener noreferrer">
                  <h3>${resource.title}</h3>
                  <p>${resource.description}</p>
                  <span class="resource-link">Read more →</span>
                </a>
              `
            )}
          </div>
        </section>

        <section class="cta-section" data-animate>
          <h2>Start Contributing</h2>
          <p>Help make PhilJS better for everyone. Every contribution matters.</p>
          <div class="cta-actions">
            <a
              href="https://github.com/philjs/philjs"
              class="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
            <a
              href="https://discord.gg/philjs"
              class="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Discord
            </a>
          </div>
        </section>
      </main>
      ${Footer()}
    </div>
  `;
}
