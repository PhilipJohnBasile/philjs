import { Overview } from "./pages/Overview";

export function App() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "2rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        maxWidth: "1600px",
        margin: "0 auto",
      }}
    >
      <Overview />
    </div>
  );
}
