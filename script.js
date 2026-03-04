// Переключение темы (светлая / тёмная)
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "☾";
  }
}

// читаем тему из localStorage
const savedTheme = localStorage.getItem("lattegarden-theme");
applyTheme(savedTheme || "light");

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  const newTheme = isDark ? "dark" : "light";
  localStorage.setItem("lattegarden-theme", newTheme);
  applyTheme(newTheme);
});

// Мобильное меню
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});

// Фильтрация меню
const filterButtons = document.querySelectorAll(".filter-btn");
const menuCards = document.querySelectorAll(".menu-card-v2");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const category = btn.getAttribute("data-category");

    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    menuCards.forEach((card) => {
      const cardCat = card.getAttribute("data-category");
      if (category === "all" || category === cardCat) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  });
});

// Кнопка "наверх"
const topBtn = document.getElementById("topBtn");

window.addEventListener("scroll", () => {
  if (window.scrollY > 400) {
    topBtn.style.display = "block";
  } else {
    topBtn.style.display = "none";
  }
});

topBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});


// ===== Product modal for menu cards =====
(() => {
  const modal = document.getElementById("productModal");
  if (!modal) return;

  const els = {
    img: document.getElementById("productModalImg"),
    title: document.getElementById("productModalTitle"),
    desc: document.getElementById("productModalDesc"),
    price: document.getElementById("productModalPrice"),
    ingRow: document.getElementById("productModalIngredientsRow"),
    ing: document.getElementById("productModalIngredients"),
    calRow: document.getElementById("productModalCaloriesRow"),
    cal: document.getElementById("productModalCalories"),
    options: document.getElementById("productModalOptions"),
    sizeBlock: document.getElementById("productModalSizeBlock"),
    sizes: document.getElementById("productModalSizes"),
    milkBlock: document.getElementById("productModalMilkBlock"),
    milks: document.getElementById("productModalMilks"),
    add: document.getElementById("productModalAdd"),
    hint: document.getElementById("productModalHint"),
  };

  // Данные (можешь менять текст/ккал/состав — это только наполнение)
  const PRODUCT_META = {
    "Классический латте": {
      ingredients: "эспрессо, молоко",
      calories: { S: 140, M: 180, L: 230 },
      desc: "Мягкий эспрессо с молоком и нежной пенкой."
    },
    "Флэт уайт": {
      ingredients: "двойной эспрессо, молоко",
      calories: { S: 120, M: 160, L: 210 },
      desc: "Плотный вкус кофе и бархатная текстура."
    },
    "Ванильный раф": {
      ingredients: "эспрессо, сливки/молоко, ваниль",
      calories: { S: 220, M: 280, L: 350 },
      desc: "Сливочный раф с тёплой ванильной ноткой."
    },
    "Эспрессо": {
      ingredients: "эспрессо",
      calories: { S: 5, M: 5, L: 10 },
      desc: "Короткий, яркий и насыщенный."
    },
    "Апельсиновый раф": {
      ingredients: "эспрессо, сливки/молоко, апельсин",
      calories: { S: 230, M: 300, L: 370 },
      desc: "Цитрусовый раф с апельсиновым акцентом."
    },
    "Колд брю": {
      ingredients: "кофе холодного заваривания, вода",
      calories: { S: 5, M: 10, L: 15 },
      desc: "Освежающий, мягкий, без горечи."
    },
    "Чизкейк": {
      ingredients: "сливочный сыр, яйца, сахар, печенье",
      desc: "Классический сливочный чизкейк."
    },
    "Булочка с корицей": {
      ingredients: "дрожжевое тесто, корица, сахар, масло",
      desc: "Тёплая булочка с ароматной корицей."
    }
  };

  const MILK_PRICE = { regular: 0, oat: 30, almond: 40, coconut: 40 };
  const SIZE_PRICE = { S: -40, M: 0, L: 40 };

  let current = null;
  let currentBase = 0;
  let currentCategory = "coffee"; // coffee | dessert
  let currentSize = "M";
  let currentMilk = "regular";

  const lockScroll = (lock) => {
    document.documentElement.style.overflow = lock ? "hidden" : "";
  };

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    lockScroll(true);
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    els.hint.textContent = "";
    lockScroll(false);
  };

  modal.addEventListener("click", (e) => {
    if (e.target && e.target.matches("[data-close]")) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  const setActive = (container, selector, attr, value) => {
    container.querySelectorAll(selector).forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute(attr) === value);
    });
  };

  const formatPrice = (n) => `${n} ₽`;

  const computePrice = () => {
    if (currentCategory === "dessert") return currentBase;
    return currentBase + (SIZE_PRICE[currentSize] || 0) + (MILK_PRICE[currentMilk] || 0);
  };

  const renderPrice = () => {
    els.price.textContent = formatPrice(computePrice());
    const meta = PRODUCT_META[current?.title] || null;
    if (meta?.calories && currentCategory !== "dessert") {
      const kcal = meta.calories[currentSize] ?? meta.calories.M;
      els.cal.textContent = kcal ? `${kcal} ккал` : "";
      els.calRow.style.display = kcal ? "" : "none";
    }
  };

  const fillModal = ({ title, img, desc, basePrice, category }) => {
    current = { title, img };
    currentBase = basePrice;
    currentCategory = category;

    // defaults
    currentSize = (category === "dessert") ? "M" : "M";
    currentMilk = "regular";
    setActive(els.sizes, ".seg", "data-size", "M");
    setActive(els.milks, ".chip", "data-milk", "regular");

    const meta = PRODUCT_META[title] || {};
    els.title.textContent = title;
    els.img.src = img;
    els.img.alt = title;
    els.desc.textContent = meta.desc || desc || "";

    const ingredients = meta.ingredients || "";
    els.ing.textContent = ingredients;
    els.ingRow.style.display = ingredients ? "" : "none";

    // Show options only for drinks
    const isDessert = category === "dessert";
    els.sizeBlock.style.display = isDessert ? "none" : "";
    els.milkBlock.style.display = isDessert ? "none" : "";
    els.options.style.display = isDessert ? "none" : "";

    // calories row: for desserts hide unless provided
    if (isDessert) {
      els.calRow.style.display = "none";
      els.cal.textContent = "";
    } else {
      els.calRow.style.display = "";
    }

    renderPrice();
  };

  // size/milk handlers
  els.sizes.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg");
    if (!btn) return;
    currentSize = btn.getAttribute("data-size") || "M";
    setActive(els.sizes, ".seg", "data-size", currentSize);
    renderPrice();
  });

  els.milks.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    currentMilk = btn.getAttribute("data-milk") || "regular";
    setActive(els.milks, ".chip", "data-milk", currentMilk);
    renderPrice();
  });

  // Add to cart (localStorage)
  const CART_KEY = "lattegarden-cart";
  const readCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
  };
  const writeCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

  els.add.addEventListener("click", () => {
    if (!current) return;
    const cart = readCart();

    const item = {
      title: current.title,
      img: current.img,
      category: currentCategory,
      size: currentCategory === "dessert" ? null : currentSize,
      milk: currentCategory === "dessert" ? null : currentMilk,
      price: computePrice(),
      qty: 1
    };

    // merge same options
    const key = `${item.title}|${item.size || ""}|${item.milk || ""}`;
    const found = cart.find((x) => (x.key === key));
    if (found) found.qty += 1;
    else cart.push({ key, ...item });

    writeCart(cart);
    els.hint.textContent = "Добавлено в корзину ✓";
    setTimeout(() => { els.hint.textContent = ""; }, 1400);
    // optionally close modal:
    // closeModal();
  });

  // Hook buttons on menu cards
  document.querySelectorAll(".menu-card-v2").forEach((card) => {
    const titleEl = card.querySelector("h3");
    const imgEl = card.querySelector("img");
    const descEl = card.querySelector(".menu-card-text p");
    const priceEl = card.querySelector(".price");
    const btn = card.querySelector(".order-btn-v2");

    const title = titleEl ? titleEl.textContent.trim() : "Товар";
    const img = imgEl ? imgEl.getAttribute("src") : "";
    const desc = descEl ? descEl.textContent.trim() : "";
    const basePrice = priceEl ? parseInt(priceEl.textContent.replace(/[^\d]/g, ""), 10) || 0 : 0;
    const category = (card.getAttribute("data-category") === "dessert") ? "dessert" : "coffee";

    const open = (e) => {
      if (e) e.preventDefault();
      fillModal({ title, img, desc, basePrice, category });
      openModal();
    };

    if (btn) btn.addEventListener("click", open);
    // open modal by clicking image/title area too
    const clickable = card.querySelector(".menu-card-img");
    if (clickable) clickable.addEventListener("click", open);
    if (titleEl) titleEl.style.cursor = "pointer";
    if (titleEl) titleEl.addEventListener("click", open);
  });
})();



// ===== Главная: секция кофеен (вместо меню) =====
(function(){
  const heroImg = document.getElementById('cafesHeroImg');
  const prev = document.querySelector('.cafes-hero__nav--prev');
  const next = document.querySelector('.cafes-hero__nav--next');

  const photos = ['gallery-3.jpeg','gallery-1.jpeg','gallery-2.jpeg','gallery-5.jpeg'];
  let idx = 0;

  function setPhoto(i){
    if(!heroImg) return;
    idx = (i + photos.length) % photos.length;
    heroImg.src = photos[idx];
  }

  prev && prev.addEventListener('click', () => setPhoto(idx - 1));
  next && next.addEventListener('click', () => setPhoto(idx + 1));

  // menu buttons: remember выбранную кофейню и открыть меню
  document.querySelectorAll('[data-open-menu]').forEach(a => {
    a.addEventListener('click', (e) => {
      const card = e.target.closest('.cafe-card');
      if(!card) return;
      const cafeId = card.getAttribute('data-cafe');
      if(cafeId) localStorage.setItem('selectedCafeId', cafeId);
      // cart cafe also starts from selected cafe
      if(cafeId) localStorage.setItem('cartCafeId', cafeId);
    });
  });
})();
