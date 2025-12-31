import { signal } from '@philjs/core';

interface Contributor {
  name: string;
  avatar: string;
  contributions: number;
  role?: 'maintainer' | 'contributor' | 'translator';
  badges?: string[];
}

interface ContributorLeaderboardProps {
  contributors?: Contributor[];
  title?: string;
  period?: 'all-time' | 'month' | 'week';
}

// Mock data - in production, this would come from GitHub API
const mockContributors: Contributor[] = [
  {
    name: 'philjs-bot',
    avatar: '🤖',
    contributions: 342,
    role: 'maintainer',
    badges: ['🏆 Top Contributor', '⚡ 100+ PRs'],
  },
  {
    name: 'developer-1',
    avatar: '👨‍💻',
    contributions: 156,
    role: 'maintainer',
    badges: ['📚 Docs Hero'],
  },
  {
    name: 'translator-1',
    avatar: '🌍',
    contributions: 89,
    role: 'translator',
    badges: ['🗣️ Multilingual'],
  },
  {
    name: 'contributor-1',
    avatar: '👩‍💻',
    contributions: 67,
    role: 'contributor',
  },
  {
    name: 'contributor-2',
    avatar: '🧑‍💻',
    contributions: 45,
    role: 'contributor',
  },
];

export function ContributorLeaderboard({
  contributors = mockContributors,
  title = '🏆 Top Contributors',
  period = 'all-time',
}: ContributorLeaderboardProps) {
  const selectedPeriod = signal<'all-time' | 'month' | 'week'>(period);

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'maintainer':
        return '#8b5cf6';
      case 'translator':
        return '#3b82f6';
      default:
        return 'var(--color-brand)';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'maintainer':
        return '👑 Maintainer';
      case 'translator':
        return '🌍 Translator';
      default:
        return '✨ Contributor';
    }
  };

  return (
    <div
      style={{
        background: 'var(--color-bg-alt)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.5rem',
        margin: '2rem 0',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{title}</h3>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['all-time', 'month', 'week'] as const).map((p) => (
            <button
              key={p}
              onClick={() => selectedPeriod.set(p)}
              style={{
                padding: '0.375rem 0.75rem',
                background:
                  selectedPeriod() === p ? 'var(--color-brand)' : 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: selectedPeriod() === p ? 'white' : 'var(--color-text-secondary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textTransform: 'capitalize',
              }}
            >
              {p === 'all-time' ? 'All Time' : `This ${p}`}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {contributors.map((contributor, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: index < 3 ? 'var(--color-bg)' : 'transparent',
              border: `1px solid ${index < 3 ? 'var(--color-brand)' : 'var(--color-border)'}`,
              borderRadius: '8px',
              transition: 'all var(--transition-fast)',
            }}
          >
            {/* Rank */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background:
                  index === 0
                    ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                    : index === 1
                      ? 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)'
                      : index === 2
                        ? 'linear-gradient(135deg, #cd7f32 0%, #e9b880 100%)'
                        : 'var(--color-bg-alt)',
                color: index < 3 ? '#000' : 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: '0.875rem',
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>

            {/* Avatar */}
            <div
              style={{
                fontSize: '2rem',
                flexShrink: 0,
              }}
            >
              {contributor.avatar}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem',
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    fontSize: '0.9375rem',
                  }}
                >
                  {contributor.name}
                </span>
                {contributor.role && (
                  <span
                    style={{
                      padding: '0.125rem 0.5rem',
                      background: getRoleColor(contributor.role),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                    }}
                  >
                    {getRoleLabel(contributor.role)}
                  </span>
                )}
              </div>

              {/* Badges */}
              {contributor.badges && contributor.badges.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {contributor.badges.map((badge, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Contributions count */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-brand)',
                }}
              >
                {contributor.contributions}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                contributions
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
        }}
      >
        <a
          href="https://github.com/philjs/philjs/graphs/contributors"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--color-brand)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          View all contributors on GitHub →
        </a>
      </div>
    </div>
  );
}
