// menu_v2.js — меню с данными из products_v2.json (сезонное меню в special)
// ВАЖНО: fetch работает только через локальный сервер.

// ===== ТЕМА (как в основном сайте) =====
const themeToggle = document.getElementById("themeToggle");
function applyTheme(theme){
  if(theme === "dark"){
    document.body.classList.add("dark");
    if(themeToggle) themeToggle.textContent = "☀";
  } else {
    document.body.classList.remove("dark");
    if(themeToggle) themeToggle.textContent = "☾";
  }
}
applyTheme(localStorage.getItem("lattegarden-theme") || "light");
if(themeToggle){
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    const newTheme = isDark ? "dark" : "light";
    localStorage.setItem("lattegarden-theme", newTheme);
    applyTheme(newTheme);
  });
}

// ===== ФИЛЬТРЫ =====
const filterButtons = document.querySelectorAll(".filter-btn");
const menuCards = Array.from(document.querySelectorAll(".menu-card-v2"));
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const category = btn.getAttribute("data-category");
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    menuCards.forEach((card) => {
      const cardCat = card.getAttribute("data-category");
      card.style.display = (category === "all" || category === cardCat) ? "flex" : "none";
    });
  });
});

// ===== ДАННЫЕ ИЗ JSON =====
let PRODUCTS = new Map();
async function loadProducts(){
  const res = await fetch("products_v2.json", { cache: "no-store" });
  const data = await res.json();
  (data.products || []).forEach(p => PRODUCTS.set(p.id, p));
}
const productsReady = loadProducts().catch(err => {
  console.warn("products_v2.json не загрузился, будет fallback из DOM", err);
});

// ===== МОДАЛКА =====
const modal = document.getElementById("productModal");
const pmImg = document.getElementById("pmImg");
const pmTitle = document.getElementById("pmTitle");
const pmDesc = document.getElementById("pmDesc");
const pmKicker = document.getElementById("pmKicker");
const pmPrice = document.getElementById("pmPrice");
const pmMl = document.getElementById("pmMl");
const pmMilkGroup = document.getElementById("pmMilkGroup");
const pmSizeGroup = document.getElementById("pmSizeGroup");
const pmAddBtn = document.getElementById("pmAddBtn");

// новые поля
const pmComposition = document.getElementById("pmComposition");
const pmCalories = document.getElementById("pmCalories");
const pmCaloriesWrap = document.getElementById("pmCaloriesWrap");
const pmSizeHint = document.getElementById("pmSizeHint");

let currentProduct = null;
let selected = { size: "S", milk: "Обычное" };

const sizeConfig = {
  S: { ml: 250, mul: 1.0 },
  M: { ml: 350, mul: 1.18 },
  L: { ml: 450, mul: 1.32 },
};

function rub(n){ return Math.round(n); }

function openModal(product){
  currentProduct = product;

  // reset selections
  selected = { size: "S", milk: "Обычное" };
  document.querySelectorAll(".pm__seg-btn").forEach(b => b.classList.toggle("active", b.dataset.size === "S"));
  document.querySelectorAll("#pmMilkGroup .pm__chip").forEach(b => b.classList.toggle("active", b.dataset.milk === "Обычное"));

  pmImg.src = product.img || "";
  pmImg.alt = product.title || "";
  pmTitle.textContent = product.title || "Товар";
  pmDesc.textContent = product.desc || "";

  const isDessert = product.category === "dessert";
  const isSeasonal = product.subCategory === "seasonal";

  pmKicker.textContent =
    isDessert ? "Десерты" :
    (isSeasonal ? "Сезонное меню" :
     (product.category === "special" ? "Спешл" : "Кофе"));

  // состав
  if(pmComposition) pmComposition.textContent = product.composition || "";

  // показываем/прячем группы
  pmMilkGroup.hidden = isDessert;
  pmSizeGroup.hidden = isDessert;         // ВАЖНО: у десертов убираем размер
  if(pmSizeHint) pmSizeHint.style.display = isDessert ? "none" : "block"; // и объём
  if(pmCaloriesWrap) pmCaloriesWrap.style.display = isDessert ? "none" : "block"; // калории только у напитков

  updatePriceAndCalories();

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(){
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function calcDrinkCalories(product, size, milk){
  const base = (product.calories && product.calories[size]) ? product.calories[size] : null;
  if(base == null) return null;
  const extra = (product.milkCaloriesExtra && (milk in product.milkCaloriesExtra))
    ? product.milkCaloriesExtra[milk]
    : 0;
  return rub(base + extra);
}

function updatePriceAndCalories(){
  if(!currentProduct) return;

  // Десерт — просто цена, без размеров/молока/объёма/калорий
  if(currentProduct.category === "dessert"){
    pmPrice.textContent = String(currentProduct.basePrice || 0);
    if(pmMl) pmMl.textContent = "";
    if(pmCalories) pmCalories.textContent = "";
    return;
  }

  const base = currentProduct.basePrice || 0;
  const cfg = sizeConfig[selected.size] || sizeConfig.S;

  // цена
  const milkExtraPrice =
    (selected.milk === "Овсяное" || selected.milk === "Миндальное" || selected.milk === "Безлактозное")
      ? 40 : 0;
  pmPrice.textContent = String(rub(base * cfg.mul + milkExtraPrice));

  // объём
  if(pmMl) pmMl.textContent = String(cfg.ml);

  // калории
  const cals = calcDrinkCalories(currentProduct, selected.size, selected.milk);
  if(pmCalories) pmCalories.textContent = cals == null ? "—" : String(cals);
}

// open by button or card click
menuCards.forEach((card) => {
  const btn = card.querySelector(".order-btn-v2");
  const open = async (e) => {
    e.preventDefault();
    await productsReady;

    const id = card.getAttribute("data-id") || "";
    const fromJson = PRODUCTS.get(id);

    // fallback if json missing
    const title = card.querySelector(".menu-title")?.textContent?.trim() || "Товар";
    const desc = card.querySelector(".menu-desc")?.textContent?.trim() || "";
    const img = card.querySelector("img")?.getAttribute("src") || "";
    const priceText = card.querySelector(".price")?.textContent || "0";
    const basePrice = parseInt(priceText.replace(/\D+/g, ""), 10) || 0;
    const category = card.getAttribute("data-category") || "coffee";

    openModal(fromJson || { id, title, desc, img, basePrice, category, composition: "" });
  };

  card.addEventListener("click", (e) => {
    if(e.target.closest(".heart-btn")) return;
    if(e.target.closest(".order-btn-v2")) return;
    open(e);
  });

  if(btn){
    btn.textContent = "Выбрать";
    btn.addEventListener("click", open);
  }
});

// size change
document.querySelectorAll(".pm__seg-btn").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".pm__seg-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    selected.size = b.dataset.size;
    updatePriceAndCalories();
  });
});

// milk change
document.querySelectorAll("#pmMilkGroup .pm__chip").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("#pmMilkGroup .pm__chip").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    selected.milk = b.dataset.milk;
    updatePriceAndCalories();
  });
});

// close modal
modal.addEventListener("click", (e) => {
  if(e.target.dataset.close) closeModal();
});
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape"){
    if(modal.classList.contains("is-open")) closeModal();
    if(cartDrawer.classList.contains("is-open")) closeCart();
  }
});

// ===== КОРЗИНА (ТОЛЬКО ДЛЯ ЭТОЙ СТРАНИЦЫ) =====
const cartDrawer = document.getElementById("cartDrawer");
const cartOpenBtn = document.getElementById("cartOpen");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartClear = document.getElementById("cartClear");

let cart = [];

function openCart(){
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeCart(){
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
cartOpenBtn?.addEventListener("click", openCart);
cartDrawer.addEventListener("click", (e) => {
  if(e.target.dataset.cartClose) closeCart();
});

function cartKey(item){
  return [item.title, item.size || "", item.milk || ""].join("|");
}

function addToCart(){
  if(!currentProduct) return;

  const isDessert = currentProduct.category === "dessert";
  const unitPrice = parseInt(pmPrice.textContent, 10) || 0;

  const item = {
    title: currentProduct.title,
    img: currentProduct.img,
    category: currentProduct.category,
    size: isDessert ? null : selected.size,
    milk: isDessert ? null : selected.milk,
    unitPrice,
    qty: 1,
  };

  const key = cartKey(item);
  const existing = cart.find(x => cartKey(x) === key);
  if(existing){
    existing.qty += 1;
  } else {
    cart.push(item);
  }
  renderCart();
  closeModal();
  openCart();
}

pmAddBtn.addEventListener("click", addToCart);

function renderCart(){
  const count = cart.reduce((s, x) => s + x.qty, 0);
  cartCount.textContent = String(count);

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, idx) => {
    total += item.unitPrice * item.qty;

    const metaParts = [];
    if(item.size) metaParts.push("Размер: " + item.size);
    if(item.milk) metaParts.push("Молоко: " + item.milk);
    const meta = metaParts.join(" • ");

    const el = document.createElement("div");
    el.className = "cart-item";
    el.innerHTML = `
      <img src="${item.img}" alt="">
      <div class="cart-item__info">
        <div class="cart-item__title">${item.title}</div>
        <div class="cart-item__meta">${meta}</div>
        <div class="cart-item__row">
          <div class="cart-qty">
            <button type="button" data-act="dec">−</button>
            <span>${item.qty}</span>
            <button type="button" data-act="inc">+</button>
          </div>
          <div class="cart-item__price">${item.unitPrice * item.qty} ₽</div>
        </div>
      </div>
      <button class="cart-item__remove" type="button" aria-label="Удалить" data-act="rm">×</button>
    `;

    el.addEventListener("click", (e) => {
      const act = e.target?.dataset?.act;
      if(!act) return;

      if(act === "inc") item.qty += 1;
      if(act === "dec") item.qty = Math.max(1, item.qty - 1);
      if(act === "rm") cart.splice(idx, 1);

      renderCart();
    });

    cartItems.appendChild(el);
  });

  cartTotal.textContent = String(total);
}

cartClear?.addEventListener("click", () => {
  cart = [];
  renderCart();
});

renderCart();


// ===== ПАТЧ: 3 кофейни (Хабаровск) + разное меню + корзина привязана к кофейне (вариант A) =====
document.addEventListener("DOMContentLoaded", () => {
  const CAFES = {
    center: { name: "Хабаровск — Центр",   title: "Кофейня в центре",  status: "Открыто до 22:00" },
    south:  { name: "Хабаровск — Южный",   title: "Кофейня в Южном",   status: "Открыто до 21:00" },
    north:  { name: "Хабаровск — Северный", title: "Кофейня в Северном", status: "Открыто до 20:00" }
  };

  const cafeSwitch = document.getElementById("cafeSwitch");
  const cafeTitleEl = document.getElementById("cafeTitle");
  const cafeStatusEl = document.getElementById("cafeStatus");
  const cartCafeNameEl = document.getElementById("cartCafeName");

  function getCafeId() {
    const id = localStorage.getItem("selectedCafeId") || "center";
    return CAFES[id] ? id : "center";
  }
  function setCafeId(id) {
    localStorage.setItem("selectedCafeId", id);
  }

  function updateCafeUI() {
    const id = getCafeId();
    const meta = CAFES[id];

    if (cafeTitleEl) cafeTitleEl.textContent = meta.title;
    if (cafeStatusEl) cafeStatusEl.textContent = meta.status;

    if (cafeSwitch) {
      cafeSwitch.querySelectorAll(".cafe-chip").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.id === id);
      });
    }
    if (cartCafeNameEl) cartCafeNameEl.textContent = meta.name;
  }

  function updateMenuVisibility() {
    const id = getCafeId();

    document.querySelectorAll(".menu-card-v2[data-id]").forEach(card => {
      const pid = card.dataset.id || "";
      const p = (typeof PRODUCTS !== "undefined" && PRODUCTS instanceof Map) ? PRODUCTS.get(pid) : null;

      // если товар не найден в JSON или не имеет cafes — показываем
      if (!p || !Array.isArray(p.cafes) || p.cafes.length === 0) {
        card.hidden = false;
        return;
      }

      // если есть "all" — показываем везде
      if (p.cafes.includes("all")) {
        card.hidden = false;
        return;
      }

      card.hidden = !p.cafes.includes(id);
    });
  }

  function clearCartOnCafeChangeIfNeeded(prevId, nextId) {
    if (prevId === nextId) return;

    // вариант A: если в корзине уже есть товары и сменили кофейню — очищаем корзину
    if (typeof cart !== "undefined" && Array.isArray(cart) && cart.length > 0) {
      cart = [];
      try { localStorage.removeItem("cart"); } catch(e) {}
      if (typeof renderCart === "function") renderCart();
    }
  }

  // обработчик переключателя кофеен
  if (cafeSwitch) {
    cafeSwitch.addEventListener("click", async (e) => {
      const btn = e.target.closest(".cafe-chip");
      if (!btn) return;

      const prev = getCafeId();
      const next = CAFES[btn.dataset.id] ? btn.dataset.id : "center";

      setCafeId(next);
      updateCafeUI();
      clearCartOnCafeChangeIfNeeded(prev, next);

      // дождаться загрузки JSON, чтобы фильтрация работала по cafes
      try { if (typeof productsReady !== "undefined") await productsReady; } catch(_) {}
      updateMenuVisibility();
    });
  }

  // init: дождаться JSON и применить фильтрацию
  (async () => {
    updateCafeUI();
    try { if (typeof productsReady !== "undefined") await productsReady; } catch(_) {}
    updateMenuVisibility();
  })();
});
const phoneInput = document.getElementById("checkoutPhone");

const phoneHint = document.getElementById("phoneHint");
function updateCheckoutState(){
  const hasItems = cart.length > 0;
  const phoneFilled = phoneInput.value.length >= 18;

  checkoutBtn.disabled = !(hasItems && phoneFilled);
}
phoneInput.addEventListener("input", () => {
  phoneInput.value = formatPhone(phoneInput.value);

  if(phoneInput.value.length < 18){
    phoneHint.textContent = "Введите номер полностью";
    phoneHint.classList.add("error");
  } else {
    phoneHint.textContent = "Номер введён корректно";
    phoneHint.classList.remove("error");
  }

  updateCheckoutState();
});

checkoutBtn.addEventListener("click", () => {
  if(!phoneInput.value.trim()){
    alert("Введите номер телефона для оформления заказа");
    phoneInput.focus();
    return;
  }

  alert("Заказ оформлен! Мы скоро свяжемся с вами.");
  cart = [];
  renderCart();
});
function formatPhone(value){
  const digits = value.replace(/\D/g, "").replace(/^7|8/, "");
  let result = "+7 ";

  if(digits.length > 0) result += "(" + digits.substring(0,3);
  if(digits.length >= 4) result += ") " + digits.substring(3,6);
  if(digits.length >= 7) result += "-" + digits.substring(6,8);
  if(digits.length >= 9) result += "-" + digits.substring(8,10);

  return result;
}
// ===== ALERT ПРИ ОФОРМЛЕНИИ ЗАКАЗА (100%) =====
document.addEventListener("click", (e) => {
  const btn = e.target.closest(
    ".checkout-btn, .cart-checkout, #checkout, #checkoutBtn, [data-checkout]"
  );

  if (!btn) return;

  // если корзина пустая — не показываем
  if (!window.cart || window.cart.length === 0) return;

  alert("✅ Заказ оформлен!");
});
document.addEventListener("DOMContentLoaded", () => {
  const checkout = document.getElementById("cartCheckout");
  if (!checkout) return;

  // Функция обновляет доступность кнопки
  function updateCheckoutEnabled() {
    const hasItems = Array.isArray(window.cart) && window.cart.length > 0;
    checkout.disabled = !hasItems;
  }

  // Обновить сразу
  updateCheckoutEnabled();

  // Подстраховка: обновлять после любого изменения DOM (корзины)
  const cartEl = document.querySelector(".cart, #cart, .cart-panel, aside");
  if (cartEl) {
    const mo = new MutationObserver(updateCheckoutEnabled);
    mo.observe(cartEl, { childList: true, subtree: true });
  }

  checkout.addEventListener("click", () => {
    if (checkout.disabled) return;
    alert("✅ Заказ оформлен!");
  });
});
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#cartCheckout");
  if (!btn) return;

  if (!window.cart || window.cart.length === 0) return;

  alert("✅ Заказ оформлен!");
});
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#cartCheckout");
  if (!btn) return;

  // если кнопка disabled — клик не пройдет, поэтому страхуемся:
  if (btn.disabled) return;

  // если корзина пустая — не оформляем
  if (!window.cart || window.cart.length === 0) return;

  alert("✅ Заказ оформлен!");
});
setInterval(() => {
  const btn = document.getElementById("cartCheckout");
  if (!btn) return;
  btn.disabled = !(window.cart && window.cart.length > 0);
}, 200);
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("cartCheckout");
  if (!btn) return;

  // включаем кнопку если есть товары
  setInterval(() => {
    btn.disabled = !(window.cart && window.cart.length > 0);
  }, 200);

  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    alert("✅ Заказ оформлен!");
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const checkoutBtn = document.getElementById('cartCheckout');

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      alert('Заказ оформлен!');
    });
  }
});
const checkoutBtn = document.getElementById('cartCheckout');
const toast = document.getElementById('orderToast');

if (checkoutBtn && toast) {
  checkoutBtn.addEventListener('click', () => {
    toast.hidden = false;

    setTimeout(() => {
      toast.hidden = true;
    }, 3000);
  });
}