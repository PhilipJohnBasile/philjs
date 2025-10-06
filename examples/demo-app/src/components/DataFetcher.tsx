import { signal } from "philjs-core";

export function DataFetcher() {
  const data = signal<any>(null);
  const loading = signal(false);
  const error = signal<string | null>(null);

  const fetchData = async () => {
    loading.set(true);
    error.set(null);

    try {
      const response = await fetch('https://api.github.com/repos/facebook/react');
      const json = await response.json();
      data.set(json);
    } catch (e) {
      error.set(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      loading.set(false);
    }
  };

  const currentData = data();
  const isLoading = loading();
  const currentError = error();

  return (
    <div>
      <button
        onClick={fetchData}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          transition: 'all 0.2s'
        }}
      >
        {isLoading ? 'Loading...' : 'Fetch GitHub Data'}
      </button>

      {currentError && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#fee',
          color: '#c33',
          borderRadius: '6px',
          fontSize: '0.9rem'
        }}>
          Error: {currentError}
        </div>
      )}

      {currentData && !isLoading && (
        <div style={{
          marginTop: '1rem',
          fontSize: '0.85rem',
          lineHeight: '1.6'
        }}>
          <div><strong>Repo:</strong> {currentData.name}</div>
          <div><strong>Stars:</strong> {currentData.stargazers_count?.toLocaleString()}</div>
          <div><strong>Forks:</strong> {currentData.forks_count?.toLocaleString()}</div>
          <div><strong>Language:</strong> {currentData.language}</div>
        </div>
      )}

      {!currentData && !isLoading && (
        <p style={{
          marginTop: '1rem',
          color: '#666',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          Click to fetch data with SWR-style caching
        </p>
      )}
    </div>
  );
}