// Interactions de présentation : filtres, tri et avis. Les comptes/commandes sont gérés par Supabase.
(() => {
  const grid = document.querySelector("#product-grid");
  if (grid) {
    const search = document.querySelector("#product-search"); const count = document.querySelector("#product-count");
    const empty = document.querySelector("#empty-results"); const sort = document.querySelector("#product-sort");
    const filters = [...document.querySelectorAll(".filter-chip")]; let activeFilter = "all";
    function update() {
      const cards = [...grid.querySelectorAll(".shop-card")]; const query = (search?.value || "").trim().toLocaleLowerCase("fr"); let visible = 0;
      cards.forEach((card) => { const category = (card.dataset.category || "").toLowerCase(); const name = (card.dataset.name || "").toLocaleLowerCase("fr"); const shown = (activeFilter === "all" || category === activeFilter) && name.includes(query); card.hidden = !shown; if (shown) visible++; });
      if (count) count.textContent = visible; if (empty) empty.hidden = visible !== 0;
    }
    search?.addEventListener("input", update);
    document.querySelector("#product-search-form")?.addEventListener("submit", (e) => { e.preventDefault(); update(); });
    filters.forEach((button) => button.addEventListener("click", () => { activeFilter = button.dataset.filter || "all"; filters.forEach((b) => { const selected = b === button; b.classList.toggle("is-active", selected); b.setAttribute("aria-pressed", String(selected)); }); update(); }));
    sort?.addEventListener("change", () => { const cards = [...grid.querySelectorAll(".shop-card")]; if (sort.value === "name") cards.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name)); else if (sort.value === "price-low") cards.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price)); cards.forEach((c) => grid.append(c)); update(); });
    grid.addEventListener("catalog:updated", update); update();
  }
  const form = document.querySelector("#feedback-form");
  if (form) {
    const rating = document.querySelector("#feedback-rating"); const stars = [...form.querySelectorAll(".rating-star")]; const submit = form.querySelector(".feedback-submit"); const success = document.querySelector("#feedback-success");
    stars.forEach((star) => star.addEventListener("click", () => { rating.value = star.dataset.rating; submit.disabled = false; stars.forEach((s) => { const active = Number(s.dataset.rating) <= Number(rating.value); s.classList.toggle("is-active", active); s.setAttribute("aria-pressed", String(s === star)); }); }));
    form.addEventListener("submit", (e) => { e.preventDefault(); if (!rating.value) return; form.reset(); rating.value = ""; stars.forEach((s) => { s.classList.remove("is-active"); s.setAttribute("aria-pressed", "false"); }); submit.disabled = true; if (success) success.hidden = false; });
  }
})();
