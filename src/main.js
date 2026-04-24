import { initSsqApp } from "./ssq/app.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSsqApp, { once: true });
} else {
  initSsqApp();
}
