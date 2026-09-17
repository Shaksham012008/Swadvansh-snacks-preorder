// Setup credentials
const RAZORPAY_KEY = "rzp_live_TanFJ9dwEEgNZz";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyYIfnt1bhDQTS_ofKrnpsxZBu8S98P6_8l-N_9G2a-L07G4/exec";

// Product Pricing Data Map
const packDetails = {
  "100g_1": { name: "100g Single Pack (10% OFF)", total: 89.10, deposit: 45.00, deliveryNote: "Standard delivery" },
  "100g_2": { name: "100g Pack of 2 (10% OFF)", total: 178.20, deposit: 84.00, deliveryNote: "Standard delivery" },
  "100g_3": { name: "100g Pack of 3 (10% OFF)", total: 267.30, deposit: 126.00, deliveryNote: "Standard delivery" },
  "150g_1": { name: "150g Single Pack", total: 149.00, deposit: 75.00, deliveryNote: "Standard delivery" },
  "150g_2": { name: "150g Pack of 2", total: 298.00, deposit: 149.00, deliveryNote: "Standard delivery" },
  "150g_3": { name: "150g Pack of 3", total: 447.00, deposit: 224.00, deliveryNote: "Standard delivery" }
};

let selectedKey = "100g_1";

// Handles Variant Pack Selection
function selectPack(key, element, cardId) {
  selectedKey = key;

  document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');

  document.querySelectorAll('.product-card').forEach(card => card.classList.remove('selected-card'));
  if (document.getElementById(cardId)) {
    document.getElementById(cardId).classList.add('selected-card');
  }

  updatePaymentMode();
}

// Global Function to Update Button Text & Summary
window.updatePaymentMode = function() {
  const submitBtn = document.getElementById("submit-btn");
  const selectedPack = packDetails[selectedKey] || packDetails["100g_1"];
  
  if (!submitBtn) return;

  const payDeposit = document.getElementById("pay_deposit");
  const payFull = document.getElementById("pay_full");
  const payCod = document.getElementById("pay_cod");

  let amountToPay = selectedPack.deposit;

  if (payCod && payCod.checked) {
    amountToPay = 40.00;
    submitBtn.innerText = "PAY ₹40 TOKEN FEE & PLACE COD ORDER";
  } else if (payFull && payFull.checked) {
    amountToPay = selectedPack.total;
    submitBtn.innerText = "PAY FULL AMOUNT & PRE-ORDER NOW";
  } else {
    amountToPay = selectedPack.deposit;
    submitBtn.innerText = "PAY 50% DEPOSIT & PRE-ORDER NOW";
  }

  // Summary box updates
  const summaryName = document.getElementById("summary-name");
  const summaryTotal = document.getElementById("summary-total");
  const summaryDeposit = document.getElementById("summary-deposit");
  const summaryDelivery = document.getElementById("summary-delivery");

  if (summaryName) summaryName.innerText = selectedPack.name;
  if (summaryTotal) summaryTotal.innerText = selectedPack.total.toFixed(2);
  if (summaryDeposit) summaryDeposit.innerText = amountToPay.toFixed(2);
  if (summaryDelivery) summaryDelivery.innerText = selectedPack.deliveryNote;
};

// Event Listeners setup on Page Load
document.addEventListener("DOMContentLoaded", function () {
  const radioButtons = document.querySelectorAll('input[name="pay_mode"]');
  radioButtons.forEach(radio => {
    radio.addEventListener("change", window.updatePaymentMode);
    radio.addEventListener("click", window.updatePaymentMode);
  });

  const form = document.getElementById("preOrderForm");
  if (form) {
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      payNow();
    });
  }

  window.updatePaymentMode();
});

// Razorpay Payment Handler
function payNow() {
  const name = document.getElementById("name")?.value;
  const phone = document.getElementById("phone")?.value;
  const street = document.getElementById("street")?.value;
  const city = document.getElementById("city")?.value;
  const state = document.getElementById("state")?.value;
  const pincode = document.getElementById("pincode")?.value;

  if (!name || !phone || !street || !city || !state || !pincode) {
    alert("Please fill all address details before proceeding.");
    return;
  }

  const selectedPack = packDetails[selectedKey] || packDetails["100g_1"];
  const payCod = document.getElementById("pay_cod")?.checked;
  const payFull = document.getElementById("pay_full")?.checked;

  let amountToPay = selectedPack.deposit;
  let payModeText = "DEPOSIT";
  let payDescription = "50% Advance Deposit - " + selectedPack.name;

  if (payCod) {
    amountToPay = 40.00;
    payModeText = "COD";
    payDescription = "COD Token Fee - " + selectedPack.name;
  } else if (payFull) {
    amountToPay = selectedPack.total;
    payModeText = "FULL";
    payDescription = "Full Payment - " + selectedPack.name;
  }

  const options = {
    "key": RAZORPAY_KEY,
    "amount": Math.round(amountToPay * 100),
    "currency": "INR",
    "name": "Swadvansh Snacks",
    "description": payDescription,
    "handler": function (response) {
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
          fullAddress: `${street}, ${city}, ${state} - ${pincode}`,
          pack: selectedPack.name,
          paymentMode: payModeText,
          totalPrice: selectedPack.total,
          paidAmount: amountToPay.toFixed(2),
          dueBalance: (selectedPack.total - amountToPay).toFixed(2),
          paymentId: response.razorpay_payment_id
        })
      })
      .then(() => {
        alert("Pre-order placed successfully! Payment ID: " + response.razorpay_payment_id);
        const form = document.getElementById("preOrderForm");
        if (form) form.reset();
        window.updatePaymentMode();
      })
      .catch(() => {
        alert("Payment done, but failed to sync data.");
      });
    },
    "prefill": { "name": name, "contact": phone },
    "theme": { "color": "#c5a059" }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}