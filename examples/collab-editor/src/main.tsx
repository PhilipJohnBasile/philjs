import { render } from "@philjs/core";
import { App } from "./App";

const root = document.getElementById("app");
if (root) {
  render(<App />, root);
}
