const productCards = document.querySelectorAll('.product-card');
const categoryButtons = document.querySelectorAll('.categories li[data-category]');
const menuGroups = document.querySelectorAll('.menu-group');
const menuEmptyState = document.getElementById('menuEmptyState');
const productModal = document.getElementById('productModal');
const closeProductModal = document.getElementById('closeProductModal');
const modalTitle = document.getElementById('modalTitle');
const modalPrice = document.getElementById('modalPrice');
const modalDescription = document.getElementById('modalDescription');
const modalProductImage = document.getElementById('modalProductImage');
const modalImageFrame = document.querySelector('.modal-image-small');
const addToCart = document.getElementById('addToCart');
const toggleDetailsButton = document.getElementById('toggleDetailsButton');
const modalDescriptionWrapper = document.getElementById('modalDescriptionWrapper');
const bundleChoicesWrapper = document.getElementById('bundleChoicesWrapper');
const cartButton = document.getElementById('cartButton');
const cartCount = document.getElementById('cartCount');
const cartBackdrop = document.getElementById('cartBackdrop');
const closeCart = document.getElementById('closeCart');
const cartItemsContainer = document.getElementById('cartItems');
const promoInput = document.getElementById('promoInput');
const applyPromoButton = document.getElementById('applyPromoButton');
const promoMessage = document.getElementById('promoMessage');
const paymentSelect = document.getElementById('paymentSelect');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartDiscount = document.getElementById('cartDiscount');
const cartTotal = document.getElementById('cartTotal');
const checkoutButton = document.getElementById('checkoutButton');
const feedbackForm = document.getElementById('feedbackForm');
const toastNotification = document.getElementById('toastNotification');
const toastTitle = document.getElementById('toastTitle');
const toastMessage = document.getElementById('toastMessage');

let cart = [];
let activePromo = null;
let selectedProduct = null;
let currentCategory = 'all';

const priceRange = document.querySelector('.filter input[type="range"]');
const minPriceSpan = document.getElementById('minPrice');
const maxPriceSpan = document.getElementById('maxPrice');

const bundleOptions = {
  premium: [
    'Sunlit Cradle Coco Muffin (Cheese)',
    'Golden Ember Coco Muffin (Cheesy Bacon)',
  ],
  classic: [
    'Ivory Coco Muffin (Original)',
    'Midnight Coco Muffin (Chocolate)',
    'Lavender Coco Muffin (Ube)',
  ],
  mylk: [
    'Midas Mylk (Original)',
    'Ebon Bliss (Chocolate)',
    'Zen Matcha (Matcha)',
  ],
};

const bundleChoiceLabels = {
  premium: 'Premium Muffins',
  classic: 'Classic Muffins',
  mylk: 'Mylk Flavors',
};

const bundleUpgradePrice = 15;

function formatPrice(value) {
  return `₱${value.toFixed(0)}`;
}

function parsePrice(price) {
  return Number(price.replace(/[^\d.]/g, '')) || 0;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createOptionMarkup(options) {
  return options.map((option) => `<option value="${escapeHTML(option)}">${escapeHTML(option)}</option>`).join('');
}

function getBundleConfig(card) {
  if (card.dataset.bundle !== 'true') {
    return null;
  }

  return {
    premium: Number(card.dataset.premiumCount) || 0,
    classic: Number(card.dataset.classicCount) || 0,
    mylk: Number(card.dataset.mylkCount) || 0,
  };
}

function renderChoiceGroup(type, count) {
  if (!count) {
    return '';
  }

  const fields = Array.from({ length: count }, (_, index) => {
    const upgradeControl = type === 'classic' ? `
      <div class="upgrade-field">
        <input type="checkbox" class="bundle-upgrade-checkbox" data-choice-index="${index}" id="upgrade-${type}-${index}" />
        <label for="upgrade-${type}-${index}">Upgrade to Premium +₱${bundleUpgradePrice}</label>
      </div>
    ` : '';

    return `
      <div class="choice-field">
        <span>${type === 'mylk' ? 'Mylk' : 'Choice'} ${index + 1}</span>
        <select class="bundle-choice-select" data-choice-type="${type}" data-choice-index="${index}">
          ${createOptionMarkup(bundleOptions[type])}
        </select>
        ${upgradeControl}
      </div>
    `;
  }).join('');

  return `
    <div class="bundle-choice-section" data-group-type="${type}">
      <h3>${bundleChoiceLabels[type]}</h3>
      <div class="bundle-choice-grid">${fields}</div>
    </div>
  `;
}

function renderBundleChoices(bundleConfig) {
  if (!bundleConfig) {
    bundleChoicesWrapper.innerHTML = '';
    bundleChoicesWrapper.classList.add('hidden');
    return;
  }

  bundleChoicesWrapper.innerHTML = `
    <p class="bundle-choice-title">Choose Your Bundle Items</p>
    <p class="bundle-upgrade-summary hidden" id="bundleUpgradeSummary"></p>
    ${renderChoiceGroup('premium', bundleConfig.premium)}
    ${renderChoiceGroup('classic', bundleConfig.classic)}
    ${renderChoiceGroup('mylk', bundleConfig.mylk)}
  `;
  bundleChoicesWrapper.classList.remove('hidden');
}

function collectBundleChoices() {
  const groupedChoices = {
    premium: [],
    classic: [],
    mylk: [],
  };
  let upgradeCount = 0;

  bundleChoicesWrapper.querySelectorAll('.bundle-choice-select').forEach((select) => {
    const type = select.dataset.choiceType;
    const index = select.dataset.choiceIndex;
    const choiceValue = select.value;
    const upgradeCheckbox = select.closest('.choice-field') ? select.closest('.choice-field').querySelector('.bundle-upgrade-checkbox') : null;

    if (type === 'classic') {
      if (upgradeCheckbox?.checked) {
        // upgraded classics will be represented by premium selects elsewhere
        return;
      }
      groupedChoices.classic.push(choiceValue);
    } else if (type === 'premium') {
      groupedChoices.premium.push(choiceValue);
    } else {
      groupedChoices.mylk.push(choiceValue);
    }
  });

  // count checked upgrade boxes
  upgradeCount = bundleChoicesWrapper.querySelectorAll('.bundle-upgrade-checkbox:checked').length;

  return {
    details: Object.entries(groupedChoices)
      .filter(([, choices]) => choices.length)
      .map(([type, choices]) => `${bundleChoiceLabels[type]}: ${choices.join(', ')}`),
    upgradeCount,
  };
}

function updateBundleUpgradePreview() {
  const data = collectBundleChoices();
  const summaryElement = bundleChoicesWrapper.querySelector('#bundleUpgradeSummary');
  const basePrice = selectedProduct ? selectedProduct.price : 0;
  const upgradeTotal = data.upgradeCount * bundleUpgradePrice;

  if (summaryElement) {
    if (data.upgradeCount > 0) {
      summaryElement.textContent = `Added upgrade: +₱${upgradeTotal} (${data.upgradeCount} classic muffin${data.upgradeCount > 1 ? 's' : ''} upgraded)`;
      summaryElement.classList.remove('hidden');
    } else {
      summaryElement.textContent = '';
      summaryElement.classList.add('hidden');
    }
  }

  if (selectedProduct) {
    modalPrice.textContent = formatPrice(basePrice + upgradeTotal);
  }
}

function openProductModal(name, price, description, imageSrc, bundleConfig = null, category = '') {
  selectedProduct = {
    name,
    price: parsePrice(price),
    description,
    imageSrc,
    bundleConfig,
    category,
  };

  modalTitle.textContent = name;
  modalPrice.textContent = price;
  modalDescription.textContent = description;
  if (imageSrc) {
    modalProductImage.src = imageSrc;
    modalImageFrame.classList.remove('hidden');
  } else {
    modalProductImage.removeAttribute('src');
    modalImageFrame.classList.add('hidden');
  }
  const shouldShowDescription = category === 'mix-match' || category === 'bundles';
  modalDescriptionWrapper.classList.toggle('hidden', !shouldShowDescription);
  toggleDetailsButton.classList.toggle('hidden', shouldShowDescription);
  toggleDetailsButton.textContent = 'View More Details';
  renderBundleChoices(bundleConfig);
  updateBundleUpgradePreview();
  productModal.classList.remove('hidden');
}

bundleChoicesWrapper.addEventListener('change', (event) => {
  if (event.target.matches('.bundle-upgrade-checkbox')) {
    const checkbox = event.target;
    const choiceField = checkbox.closest('.choice-field');
    const select = choiceField ? choiceField.querySelector('.bundle-choice-select') : null;

    if (!select) return;

    if (checkbox.checked) {
      // save current classic selection so we can restore it
      select.dataset._classicValue = select.value;
      // switch options in-place to premium choices
      select.innerHTML = createOptionMarkup(bundleOptions.premium);
      select.dataset.choiceType = 'premium';
      choiceField.classList.add('upgraded');
    } else {
      // restore classic options in-place
      select.innerHTML = createOptionMarkup(bundleOptions.classic);
      select.dataset.choiceType = 'classic';
      if (select.dataset._classicValue) select.value = select.dataset._classicValue;
      choiceField.classList.remove('upgraded');
    }

    updateBundleUpgradePreview();
  }
});

function closeModal() {
  productModal.classList.add('hidden');
  bundleChoicesWrapper.classList.add('hidden');
}

toggleDetailsButton.addEventListener('click', () => {
  const isHidden = modalDescriptionWrapper.classList.toggle('hidden');
  toggleDetailsButton.textContent = isHidden ? 'View More Details' : 'Hide Details';
});

function showToast(title, message, duration = 3000) {
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  toastNotification.classList.remove('hidden');

  setTimeout(() => {
    toastNotification.classList.add('hidden');
  }, duration);
}

function filterProducts(category, maxPrice = null) {
  let visibleCount = 0;

  productCards.forEach((card) => {
    const cardPrice = parsePrice(card.dataset.price);
    const categoryMatch = category === 'all' || card.dataset.category === category;
    const priceMatch = maxPrice === null || cardPrice <= maxPrice;
    const isVisible = categoryMatch && priceMatch;
    card.style.display = isVisible ? '' : 'none';

    if (isVisible) {
      visibleCount += 1;
    }
  });

  menuGroups.forEach((group) => {
    const groupCategory = group.dataset.menuGroup;
    const groupMatchesCategory = category === 'all' || category === groupCategory;
    const hasVisibleCards = Array.from(group.querySelectorAll('.product-card')).some((card) => card.style.display !== 'none');
    group.style.display = groupMatchesCategory && hasVisibleCards ? '' : 'none';
  });

  if (menuEmptyState) {
    menuEmptyState.classList.toggle('hidden', visibleCount > 0);
  }
}

function updateCartCount() {
  const totalQuantity = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = totalQuantity;
}

function calculateCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = activePromo ? Math.round(subtotal * activePromo.percent / 100) : 0;
  const total = Math.max(subtotal - discount, 0);

  cartSubtotal.textContent = formatPrice(subtotal);
  cartDiscount.textContent = `-${formatPrice(discount)}`;
  cartTotal.textContent = formatPrice(total);
}

function renderCart() {
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty. Add something delicious!</p>';
  } else {
    cartItemsContainer.innerHTML = cart.map((item, index) => `
      <div class="cart-item">
        ${item.imageSrc ? `<img src="${escapeHTML(item.imageSrc)}" alt="${escapeHTML(item.name)}" />` : '<div class="cart-item-placeholder">Box</div>'}
        <div class="cart-item-info">
          <h4>${escapeHTML(item.name)}</h4>
          <p>${formatPrice(item.price)} each</p>
          ${item.details ? `<p class="cart-item-details">${escapeHTML(item.details)}</p>` : ''}
          <div class="qty-control">
            <button class="qty-btn" data-index="${index}" data-action="decrease">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" data-index="${index}" data-action="increase">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <span>${formatPrice(item.price * item.qty)}</span>
          <button class="remove-item" data-index="${index}">Remove</button>
        </div>
      </div>
    `).join('');
  }

  updateCartCount();
  calculateCartTotals();
}

cartItemsContainer.addEventListener('click', (event) => {
  if (event.target.classList.contains('remove-item')) {
    const itemIndex = Number(event.target.dataset.index);
    const removedItem = cart[itemIndex];
    cart.splice(itemIndex, 1);
    renderCart();
    showToast('Removed', `${removedItem.name} removed from cart.`);
    return;
  }

  if (event.target.classList.contains('qty-btn')) {
    const itemIndex = Number(event.target.dataset.index);
    const action = event.target.dataset.action;
    const item = cart[itemIndex];

    if (!item) return;

    if (action === 'increase') {
      item.qty += 1;
    } else if (action === 'decrease') {
      item.qty -= 1;
      if (item.qty <= 0) {
        cart.splice(itemIndex, 1);
      }
    }

    renderCart();
    return;
  }
});

function applyPromoCode() {
  const code = promoInput.value.trim().toUpperCase();

  if (!code) {
    promoMessage.textContent = 'Enter a promo code to save.';
    activePromo = null;
  } else if (code === 'MUFFI10') {
    activePromo = { code, percent: 10 };
    promoMessage.textContent = 'Promo applied: 10% off your order.';
  } else if (code === 'SWEET5') {
    activePromo = { code, percent: 5 };
    promoMessage.textContent = 'Promo applied: 5% off your order.';
  } else {
    promoMessage.textContent = 'Invalid promo code. Try MUFFI10 or SWEET5.';
    activePromo = null;
  }

  calculateCartTotals();
}

function addToCartItem() {
  if (!selectedProduct) {
    return;
  }

  const bundleChoiceData = selectedProduct.bundleConfig ? collectBundleChoices() : { details: [], upgradeCount: 0 };
  const details = bundleChoiceData.details.join('; ');
  const upgradeTotal = bundleChoiceData.upgradeCount * bundleUpgradePrice;
  const itemPrice = selectedProduct.price + upgradeTotal;
  const productToAdd = {
    ...selectedProduct,
    price: itemPrice,
    details,
    id: details ? `${selectedProduct.name}|${details}|upgrades=${bundleChoiceData.upgradeCount}` : `${selectedProduct.name}|upgrades=${bundleChoiceData.upgradeCount}`,
  };
  const existing = cart.find((item) => item.id === productToAdd.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...productToAdd, qty: 1 });
  }

  showToast('Added to Cart!', `${selectedProduct.name} added to cart.`);
  renderCart();
  closeModal();
}

productCards.forEach((card) => {
  card.addEventListener('click', () => {
    const name = card.dataset.name;
    const price = card.dataset.price;
    const description = card.dataset.desc;
    const category = card.dataset.category;
    const imageElement = card.querySelector('.product-image');
    const imageSrc = imageElement ? imageElement.src : '';
    openProductModal(name, price, description, imageSrc, getBundleConfig(card), category);
  });
});

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    categoryButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    currentCategory = button.dataset.category;
    filterProducts(currentCategory, parseInt(priceRange.value));
  });
});

maxPriceSpan.textContent = `₱${priceRange.value}`;

priceRange.addEventListener('input', () => {
  maxPriceSpan.textContent = `₱${priceRange.value}`;
  filterProducts(currentCategory, parseInt(priceRange.value));
});

closeProductModal.addEventListener('click', closeModal);
productModal.addEventListener('click', (event) => {
  if (event.target === productModal) {
    closeModal();
  }
});

cartButton.addEventListener('click', () => {
  cartBackdrop.classList.remove('hidden');
  renderCart();
});

closeCart.addEventListener('click', () => {
  cartBackdrop.classList.add('hidden');
});

cartBackdrop.addEventListener('click', (event) => {
  if (!event.target.closest('.cart-panel')) {
    cartBackdrop.classList.add('hidden');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
    cartBackdrop.classList.add('hidden');
  }
});

addToCart.addEventListener('click', addToCartItem);

applyPromoButton.addEventListener('click', (event) => {
  event.preventDefault();
  applyPromoCode();
});

checkoutButton.addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Cart Empty', 'Add an item before checking out.');
    return;
  }

  const method = paymentSelect.value;
  const total = cartTotal.textContent;
  showToast('Order Placed', `${total} paid with ${method}. Thank you!`);
  cart = [];
  activePromo = null;
  promoInput.value = '';
  promoMessage.textContent = 'Use MUFFI10 for 10% off.';
  renderCart();
  cartBackdrop.classList.add('hidden');
});

feedbackForm.addEventListener('submit', (event) => {
  event.preventDefault();
  showToast('Thanks!', 'We appreciate your feedback. Thank you!');
  feedbackForm.reset();
});
