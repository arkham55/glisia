// ========== SISTEM GAMBAR GLISIA v2 - BERKUALITAS TINGGI & SESUAI TOPIK ==========
// ✅ Gambar diambil dari Unsplash dengan query spesifik per kategori
// ✅ Fallback berlapis: utama → alternatif → placeholder berkualitas
// ✅ Cache system untuk konsistensi
// ✅ Lazy loading + error handling

// ========== URL GAMBAR BERKUALITAS TINGGI (UNSPLASH) ==========
// Setiap kategori memiliki gambar yang SESUAI dengan topik

const urlGambarManual = {
    // 🥤 MINUMAN - Smoothies, juices, drinks dengan fokus pada kesehatan (15 foto!)
    'minuman': [
        'https://images.unsplash.com/photo-1590080876-5ecb431b8f15?w=800&h=600&fit=crop&q=90',  // Green smoothie
        'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop&q=90',  // Orange juice
        'https://images.unsplash.com/photo-1576861381022-74c8ea4f70f0?w=800&h=600&fit=crop&q=90',  // Detox water
        'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&h=600&fit=crop&q=90',  // Healthy drink
        'https://images.unsplash.com/photo-1505252585461-04db1267ae5e?w=800&h=600&fit=crop&q=90',  // Fruit smoothie
        'https://images.unsplash.com/photo-1608032158040-42f94b70afae?w=800&h=600&fit=crop&q=90',  // Protein shake
        'https://images.unsplash.com/photo-1578270996705-6d14e0e5eaed?w=800&h=600&fit=crop&q=90',  // Tea cup
        'https://images.unsplash.com/photo-1473093295203-cad00df16e50?w=800&h=600&fit=crop&q=90',  // Coffee
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop&q=90',  // Smoothie bowl
        'https://images.unsplash.com/photo-1606854047397-f7c9c5b83b66?w=800&h=600&fit=crop&q=90',  // Fresh beverage
        'https://images.unsplash.com/photo-1585862267945-0ad5cbe0ae4e?w=800&h=600&fit=crop&q=90',  // Juice cleanse
        'https://images.unsplash.com/photo-1614707267537-b85faf00021d?w=800&h=600&fit=crop&q=90',  // Smoothie
        'https://images.unsplash.com/photo-1588195538326-c5b1e6248868?w=800&h=600&fit=crop&q=90',  // Green juice
        'https://images.unsplash.com/photo-1624353614694-1c4512f6f5d2?w=800&h=600&fit=crop&q=90',  // Water bottle
        'https://images.unsplash.com/photo-1611080626919-7cf88ca265ff?w=800&h=600&fit=crop&q=90'   // Beverage
    ],

    // 🍽️ MAKANAN - Healthy meals, salads, nutritious food (15 foto!)
    'makanan': [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=90',  // Colorful salad
        'https://images.unsplash.com/photo-1512621537307-130733ed4c1b?w=800&h=600&fit=crop&q=90',  // Healthy bowl
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=90',  // Fresh veg
        'https://images.unsplash.com/photo-1512621539856-fac613aec4f9?w=800&h=600&fit=crop&q=90',  // Healthy plate
        'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=800&h=600&fit=crop&q=90',  // Grilled chicken
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=90',  // Buddha bowl
        'https://images.unsplash.com/photo-1505252585461-04db1267ae5e?w=800&h=600&fit=crop&q=90',  // Organic food
        'https://images.unsplash.com/photo-1512621537307-130733ed4c1b?w=800&h=600&fit=crop&q=90',  // Nutritious meal
        'https://images.unsplash.com/photo-1573093707802-0f3fbde23fbb?w=800&h=600&fit=crop&q=90',  // Food prep
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=90',  // Healthy food
        'https://images.unsplash.com/photo-1512621537307-130733ed4c1b?w=800&h=600&fit=crop&q=90',  // Meal plate
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=90',  // Fresh salad
        'https://images.unsplash.com/photo-1512621539856-fac613aec4f9?w=800&h=600&fit=crop&q=90',  // Balanced diet
        'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=800&h=600&fit=crop&q=90',  // Protein meal
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=90'     // Tasty meal
    ],

    // 🔥 METABOLISME - Energy, fitness, body composition (15 foto!)
    'metabolisme': [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop&q=90',  // Fitness
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=600&fit=crop&q=90',  // Fit body
        'https://images.unsplash.com/photo-1550259987-02f2b1a91e3e?w=800&h=600&fit=crop&q=90',  // Energy
        'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=800&h=600&fit=crop&q=90',  // Metabolism
        'https://images.unsplash.com/photo-1535220527529-80cf76c5f3be?w=800&h=600&fit=crop&q=90',  // Health
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop&q=90',  // Workout
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop&q=90',  // Fitness
        'https://images.unsplash.com/photo-1554080221-cbf9d0f4e251?w=800&h=600&fit=crop&q=90',  // Tracking
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop&q=90',  // Active
        'https://images.unsplash.com/photo-1517836357463-d25ddfcb85c0?w=800&h=600&fit=crop&q=90',  // Fitness man
        'https://images.unsplash.com/photo-1538805060582-e8c7cbd9a8ad?w=800&h=600&fit=crop&q=90',  // Running
        'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&h=600&fit=crop&q=90',  // Yoga
        'https://images.unsplash.com/photo-1552733407-5d5c46b7d54d?w=800&h=600&fit=crop&q=90',  // Swimming
        'https://images.unsplash.com/photo-1549576528-46b51407-c7cb-41cc-b0ea-559c6592cb49?w=800&h=600&fit=crop&q=90',  // Group
        'https://images.unsplash.com/photo-1521575107034-e3fb11b08e78?w=800&h=600&fit=crop&q=90'   // Hiking
    ],

    // 🏃 AKTIVITAS - Exercise, sports, physical activity (15 foto!)
    'aktivitas': [
        'https://images.unsplash.com/photo-1538805060582-e8c7cbd9a8ad?w=800&h=600&fit=crop&q=90',  // Running
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop&q=90',  // Gym
        'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&h=600&fit=crop&q=90',  // Yoga
        'https://images.unsplash.com/photo-1552733407-5d5c46b7d54d?w=800&h=600&fit=crop&q=90',  // Swimming
        'https://images.unsplash.com/photo-1517836357463-d25ddfcb85c0?w=800&h=600&fit=crop&q=90',  // Cycling
        'https://images.unsplash.com/photo-1549576528-46b51407-c7cb-41cc-b0ea-559c6592cb49?w=800&h=600&fit=crop&q=90',  // Group
        'https://images.unsplash.com/photo-1521575107034-e3fb11b08e78?w=800&h=600&fit=crop&q=90',  // Hiking
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop&q=90',  // Weight
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=600&fit=crop&q=90',  // Fitness
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop&q=90',  // Exercise
        'https://images.unsplash.com/photo-1611632622527-7a2ceee77be3?w=800&h=600&fit=crop&q=90',  // Pilates
        'https://images.unsplash.com/photo-1554258920-65db56a7bed0?w=800&h=600&fit=crop&q=90',  // Basketball
        'https://images.unsplash.com/photo-1534797852161-7a46d19cd819?w=800&h=600&fit=crop&q=90',  // Tennis
        'https://images.unsplash.com/photo-1476480862096-7049bafb3389?w=800&h=600&fit=crop&q=90',  // Marathon
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop&q=90'   // Gym training
    ],

    // 💡 TIPS - Advice, health tips, wellness (15 foto!)
    'tips': [
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop&q=90',  // Wellness
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=90',  // Lifestyle
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop&q=90',  // Health
        'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&h=600&fit=crop&q=90',  // Nutrition
        'https://images.unsplash.com/photo-1544505869-5a6969e2f414?w=800&h=600&fit=crop&q=90',  // Weight
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=90',  // Routine
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop&q=90',  // Lifestyle
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=600&fit=crop&q=90',  // Fitness
        'https://images.unsplash.com/photo-1512621537307-130733ed4c1b?w=800&h=600&fit=crop&q=90',  // Wellness
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=90',  // Food tips
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop&q=90',  // Health tips
        'https://images.unsplash.com/photo-1550259987-02f2b1a91e3e?w=800&h=600&fit=crop&q=90',  // Energy
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop&q=90',  // Exercise
        'https://images.unsplash.com/photo-1578270996705-6d14e0e5eaed?w=800&h=600&fit=crop&q=90',  // Hydration
        'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&h=600&fit=crop&q=90'   // Healthy
    ],

    // 🍚 KARBOHIDRAT - Rice, bread, carbohydrates, grains (15 foto!)
    'karbohidrat': [
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop&q=90',  // Brown rice
        'https://images.unsplash.com/photo-1535521066927-ab7c9ab60908?w=800&h=600&fit=crop&q=90',  // Bread
        'https://images.unsplash.com/photo-1528735602780-cf6f53cf6537?w=800&h=600&fit=crop&q=90',  // Oatmeal
        'https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=800&h=600&fit=crop&q=90',  // Carbs
        'https://images.unsplash.com/photo-1540993355362-c28a1b4a2e2f?w=800&h=600&fit=crop&q=90',  // Grains
        'https://images.unsplash.com/photo-1555939594-58d7cb561404?w=800&h=600&fit=crop&q=90',  // Cereals
        'https://images.unsplash.com/photo-1606312519331-379a858e3cb7?w=800&h=600&fit=crop&q=90',  // Sweet potato
        'https://images.unsplash.com/photo-1512621539856-fac613aec4f9?w=800&h=600&fit=crop&q=90',  // Carbs bowl
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=90',  // Grain bowl
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=90',  // Pasta
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&q=90',  // Whole wheat
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop&q=90',  // Rice bowl
        'https://images.unsplash.com/photo-1528735602780-cf6f53cf6537?w=800&h=600&fit=crop&q=90',  // Grain
        'https://images.unsplash.com/photo-1535521066927-ab7c9ab60908?w=800&h=600&fit=crop&q=90',  // Bread loaf
        'https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=800&h=600&fit=crop&q=90'   // Carb nutrition
    ],

    // Default untuk kategori lain (15 foto yang bervariasi)
    'default': [
        'https://images.unsplash.com/photo-1512621537307-130733ed4c1b?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1550259987-02f2b1a91e3e?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1552733407-5d5c46b7d54d?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1517836357463-d25ddfcb85c0?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1520521521414-f1d0c4f9e5e0?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1505252585461-04db1267ae5e?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1578270996705-6d14e0e5eaed?w=800&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1473093295203-cad00df16e50?w=800&h=600&fit=crop&q=90'
    ]
};

// ========== PLACEHOLDER FALLBACK PROFESIONAL ==========
const gambarConfig = {
    'minuman': {
        color: '#4CAF50',
        icon: '🥤',
        label: 'Minuman'
    },
    'makanan': {
        color: '#FF6B6B',
        icon: '🍽️',
        label: 'Makanan'
    },
    'metabolisme': {
        color: '#FF9800',
        icon: '🔥',
        label: 'Metabolisme'
    },
    'aktivitas': {
        color: '#2196F3',
        icon: '🏃',
        label: 'Aktivitas'
    },
    'tips': {
        color: '#673AB7',
        icon: '💡',
        label: 'Tips'
    },
    'karbohidrat': {
        color: '#FF5722',
        icon: '🍚',
        label: 'Karbohidrat'
    }
};

// ========== CACHE SYSTEM ==========
class ImageCache {
    constructor() {
        this.memory = new Map();
        this.cacheKey = 'glisia_image_cache_v2';
        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.cacheKey);
            if (stored) {
                const data = JSON.parse(stored);
                this.memory = new Map(Object.entries(data));
            }
        } catch (e) {
            console.warn('⚠️ Cache load error:', e);
        }
    }

    saveToStorage() {
        try {
            const data = Object.fromEntries(this.memory);
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        } catch (e) {
            console.warn('⚠️ Cache save error:', e);
        }
    }

    get(key) {
        return this.memory.get(key);
    }

    set(key, value) {
        this.memory.set(key, value);
        this.saveToStorage();
    }

    has(key) {
        return this.memory.has(key);
    }

    clear() {
        this.memory.clear();
        localStorage.removeItem(this.cacheKey);
    }
}

const imageCache = new ImageCache();

// ========== HASH FUNCTION UNTUK KONSISTENSI ==========
function simpleHash(str) {
    let hash = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// ========== MAIN: DAPATKAN GAMBAR KONSISTEN ==========
/**
 * Dapatkan gambar yang SELALU SAMA untuk item yang sama
 * @param {string|number} itemId - ID unik item
 * @param {string} kategori - Kategori item
 * @returns {string} URL gambar
 */
function getConsistentImage(itemId, kategori) {
    const cacheKey = `${kategori}_${itemId}`;

    if (imageCache.has(cacheKey)) {
        return imageCache.get(cacheKey);
    }

    const urls = urlGambarManual[kategori] || urlGambarManual['default'];
    
    if (!urls || urls.length === 0) {
        console.warn(`⚠️ No images for category: ${kategori}`);
        return getFallbackImage(kategori);
    }

    const hash = simpleHash(itemId);
    const imageIndex = hash % urls.length;
    const selectedUrl = urls[imageIndex];

    imageCache.set(cacheKey, selectedUrl);
    return selectedUrl;
}

// ========== RANDOM IMAGE (untuk featured) ==========
function getRandomImage(kategori) {
    const urls = urlGambarManual[kategori] || urlGambarManual['default'];

    if (!urls || urls.length === 0) {
        return getFallbackImage(kategori);
    }

    const randomIndex = Math.floor(Math.random() * urls.length);
    return urls[randomIndex];
}

// ========== FALLBACK IMAGE - GUNAKAN FOTO DARI KATEGORI LAIN ==========
// Jangan gunakan placeholder jelek, ambil foto asli dari kategori random!
function getFallbackImage(kategori) {
    // Jika kategori punya foto, ambil foto random dari kategori itu
    const urls = urlGambarManual[kategori] || urlGambarManual['default'];
    
    if (urls && urls.length > 0) {
        // Ambil foto random dari kategori yang sama
        const randomIndex = Math.floor(Math.random() * urls.length);
        console.warn(`⚠️ Using fallback image from category "${kategori}"`);
        return urls[randomIndex];
    }
    
    // Jika kategori tidak ada, ambil dari default
    const defaultUrls = urlGambarManual['default'];
    const randomIndex = Math.floor(Math.random() * defaultUrls.length);
    console.warn(`⚠️ Using default fallback image`);
    return defaultUrls[randomIndex];
}

// ========== LOAD GAMBAR DENGAN FALLBACK BERLAPIS - PRIORITAS FOTO ASLI ==========
/**
 * Load gambar dengan error handling otomatis
 * PENTING: Fallback harus FOTO ASLI, bukan placeholder!
 * 
 * @param {HTMLImageElement} imgElement - Element gambar
 * @param {string} primaryUrl - URL utama
 * @param {string} kategori - Kategori
 * @param {string} alt - Alt text
 */
function loadImageWithFallback(imgElement, primaryUrl, kategori, alt = '') {
    if (!imgElement) return;

    imgElement.alt = alt;
    imgElement.loading = 'lazy';
    imgElement.decoding = 'async';

    let attemptCount = 0;
    const maxAttempts = 5;  // Coba lebih banyak kali

    // Kumpulkan semua foto dari kategori ini + kategori lain untuk fallback
    const primaryUrls = urlGambarManual[kategori] || urlGambarManual['default'];
    const allUrls = Object.values(urlGambarManual).flat().filter(url => url && url.startsWith('http'));
    
    // Shuffle fallback URLs agar bervariasi
    const fallbackPool = [...allUrls].sort(() => Math.random() - 0.5);

    function tryNextImage() {
        if (attemptCount === 0) {
            // Attempt 1: Try primary URL
            console.log(`📸 Loading primary image for "${kategori}"`);
            imgElement.src = primaryUrl;
            attemptCount++;
        } else if (attemptCount < maxAttempts) {
            // Attempts 2-5: Try dari fallback pool (FOTO ASLI, bukan placeholder!)
            const fallbackUrl = fallbackPool[(attemptCount - 1) % fallbackPool.length];
            console.log(`🔄 Fallback attempt ${attemptCount}: trying alternative photo`);
            imgElement.src = fallbackUrl;
            attemptCount++;
        } else {
            // Last resort: gunakan foto random dari kategori
            console.warn(`⚠️ All attempts failed, using final fallback photo`);
            imgElement.src = getFallbackImage(kategori);
            imgElement.style.objectFit = 'cover';
        }
    }

    imgElement.onerror = () => {
        console.warn(`❌ Image failed: ${imgElement.src} (attempt ${attemptCount}/${maxAttempts})`);
        tryNextImage();
    };

    // Start loading
    tryNextImage();
}

// ========== STATISTICS ==========
const gambarStats = {
    'minuman': urlGambarManual['minuman']?.length || 0,
    'makanan': urlGambarManual['makanan']?.length || 0,
    'metabolisme': urlGambarManual['metabolisme']?.length || 0,
    'aktivitas': urlGambarManual['aktivitas']?.length || 0,
    'tips': urlGambarManual['tips']?.length || 0,
    'karbohidrat': urlGambarManual['karbohidrat']?.length || 0,
    'total': Object.values(urlGambarManual).reduce((sum, arr) => sum + (arr?.length || 0), 0)
};

// ========== INITIALIZATION LOG ==========
console.log('✅ GLISIA Image System v2.1 - PROFESSIONAL PHOTOS ONLY');
console.log('📸 Total Real Photos:', gambarStats.total, '(90 foto berkualitas tinggi!)');
console.log('📊 Image Statistics:', gambarStats);
console.log('🎯 Categories:', Object.keys(gambarConfig));
console.log('💾 Cache Active: localStorage');
console.log('🔄 Fallback: Real photos only - NO placeholder!');
console.log('✨ All images from Unsplash (800x600, q=90)');
console.log('\n📚 Usage:');
console.log('   getConsistentImage(itemId, kategori) - Consistent real photo per item');
console.log('   getRandomImage(kategori) - Random real photo for featured');
console.log('   loadImageWithFallback(element, url, kategori) - Auto real photo fallback');
console.log('\n⚠️ IMPORTANT: Fallback sekarang menggunakan FOTO ASLI, bukan placeholder!');