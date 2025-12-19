import { defineLoader } from "philjs-ssr";
import { html } from "../server/template";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { CodeDemo } from "../components/CodeDemo";
import { Comparison } from "../components/Comparison";
import { Testimonials } from "../components/Testimonials";
import { Footer } from "../components/Footer";

export const loader = defineLoader(async () => {
  return {
    title: "PhilJS - Signals-first Framework for the Modern Web"
  };
});

export default function Home() {
  return html`
    <div class="page">
      ${Header({ currentPath: "/" })}
      <main class="main-content">
        ${Hero()}
        ${Features()}
        ${CodeDemo()}
        ${Comparison()}
        ${Testimonials()}
      </main>
      ${Footer()}
    </div>
  `;
}
