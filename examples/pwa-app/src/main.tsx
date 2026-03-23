import { signal, render } from "@philjs/core";

const isOnline = signal(navigator.onLine);

window.addEventListener("online", () => isOnline.set(true));
window.addEventListener("offline", () => isOnline.set(false));

function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      <h1>PhilJS PWA Demo</h1>
      <p>Status: {isOnline() ? "Online" : "Offline"}</p>
      <p>This app works offline thanks to the service worker.</p>
    </div>
  );
}

render(() => <App />, document.getElementById("app")!);
