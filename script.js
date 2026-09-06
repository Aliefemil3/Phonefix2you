const modal = document.querySelector("#booking-modal");
const deviceSelect = document.querySelector("#device-select");
const repairSelect = document.querySelector("#repair-select");
const content = document.querySelector("#booking-step-content");
const nextButton = document.querySelector(".booking-next");
const backButton = document.querySelector(".booking-back");
const bookingAlert = document.querySelector("#booking-alert");
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
  "Galaxy A Series": 89, "S21 Ultra": 159, "S22 Ultra": 169,
  "S23 Ultra": 179, "S24 Ultra": 199, "S25 Ultra": 229
};

const booking = {
  brand: "", model: "", repair: "", price: null,
  name: "", phone: "", email: "", address: "", preferredDate: "", preferredTime: ""
};
let step = 1;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function localDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split("T")[0];
}

function calculatePrice() {
  if (booking.brand === "Apple iPhone" && booking.repair === "Screen Repair") return screenPrices[booking.model] ?? null;
  if (booking.brand === "Apple iPhone" && booking.repair === "Back Glass Repair") return backGlassPrices[booking.model] ?? null;
  if (booking.brand === "Samsung Galaxy" && booking.repair === "Screen Repair") return samsungScreenPrices[booking.model] ?? null;
  return null;
}

function priceLabel() {
  return booking.price === null ? "Custom quote" : `$${booking.price}`;
}

function choiceCards(items, key, selected) {
  return `<div class="booking-choice-grid">${items.map(label =>
    `<button class="booking-choice ${selected === label ? "selected" : ""}" data-key="${key}" data-value="${label}" type="button"><span>${label}</span><b>→</b></button>`
  ).join("")}</div>`;
}

function renderStep() {
  const titles = ["Choose your device brand", "Choose your device model", "Select a repair", "Your repair price", "Your information", "Review your booking"];
  const descriptions = [
    "Select the phone you need repaired.",
    `Choose your ${booking.brand || "phone"} model.`,
    "Select the repair service you need.",
    "Your price is calculated automatically from your device and repair.",
    "Tell us where and when our mobile technician should meet you.",
    "Confirm your details and request your mobile repair."
  ];

  document.querySelector("#step-kicker").textContent = `Step ${step} of 6`;
  document.querySelector("#step-title").textContent = titles[step - 1];
  document.querySelector("#step-description").textContent = descriptions[step - 1];
  bookingAlert.textContent = "";
  document.querySelectorAll(".booking-progress span").forEach((bar, index) => bar.classList.toggle("active", index < step));
  backButton.style.visibility = step === 1 ? "hidden" : "visible";
  nextButton.innerHTML = step === 6 ? "Prepare SMS request <span>→</span>" : "Continue <span>→</span>";

  if (step === 1) content.innerHTML = choiceCards(Object.keys(models), "brand", booking.brand);
  if (step === 2) content.innerHTML = choiceCards(models[booking.brand] || [], "model", booking.model);
  if (step === 3) content.innerHTML = choiceCards(repairs, "repair", booking.repair);
  if (step === 4) {
    booking.price = calculatePrice();
    content.innerHTML = `<div class="price-result">
      <span class="price-status">Instant price</span>
      <strong>${priceLabel()}</strong>
      <h3>${booking.model} · ${booking.repair}</h3>
      <p>${booking.price === null ? "We will confirm your exact price by call or text before the repair." : "Your listed repair price. No surprise fees."}</p>
      <div class="price-trust"><span>✓ We Come To You</span><span>✓ 30-day warranty</span><span>✓ Professional installation</span></div>
    </div>`;
  }
  if (step === 5) content.innerHTML = `<div class="customer-form">
    <label>Full name<input required data-field="name" value="${booking.name}" placeholder="Your name" autocomplete="name"></label>
    <label>Phone number<input required data-field="phone" value="${booking.phone}" placeholder="509-555-0123" inputmode="tel" autocomplete="tel"></label>
    <label>Email address<input required data-field="email" value="${booking.email}" placeholder="you@example.com" type="email" autocomplete="email"></label>
    <label>Service address<input required data-field="address" value="${booking.address}" placeholder="Where should we come to you?" autocomplete="street-address"></label>
    <label>Preferred date<input required data-field="preferredDate" value="${booking.preferredDate}" type="date" min="${localDateString()}"></label>
    <label>Preferred time<select required data-field="preferredTime"><option value="">Select a time</option>${["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"].map(time => `<option ${booking.preferredTime === time ? "selected" : ""}>${time}</option>`).join("")}</select></label>
  </div>`;
  if (step === 6) content.innerHTML = `<div class="booking-summary">
    <div><span>Device</span><strong>${escapeHtml(booking.brand)} · ${escapeHtml(booking.model)}</strong></div>
    <div><span>Repair</span><strong>${escapeHtml(booking.repair)}</strong></div>
    <div class="summary-price"><span>Repair price</span><strong>${priceLabel()}</strong></div>
    <div><span>Customer</span><strong>${escapeHtml(booking.name)}<br>${escapeHtml(booking.phone)}<br>${escapeHtml(booking.email)}</strong></div>
    <div><span>We Come To You</span><strong>${escapeHtml(booking.address)}</strong></div>
    <div><span>Preferred appointment</span><strong>${escapeHtml(booking.preferredDate)} at ${escapeHtml(booking.preferredTime)}</strong></div>
  </div>`;

  content.querySelectorAll(".booking-choice").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.key;
    booking[key] = button.dataset.value;
    if (key === "brand") {
      booking.model = "";
      booking.repair = "";
    }
    if (key === "model") booking.repair = "";
    booking.price = null;
    content.querySelectorAll(".booking-choice").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
  }));
}

function openBookingModal() {
  document.querySelector(".booking-step-copy").style.display = "";
  document.querySelector(".booking-controls").style.display = "";
  document.querySelector(".booking-progress").style.display = "";
  if (deviceSelect?.value) {
    const brandMap = { iPhone: "Apple iPhone", "Samsung Galaxy": "Samsung Galaxy", "Other smartphone": "Other" };
    booking.brand = brandMap[deviceSelect.value] || deviceSelect.value;
  }
  if (repairSelect?.value) {
    const repairMap = {
      "Screen replacement": "Screen Repair", "Battery replacement": "Battery Replacement",
      "Back glass replacement": "Back Glass Repair", "Charging port repair": "Charging Port Repair",
      "Camera repair": "Camera Repair", "Speaker repair": "Speaker Repair",
      "Diagnostics / Other": "Diagnostics"
    };
    booking.repair = repairMap[repairSelect.value] || repairSelect.value;
  }
  step = booking.brand ? 2 : 1;
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

menuButton.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});
mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

document.querySelectorAll(".booking-trigger, .booking-submit, a[href='#booking']").forEach(button => button.addEventListener("click", event => {
  event.preventDefault();
  openBookingModal();
}));
document.querySelector(".modal-close").addEventListener("click", closeBookingModal);
modal.addEventListener("click", event => { if (event.target === modal) closeBookingModal(); });
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeBookingModal();
    closeMenu();
  }
});
backButton.addEventListener("click", () => { if (step > 1) { step -= 1; renderStep(); } });

nextButton.addEventListener("click", () => {
  if (step === 1 && !booking.brand) return showBookingAlert("Please choose a device brand.");
  if (step === 2 && !booking.model) return showBookingAlert("Please choose your device model.");
  if (step === 3 && !booking.repair) return showBookingAlert("Please choose a repair service.");
  if (step === 5) {
    const fields = [...content.querySelectorAll("input, select")];
    fields.forEach(input => booking[input.dataset.field] = input.value.trim());
    if (fields.some(field => !field.checkValidity())) {
      content.classList.add("form-error");
      return showBookingAlert("Please complete every field with valid information.");
    }
  }
  if (step < 6) {
    step += 1;
    renderStep();
    return;
  }
  const request = encodeURIComponent(`PhoneFix2You booking request:
Device: ${booking.brand} ${booking.model}
Repair: ${booking.repair}
Price: ${priceLabel()}
Name: ${booking.name}
Phone: ${booking.phone}
Email: ${booking.email}
Address: ${booking.address}
Preferred: ${booking.preferredDate} at ${booking.preferredTime}`);
  content.innerHTML = `<div class="booking-success"><div>✓</div><h3>Your booking request is ready</h3><p>Send the prepared SMS to PhoneFix2You. We will call or text you to confirm the appointment.</p><div class="success-actions"><a href="sms:+15097069013?body=${request}">Send booking SMS</a><a href="tel:+15097069013">Call Now</a></div></div>`;
  document.querySelector(".booking-step-copy").style.display = "none";
  document.querySelector(".booking-controls").style.display = "none";
  document.querySelector(".booking-progress").style.display = "none";
});
