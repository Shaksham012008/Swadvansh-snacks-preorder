// Setup credentials
const RAZORPAY_KEY = "rzp_live_TanFJ9dWEEgNzZ"; 
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_EXEC_ID/exec";

// Product Pricing Data Map
const packDetails = {
  "100g_1": { name: "100g Single Pack (10% OFF)", total: 89.10, deposit: 45.00, deliveryNote: "(+ Delivery as per location)" },
  "100g_2": { name: "100g Pack of 2 (10% OFF)", total: 178.20, deposit: 84.00, deliveryNote: "(FREE Delivery)" },
  "100g_3": { name: "100g Pack of 3 (10% OFF)", total: 267.30, deposit: 126.00, deliveryNote: "(FREE Delivery)" },
  "150g_1": { name: "150g Single Pack", total: 149.00, deposit: 75.00, deliveryNote: "(Standard Delivery)" },
  "150g_2": { name: "150g Pack of 2", total: 298.00, deposit: 149.00, deliveryNote: "(Standard Delivery)" },
  "150g_3": { name: "150g Pack of 3", total: 447.00, deposit: 224.00, deliveryNote: "(Standard Delivery)" }
};

let selectedKey = "100g_1";

// Handles Variant Buttons Click
function selectPack(key, element, cardId) {
  selectedKey = key;

  // Reset all buttons active state
  document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');

  // Highlight active card border
  document.querySelectorAll('.product-card').forEach(card => card.classList.remove('selected-card'));
  document.getElementById(cardId).classList.add('selected-card');

  // Update Summary Box DOM Elements
  const pack = packDetails[selectedKey];
  document.getElementById("summary-name").innerText = pack.name;
  document.getElementById("summary-total").innerText = pack.total.toFixed(2);
  document.getElementById("summary-deposit").innerText = pack.deposit.toFixed(2);
  document.getElementById("summary-delivery").innerText = pack.deliveryNote;
}

// Triggers Razorpay Checkout & Webhook Payload
function payNow() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const street = document.getElementById("street").value;
  const city = document.getElementById("city").value;
  const state = document.getElementById("state").value;
  const pincode = document.getElementById("pincode").value;
  const fullAddress = `${street}, ${city}, ${state} - ${pincode}`;

  const selectedPack = packDetails[selectedKey];

  const options = {
    "key": RAZORPAY_KEY,
    "amount": Math.round(selectedPack.deposit * 100), // Amount in Paise
    "currency": "INR",
    "name": "Swadvansh Snacks",
    "description": "50% Deposit for " + selectedPack.name,
    "handler": function (response) {
      // Post data to Google Apps Script Web App
      fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          phone: phone,
          street: street,
          city: city,
          state: state,
          pincode: pincode,
          fullAddress: fullAddress,
          pack: selectedPack.name,
          totalPrice: selectedPack.total,
          paidDeposit: selectedPack.deposit,
          dueBalance: (selectedPack.total - selectedPack.deposit).toFixed(2),
          paymentId: response.razorpay_payment_id
        })
      }).then(() => {
        alert("Pre-order placed successfully! Payment ID: " + response.razorpay_payment_id);
        document.getElementById("preOrderForm").reset();
      }).catch(() => {
        alert("Payment done, but failed to sync data.");
      });
    },
    "prefill": { "name": name, "contact": phone },
    "theme": { "color": "#c5a059" }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}