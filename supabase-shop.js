/* La Poster: fonctionnalités boutique. L'accès réel est toujours contrôlé par Supabase/RLS. */
(() => {
  const config = window.LaPosterConfig;
  const api = { products: [], user: null, profile: null, configured: Boolean(config?.isConfigured), ready: null };
  const CART_KEY = "la-poster-cart-v1";
  const FALLBACK = [
    { id: "igor", name: "IGOR", artist: "TYLER, THE CREATOR", category: "HIP-HOP", description: "Poster musical — Tyler, The Creator.", price_millimes: 20000, image_url: "images/poster-1.jpg.jpg", available: true },
    { id: "i-am-music", name: "I AM MUSIC", artist: "PLAYBOI CARTI", category: "HIP-HOP", description: "Poster musical — Playboi Carti.", price_millimes: 20000, image_url: "images/poster-2.jpg.jpg", available: true },
    { id: "am", name: "AM", artist: "ARCTIC MONKEYS", category: "ROCK", description: "Poster musical — Arctic Monkeys.", price_millimes: 20000, image_url: "images/poster-3.jpg.jpg", available: true },
    { id: "collection-sousse", name: "Collection Exclusive Sousse", artist: "LA POSTER", category: "COLLECTION", description: "Collection exclusive La Poster.", price_millimes: 20000, image_url: "images/poster-1.jpg.jpg", available: true },
  ];
  const client = () => window.supabaseClient;
  const message = (text, type = "error") => {
    const node = document.querySelector("[data-form-message]");
    if (node) { node.textContent = text; node.className = `form-message ${type}`; node.hidden = false; }
  };
  const formatMoney = (millimes) => `${(Number(millimes || 0) / 1000).toLocaleString("fr-TN", { maximumFractionDigits: 3 })} TND`;
  const cartRead = () => { try { const x = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); return Array.isArray(x) ? x : []; } catch { return []; } };
  const cartWrite = (items) => { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {} };
  const cart = () => cartRead().map((entry) => { const p = api.products.find((product) => product.id === entry.id) || FALLBACK.find((product) => product.id === entry.id); return p && { ...p, quantity: Math.min(99, Math.max(1, Math.floor(Number(entry.quantity) || 1))) }; }).filter(Boolean);
  const totals = (items) => ({ count: items.reduce((n, x) => n + x.quantity, 0), subtotal: items.reduce((n, x) => n + Number(x.price_millimes) * x.quantity, 0) });
  const safeImage = (p) => p.image_url || p.image || "images/poster-1.jpg.jpg";
  function status(text) { const el = document.querySelector("#cart-status"); if (el) el.textContent = text || ""; }

  function renderProductCards() {
    const grid = document.querySelector("#product-grid"); if (!grid) return;
    const original = new Map(Array.from(grid.querySelectorAll(".shop-card")).map((el) => [el.dataset.productId || el.querySelector(".add-to-cart")?.dataset.productId, el]));
    grid.replaceChildren();
    api.products.filter((p) => p.available !== false).forEach((p) => {
      let card = original.get(p.id);
      if (!card) {
        card = document.createElement("article"); card.className = "shop-card";
        card.innerHTML = '<a class="product-art"><span class="product-tag"></span><img loading="lazy"><span class="art-action">Voir le poster ↗</span></a><div class="shop-card-info"><p class="artist-name"></p><h3 class="album-title"></h3><div class="product-buy-row"><span class="shop-price"></span><button class="btn shop-buy add-to-cart" type="button">Ajouter au panier</button></div></div>';
      }
      card.dataset.productId = p.id; card.dataset.category = String(p.category || "").toLowerCase(); card.dataset.name = `${p.name} ${p.artist || ""}`.toLocaleLowerCase("fr"); card.dataset.price = String(p.price_millimes / 1000);
      const img = card.querySelector("img"); if (img) { img.src = safeImage(p); img.alt = `Poster ${p.name}`; }
      const title = card.querySelector(".album-title"); if (title) { title.textContent = p.name; title.classList.remove("album-title-blue", "album-title-pink", "album-title-red"); title.classList.add(p.category === "ROCK" ? "album-title-red" : p.id === "i-am-music" ? "album-title-pink" : "album-title-blue"); }
      const artist = card.querySelector(".artist-name"); if (artist) artist.textContent = p.artist || p.category;
      const price = card.querySelector(".shop-price"); if (price) { price.replaceChildren(document.createTextNode(`${(Number(p.price_millimes) / 1000).toLocaleString("fr-TN", { maximumFractionDigits: 3 })} `)); const small = document.createElement("small"); small.textContent = "TND"; price.append(small); }
      const link = card.querySelector(".product-art"); if (link) { link.href = "produit-vedette.html"; link.setAttribute("aria-label", `Découvrir le poster ${p.name}`); }
      const tag = card.querySelector(".product-tag"); if (tag) tag.textContent = p.category || "POSTER";
      const button = card.querySelector(".add-to-cart"); if (button) { button.dataset.productId = p.id; button.disabled = p.available === false; }
      card.dataset.productId = p.id; grid.append(card);
    });
    grid.dispatchEvent(new CustomEvent("catalog:updated"));
  }
  function renderFeaturedProduct() {
    const p = api.products.find((x) => x.id === "collection-sousse"); if (!p) return;
    const button = document.querySelector('[data-product-id="collection-sousse"]');
    if (button) { button.dataset.name = p.name; button.dataset.artist = p.artist || "LA POSTER"; }
    const featured = document.querySelector(".featured-panel"); if (!featured) return;
    const heading = featured.querySelector("h2"); if (heading) heading.textContent = p.name;
    const price = featured.querySelector(".price"); if (price) price.textContent = formatMoney(p.price_millimes);
    const img = featured.querySelector("img"); if (img) { img.src = safeImage(p); img.alt = `Poster ${p.name}`; }
  }
  function renderCart() {
    const items = cart(); const sum = totals(items);
    document.querySelectorAll("[data-cart-count]").forEach((n) => { n.textContent = sum.count; });
    document.querySelectorAll("a.cart-nav-link").forEach((a) => { a.href = "panier.html"; });
    const list = document.querySelector("#cart-items");
    if (list) {
      document.querySelector("#cart-empty").hidden = items.length > 0;
      document.querySelector("#cart-content").hidden = items.length === 0;
      list.replaceChildren();
      items.forEach((item) => {
        const row = document.createElement("article"); row.className = "cart-item"; row.dataset.id = item.id;
        const img = document.createElement("img"); img.src = safeImage(item); img.alt = `Poster ${item.name}`;
        const details = document.createElement("div"); details.className = "cart-item-info";
        const title = document.createElement("h3"); title.textContent = item.name;
        const artist = document.createElement("p"); artist.textContent = `${item.category} · ${item.artist || "La Poster"}`;
        const price = document.createElement("p"); price.className = "cart-item-price"; price.textContent = `${formatMoney(item.price_millimes)} · Sous-total ${formatMoney(item.price_millimes * item.quantity)}`;
        details.append(title, artist, price);
        const actions = document.createElement("div"); actions.className = "cart-item-actions";
        [["decrease", "−", "Réduire"], ["quantity", String(item.quantity), "Quantité"], ["increase", "+", "Augmenter"], ["remove", "Supprimer", "Supprimer"]].forEach(([act, label, aria]) => {
          const b = document.createElement(act === "quantity" ? "span" : "button"); b.className = act === "remove" ? "remove-item" : act === "quantity" ? "item-quantity" : "quantity-button";
          if (act !== "quantity") { b.type = "button"; b.dataset.action = act; b.setAttribute("aria-label", `${aria} ${item.name}`); }
          b.textContent = label; actions.append(b);
        });
        row.append(img, details, actions); list.append(row);
      });
      document.querySelector("#cart-unit-count").textContent = sum.count;
      document.querySelector("#cart-subtotal").textContent = formatMoney(sum.subtotal);
      document.querySelector("#cart-shipping").textContent = "À confirmer";
      document.querySelector("#cart-total").textContent = formatMoney(sum.subtotal);
      const checkout = document.querySelector("#checkout-link"); if (checkout) checkout.href = "checkout.html";
      const clear = document.querySelector("#clear-cart"); if (clear) clear.disabled = items.length === 0;
    }
    const summary = document.querySelector("#checkout-items");
    if (summary) {
      summary.replaceChildren();
      items.forEach((item) => { const p = document.createElement("p"); p.className = "summary-line"; p.textContent = `${item.name} × ${item.quantity} — ${formatMoney(item.price_millimes * item.quantity)}`; summary.append(p); });
      document.querySelector("#checkout-subtotal").textContent = formatMoney(sum.subtotal);
      document.querySelector("#checkout-shipping").textContent = "À confirmer";
      document.querySelector("#checkout-total").textContent = formatMoney(sum.subtotal);
    }
    return items;
  }
  function addToCart(id) {
    const p = api.products.find((x) => x.id === id && x.available !== false); if (!p) return;
    const items = cartRead(); const found = items.find((x) => x.id === id);
    if (found) found.quantity = Math.min(99, Number(found.quantity || 1) + 1); else items.push({ id, quantity: 1 });
    cartWrite(items); renderCart(); status(`${p.name} ajouté au panier.`);
  }
  function renderOrders(orders, target) {
    target.replaceChildren();
    orders.forEach((order) => {
      const card = document.createElement("article"); card.className = "order-history-card";
      const title = document.createElement("h3"); title.textContent = order.reference;
      const line = document.createElement("p"); line.textContent = `${new Date(order.created_at).toLocaleString("fr-TN")} · ${order.items.reduce((n, i) => n + i.quantity, 0)} article(s) · ${formatMoney(order.total_millimes)} · ${order.status}`;
      card.append(title, line); target.append(card);
    });
  }
  async function refreshAccount() {
    const el = document.querySelector("#account-content"); if (!el || !api.user) return;
    const meta = api.user.user_metadata || {};
    document.querySelector("#account-greeting").textContent = `Bonjour, ${meta.first_name || api.user.email}`;
    document.querySelector("#account-first-name").textContent = meta.first_name || "—";
    document.querySelector("#account-last-name").textContent = meta.last_name || "—";
    document.querySelector("#account-email").textContent = api.user.email || "—";
    document.querySelector("#account-verified").textContent = api.user.email_confirmed_at ? "Adresse confirmée" : "Confirmation en attente";
    const target = document.querySelector("#account-orders");
    const { data, error } = await client().from("orders").select("id,reference,items,total_millimes,status,created_at").order("created_at", { ascending: false }).limit(100);
    if (error) return message(`Impossible de charger les commandes : ${error.message}`);
    document.querySelector("#no-orders").hidden = data.length > 0; renderOrders(data, target);
  }
  async function guard() {
    const body = document.body;
    if (body.dataset.protected !== "true") return;
    if (!api.user) location.replace(`connexion.html?next=${encodeURIComponent(body.dataset.next || "compte.html")}`);
  }
  function formObject(form) { return Object.fromEntries(new FormData(form).entries()); }
  async function register(event) {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return;
    const v = formObject(form);
    if (v.password !== v.confirmPassword) return message("Les deux mots de passe ne correspondent pas.");
    if (String(v.password).length < 8) return message("Le mot de passe doit contenir au moins 8 caractères.");
    if (!client()) return message(config?.error || "Configurez d'abord Supabase.");
    const button = form.querySelector('[type="submit"]'); button.disabled = true;
    const { error } = await client().auth.signUp({ email: String(v.email).trim(), password: v.password, options: { data: { first_name: String(v.firstName).trim(), last_name: String(v.lastName).trim() }, emailRedirectTo: new URL("connexion.html", location.href).href } });
    button.disabled = false;
    if (error) return message(error.message);
    location.href = "verification.html";
  }
  async function login(event) {
    event.preventDefault(); const form = event.currentTarget; if (!client()) return message(config?.error || "Configurez d'abord Supabase.");
    const button = form.querySelector('[type="submit"]'); button.disabled = true;
    const v = formObject(form); const { error } = await client().auth.signInWithPassword({ email: String(v.email).trim(), password: v.password }); button.disabled = false;
    if (error) return message(error.message);
    const next = new URLSearchParams(location.search).get("next"); location.href = next === "checkout.html" && cart().length ? "checkout.html" : "compte.html";
  }
  async function checkout(event) {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return;
    const items = renderCart(); if (!items.length) return message("Votre panier est vide.");
    if (!client() || !api.user) return message(config?.error || "Connectez-vous et configurez Supabase pour commander.");
    const attemptKey = "la-poster-order-attempt-v1";
    let attempt; try { attempt = sessionStorage.getItem(attemptKey); if (!attempt) { attempt = crypto.randomUUID(); sessionStorage.setItem(attemptKey, attempt); } } catch { return message("Cette page doit être exécutée sur un navigateur compatible HTTPS."); }
    const button = form.querySelector('[type="submit"]'); button.disabled = true;
    const v = formObject(form); const cleanItems = items.map((i) => ({ id: i.id, quantity: i.quantity }));
    const address = { first_name: String(v.firstName).trim(), last_name: String(v.lastName).trim(), email: String(v.email).trim(), phone: String(v.phone).trim(), address: String(v.address).trim(), city: String(v.city).trim(), postal_code: String(v.postalCode).trim(), country: String(v.country).trim() };
    const expected = totals(items).subtotal;
    const { data, error } = await client().rpc("create_demo_order", { p_attempt_id: attempt, p_items: cleanItems, p_shipping_address: address, p_payment_method: v.payment, p_expected_total_millimes: expected });
    button.disabled = false;
    if (error) return message(`La commande n'a pas été enregistrée. Votre panier est conservé. ${error.message}`);
    try { sessionStorage.setItem("la-poster-confirmation-id-v1", data.id); sessionStorage.removeItem(attemptKey); } catch {}
    cartWrite([]); location.href = "confirmation.html";
  }
  async function showConfirmation() {
    const section = document.querySelector("#confirmation-content"); if (!section || !api.user) return;
    let id; try { id = sessionStorage.getItem("la-poster-confirmation-id-v1"); } catch {}
    if (!id) { document.querySelector("#confirmation-missing").hidden = false; section.hidden = true; return; }
    const { data: order, error } = await client().from("orders").select("id,reference,items,total_millimes,shipping_address,created_at").eq("id", id).maybeSingle();
    if (error || !order) { document.querySelector("#confirmation-missing").hidden = false; section.hidden = true; return; }
    document.querySelector("#confirmation-reference").textContent = order.reference;
    document.querySelector("#confirmation-date").textContent = new Date(order.created_at).toLocaleString("fr-TN");
    document.querySelector("#confirmation-total").textContent = formatMoney(order.total_millimes);
    const a = order.shipping_address; document.querySelector("#confirmation-address").textContent = `${a.first_name} ${a.last_name}, ${a.address}, ${a.postal_code} ${a.city}, ${a.country}`;
    const lines = document.querySelector("#confirmation-items"); lines.replaceChildren();
    order.items.forEach((item) => { const p = document.createElement("p"); p.textContent = `${item.name} × ${item.quantity} — ${formatMoney(item.line_total_millimes)}`; lines.append(p); });
  }
  async function adminPage() {
    const root = document.querySelector("#admin-content"); if (!root || !api.user) return;
    const { data: role, error: roleErr } = await client().from("user_roles").select("role").eq("user_id", api.user.id).maybeSingle();
    if (roleErr || role?.role !== "admin") { root.innerHTML = "<h1>Accès administrateur requis</h1><p>Ce compte n'a pas de rôle administrateur.</p>"; return; }
    document.querySelector("#admin-dashboard").hidden = false;
    const statusSelect = document.querySelector("#admin-status-filter");
    const orders = document.querySelector("#admin-orders");
    async function loadOrders() {
      orders.replaceChildren(); const { data, error } = await client().from("orders").select("id,reference,user_id,items,total_millimes,status,created_at,shipping_address").order("created_at", { ascending: false }).limit(50);
      if (error) return message(`Chargement commandes impossible : ${error.message}`);
      const filtered = statusSelect.value ? data.filter((x) => x.status === statusSelect.value) : data;
      filtered.forEach((o) => {
        const card = document.createElement("article"); card.className = "order-history-card";
        const h = document.createElement("h3"); h.textContent = `${o.reference} · ${formatMoney(o.total_millimes)}`;
        const p = document.createElement("p"); p.textContent = `${o.created_at} · ${o.shipping_address.email || ""} · ${o.status}`;
        const select = document.createElement("select"); select.setAttribute("aria-label", `Statut ${o.reference}`);
        ["nouvelle", "en_preparation", "terminee", "annulee"].forEach((s) => { const option = document.createElement("option"); option.value = s; option.textContent = s; option.selected = o.status === s; select.append(option); });
        select.addEventListener("change", async () => { const old = o.status; const { error: e } = await client().from("orders").update({ status: select.value }).eq("id", o.id).eq("status", old); if (e) { message(`Mise à jour refusée : ${e.message}`); select.value = old; } else { o.status = select.value; p.textContent = `${o.created_at} · ${o.shipping_address.email || ""} · ${o.status}`; } });
        card.append(h, p, select); orders.append(card);
      });
    }
    statusSelect.addEventListener("change", loadOrders); await loadOrders();
    const productForm = document.querySelector("#admin-product-form");
    productForm.addEventListener("submit", async (event) => {
      event.preventDefault(); if (!productForm.reportValidity()) return;
      const v = formObject(productForm); const row = { id: String(v.id).trim(), name: String(v.name).trim(), artist: String(v.artist).trim(), category: String(v.category), description: String(v.description).trim(), price_millimes: Math.round(Number(v.price) * 1000), image_url: String(v.image_url).trim(), available: v.available === "on" };
      if (!/^[a-z0-9-]{2,60}$/.test(row.id) || !Number.isSafeInteger(row.price_millimes) || row.price_millimes <= 0) return message("Vérifiez l’identifiant et le prix.");
      const { error } = await client().from("products").upsert(row); if (error) return message(`Produit non enregistré : ${error.message}`);
      productForm.reset(); message("Produit enregistré.", "success"); await loadProducts(); renderProductCards();
    });
    const productList = document.querySelector("#admin-products");
    async function loadAdminProducts() {
      const { data, error } = await client().from("products").select("id,name,artist,category,description,price_millimes,image_url,available").order("name"); if (error) return message(error.message);
      productList.replaceChildren(); data.forEach((p) => { const row = document.createElement("div"); row.className = "order-history-card"; const label = document.createElement("span"); label.textContent = `${p.name} · ${formatMoney(p.price_millimes)} · ${p.available ? "disponible" : "masqué"}`; const edit = document.createElement("button"); edit.type = "button"; edit.className = "btn"; edit.textContent = "Modifier"; edit.addEventListener("click", () => { ["id","name","artist","category","description","image_url"].forEach((key) => { productForm.elements[key].value = p[key] || ""; }); productForm.elements.price.value = p.price_millimes / 1000; productForm.elements.available.checked = p.available; productForm.scrollIntoView({ behavior: "smooth", block: "center" }); }); const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "btn"; toggle.textContent = p.available ? "Masquer" : "Publier"; toggle.addEventListener("click", async () => { const { error: e } = await client().from("products").update({ available: !p.available }).eq("id", p.id); if (e) message(e.message); else { await loadAdminProducts(); await loadProducts(); renderProductCards(); renderFeaturedProduct(); } }); row.append(label, edit, toggle); productList.append(row); });
    }
    await loadAdminProducts();
  }
  async function loadProducts() {
    if (!client()) { api.products = FALLBACK; return; }
    const { data, error } = await client().from("products").select("id,name,artist,category,description,price_millimes,image_url,available").order("name");
    api.products = error ? FALLBACK : (data || []); if (error) console.warn("Catalogue Supabase indisponible; catalogue embarqué utilisé.", error.message);
  }
  function refreshNavigation() {
    const list = document.querySelector(".nav-links"); if (!list || list.querySelector("[data-account-nav]")) return;
    const li = document.createElement("li"); li.dataset.accountNav = "true"; const a = document.createElement("a"); a.href = api.user ? "compte.html" : "connexion.html"; a.textContent = api.user ? `Mon compte (${api.user.user_metadata?.first_name || api.user.email})` : "Compte"; li.append(a);
    const admin = document.createElement("li"); admin.innerHTML = '<a href="admin.html">Administration</a>';
    const cartLi = list.querySelector(".cart-nav-link")?.closest("li"); if (cartLi) list.insertBefore(li, cartLi); else list.append(li);
    if (api.profile?.role === "admin") { if (cartLi) list.insertBefore(admin, cartLi); else list.append(admin); }
  }
  async function boot() {
    if (!api.configured || !client()) { api.products = FALLBACK; renderProductCards(); renderCart(); refreshNavigation(); if (document.body.dataset.protected === "true") guard(); return; }
    const { data: sessionData } = await client().auth.getSession(); api.user = sessionData.session?.user || null;
    if (api.user) { const { data } = await client().from("user_roles").select("role").eq("user_id", api.user.id).maybeSingle(); api.profile = data; }
    await loadProducts(); renderProductCards(); renderFeaturedProduct(); refreshNavigation(); renderCart(); await guard();
    client().auth.onAuthStateChange((_event, session) => { api.user = session?.user || null; setTimeout(async () => { if (api.user) { const { data } = await client().from("user_roles").select("role").eq("user_id", api.user.id).maybeSingle(); api.profile = data; } refreshNavigation(); if (document.body.dataset.protected === "true" && !api.user) location.replace("connexion.html"); }, 0); });
    await refreshAccount(); await showConfirmation(); await adminPage();
  }
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#register-form")?.addEventListener("submit", register);
    document.querySelector("#login-form")?.addEventListener("submit", login);
    document.querySelector("#checkout-form")?.addEventListener("submit", checkout);
    document.querySelector("#verification-form")?.addEventListener("submit", (e) => { e.preventDefault(); message("Consultez le lien de confirmation envoyé par Supabase, puis connectez-vous.", "info"); });
    document.querySelector("[data-forgot-password]")?.addEventListener("click", async (e) => { e.preventDefault(); const email = document.querySelector('#login-form [name="email"]')?.value.trim(); if (!email) return message("Saisissez votre e-mail avant de demander un lien.", "info"); if (!client()) return message(config?.error || "Configurez d'abord Supabase."); const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo: new URL("reinitialiser.html", location.href).href }); message(error ? error.message : "Si le compte existe, Supabase enverra un lien de réinitialisation.", error ? "error" : "success"); });
    document.querySelector("#password-reset-form")?.addEventListener("submit", async (e) => { e.preventDefault(); const form = e.currentTarget; if (!form.reportValidity() || !client()) return; const v = formObject(form); if (v.password !== v.confirmPassword) return message("Les deux mots de passe ne correspondent pas."); const { error } = await client().auth.updateUser({ password: v.password }); if (error) return message(error.message); message("Mot de passe modifié. Redirection vers votre compte…", "success"); setTimeout(() => { location.href = "compte.html"; }, 900); });
    document.querySelectorAll("[data-logout]").forEach((b) => b.addEventListener("click", async () => { if (client()) await client().auth.signOut(); location.href = "index.html"; }));
    document.addEventListener("click", (e) => { const b = e.target.closest(".add-to-cart"); if (b) { addToCart(b.dataset.productId); const text = b.textContent; b.textContent = "Ajouté ✓"; setTimeout(() => { b.textContent = text; }, 1200); } });
    document.querySelector("#cart-items")?.addEventListener("click", (e) => { const b = e.target.closest("button[data-action]"); if (!b) return; const items = cartRead(); const item = items.find((x) => x.id === b.closest(".cart-item").dataset.id); if (!item) return; if (b.dataset.action === "remove") cartWrite(items.filter((x) => x !== item)); else { item.quantity = Number(item.quantity || 1) + (b.dataset.action === "increase" ? 1 : -1); cartWrite(items.filter((x) => x.quantity > 0)); } renderCart(); });
    document.querySelector("#clear-cart")?.addEventListener("click", () => { cartWrite([]); renderCart(); });
    boot().catch((e) => { console.error(e); message("Une erreur est survenue au chargement de la boutique."); });
  });
  window.LaPosterShop = api;
})();
