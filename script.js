const modal = document.querySelector("#booking-modal");
const deviceSelect = document.querySelector("#device-select");
const repairSelect = document.querySelector("#repair-select");
const content = document.querySelector("#booking-step-content");
const nextButton = document.querySelector(".booking-next");
const backButton = document.querySelector(".booking-back");
const bookingAlert = document.querySelector("#booking-alert");
const progress = document.querySelector(".booking-progress");
const summary = document.createElement("div");
summary.className = "booking-summary-bar";
summary.hidden = true;
summary.setAttribute("aria-label", "Your selections");
document.querySelector(".booking-step-copy").after(summary);
const menuButton = document.querySelector(".menu-button");
const mainNav = document.querySelector("#main-nav");

const models = {
  "Apple iPhone": [
    "iPhone XR", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
    "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
    "iPhone 13 Mini", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
    "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
    "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
    "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
    "iPhone 17", "iPhone 17 Pro", "iPhone 17 Pro Max", "Other iPhone"
  ],
  "Samsung Galaxy": ["Galaxy A Series", "S21 Ultra", "S22 Ultra", "S23 Ultra", "S24 Ultra", "S25 Ultra", "Other Samsung Galaxy"],
  "Google Pixel": ["Pixel 9 Series", "Pixel 8 Series", "Pixel 7 Series", "Pixel 6 Series", "Other Google Pixel"],
  Motorola: ["Moto G Series", "Motorola Edge Series", "Razr Series", "Other Motorola"],
  Other: ["Other smartphone"]
};

const repairs = ["Screen Repair", "Back Glass Repair", "Battery Replacement", "Charging Port Repair", "Camera Repair", "Speaker Repair", "Diagnostics"];

const screenPrices = {
  "iPhone XR": 69, "iPhone 11": 79, "iPhone 11 Pro": 79, "iPhone 11 Pro Max": 99,
  "iPhone 12": 89, "iPhone 12 Pro": 89, "iPhone 12 Mini": 89, "iPhone 12 Pro Max": 109,
  "iPhone 13 Mini": 89, "iPhone 13": 99, "iPhone 13 Pro": 109, "iPhone 13 Pro Max": 119,
  "iPhone 14": 99, "iPhone 14 Plus": 109, "iPhone 14 Pro": 119, "iPhone 14 Pro Max": 129,
  "iPhone 15": 109, "iPhone 15 Plus": 119, "iPhone 15 Pro": 129, "iPhone 15 Pro Max": 139,
  "iPhone 16": 119, "iPhone 16 Plus": 129, "iPhone 16 Pro": 139, "iPhone 16 Pro Max": 149,
  "iPhone 17": 129, "iPhone 17 Pro": 149, "iPhone 17 Pro Max": 159
};

const backGlassPrices = {
  "iPhone 11": 79, "iPhone 11 Pro": 79, "iPhone 11 Pro Max": 79,
  "iPhone 12 Mini": 89, "iPhone 12 Pro": 99, "iPhone 12 Pro Max": 109,
  "iPhone 13": 99, "iPhone 13 Mini": 99, "iPhone 13 Pro": 109, "iPhone 13 Pro Max": 119,
  "iPhone 14": 109, "iPhone 14 Plus": 109, "iPhone 14 Pro": 119, "iPhone 14 Pro Max": 129,
  "iPhone 15": 119, "iPhone 15 Plus": 119, "iPhone 15 Pro": 129, "iPhone 15 Pro Max": 139
};

const samsungScreenPrices = {
  "S21 Ultra": 159, "S22 Ultra": 169,
  "S23 Ultra": 179, "S24 Ultra": 199, "S25 Ultra": 229
};

// iPhone battery replacement is priced $30 below the screen replacement for the same model.
const batteryDiscount = 30;
const batteryPrices = Object.fromEntries(Object.entries(screenPrices).map(([model, price]) => [model, price - batteryDiscount]));
// Samsung batteries are priced separately: $79 for every listed model, $99 for the S25 Ultra.
// Galaxy A Series has no listed price (custom quote), so it is left out of the price tables.
const samsungBatteryPrices = Object.fromEntries(Object.keys(samsungScreenPrices).map(model => [model, model === "S25 Ultra" ? 99 : 79]));

// Single source for every price shown on the site. Service pages fill [data-price-table] and
// [data-price-range] elements from these tables, so a price changes in one place only.
const priceTables = {
  "iphone-screen": { label: "iPhone screen replacement", prices: screenPrices },
  "samsung-screen": { label: "Samsung Galaxy screen replacement", prices: samsungScreenPrices },
  "iphone-battery": { label: "iPhone battery replacement", prices: batteryPrices },
  "samsung-battery": { label: "Samsung Galaxy battery replacement", prices: samsungBatteryPrices },
  "iphone-backglass": { label: "iPhone back glass replacement", prices: backGlassPrices },
  // Combined tables, used only for price ranges
  screen: { prices: { ...screenPrices, ...samsungScreenPrices } },
  battery: { prices: { ...batteryPrices, ...samsungBatteryPrices } },
  backglass: { prices: backGlassPrices }
};

// Appointment requests: the site lists 8 AM-11 PM daily. Requests can start at 8 AM through 10 PM
// so a 30-60 minute repair finishes inside opening hours. Every request is confirmed by call or text.
const slotHours = Array.from({ length: 15 }, (_, index) => index + 8);
const eveningStartHour = 17;
const leadTimeMinutes = 60;
const businessPhone = "+1 509-706-9013";

const booking = {
  brand: "", model: "", repair: "", price: null,
  name: "", phone: "", email: "", address: "", preferredDate: "", preferredTime: ""
};
let step = 1;
const totalSteps = 3;
// True when the visitor already picked a repair (service card, hero form or repair page), so step 2 skips the repair list.
let repairLocked = false;
let brandLocked = false; // same idea for the brand: a brand-specific card or page skips the brand list

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

// Business hours are Tri-Cities (Pacific) time, whatever the visitor's device clock says.
function pacificNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

function slotLabel(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:00 ${suffix}`;
}

function availableSlots(date) {
  const now = pacificNow();
  return slotHours.filter(hour => date !== now.date || hour * 60 >= now.minutes + leadTimeMinutes);
}

function timeOptions(date, selected) {
  if (!date) return '<option value="">Choose a date first</option>';
  const slots = availableSlots(date);
  if (!slots.length) return '<option value="">No request times left today</option>';
  return '<option value="">Select a time</option>' + slots.map(hour => {
    const label = slotLabel(hour);
    const text = hour >= eveningStartHour ? `${label} (evening)` : label;
    return `<option value="${label}" ${selected === label ? "selected" : ""}>${text}</option>`;
  }).join("");
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

// Returns { amount } (an estimate for the exact model), or null when we quote by call or text.
function calculatePrice() {
  const { brand, model, repair } = booking;
  let amount;
  if (brand === "Apple iPhone" && repair === "Screen Repair") amount = screenPrices[model];
  if (brand === "Apple iPhone" && repair === "Back Glass Repair") amount = backGlassPrices[model];
  if (brand === "Samsung Galaxy" && repair === "Screen Repair") amount = samsungScreenPrices[model];
  if (repair === "Battery Replacement" && brand === "Apple iPhone") amount = batteryPrices[model];
  if (repair === "Battery Replacement" && brand === "Samsung Galaxy") amount = samsungBatteryPrices[model];
  return amount === undefined ? null : { amount };
}

function priceLabel() {
  if (!booking.price) return "Quote by call or text";
  return `Estimated $${booking.price.amount}`;
}

function choiceCards(items, key, selected) {
  return `<div class="booking-choice-grid">${items.map(label =>
    `<button class="booking-choice ${selected === label ? "selected" : ""}" data-key="${key}" data-value="${escapeHtml(label)}" type="button" aria-pressed="${selected === label}"><span>${escapeHtml(label)}</span><b>→</b></button>`
  ).join("")}</div>`;
}

function estimateCard() {
  booking.price = calculatePrice();
  const { price } = booking;
  const headline = price ? `$${price.amount}` : "Quote needed";
  const status = price ? "Estimated price" : "Custom quote";
  const note = price
    ? "This is an estimate, not a final price. We confirm the final price by call or text when we confirm your appointment, before the repair starts."
    : "We don't list a price for this device and repair online. Call or text us with your model and we'll quote it, and confirm the final price before the repair starts.";
  return `<div class="price-result" id="price-result">
    <span class="price-status">${status}</span>
    <strong>${headline}</strong>
    <h3>${escapeHtml(booking.model)} · ${escapeHtml(booking.repair)}</h3>
    <p>${note}</p>
    <div class="price-trust"><span>✓ We Come To You</span><span>✓ 30-day warranty</span><span>✓ Call or text to confirm</span></div>
  </div>`;
}

function summaryBar() {
  booking.price = calculatePrice();
  // Device and Repair are buttons: tap one to jump straight back to that choice (no stepping through Back).
  const items = [
    ["Device", booking.model || booking.brand, "device"],
    ["Repair", booking.repair, "repair"],
    ["Price", booking.repair && booking.model ? priceLabel() : "", ""]
  ].filter(([, value]) => value);
  summary.hidden = !items.length;
  summary.innerHTML = items.map(([label, value, go]) => go
    ? `<button type="button" data-go="${go}" title="Change ${label.toLowerCase()}"><small>${label} · change</small><strong>${escapeHtml(value)}</strong></button>`
    : `<span><small>${label}</small><strong>${escapeHtml(value)}</strong></span>`).join("");
}

function markSelected(key) {
  content.querySelectorAll(`[data-key='${key}']`).forEach(item => {
    const selected = item.dataset.value === booking[key];
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
}

// Delegated click handler for the choice buttons that are currently on screen.
function choose(button) {
  const key = button.dataset.key;
  booking[key] = button.dataset.value;
  if (key === "brand") { booking.model = ""; if (!repairLocked) booking.repair = ""; }
  booking.price = null;
  bookingAlert.textContent = "";
  markSelected(key);
  if (key === "brand") renderModels();
  if (key === "repair") renderEstimate();
  summaryBar();
}

function renderModels() {
  const slot = content.querySelector("#model-slot");
  if (!slot) return;
  slot.innerHTML = booking.brand
    ? `<h3 class="booking-subtitle">Your ${escapeHtml(booking.brand === "Other" ? "phone" : booking.brand)} model</h3>${choiceCards(models[booking.brand] || [], "model", booking.model)}`
    : "";
  if (booking.brand) slot.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
}

function renderEstimate() {
  const slot = content.querySelector("#estimate-slot");
  if (!slot) return;
  slot.innerHTML = booking.repair ? estimateCard() : "";
  if (booking.repair) slot.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
}

function renderStep() {
  const titles = ["Choose your phone", "Choose your repair", "Your details & appointment"];
  const descriptions = [
    "Pick the brand, then your model.",
    "Pick the repair to see your price estimate.",
    "Tell us where and when the technician should meet you. Nothing is booked until we confirm."
  ];

  document.querySelector("#step-kicker").textContent = `Step ${step} of ${totalSteps}`;
  document.querySelector("#step-title").textContent = titles[step - 1];
  document.querySelector("#step-description").textContent = descriptions[step - 1];
  bookingAlert.textContent = "";
  progress.innerHTML = Array.from({ length: totalSteps }, (_, index) => `<span class="${index < step ? "active" : ""}"></span>`).join("");
  backButton.style.visibility = step === 1 ? "hidden" : "visible";
  nextButton.innerHTML = step === totalSteps ? "Prepare SMS request <span>→</span>" : "Continue <span>→</span>";
  summaryBar();

  if (step === 1) {
    content.innerHTML = (brandLocked && booking.brand
      ? `<div class="locked-repair"><span><small>Your phone</small><strong>${escapeHtml(booking.brand === "Other" ? "Other phone" : booking.brand)}</strong></span><button class="link-button" type="button" data-unlock-brand>Change device</button></div>`
      : choiceCards(Object.keys(models), "brand", booking.brand)) + '<div id="model-slot"></div>';
    renderModels();
  }
  if (step === 2) {
    content.innerHTML = (repairLocked && booking.repair
      ? `<div class="locked-repair"><span><small>Your repair</small><strong>${escapeHtml(booking.repair)}</strong></span><button class="link-button" type="button" data-unlock>Change repair</button></div><div id="estimate-slot"></div>`
      : `${choiceCards(repairs, "repair", booking.repair)}<div id="estimate-slot"></div>`);
    renderEstimate();
  }
  if (step === 3) {
    booking.price = calculatePrice();
    content.innerHTML = `<div class="customer-form">
      <label>Full name<input required data-field="name" value="${escapeHtml(booking.name)}" placeholder="Your name" autocomplete="name"></label>
      <label>Phone number<input required data-field="phone" value="${escapeHtml(booking.phone)}" placeholder="509-555-0123" inputmode="tel" autocomplete="tel" pattern="[0-9+()\\-\\s.]{10,}" title="Enter a phone number with area code"></label>
      <label>Email address<input required data-field="email" value="${escapeHtml(booking.email)}" placeholder="you@example.com" type="email" autocomplete="email"></label>
      <label>Service address<input required data-field="address" value="${escapeHtml(booking.address)}" placeholder="Where should we come to you?" autocomplete="street-address"></label>
      <label>Preferred date<input required data-field="preferredDate" value="${escapeHtml(booking.preferredDate)}" type="date" min="${pacificNow().date}"></label>
      <label>Preferred time<select required data-field="preferredTime" id="time-select">${timeOptions(booking.preferredDate, booking.preferredTime)}</select></label>
      <p class="form-hint">We're open daily 8 AM–11 PM (Tri-Cities time). These are <strong>requested</strong> times, not confirmed appointments: we confirm by call or text. Need a different time? <a href="tel:+15097069013">Call</a> or <a href="sms:+15097069013">text ${businessPhone}</a>.</p>
      <p class="form-privacy">Your details are used only to arrange this repair by SMS, call or email. <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a></p>
    </div>`;
    const dateInput = content.querySelector("[data-field='preferredDate']");
    const timeSelect = content.querySelector("#time-select");
    dateInput.addEventListener("change", () => {
      booking.preferredDate = dateInput.value;
      booking.preferredTime = "";
      timeSelect.innerHTML = timeOptions(dateInput.value, "");
    });
  }
}

function openBookingModal(trigger) {
  document.querySelector(".booking-step-copy").style.display = "";
  document.querySelector(".booking-controls").style.display = "";
  progress.style.display = "";
  // Every new booking starts fresh: the phone and repair from an earlier attempt are not carried over.
  // Contact details are kept so the form doesn't have to be retyped.
  if (!modal.classList.contains("open")) {
    booking.brand = "";
    booking.model = "";
    booking.repair = "";
    booking.preferredTime = "";
  }
  brandLocked = false;
  if (trigger?.dataset?.brand) {
    if (trigger.dataset.brand !== booking.brand) { booking.brand = trigger.dataset.brand; booking.model = ""; }
    brandLocked = true;
  } else if (deviceSelect?.value) {
    brandLocked = true;
    const brandMap = { iPhone: "Apple iPhone", "Samsung Galaxy": "Samsung Galaxy", "Other smartphone": "Other" };
    const brand = brandMap[deviceSelect.value] || deviceSelect.value;
    if (brand !== booking.brand) { booking.brand = brand; booking.model = ""; }
  }
  const cardRepair = trigger?.dataset?.repair;
  repairLocked = false;
  if (cardRepair) {
    booking.repair = cardRepair;
    repairLocked = true;
  } else if (repairSelect?.value) {
    const repairMap = {
      "Screen replacement": "Screen Repair", "Battery replacement": "Battery Replacement",
      "Back glass replacement": "Back Glass Repair", "Charging port repair": "Charging Port Repair",
      "Camera repair": "Camera Repair", "Speaker repair": "Speaker Repair",
      "Diagnostics / Other": "Diagnostics"
    };
    booking.repair = repairMap[repairSelect.value] || repairSelect.value;
    repairLocked = true;
  }
  step = booking.brand && booking.model ? 2 : 1;
  renderStep();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  document.querySelector(".modal-close").focus();
}

function closeBookingModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function showBookingAlert(message) {
  bookingAlert.textContent = message;
}

function closeMenu() {
  mainNav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
}

function readForm() {
  content.querySelectorAll("input, select").forEach(input => booking[input.dataset.field] = input.value.trim());
}

menuButton.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});
mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

document.querySelectorAll(".booking-trigger, .booking-submit, a[href='#booking']").forEach(button => button.addEventListener("click", event => {
  event.preventDefault();
  openBookingModal(event.currentTarget);
}));
document.querySelector(".modal-close").addEventListener("click", closeBookingModal);
summary.addEventListener("click", event => {
  const target = event.target.closest("[data-go]")?.dataset.go;
  if (!target) return;
  if (step === 3) readForm();
  if (target === "device") step = 1;
  if (target === "repair") { step = 2; repairLocked = false; }
  renderStep();
});
modal.addEventListener("click", event => { if (event.target === modal) closeBookingModal(); });
content.addEventListener("click", event => {
  const button = event.target.closest(".booking-choice");
  if (button) choose(button);
  if (event.target.closest("[data-unlock]")) { repairLocked = false; renderStep(); }
  if (event.target.closest("[data-change-device]")) { step = 1; renderStep(); }
  if (event.target.closest("[data-unlock-brand]")) { brandLocked = false; renderStep(); }
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeBookingModal();
    closeMenu();
  }
});
backButton.addEventListener("click", () => {
  if (step === 3) readForm();
  if (step > 1) { step -= 1; renderStep(); }
});

nextButton.addEventListener("click", () => {
  if (step === 1 && !booking.brand) return showBookingAlert("Please choose a device brand.");
  if (step === 1 && !booking.model) return showBookingAlert("Please choose your device model.");
  if (step === 2 && !booking.repair) return showBookingAlert("Please choose a repair service.");
  if (step === 3) {
    readForm();
    const fields = [...content.querySelectorAll("input, select")];
    if (fields.some(field => !field.checkValidity())) {
      content.classList.add("form-error");
      return showBookingAlert("Please complete every field with valid information.");
    }
    if (!availableSlots(booking.preferredDate).map(slotLabel).includes(booking.preferredTime)) {
      return showBookingAlert("That time can't be requested any more. Please choose another time.");
    }
  }
  if (step < totalSteps) {
    step += 1;
    renderStep();
    return;
  }
  const device = booking.brand === "Other" || /iPhone|Pixel|Moto|Other/.test(booking.model) ? booking.model : `${booking.brand} ${booking.model}`;
  const request = encodeURIComponent(`PhoneFix2You repair request (not confirmed until you reply):
Device: ${device}
Repair: ${booking.repair}
Price: ${priceLabel()} (final price confirmed by call or text)
Name: ${booking.name}
Phone: ${booking.phone}
Email: ${booking.email}
Address: ${booking.address}
Requested: ${formatDate(booking.preferredDate)} at ${booking.preferredTime}`);
  content.innerHTML = `<div class="booking-success"><div>✓</div><h3>Your request is ready to send</h3><p>It is <strong>not booked yet</strong>. Send the prepared text to PhoneFix2You from your phone, and we'll call or text you to confirm the time and the final price.</p><div class="booking-summary">
    <div><span>Device</span><strong>${escapeHtml(device)}</strong></div>
    <div><span>Repair</span><strong>${escapeHtml(booking.repair)} · ${escapeHtml(priceLabel())}</strong></div>
    <div><span>Requested</span><strong>${escapeHtml(formatDate(booking.preferredDate))} at ${escapeHtml(booking.preferredTime)}</strong></div>
    <div><span>Address</span><strong>${escapeHtml(booking.address)}</strong></div>
  </div><div class="success-actions"><a href="sms:+15097069013?body=${request}">Send booking SMS</a><a href="tel:+15097069013">Call instead</a></div></div>`;
  summary.hidden = true;
  document.querySelector(".booking-step-copy").style.display = "none";
  document.querySelector(".booking-controls").style.display = "none";
  progress.style.display = "none";
});

// Price tables and ranges on service pages come from the same tables the booking estimate uses.
document.querySelectorAll("[data-price-table]").forEach(target => {
  const table = priceTables[target.dataset.priceTable];
  if (!table?.label) return;
  const rows = Object.entries(table.prices).map(([model, amount]) => `<tr><th scope="row">${escapeHtml(model)}</th><td>$${amount}</td></tr>`).join("");
  target.innerHTML = `<table class="price-table"><caption>${escapeHtml(table.label)}: estimated prices</caption><thead><tr><th scope="col">Model</th><th scope="col">Estimate</th></tr></thead><tbody>${rows}</tbody></table>`;
});
document.querySelectorAll("[data-price-range]").forEach(target => {
  const table = priceTables[target.dataset.priceRange];
  if (!table) return;
  const amounts = Object.values(table.prices);
  target.textContent = `$${Math.min(...amounts)}–$${Math.max(...amounts)}`;
});

// GA4 click tracking. First matching selector wins, so nested areas come first.
const trackingLocations = [
  [".booking-success", "booking_modal"],
  [".modal", "booking_modal"],
  [".mobile-book", "sticky_bar"],
  [".announcement", "announcement"],
  [".site-header", "header"],
  [".hero", "hero"],
  [".process", "how_it_works"],
  [".service-area", "service_area"],
  [".faq-section", "faq"],
  [".cta-section", "cta_banner"],
  ["footer", "footer"]
];

function buttonLocation(element) {
  const match = trackingLocations.find(([selector]) => element.closest(selector));
  return match ? match[1] : element.closest("section[id]")?.id || "other";
}

function trackEvent(name, element, extraParams = {}) {
  try {
    if (typeof gtag !== "function") return;
    gtag("event", name, { page_path: location.pathname, button_location: buttonLocation(element), ...extraParams });
  } catch (error) {
    // Tracking must never stop the link from opening.
  }
}

// Capture phase, no preventDefault: the event is queued and the link opens immediately.
document.addEventListener("click", event => {
  const link = event.target.closest?.("a[href^='tel:'], a[href^='sms:']");
  if (!link) return;
  const isSms = link.getAttribute("href").startsWith("sms:");
  // Links on the booking success screen finish the booking: count them once, as booking_submit only.
  if (link.closest(".booking-success")) {
    trackEvent("booking_submit", link, { contact_method: isSms ? "sms" : "call" });
    return;
  }
  trackEvent(isSms ? "sms_click" : "phone_call_click", link);
}, true);
