import { memo, signal } from "philjs-core";

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

  const buttonLabel = memo(() => loading() ? "Loading..." : "Fetch GitHub Data");
  const buttonStyle = memo(() => ({
    width: "100%",
    padding: "0.75rem",
    fontSize: "1rem",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: loading() ? "not-allowed" : "pointer",
    opacity: loading() ? 0.6 : 1,
    transition: "all 0.2s"
  }));

  const errorStyle = memo(() => ({
    marginTop: "1rem",
    padding: "0.75rem",
    background: "#fee",
    color: "#c33",
    borderRadius: "6px",
    fontSize: "0.9rem",
    display: error() ? "block" : "none"
  }));

  const errorText = memo(() => (error() ? `Error: ${error()}` : ""));

  const hasData = memo(() => !!data() && !loading());
  const dataCardStyle = memo(() => ({
    marginTop: "1rem",
    fontSize: "0.85rem",
    lineHeight: "1.6",
    display: hasData() ? "block" : "none"
  }));

  const repoName = memo(() => data()?.name ?? "");
  const repoStars = memo(() => data()?.stargazers_count?.toLocaleString() ?? "");
  const repoForks = memo(() => data()?.forks_count?.toLocaleString() ?? "");
  const repoLanguage = memo(() => data()?.language ?? "");

  const showEmptyState = memo(() => !data() && !loading());
  const emptyStateStyle = memo(() => ({
    marginTop: "1rem",
    color: "#666",
    fontSize: "0.9rem",
    textAlign: "center",
    display: showEmptyState() ? "block" : "none"
  }));

  return (
    <div>
      <button
        onClick={fetchData}
        disabled={loading}
        style={buttonStyle}
      >
        {buttonLabel}
      </button>

      <div style={errorStyle}>
        {errorText}
      </div>

      <div style={dataCardStyle}>
        <div><strong>Repo:</strong> {repoName}</div>
        <div><strong>Stars:</strong> {repoStars}</div>
        <div><strong>Forks:</strong> {repoForks}</div>
        <div><strong>Language:</strong> {repoLanguage}</div>
      </div>

      <p style={emptyStateStyle}>
        Click to fetch data with SWR-style caching
      </p>
    </div>
  );
}
