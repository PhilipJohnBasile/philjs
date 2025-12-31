import { defineLoader } from "@philjs/ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const loader = defineLoader(async () => {
  return {
    title: "Community - PhilJS",
    description: "Join the PhilJS community to share feedback, contribute packages, and connect with other builders."
  };
});

export default function CommunityPage() {
  const channels = [
    {
      name: "Discord",
      icon: "DS",
      description: "Chat with the community, share your work, and get help in real time.",
      link: "https://discord.gg/philjs",
      members: "2,500+ members",
      color: "#5865F2"
    },
    {
      name: "GitHub",
      icon: "GH",
      description: "Contribute code, report issues, and discuss roadmap priorities.",
      link: "https://github.com/philjs/philjs",
      members: "5,000+ stars",
      color: "#111827"
    },
    {
      name: "Twitter",
      icon: "TW",
      description: "Follow product announcements, releases, and highlights.",
      link: "https://twitter.com/philjs",
      members: "3,200+ followers",
      color: "#0EA5E9"
    },
    {
      name: "Stack Overflow",
      icon: "SO",
      description: "Ask and answer questions with the PhilJS community.",
      link: "https://stackoverflow.com/questions/tagged/philjs",
      members: "500+ questions",
      color: "#F97316"
    }
  ];

  const programs = [
    {
      title: "Core runtime",
      description: "Signals, compiler, and rendering performance."
    },
    {
      title: "Ecosystem packages",
      description: "Plugins, UI, auth, data, and adapters."
    },
    {
      title: "Docs and examples",
      description: "Guides, tutorials, and reference content."
    },
    {
      title: "Adopters and feedback",
      description: "Case studies, benchmarks, and success stories."
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
      description: "How to contribute to core, docs, and packages.",
      link: "https://github.com/philjs/philjs/blob/main/CONTRIBUTING.md"
    },
    {
      title: "Code of Conduct",
      description: "Community guidelines for inclusive collaboration.",
      link: "https://github.com/philjs/philjs/blob/main/CODE_OF_CONDUCT.md"
    },
    {
      title: "Governance",
      description: "How decisions are made in the PhilJS project.",
      link: "https://github.com/philjs/philjs/blob/main/GOVERNANCE.md"
    },
    {
      title: "Release Process",
      description: "How releases are planned and shipped.",
      link: "https://github.com/philjs/philjs/blob/main/docs/RELEASE_PROCESS.md"
    }
  ];

  return html`
    <div class="page">
      ${Header({ currentPath: "/community" })}
      <main class="main-content">
        <section class="page-hero" data-animate>
          <h1>Join the PhilJS community</h1>
          <p class="lead">
            Meet the people building the PhilJS ecosystem. Share feedback, ship plugins, and shape the roadmap.
          </p>
        </section>

        <section class="channels-section">
          <h2 data-animate>Connect with us</h2>
          <div class="channels-grid">
            ${channels.map(
              (channel, index) => html`
                <a
                  href="${channel.link}"
                  class="channel-card"
                  data-animate
                  style="--delay: ${index * 0.05}s"
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

        <section class="programs-section" data-animate>
          <h2>Community focus areas</h2>
          <div class="programs-grid">
            ${programs.map(
              (program, index) => html`
                <div class="program-card" data-animate style="--delay: ${index * 0.05}s">
                  <h3>${program.title}</h3>
                  <p>${program.description}</p>
                </div>
              `
            )}
          </div>
        </section>

        <section class="contributors-section" data-animate>
          <h2>Core team</h2>
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
            <a href="https://github.com/philjs/philjs/graphs/contributors" target="_blank" rel="noopener noreferrer">View all -></a>
          </p>
        </section>

        <section class="resources-section" data-animate>
          <h2>Community resources</h2>
          <div class="resources-grid">
            ${resources.map(
              (resource, index) => html`
                <a href="${resource.link}" class="resource-card" data-animate style="--delay: ${index * 0.04}s" target="_blank" rel="noopener noreferrer">
                  <h3>${resource.title}</h3>
                  <p>${resource.description}</p>
                  <span class="resource-link">Read more -></span>
                </a>
              `
            )}
          </div>
        </section>

        <section class="cta-section" data-animate>
          <h2>Start contributing</h2>
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
