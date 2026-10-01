// Dark mode toggle. Applies a stored preference before first paint (avoids a
// flash of the wrong theme) and wires up any [data-theme-toggle] button.
// No stored preference yet -> style.css falls back to prefers-color-scheme.
(function () {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    document.documentElement.setAttribute("data-theme", stored);
  }
})();

function currentTheme() {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateToggleLabels();
}

function updateToggleLabels() {
  const label = currentTheme() === "dark" ? "Light Mode" : "Dark Mode";
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.textContent = label;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateToggleLabels();
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", toggleTheme);
  });
});
