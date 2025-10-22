import { render } from "philjs-core";
import { App } from "./App";

// Render the app
const root = document.getElementById("app");
if (root) {
  render(<App />, root);
}
