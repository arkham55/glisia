// js/konsultasi.js
const API_BASE = "http://localhost:5002";

// ==================== AUTHENTICATION ====================
let currentUser = null;

function getToken() {
  return localStorage.getItem("glisia_token");
}

async function checkLoginStatus() {
  const token = getToken();
  if (!token) {
    document.getElementById("guestMenu").style.display = "flex";
    document.getElementById("userMenu").style.display = "none";
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 200) {
      const data = await res.json();
      if (data.status === "success") {
        currentUser = data.user;
        document.getElementById("guestMenu").style.display = "none";
        document.getElementById("userMenu").style.display = "flex";
        document.getElementById("userName").innerText =
          currentUser.email.split("@")[0];
        const adminLink = document.getElementById("adminPanelLink");
        if (adminLink && currentUser.role === "admin") {
          adminLink.style.display = "block";
          adminLink.href = "admin/edukasi.html";
        }
        return currentUser;
      }
    }
    localStorage.removeItem("glisia_token");
    document.getElementById("guestMenu").style.display = "flex";
    document.getElementById("userMenu").style.display = "none";
  } catch (err) {
    console.error("[Auth] Error:", err);
    document.getElementById("guestMenu").style.display = "flex";
    document.getElementById("userMenu").style.display = "none";
  }
  return null;
}

function logout() {
  localStorage.removeItem("glisia_token");
  window.location.href = "index.html";
}

// ==================== STEP NAVIGATION ====================
const steps = document.querySelectorAll(".form-step");
const stepIndicators = document.querySelectorAll(".step");
let currentStep = 0;

function showStep(stepIndex) {
  steps.forEach((step, idx) =>
    step.classList.toggle("active", idx === stepIndex)
  );
  stepIndicators.forEach((indicator, idx) =>
    indicator.classList.toggle("active", idx === stepIndex)
  );
  currentStep = stepIndex;
  updateEvidence();
}

document.querySelectorAll(".btn-next").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nextStep = parseInt(btn.dataset.next);
    if (nextStep && nextStep <= steps.length) showStep(nextStep - 1);
  });
});
document.querySelectorAll(".btn-prev").forEach((btn) => {
  btn.addEventListener("click", () => {
    const prevStep = parseInt(btn.dataset.prev);
    if (prevStep && prevStep >= 1) showStep(prevStep - 1);
  });
});
stepIndicators.forEach((indicator, idx) => {
  indicator.addEventListener("click", () => showStep(idx));
});

// ==================== UPDATE EVIDENCE PANEL ====================
function calculateBMI() {
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  if (weight && height) return (weight / (height / 100) ** 2).toFixed(1);
  return "-";
}
function getBMICategory() {
  const bmi = parseFloat(calculateBMI());
  if (isNaN(bmi)) return "-";
  if (bmi < 18.5) return "Kurus";
  if (bmi < 23) return "Normal";
  if (bmi < 25) return "Overweight";
  return "Obesitas";
}
function getIntensitasText() {
  const selected = document.querySelector('input[name="intensity"]:checked');
  if (!selected) return "Sedang";
  const val = selected.value;
  if (val === "ringan") return "Ringan";
  if (val === "berat") return "Berat";
  return "Sedang";
}
function updateEvidence() {
  const calories = parseFloat(document.getElementById("calories")?.value) || 0;
  const fat = parseFloat(document.getElementById("fat_harian")?.value) || 0;
  const carbo = parseFloat(document.getElementById("carbo_harian")?.value) || 0;
  const activity =
    parseInt(document.getElementById("activity_duration").value) || 0;
  const intensitas = getIntensitasText();

  document.getElementById("evidenceBMI").innerHTML = `${calculateBMI()} (${getBMICategory()})`;
  document.getElementById("evidenceCalories").innerHTML = calories;
  document.getElementById("evidenceFat").innerHTML = fat;
  document.getElementById("evidenceCarbo").innerHTML = carbo;
  document.getElementById("evidenceActivity").innerHTML = activity;
  document.getElementById("evidenceIntensitas").innerHTML = intensitas;
}
document
  .querySelectorAll(
    '#weight, #height, #calories, #fat_harian, #carbo_harian, #activity_duration, input[name="intensity"]'
  )
  .forEach((input) => {
    input.addEventListener("input", updateEvidence);
  });

// ==================== DROPDOWN AKTIVITAS MODERN ====================
const activitiesByIntensity = {
  ringan: [
    "Berjalan santai di rumah (kecepatan <3 km/jam)",
    "Menyapu/mengepel rumah",
    "Yoga ringan (Hatha, peregangan)",
    "Berkebun ringan (menyiram, mencabut rumput)",
    "Jalan-jalan di taman (kecepatan santai)",
    "Memasak/aktivitas dapur ringan",
    "Naik turun tangga perlahan",
    "Mencuci piring atau menyetrika",
    "Bermain dengan anak-anak (duduk/berdiri)",
    "Belanja kebutuhan ringan (jalan santai)",
    "Senam lansia / tai chi",
    "Memancing di tepi pantai/sungai",
    "Membersihkan kaca/jendela",
    "Mengemudi mobil",
  ],
  sedang: [
    "Jalan cepat (5-6 km/jam)",
    "Bersepeda santai (15-20 km/jam)",
    "Senam aerobik ringan (low impact)",
    "Menari (ballroom, line dance, disco)",
    "Naik turun tangga dengan kecepatan normal",
    "Berlari santai (jogging 7-8 km/jam)",
    "Berenang santai (gaya bebas perlahan)",
    "Pilates",
    "Bulutangkis rekreasi (ganda)",
    "Tenis meja (pingpong)",
    "Voli pantai rekreasi",
    "Mendaki gunung dengan kemiringan landai",
    "Bersepeda statis (intensitas sedang)",
    "Elliptical trainer (sedang)",
    "Rowing machine (dayung, sedang)",
    "Yoga aliran vinyasa (aktif)",
    "Ski (rekreasi, kecepatan sedang)",
    "Hula hoop (lingkar pinggang)",
  ],
  berat: [
    "Lari (8-10 km/jam atau lebih cepat)",
    "Bersepeda cepat (>25 km/jam atau tanjakan)",
    "HIIT (High Intensity Interval Training)",
    "Renang gaya bebas cepat (laju tinggi)",
    "Angkat beban intensif (circuit training)",
    "Zumba atau aerobik high impact",
    "Skipping/lompat tali (kecepatan tinggi)",
    "Crossfit",
    "Basketball pertandingan penuh",
    "Sepak bola pertandingan",
    "Squash atau racquetball",
    "Mendaki gunung curam dengan beban",
    "Latihan ketahanan militer (burpees, push-up intensif)",
    "Rowing cepat (dayung kompetitif)",
    "Tinju / kickboxing (latihan)",
    "Panjat tebing (intensif)",
    "Lari interval (sprint + jogging)",
  ],
};

let currentActivities = [];
let selectedActivities = [];

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function renderDropdownMenu() {
  const menu = document.getElementById("dropdownMenu");
  if (!menu) return;
  menu.innerHTML = "";
  currentActivities.forEach((act) => {
    const isChecked = selectedActivities.includes(act);
    const div = document.createElement("div");
    div.className = "dropdown-item";
    div.innerHTML = `
            <input type="checkbox" value="${escapeHtml(act)}" id="chk_${escapeHtml(
      act.replace(/\s/g, "_")
    )}" ${isChecked ? "checked" : ""}>
            <label for="chk_${escapeHtml(act.replace(/\s/g, "_"))}">${escapeHtml(
      act
    )}</label>
        `;
    const chk = div.querySelector("input");
    chk.addEventListener("change", (e) => {
      if (e.target.checked) {
        if (!selectedActivities.includes(act)) selectedActivities.push(act);
      } else {
        selectedActivities = selectedActivities.filter((a) => a !== act);
      }
      updateDropdownUI();
    });
    menu.appendChild(div);
  });
}

function updateDropdownUI() {
  const selectedTextSpan = document.getElementById("selectedText");
  const tagContainer = document.getElementById("tagContainer");
  if (!selectedTextSpan || !tagContainer) return;

  if (selectedActivities.length === 0) {
    selectedTextSpan.innerText = "Pilih aktivitas...";
  } else if (selectedActivities.length === 1) {
    selectedTextSpan.innerText = selectedActivities[0];
  } else {
    selectedTextSpan.innerText = `${selectedActivities.length} aktivitas dipilih`;
  }

  tagContainer.innerHTML = "";
  selectedActivities.forEach((act) => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.innerHTML = `${escapeHtml(act)} <span class="remove-tag" data-act="${escapeHtml(
      act
    )}">✕</span>`;
    tagContainer.appendChild(tag);
  });

  document.querySelectorAll(".remove-tag").forEach((el) => {
    el.addEventListener("click", (e) => {
      const actToRemove = el.getAttribute("data-act");
      selectedActivities = selectedActivities.filter((a) => a !== actToRemove);
      syncCheckboxes();
      updateDropdownUI();
    });
  });
}

function syncCheckboxes() {
  const checkboxes = document.querySelectorAll(
    '#dropdownMenu input[type="checkbox"]'
  );
  checkboxes.forEach((chk) => {
    chk.checked = selectedActivities.includes(chk.value);
  });
}

function refreshActivitiesByIntensity() {
  const selectedRadio = document.querySelector(
    'input[name="intensity"]:checked'
  );
  let intensity = "sedang";
  if (selectedRadio) intensity = selectedRadio.value;
  currentActivities =
    activitiesByIntensity[intensity] || activitiesByIntensity.sedang;
  selectedActivities = [];
  renderDropdownMenu();
  updateDropdownUI();
}

function initActivityDropdown() {
  const dropdownBtn = document.getElementById("dropdownBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  if (!dropdownBtn || !dropdownMenu) return;
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
  });
  document.addEventListener("click", function (e) {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove("show");
    }
  });
  refreshActivitiesByIntensity();
}

function attachIntensityChangeListener() {
  const radios = document.querySelectorAll('input[name="intensity"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      refreshActivitiesByIntensity();
      updateEvidence();
    });
  });
}

// ==================== FUNGSI KONVERSI AKTIVITAS ====================
function getEquivalentActivityMinutes(menit, intensitas) {
  if (intensitas === "ringan") return menit * (2.0 / 3.5);
  if (intensitas === "berat") return menit * (6.0 / 3.5);
  return menit;
}

// ==================== FOOD SEARCH ====================
const foodModal = document.getElementById("foodModal");
const openFoodSearchBtn = document.getElementById("openFoodSearchBtn");
let cart = [];

openFoodSearchBtn?.addEventListener("click", () => {
  updateFoodModalUI();
  foodModal.style.display = "block";
  loadCartDisplayNew();
});

function updateFoodModalUI() {
  const modalContent = foodModal.querySelector(".modal-content");
  if (!modalContent.querySelector(".food-calculator-wrapper")) {
    modalContent.innerHTML = `
            <span class="close-food">&times;</span>
            <div class="food-calculator-wrapper">
                <div class="food-calculator-header">
                    <i class="fas fa-calculator"></i>
                    <h4>Kalkulator Kalori, Lemak & Karbohidrat</h4>
                    <p>Hitung total kalori, lemak, dan karbohidrat dari makanan/minuman</p>
                </div>
                <div class="search-container">
                    <div class="search-input-wrapper">
                        <i class="fas fa-search"></i>
                        <input type="text" id="foodSearchInput" placeholder="Cari makanan atau minuman...">
                    </div>
                    <button id="searchFoodBtn" class="search-btn"><i class="fas fa-search"></i> Cari</button>
                </div>
                <div class="search-results-container">
                    <div class="search-results-title"><i class="fas fa-utensils"></i> Hasil Pencarian</div>
                    <div id="searchResults" class="search-results-list"></div>
                </div>
                <div class="cart-container">
                    <div class="cart-header">
                        <h4><i class="fas fa-shopping-cart"></i> Keranjang</h4>
                        <span>Item yang dipilih</span>
                    </div>
                    <div id="cartItems" class="cart-items"></div>
                </div>
                <div class="cart-total" id="cartTotal">
                    <div class="total-item"><span>Total Kalori:</span> <strong id="totalCaloriesValue">0 kkal</strong></div>
                    <div class="total-item"><span>Total Lemak:</span> <strong id="totalFatValue">0 g</strong></div>
                    <div class="total-item"><span>Total Karbohidrat:</span> <strong id="totalCarboValue">0 g</strong></div>
                </div>
                <button id="addToNutritionBtn" class="use-cart-btn">
                    <i class="fas fa-check-circle"></i> Gunakan Data Ini
                </button>
            </div>
        `;
    window.foodSearchInput = document.getElementById("foodSearchInput");
    window.searchFoodBtn = document.getElementById("searchFoodBtn");
    window.searchResultsDiv = document.getElementById("searchResults");
    window.cartItemsDiv = document.getElementById("cartItems");
    window.addToNutritionBtn = document.getElementById("addToNutritionBtn");

    window.searchFoodBtn?.addEventListener("click", async () => {
      const query = window.foodSearchInput.value.trim();
      if (!query) return;
      try {
        const res = await fetch(
          `${API_BASE}/api/makanan?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        if (data.status === "success") displaySearchResultsNew(data.data);
        else
          window.searchResultsDiv.innerHTML =
            '<div class="empty-result"><i class="fas fa-search"></i><p>Tidak ditemukan</p></div>';
      } catch (err) {
        console.error(err);
        window.searchResultsDiv.innerHTML =
          '<div class="empty-result"><i class="fas fa-wifi"></i><p>Error koneksi ke server</p></div>';
      }
    });

    window.addToNutritionBtn?.addEventListener("click", async () => {
      if (cart.length === 0) return alert("Keranjang kosong");
      const items = cart.map((i) => ({ id: i.id, gram: i.gram }));
      try {
        const res = await fetch(`${API_BASE}/api/hitung-nutrisi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        const data = await res.json();
        if (data.status === "success") {
          document.getElementById("calories").value = data.data.total_calories;
          document.getElementById("fat_harian").value = data.data.total_fat;
          document.getElementById("carbo_harian").value =
            data.data.total_carbohydrate;
          alert(
            `✅ Data berhasil dihitung!\nKalori: ${data.data.total_calories} kkal\nLemak: ${data.data.total_fat} g\nKarbohidrat: ${data.data.total_carbohydrate} g`
          );
          foodModal.style.display = "none";
          cart = [];
          updateEvidence();
        } else alert("Gagal hitung nutrisi");
      } catch (err) {
        console.error(err);
        alert("Error server");
      }
    });

    const closeBtn = modalContent.querySelector(".close-food");
    if (closeBtn)
      closeBtn.addEventListener("click", () => {
        foodModal.style.display = "none";
      });
  }
}

function displaySearchResultsNew(items) {
  const container = window.searchResultsDiv;
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML =
      '<div class="empty-result"><i class="fas fa-search"></i><p>Tidak ditemukan</p></div>';
    return;
  }
  container.innerHTML = "";
  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.innerHTML = `
            <div class="result-info">
                <div class="result-name">${item.name}</div>
                <div class="result-nutrition">🔥 ${item.calories} kkal/100g | 🧈 ${item.fat}g lemak/100g | 🍚 ${item.carbohydrate}g karbo/100g</div>
            </div>
            <div class="result-add">
                <input type="number" id="gram_${item.id}" placeholder="Gram" value="100" style="width:70px; margin-right:8px;">
                <button class="result-add-btn" data-id="${item.id}" data-name="${item.name}" data-cal="${item.calories}" data-fat="${item.fat}" data-carbo="${item.carbohydrate}">+</button>
            </div>
        `;
    container.appendChild(div);
  });
  document.querySelectorAll(".result-add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      const name = btn.dataset.name;
      const calPer100 = parseFloat(btn.dataset.cal);
      const fatPer100 = parseFloat(btn.dataset.fat);
      const carboPer100 = parseFloat(btn.dataset.carbo);
      const gramInput = document.getElementById(`gram_${id}`);
      const gram = parseFloat(gramInput?.value) || 100;
      const factor = gram / 100;
      const totalCal = calPer100 * factor;
      const totalFat = fatPer100 * factor;
      const totalCarbo = carboPer100 * factor;
      addToCartNew(id, name, gram, totalCal, totalFat, totalCarbo);
    });
  });
}

function addToCartNew(id, name, gram, totalCal, totalFat, totalCarbo) {
  const existing = cart.find((i) => i.id === id);
  if (existing) {
    existing.gram += gram;
    existing.totalCalories += totalCal;
    existing.totalFat += totalFat;
    existing.totalCarbohydrate += totalCarbo;
  } else {
    cart.push({
      id,
      name,
      gram,
      totalCalories: totalCal,
      totalFat,
      totalCarbohydrate: totalCarbo,
    });
  }
  loadCartDisplayNew();
}

function loadCartDisplayNew() {
  const container = window.cartItemsDiv;
  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML =
      '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Keranjang kosong</p></div>';
    updateCartSummary();
    return;
  }
  container.innerHTML = "";
  cart.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-detail">${item.gram}g → ${item.totalCalories.toFixed(
      1
    )} kkal, ${item.totalFat.toFixed(1)}g lemak, ${item.totalCarbohydrate.toFixed(
      1
    )}g karbo</div>
            </div>
            <div class="cart-item-actions">
                <button class="remove-cart-btn" data-idx="${idx}"><i class="fas fa-trash"></i></button>
            </div>
        `;
    container.appendChild(div);
  });
  document.querySelectorAll(".remove-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      cart.splice(idx, 1);
      loadCartDisplayNew();
    });
  });
  updateCartSummary();
}

function updateCartSummary() {
  const totalCal = cart.reduce((sum, item) => sum + item.totalCalories, 0);
  const totalFat = cart.reduce((sum, item) => sum + item.totalFat, 0);
  const totalCarbo = cart.reduce(
    (sum, item) => sum + item.totalCarbohydrate,
    0
  );
  document.getElementById("totalCaloriesValue").innerText =
    totalCal.toFixed(1) + " kkal";
  document.getElementById("totalFatValue").innerText =
    totalFat.toFixed(1) + " g";
  document.getElementById("totalCarboValue").innerText =
    totalCarbo.toFixed(1) + " g";
}

// ==================== SUBMIT ANALISIS (GUEST ALLOWED) ====================
const form = document.getElementById("consultationForm");
const resultModal = document.getElementById("resultModal");

let isSubmitting = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  isSubmitting = true;

  const submitBtn = document.querySelector(".btn-submit");
  if (submitBtn) submitBtn.disabled = true;

  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const usia = parseInt(document.getElementById("usia").value);
  const jenis_kelamin =
    document.querySelector('input[name="jenis_kelamin"]:checked')?.value ||
    "pria";
  const totalKalori = parseFloat(document.getElementById("calories").value);
  const totalLemak = parseFloat(document.getElementById("fat_harian").value);
  const totalKarbohidrat = parseFloat(
    document.getElementById("carbo_harian").value
  );
  const activityDuration = parseInt(
    document.getElementById("activity_duration").value
  );
  const intensitas =
    document.querySelector('input[name="intensity"]:checked')?.value ||
    "sedang";
  const userId = currentUser
    ? currentUser.id || currentUser.email
    : "anonymous";

  const errors = [];
  if (isNaN(weight) || weight <= 0)
    errors.push("• Berat badan (kg) harus diisi angka positif");
  if (isNaN(height) || height <= 0)
    errors.push("• Tinggi badan (cm) harus diisi angka positif");
  if (isNaN(usia) || usia <= 0) errors.push("• Usia harus diisi angka positif");
  if (isNaN(totalKalori) || totalKalori <= 0)
    errors.push("• Kalori harian harus diisi angka positif");
  if (isNaN(totalLemak) || totalLemak <= 0)
    errors.push("• Lemak harian harus diisi angka positif");
  if (isNaN(totalKarbohidrat) || totalKarbohidrat <= 0)
    errors.push("• Karbohidrat harian harus diisi angka positivo");
  if (isNaN(activityDuration) || activityDuration <= 0)
    errors.push("• Durasi aktivitas harus diisi angka positif");
  if (errors.length) {
    alert("❌ Data tidak lengkap:\n" + errors.join("\n"));
    isSubmitting = false;
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  const payload = {
    weight_kg: weight,
    height_cm: height,
    usia,
    jenis_kelamin,
    total_kalori_harian: totalKalori,
    total_lemak_harian: totalLemak,
    total_karbohidrat_harian: totalKarbohidrat,
    aktivitas_menit_per_minggu: activityDuration,
    intensitas_aktivitas: intensitas,
    user_id: userId,
    selected_activities: selectedActivities,
  };

  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.status === "success") {
      displayResultModal(result.data);
      resultModal.style.display = "block";
    } else {
      alert("Error: " + (result.error || "Gagal analisis"));
    }
  } catch (err) {
    console.error(err);
    alert(
      "❌ Gagal terhubung ke server backend.\nPastikan backend Flask berjalan di http://localhost:5002"
    );
  } finally {
    isSubmitting = false;
    if (submitBtn) submitBtn.disabled = false;
  }
});

// ==================== REKOMENDASI DINAMIS ====================
function buatRekomendasiDinamis(categories, riskLevel) {
  const recs = [];
  const isUnderweight = categories.bmi === "underweight";

  if (categories.lemak === "tinggi")
    recs.push(
      "🧈 Kurangi lemak jenuh (gorengan, santan, mentega). Ganti dengan lemak sehat dari alpukat, kacang, dan minyak zaitun."
    );

  if (categories.kalori === "tinggi") {
    if (isUnderweight) {
      recs.push(
        "🍽️ Asupan kalori tinggi membantu menambah berat badan. Pastikan sumbernya dari makanan bergizi (bukan junk food)."
      );
    } else {
      recs.push(
        "🍽️ Kurangi kalori harian dengan mengatur porsi makan, perbanyak sayur dan protein tanpa lemak."
      );
    }
  }

  if (categories.karbohidrat === "tinggi")
    recs.push(
      "🍚 Ganti karbohidrat olahan dengan kompleks: nasi merah, oatmeal, ubi, jagung."
    );

  if (categories.bmi === "obesitas") {
    recs.push(
      "⚖️ Targetkan penurunan berat badan 5-10% dalam 3-6 bulan dengan defisit 300-500 kkal/hari + olahraga."
    );
  } else if (categories.bmi === "overweight") {
    recs.push(
      "⚖️ Usahakan mencapai berat badan ideal dengan kombinasi diet seimbang dan aktivitas fisik."
    );
  } else if (categories.bmi === "underweight") {
    recs.push(
      "🍗 Perhatikan asupan kalori dan protein untuk mencapai berat badan ideal. Konsultasikan dengan ahli gizi."
    );
    recs.push(
      "🥑 Tambahkan makanan padat nutrisi seperti alpukat, kacang-kacangan, susu, dan telur untuk menambah berat badan sehat."
    );
  }

  if (categories.aktivitas === "ringan")
    recs.push(
      "🏃 Tingkatkan aktivitas fisik: minimal 150 menit/minggu aktivitas sedang (jalan cepat, bersepeda)."
    );
  else if (categories.aktivitas === "sedang")
    recs.push(
      "💪 Aktivitas sudah baik. Tambahkan latihan kekuatan 2x/minggu untuk meningkatkan metabolisme."
    );
  else if (categories.aktivitas === "berat")
    recs.push(
      "🏋️ Aktivitas berat sudah sangat baik! Pastikan asupan nutrisi mencukupi untuk pemulihan."
    );

  if (categories.kalori === "rendah")
    recs.push(
      "🍚 Asupan kalori rendah, pastikan makan cukup untuk mendukung metabolisme dan aktivitas."
    );
  if (categories.lemak === "rendah")
    recs.push(
      "🥑 Asupan lemak rendah, tetap konsumsi lemak sehat untuk fungsi hormon dan penyerapan vitamin."
    );
  if (categories.karbohidrat === "rendah")
    recs.push(
      "🍚 Pastikan asupan karbohidrat cukup untuk energi, terutama jika aktif."
    );

  if (riskLevel === "TINGGI") {
    recs.push(
      "🩺 Segera konsultasikan kondisi Anda ke dokter atau ahli gizi untuk evaluasi lebih lanjut."
    );
    recs.push(
      "🏥 Lakukan pemeriksaan kolesterol, gula darah, dan tekanan darah."
    );
  } else if (riskLevel === "SEDANG") {
    recs.push(
      "📊 Pantau asupan kalori, lemak, dan karbohidrat secara rutin menggunakan aplikasi."
    );
  } else {
    recs.push(
      "✅ Pertahankan pola makan seimbang dan rutin berolahraga."
    );
    recs.push(
      "🩺 Lakukan pemeriksaan kesehatan berkala setiap 6-12 bulan."
    );
  }

  return [...new Map(recs.map((item) => [item, item])).values()];
}

function generateInsightMessage(categories, riskLevel, tdee, totalKalori) {
  const bmi = categories.bmi;
  const kalori = categories.kalori;
  const lemak = categories.lemak;
  const karbo = categories.karbohidrat;
  const aktivitas = categories.aktivitas;
  const surplus = totalKalori - tdee;
  const isOverweightOrObese = (bmi === "overweight" || bmi === "obesitas");
  const isUnderweight = (bmi === "underweight");
  const isActiveHeavy = (aktivitas === "berat");
  const isActiveLight = (aktivitas === "ringan");
  const isActiveModerate = (aktivitas === "sedang");
  const kaloriHigh = (kalori === "tinggi");
  const kaloriLow = (kalori === "rendah");
  const lemakHigh = (lemak === "tinggi");
  const karboHigh = (karbo === "tinggi");

  if (riskLevel === "TINGGI") {
    if (isOverweightOrObese && kaloriHigh && lemakHigh) {
      return "🚨 Risiko tinggi: Kombinasi kelebihan berat badan, asupan kalori dan lemak berlebih. Segera perbaiki pola makan dan konsultasi dengan dokter.";
    }
    if (isOverweightOrObese && isActiveLight) {
      return "⚠️ Risiko tinggi: Berat badan berlebih + kurang gerak. Tingkatkan aktivitas fisik secara signifikan dan atur kalori harian.";
    }
    if (isUnderweight && kaloriLow && isActiveHeavy) {
      return "⚠️ Risiko tinggi: Berat badan kurang + defisit kalori + aktivitas berat. Risiko malnutrisi dan kelelahan. Segera tingkatkan asupan kalori dan kurangi aktivitas berlebih.";
    }
    return "🩺 Risiko tinggi: Kondisi metabolik Anda memerlukan perhatian medis segera. Konsultasikan dengan tenaga kesehatan profesional.";
  }
  
  if (riskLevel === "RENDAH") {
    if (bmi === "normal" && !kaloriHigh && !lemakHigh && isActiveHeavy) {
      return "✨ Metabolisme sangat baik! BMI normal, asupan seimbang, dan aktivitas berat. Pertahankan gaya hidup sehat ini.";
    }
    if (bmi === "normal" && isActiveModerate) {
      return "✅ Metabolisme sehat. BMI normal, aktivitas sedang, dan pola makan seimbang. Terus jaga kebiasaan baik ini.";
    }
    if (bmi === "underweight" && kalori === "cukup" && isActiveLight) {
      return "🌱 Risiko rendah secara metabolik, namun berat badan kurang. Fokus pada penambahan berat badan sehat (tambah 300-500 kkal/hari).";
    }
    return "✅ Risiko rendah: Pola hidup Anda sudah baik. Pertahankan keseimbangan asupan dan aktivitas fisik.";
  }
  
  // RISIKO SEDANG
  if (isActiveHeavy && (kaloriLow || kalori === "cukup")) {
    return "🏋️ Aktivitas berat Anda sudah sangat baik, namun pastikan asupan kalori mencukupi (terutama jika ingin menaikkan berat badan atau mempertahankan energi). Perhatikan juga komposisi gizi.";
  }
  if (isActiveLight && isOverweightOrObese) {
    return "🚶 Aktivitas ringan kurang optimal untuk menurunkan risiko. Tingkatkan durasi dan intensitas latihan (target 150-300 menit/minggu aktivitas sedang).";
  }
  if (isActiveLight && kaloriHigh) {
    return "🍔 Kelebihan kalori dan kurang gerak dapat menyebabkan kenaikan berat badan. Kurangi asupan kalori dan tingkatkan aktivitas fisik.";
  }
  if (lemakHigh && isActiveLight) {
    return "🧈 Lemak tinggi + aktivitas ringan meningkatkan risiko dislipidemia. Batasi lemak jenuh dan perbanyak olahraga.";
  }
  if (karboHigh && isActiveLight) {
    return "🍚 Karbohidrat berlebih + kurang gerak dapat meningkatkan resistensi insulin. Ganti dengan karbohidrat kompleks dan tingkatkan aktivitas.";
  }
  if (isUnderweight && kaloriHigh && isActiveLight) {
    return "🍽️ Kelebihan kalori dengan berat kurang? Gunakan surplus kalori untuk menambah berat badan secara sehat (pilih makanan padat nutrisi). Tingkatkan aktivitas secara bertahap.";
  }
  if (isUnderweight && kalori === "cukup" && isActiveHeavy) {
    return "🏃‍♀️ Berat kurang + aktivitas berat + kalori cukup: Anda perlu tambahan kalori untuk mengejar kebutuhan energi agar berat badan bisa naik. Konsultasikan dengan ahli gizi.";
  }
  if (bmi === "overweight" && isActiveHeavy && kalori === "cukup") {
    return "⚖️ Overweight dengan aktivitas berat dan asupan cukup – fokus pada penurunan berat badan bertahap (0.5-1 kg/minggu) dengan defisit kalori moderat.";
  }
  if (bmi === "normal" && kaloriHigh && isActiveLight) {
    return "📈 BMI normal tapi kelebihan kalori + kurang gerak berisiko kenaikan berat badan. Perbaiki pola makan dan tingkatkan aktivitas.";
  }
  if (bmi === "normal" && kaloriLow && isActiveHeavy) {
    return "⚠️ Defisit kalori + aktivitas berat meski BMI normal dapat menyebabkan kelelahan dan defisiensi energi. Tingkatkan asupan kalori agar seimbang.";
  }
  return "📊 Risiko sedang. Perbaiki pola makan (kurangi lemak jenuh/gula, perbanyak sayur) dan penuhi rekomendasi aktivitas fisik (150-300 menit/minggu).";
}

function estimasiMenitBaca(konten) {
  if (!konten) return 5;
  const plainText = konten.replace(/<[^>]*>/g, "");
  const kata = plainText.split(/\s+/).length;
  return Math.max(2, Math.ceil(kata / 200));
}

async function getEdukasiRecommendations(
  categories,
  riskLevel,
  bmiCategory,
  aktivitasLevel
) {
  try {
    const res = await fetch(`${API_BASE}/api/edukasi`);
    const data = await res.json();
    if (data.status !== "success" || !data.data.length) return [];

    let semuaMateri = data.data;
    const isUnderweight = bmiCategory === "Kurang" || bmiCategory === "Kurus";
    const isOverweightOrObese =
      bmiCategory === "Overweight" || bmiCategory === "Obesitas";

    if (isUnderweight) {
      const forbiddenForUnderweight = [
        "defisit kalori","defisit","penurunan berat badan","penurunan berat","kurangi kalori","diet ketat","low calorie","menurunkan berat badan","kelebihan kalori","kelebihan berat","overweight","obesitas","tips mengurangi","kurangi asupan","defisit energi","bahaya kalori","kontrol kalori","batasi kalori","kurangi porsi","lemak jenuh","kolesterol","atlet","serat larut","indeks glikemik","beban glikemik","stres","makan emosional","emotional eating","ngemil","craving","makan berlebih","berat badan berlebih","kebiasaan makan","psikologis","manajemen stres","stres makan","binge eating","diabetes","gula darah","insulin","glukosa","hiperglikemia","hipoglikemia","diabetes tipe 2","diabetes melitus","kadar gula","pengendalian gula","termogenik","thermogenesis","cabai","capsaicin","teh hijau","katekin","kopi","kafein","jahe","kunyit","makanan pembakar lemak","bakar kalori","peningkatan metabolisme","meningkatkan metabolisme","makanan peningkat metabolisme"
      ];
      let filteredMateri = semuaMateri.filter((materi) => {
        const text = (
          materi.judul +
          " " +
          (materi.subtitle || "") +
          " " +
          (materi.konten || "")
        ).toLowerCase();
        return !forbiddenForUnderweight.some((f) => text.includes(f));
      });
      filteredMateri.sort((a, b) => {
        const aText = (a.judul + " " + (a.subtitle || "")).toLowerCase();
        const bText = (b.judul + " " + (b.subtitle || "")).toLowerCase();
        const aBonus = aText.includes("menambah berat badan") || aText.includes("meningkatkan berat badan") || aText.includes("berat badan ideal") || aText.includes("kenaikan berat badan") ? 100 : 0;
        const bBonus = bText.includes("menambah berat badan") || bText.includes("meningkatkan berat badan") || bText.includes("berat badan ideal") || bText.includes("kenaikan berat badan") ? 100 : 0;
        return bBonus - aBonus;
      });
      return filteredMateri.slice(0, 5);
    }

    const diabetesBlacklist = ["diabetes","gula darah","insulin","glukosa","hiperglikemia","hipoglikemia","diabetes tipe 2","diabetes melitus","kadar gula"];
    const weightGainBlacklist = ["menambah berat badan","meningkatkan berat badan","kenaikan berat badan","naikkan berat badan","menaikkan berat badan","nafsu makan","cara menambah berat badan","menaikkan massa","tambah nafsu makan"];

    const prioritasKategori = [];
    if (categories.kalori === "tinggi") prioritasKategori.push("makanan","minuman");
    if (categories.karbohidrat === "tinggi") prioritasKategori.push("karbohidrat");
    if (riskLevel === "TINGGI") prioritasKategori.push("metabolisme","tips");
    if (riskLevel === "SEDANG") prioritasKategori.push("tips");
    if (bmiCategory === "Obesitas" || bmiCategory === "Overweight") prioritasKategori.push("makanan","tips");
    const uniquePrioritas = [...new Set(prioritasKategori)];

    let materiDenganSkor = [];
    for (let materi of semuaMateri) {
      let score = 0;
      const textToCheck = (materi.judul + " " + (materi.konten || "") + " " + (materi.subtitle || "")).toLowerCase();
      const kategori = (materi.kategori || "").toLowerCase();

      if (diabetesBlacklist.some((kw) => textToCheck.includes(kw.toLowerCase()))) score -= 100;
      if (weightGainBlacklist.some((kw) => textToCheck.includes(kw.toLowerCase()))) score -= 100;

      if (kategori === "metabolisme" && riskLevel === "TINGGI") score += 25;
      if (kategori === "tips" && riskLevel !== "RENDAH") score += 15;
      if (kategori === "makanan" && (categories.kalori === "tinggi" || categories.lemak === "tinggi")) score += 20;
      if (kategori === "karbohidrat" && categories.karbohidrat === "tinggi") score += 20;
      if (kategori === "minuman" && categories.kalori === "tinggi") score += 15;

      let keywords = [];
      if (riskLevel === "TINGGI") keywords.push("metabolisme","risiko","lemak");
      else if (riskLevel === "SEDANG") keywords.push("pola makan","karbohidrat","sehat");
      else keywords.push("pertahankan","seimbang","gaya hidup sehat");

      if (bmiCategory === "Obesitas") keywords.push("obesitas","penurunan berat badan");
      else if (bmiCategory === "Overweight") keywords.push("berat badan ideal","diet seimbang","penurunan berat badan");

      if (categories.kalori === "tinggi") keywords.push("kontrol kalori","defisit kalori");
      if (categories.lemak === "tinggi") keywords.push("lemak jenuh","lemak sehat");
      if (categories.karbohidrat === "tinggi") keywords.push("karbohidrat kompleks","gula tambahan");

      for (let kw of keywords) {
        if (textToCheck.includes(kw.toLowerCase())) score += 5;
      }

      if (uniquePrioritas.includes(kategori)) score += 10;

      if (isOverweightOrObese) {
        const maintenanceKeywords = ["setelah turun","plateau","yo-yo","mempertahankan berat badan","menjaga berat badan","stabilisasi berat badan","mencegah yo-yo","setelah penurunan","fase maintenance"];
        if (maintenanceKeywords.some((kw) => textToCheck.includes(kw.toLowerCase()))) score -= 100;
        const lowPriorityKeywords = ["probiotik","prebiotik","mikrobioma","bakteri usus","kesehatan usus","fermentasi","yogurt","kefir","kimchi","tempe","miso"];
        if (lowPriorityKeywords.some((kw) => textToCheck.includes(kw.toLowerCase()))) score -= 100;
        const termogenikKeywords = ["termogenik","thermogenesis","cabai","capsaicin","teh hijau","katekin","kopi","kafein","jahe","kunyit","makanan pembakar lemak","bakar kalori","peningkatan metabolisme","meningkatkan metabolisme","makanan peningkat metabolisme"];
        if (termogenikKeywords.some((kw) => textToCheck.includes(kw.toLowerCase()))) score -= 100;
        const highPriorityKeywords = ["defisit kalori","kurangi kalori","kontrol kalori","batasi kalori","porsi makan","manajemen porsi","metode piring","ukuran porsi","penurunan berat badan","berat badan ideal","diet sehat"];
        for (let kw of highPriorityKeywords) {
          if (textToCheck.includes(kw.toLowerCase())) { score += 25; break; }
        }
      }
      materiDenganSkor.push({ materi, score, kategori });
    }

    if (!isUnderweight) {
      materiDenganSkor = materiDenganSkor.filter((item) => {
        const text = (item.materi.judul + " " + (item.materi.subtitle || "") + " " + (item.materi.konten || "")).toLowerCase();
        return !weightGainBlacklist.some((kw) => text.includes(kw.toLowerCase()));
      });
    }

    materiDenganSkor = materiDenganSkor.filter((item) => item.score > 0);
    materiDenganSkor.sort((a, b) => b.score - a.score);

    const MAX_PER_CATEGORY = 2;
    const targetTotal = 5;
    let selected = [];
    let categoryCount = {};

    function ambilDariKategori(kategori, jumlah) {
      const dariKategori = materiDenganSkor.filter(
        (item) =>
          item.kategori === kategori &&
          !selected.includes(item.materi) &&
          (!categoryCount[item.kategori] || categoryCount[item.kategori] < MAX_PER_CATEGORY)
      );
      for (let item of dariKategori.slice(0, jumlah)) {
        selected.push(item.materi);
        categoryCount[item.kategori] = (categoryCount[item.kategori] || 0) + 1;
      }
    }

    for (let kat of uniquePrioritas) {
      if (selected.length >= targetTotal) break;
      ambilDariKategori(kat, 1);
    }
    for (let kat of uniquePrioritas) {
      if (selected.length >= targetTotal) break;
      ambilDariKategori(kat, 1);
    }

    if (selected.length < targetTotal) {
      const sisa = materiDenganSkor.filter(
        (item) =>
          !selected.includes(item.materi) &&
          (!categoryCount[item.kategori] || categoryCount[item.kategori] < MAX_PER_CATEGORY)
      );
      for (let item of sisa) {
        if (selected.length >= targetTotal) break;
        selected.push(item.materi);
        categoryCount[item.kategori] = (categoryCount[item.kategori] || 0) + 1;
      }
    }

    if (selected.length > targetTotal) selected = selected.slice(0, targetTotal);
    return selected;
  } catch (err) {
    console.error("Error in getEdukasiRecommendations:", err);
    return [];
  }
}

// ==================== DISPLAY RESULT MODAL (URUTAN DIPERBAIKI) ====================
function displayResultModal(data) {
  const categories = data.categories || {};
  const explanation = data.explanation || "Tidak ada penjelasan.";
  const trace = data.trace || [];
  const tdee = data.tdee || 0;

  const rawBmi = (categories.bmi || "").toLowerCase();
  let bmiKey = "";
  if (rawBmi === "obesitas" || rawBmi === "obese") bmiKey = "obesitas";
  else if (rawBmi === "overweight") bmiKey = "overweight";
  else if (rawBmi === "underweight" || rawBmi === "kurus") bmiKey = "underweight";
  else bmiKey = "normal";

  const normalizedCategories = { ...categories, bmi: bmiKey };

  let finalRiskLevel = (data.risk_level || "").toUpperCase();
  if (!finalRiskLevel || (finalRiskLevel !== "TINGGI" && finalRiskLevel !== "SEDANG" && finalRiskLevel !== "RENDAH")) {
    finalRiskLevel = "SEDANG";
  }

  const riskColor = finalRiskLevel === "TINGGI" ? "#E53935" : finalRiskLevel === "SEDANG" ? "#FFB300" : "#43A047";

  const dynamicRecs = buatRekomendasiDinamis(normalizedCategories, finalRiskLevel);
  const backendRecs = data.recommendations || [];
  const allRecs = [...backendRecs, ...dynamicRecs];
  const uniqueRecs = [...new Map(allRecs.map((item) => [item, item])).values()];

  const bmiValue = calculateBMI();
  const bmiCategory = getBMICategory();
  const totalKalori = parseFloat(document.getElementById("calories").value) || 0;
  const totalLemak = parseFloat(document.getElementById("fat_harian").value) || 0;
  const totalKarbohidrat = parseFloat(document.getElementById("carbo_harian").value) || 0;
  const activity = parseInt(document.getElementById("activity_duration").value) || 0;
  const intensitas = getIntensitasText();

  function getCategoryBadge(cat, type) {
    let label = "", bgColor = "", textColor = "", borderColor = "", icon = "";
    if (cat === "tinggi") {
      label = "Tinggi"; bgColor = "#FEF2F2"; textColor = "#B91C1C"; borderColor = "#FEE2E2"; icon = '<i class="fas fa-arrow-up" style="font-size: 0.7rem; margin-right: 4px;"></i>';
    } else if (cat === "rendah") {
      label = "Rendah"; bgColor = "#ECFDF5"; textColor = "#065F46"; borderColor = "#D1FAE5"; icon = '<i class="fas fa-arrow-down" style="font-size: 0.7rem; margin-right: 4px;"></i>';
    } else {
      label = "Cukup"; bgColor = "#FFFBEB"; textColor = "#B45309"; borderColor = "#FEF3C7"; icon = '<i class="fas fa-check-circle" style="font-size: 0.7rem; margin-right: 4px;"></i>';
    }
    return `<span class="nutri-badge" style="display: inline-flex; align-items: center; gap: 4px; background: ${bgColor}; color: ${textColor}; padding: 4px 10px; border-radius: 30px; font-size: 0.7rem; font-weight: 600; border: 1px solid ${borderColor}; line-height: 1.2;">${icon}${label}</span>`;
  }

  function getInterpretationMessage(cat, type, value) {
    if (cat === "tinggi") {
      if (type === "kalori") return `Asupan kalori (${value} kkal) melebihi kebutuhan (${tdee} kkal). Kelebihan kalori dapat menambah berat badan.`;
      if (type === "lemak") return `Asupan lemak (${value} g) terlalu tinggi. Kurangi lemak jenuh, pilih lemak sehat.`;
      if (type === "karbohidrat") return `Karbohidrat (${value} g) berlebih. Pilih karbohidrat kompleks.`;
    } else if (cat === "rendah") {
      if (type === "kalori") return `Asupan kalori (${value} kkal) kurang dari kebutuhan (${tdee} kkal). Perbanyak porsi makan.`;
      if (type === "lemak") return `Asupan lemak (${value} g) rendah. Konsumsi lemak sehat seperti alpukat, kacang.`;
      if (type === "karbohidrat") return `Karbohidrat (${value} g) rendah. Tambahkan karbohidrat kompleks untuk energi.`;
    } else {
      if (type === "kalori") return `Asupan kalori (${value} kkal) seimbang dengan kebutuhan. Pertahankan.`;
      if (type === "lemak") return `Asupan lemak (${value} g) cukup. Pastikan sumber lemak sehat.`;
      if (type === "karbohidrat") return `Asupan karbohidrat (${value} g) cukup. Prioritaskan karbohidrat kompleks.`;
    }
    return "";
  }

  const kaloriCat = normalizedCategories.kalori || "cukup";
  const lemakCat = normalizedCategories.lemak || "cukup";
  const karboCat = normalizedCategories.karbohidrat || "cukup";

  let summaryInterpretation = "";
  const kaloriMsg = getInterpretationMessage(kaloriCat, "kalori", totalKalori);
  const lemakMsg = getInterpretationMessage(lemakCat, "lemak", totalLemak);
  const karboMsg = getInterpretationMessage(karboCat, "karbohidrat", totalKarbohidrat);
  if (kaloriMsg) summaryInterpretation += `• ${kaloriMsg}<br>`;
  if (lemakMsg) summaryInterpretation += `• ${lemakMsg}<br>`;
  if (karboMsg) summaryInterpretation += `• ${karboMsg}<br>`;
  if (explanation && explanation !== "Tidak ada penjelasan.") {
    summaryInterpretation += `<br><strong>Kesimpulan sistem pakar:</strong> ${explanation}`;
  }
  if (summaryInterpretation === "") summaryInterpretation = "Tidak ada catatan khusus untuk asupan gizi Anda.";

  const insightMessage = generateInsightMessage(normalizedCategories, finalRiskLevel, tdee, totalKalori);

  let tdeeInfo = "";
  if (tdee > 0) {
    const persen = ((totalKalori / tdee) * 100).toFixed(0);
    let statusClass = "", statusText = "";
    if (persen < 80) { statusClass = "defisit"; statusText = "Defisit Kalori"; }
    else if (persen > 120) { statusClass = "surplus"; statusText = "Surplus Kalori"; }
    else { statusClass = "seimbang"; statusText = "Seimbang"; }
    tdeeInfo = `<div class="tdee-info"><p><strong>Kebutuhan Kalori (TDEE):</strong> ${tdee.toFixed(0)} kkal/hari</p><p><strong>Persentase asupan terhadap kebutuhan:</strong> ${persen}% <span class="status-badge status-${statusClass}">${statusText}</span></p></div>`;
  }

  let traceHtml = "";
  if (trace && trace.length > 0) {
    let traceSteps = "";
    trace.forEach((t) => {
      if (t.rule_id) {
        traceSteps += `<div class="trace-step"><div class="trace-icon"><i class="fas fa-code-branch"></i></div><div class="trace-content"><div class="trace-title">Aturan ${t.rule_id} (Prioritas ${t.priority})</div><div class="trace-condition">Kondisi: ${JSON.stringify(t.conditions)} → Kesimpulan: ${t.conclusion}</div></div></div>`;
      } else {
        traceSteps += `<div class="trace-step"><div class="trace-content">${t.info || "Tidak ada aturan cocok, menggunakan default"}</div></div>`;
      }
    });
    traceHtml = `<div class="trace-section"><h3 class="section-title"><i class="fas fa-code-branch"></i> Forward Chaining Trace</h3><div class="trace-chain">${traceSteps}</div></div>`;
  }

  let recsHtml = "";
  if (uniqueRecs.length > 0) {
    recsHtml = `<div class="recommendations-section"><h3 class="section-title"><i class="fas fa-clipboard-list"></i> Rekomendasi</h3><ul class="recommendations-list">${uniqueRecs.map(r => `<li>${r}</li>`).join("")}</ul></div>`;
  }

  // GUEST WARNING HTML
  const guestWarningHtml = !currentUser ? `
    <div class="guest-warning" style="background: #FFF8E1; border-left: 4px solid #FFB300; padding: 12px 16px; border-radius: 16px; margin: 16px 0; display: flex; align-items: center; gap: 12px; font-size: 0.85rem;">
      <i class="fas fa-exclamation-triangle" style="color: #FFB300; font-size: 1.2rem;"></i>
      <span><strong>Perhatian:</strong> Karena Anda tidak login, hasil analisis ini tidak akan tersimpan di riwayat. <a href="login.html" style="color: #1E88E5; text-decoration: underline;">Login atau daftar</a> untuk menyimpan dan memantau perkembangan Anda.</span>
    </div>
  ` : "";

  // CONTENT TANPA CTA RESULT (AKAN DITAMBAHKAN SETELAH EDUKASI)
  const content = `
    <div class="result-header"><h2><i class="fas fa-chart-bar"></i> Hasil Analisis Forward Chaining</h2><p class="result-subtitle">Status Kesehatan Metabolik Anda</p></div>
    <div class="result-body">
        <p class="result-intro">Berdasarkan data yang Anda berikan, sistem pakar GLISIA menggunakan metode <strong>Forward Chaining</strong> untuk memproses aturan medis dan menyimpulkan profil risiko Anda.</p>
        ${guestWarningHtml}
        <div class="factors-section"><h3 class="section-title"><i class="fas fa-chart-pie"></i> Faktor Penentu Utama</h3><div class="factors-grid">
            <div class="factor-card"><div class="factor-icon"><i class="fas fa-exclamation-triangle"></i></div><div class="factor-info"><div class="factor-label">Risk Level</div><div class="factor-value" style="color:${riskColor};">${finalRiskLevel}</div></div></div>
            <div class="factor-card"><div class="factor-icon"><i class="fas fa-weight-scale"></i></div><div class="factor-info"><div class="factor-label">Indeks Massa Tubuh</div><div class="factor-value">${bmiValue} (${bmiCategory})</div></div></div>
            <div class="factor-card"><div class="factor-icon"><i class="fas fa-chart-line"></i></div><div class="factor-info"><div class="factor-label">Asupan Kalori</div><div class="factor-value">${totalKalori} kkal ${getCategoryBadge(kaloriCat, "kalori")}</div></div></div>
        </div></div>
        <div class="data-summary">
            <div class="summary-item"><span>🔥 Kalori Harian</span><strong>${totalKalori} kkal ${getCategoryBadge(kaloriCat, "kalori")}</strong></div>
            <div class="summary-item"><span>🧈 Lemak Harian</span><strong>${totalLemak} g ${getCategoryBadge(lemakCat, "lemak")}</strong></div>
            <div class="summary-item"><span>🍚 Karbohidrat Harian</span><strong>${totalKarbohidrat} g ${getCategoryBadge(karboCat, "karbohidrat")}</strong></div>
            <div class="summary-item"><span>🏃 Aktivitas</span><strong>${activity} menit/minggu (${intensitas})</strong></div>
            <div class="summary-item"><span>⚖️ BMI</span><strong>${bmiValue} (${bmiCategory})</strong></div>
        </div>
        ${tdeeInfo}
        <div class="insight-card"><h4><i class="fas fa-lightbulb"></i> Insight Metabolisme</h4><p>${insightMessage}</p></div>
        ${recsHtml}${traceHtml}
        <!-- Placeholder untuk edukasi dan CTA -->
        <div id="eduAndCtaPlaceholder"></div>
        <div class="result-actions">
            <button class="btn-outline-primary" id="printResultBtn"><i class="fas fa-print"></i> Cetak Hasil</button>
            <button class="btn-primary" id="closeResultBtn"><i class="fas fa-check-circle"></i> Selesai</button>
        </div>
    </div>
  `;

  document.getElementById("resultContentModal").innerHTML = content;

  // Event untuk print & close
  document.getElementById("printResultBtn")?.addEventListener("click", () => window.print());
  document.getElementById("closeResultBtn")?.addEventListener("click", () => resultModal.style.display = "none");

  // ========== REKOMENDASI EDUKASI & CTA (URUTAN: EDUKASI DULU, BARU CTA) ==========
  (async () => {
    const edukasiList = await getEdukasiRecommendations(normalizedCategories, finalRiskLevel, bmiCategory, intensitas);
    let edukasiHtml = `<div class="edukasi-recommendations"><h3 class="section-title"><i class="fas fa-graduation-cap"></i> Rekomendasi Materi Edukasi</h3>`;
    if (edukasiList.length > 0) {
      edukasiHtml += `<div class="edukasi-grid">`;
      for (let item of edukasiList) {
        const estimasi = estimasiMenitBaca(item.konten);
        edukasiHtml += `
          <div class="edukasi-card" data-id="${item.id}">
            <div class="edukasi-card-content">
              <span class="edukasi-category">${escapeHtml(item.kategori)}</span>
              <h4>${escapeHtml(item.judul)}</h4>
              <p>${escapeHtml(item.subtitle || "")}</p>
              <div class="edukasi-meta">
                <span><i class="far fa-clock"></i> ${estimasi} menit</span>
                <button class="btn-edukasi-detail">Baca →</button>
              </div>
            </div>
          </div>
        `;
      }
      edukasiHtml += `</div>`;
    } else {
      edukasiHtml += `<p class="empty-edukasi">📚 Belum ada materi edukasi yang tersedia. Silakan cek kembali nanti atau <a href="edukasi.html">jelajahi materi lainnya</a>.</p>`;
    }
    edukasiHtml += `</div>`;

    // CTA HTML
    const ctaHtml = `
      <div class="cta-result">
        <h3>Siap Memulai Transformasi Kesehatan Anda?</h3>
        <p>Pantau progres Anda setiap hari dan lihat bagaimana perubahan kecil membawa dampak besar pada metabolisme Anda.</p>
        <div class="cta-buttons">
          <button class="btn-outline-primary" id="lihatRiwayatBtn"><i class="fas fa-chart-line"></i> Lihat Riwayat Tren</button>
          <button class="btn-primary" id="eksplorasiEdukasiBtn"><i class="fas fa-graduation-cap"></i> Eksplorasi Materi Edukasi</button>
        </div>
      </div>
    `;

    const placeholder = document.getElementById("eduAndCtaPlaceholder");
    if (placeholder) {
      // Sisipkan edukasi dulu, lalu CTA di bawahnya
      placeholder.insertAdjacentHTML('beforebegin', edukasiHtml + ctaHtml);
      placeholder.remove(); // hapus placeholder
    } else {
      // fallback
      const resultBody = document.querySelector("#resultModal .result-body");
      const actionsDiv = resultBody.querySelector(".result-actions");
      if (actionsDiv) {
        actionsDiv.insertAdjacentHTML('beforebegin', edukasiHtml + ctaHtml);
      }
    }

    // Pasang event listener tombol CTA
    document.getElementById("lihatRiwayatBtn")?.addEventListener("click", () => {
      if (!currentUser) {
        if (confirm("⚠️ Anda belum login. Riwayat analisis hanya tersimpan jika Anda memiliki akun.\n\nLogin sekarang untuk menyimpan hasil ini dan lihat riwayat lengkap Anda.\n\nKlik OK untuk login, Cancel untuk kembali.")) {
          window.location.href = "login.html";
        }
      } else {
        window.location.href = "riwayat.html";
      }
    });

    document.getElementById("eksplorasiEdukasiBtn")?.addEventListener("click", () => {
      window.location.href = "edukasi.html";
      resultModal.style.display = "none";
    });

    // Event untuk tombol baca edukasi
    if (edukasiList.length > 0) {
      document.querySelectorAll(".btn-edukasi-detail").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const card = btn.closest(".edukasi-card");
          const id = card.getAttribute("data-id");
          if (id) window.location.href = `edukasi-detail.html?id=${id}`;
        });
      });
    }
  })();
}

document.querySelector(".close-result")?.addEventListener("click", () => resultModal.style.display = "none");
window.onclick = (e) => {
  if (e.target === resultModal) resultModal.style.display = "none";
  if (e.target === foodModal) foodModal.style.display = "none";
};

// ==================== INISIALISASI ====================
document.addEventListener("DOMContentLoaded", async () => {
  await checkLoginStatus();
  initActivityDropdown();
  attachIntensityChangeListener();
  updateEvidence();
  showStep(0);
  document.getElementById("btnLogin")?.addEventListener("click", () => window.location.href = "login.html");
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
});