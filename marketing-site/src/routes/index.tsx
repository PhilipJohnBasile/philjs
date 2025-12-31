import { defineLoader } from "@philjs/ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { Ecosystem } from "../components/Ecosystem";
import { Workflow } from "../components/Workflow";
import { UseCases } from "../components/UseCases";
import { CodeDemo } from "../components/CodeDemo";
import { Comparison } from "../components/Comparison";
import { Testimonials } from "../components/Testimonials";
import { CallToAction } from "../components/CallToAction";
import { Footer } from "../components/Footer";

export const loader = defineLoader(async () => {
  return {
    title: "PhilJS - Signals-first Framework for the Modern Web",
    description: "PhilJS is the signals-first framework with SSR, islands, and a full ecosystem of packages for data, auth, UI, and deployment."
  };
});

export default function Home() {
  return html`
    <div class="page">
      ${Header({ currentPath: "/" })}
      <main class="main-content">
        ${Hero()}
        ${Features()}
        ${Ecosystem()}
        ${Workflow()}
        ${UseCases()}
        ${CodeDemo()}
        ${Comparison()}
        ${Testimonials()}
        ${CallToAction()}
      </main>
      ${Footer()}
    </div>
  `;
}
