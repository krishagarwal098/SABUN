// Lather & Lust - Application Configuration & Product Catalog

const CONFIG = {
  // Replace this with your actual WhatsApp business number (with country code, e.g., '919876543210')
  whatsappNumber: "919876543210",
  
  // Default currency configurations
  currency: {
    symbol: "₹",
    code: "INR"
  },
  
  // Product list for Lather & Lust
  products: [
    {
      id: "lavender_calm",
      name: "Lavender Calm",
      tagline: "Calming & Relaxing",
      price: 129,
      weight: "100g",
      size: "3.5 oz",
      image: "assets/images/lavender_calm.png",
      themeColor: "#B7AACA", // Lavender shade from branding sheet
      description: "Infused with pure lavender essential oils and botanicals, this calming bar gently cleanses while melting away daily stress. Rich in natural glycerin for velvety skin.",
      ingredients: ["Saponified Coconut Oil", "Lavender Essential Oil", "Shea Butter", "Almond Oil", "Dried Lavender Buds"],
      badge: "Best Seller"
    },
    {
      id: "neem_tea_tree",
      name: "Neem Tea Tree",
      tagline: "Purifying & Refreshing",
      price: 119,
      weight: "100g",
      size: "3.5 oz",
      image: "assets/images/neem_tea_tree.png",
      themeColor: "#A8BB8A", // Sage green shade from branding sheet
      description: "A powerful combination of organic neem extract and active tea tree oil to purify acne-prone or irritated skin. It provides deep, cooling cleansing and lasting protection.",
      ingredients: ["Neem Leaf Extract", "Tea Tree Essential Oil", "Olive Oil", "Saponified Coconut Oil", "Eucalyptus Oil"],
      badge: "Purifying"
    },
    {
      id: "rose_milk",
      name: "Rose Milk",
      tagline: "Nourishing & Softening",
      price: 129,
      weight: "100g",
      size: "3.5 oz",
      image: "assets/images/rose_milk.png",
      themeColor: "#F2C6CE", // Rose pink shade from branding sheet
      description: "Crafted with damask rose extracts and fresh goat milk, this nourishing soap deeply hydrates your skin, leaving it incredibly soft, radiant, and beautifully scented.",
      ingredients: ["Rose Petal Extract", "Pure Goat Milk", "Rose Water", "Jojoba Oil", "Saponified Coconut Oil"],
      badge: "Nourishing"
    },
    {
      id: "turmeric_honey",
      name: "Turmeric Honey",
      tagline: "Brightening & Glowing",
      price: 119,
      weight: "100g",
      size: "3.5 oz",
      image: "assets/images/turmeric_honey.png",
      themeColor: "#E7C25A", // Turmeric gold shade from branding sheet
      description: "Enriched with wild turmeric powder and raw forest honey, this bar naturally brightens your complexion, reduces blemishes, and reveals a healthy, sun-kissed glow.",
      ingredients: ["Wild Turmeric Powder", "Raw Forest Honey", "Sandalwood Oil", "Coconut Oil", "Vitamin E"],
      badge: "Glowing"
    },
    {
      id: "luxury_hamper",
      name: "Lather & Lust Gift Hamper",
      tagline: "The Ultimate Indulgence Pack",
      price: 479,
      weight: "4 x 100g",
      size: "14 oz total",
      image: "assets/images/gift_hamper.png",
      themeColor: "#E2B883", // Luxurious cream gold
      description: "The complete artisanal collection. Contains all four signature bathing bars (Lavender Calm, Neem Tea Tree, Rose Milk, and Turmeric Honey) in a beautiful premium box packaging.",
      ingredients: ["1x Lavender Calm", "1x Neem Tea Tree", "1x Rose Milk", "1x Turmeric Honey"],
      badge: "Gift Pack"
    }
  ],
  
  // Custom brand promises / values shown in the values section
  promises: [
    {
      title: "100% Vegan",
      icon: "🌱",
      description: "Completely plant-based ingredients with zero animal-derived components."
    },
    {
      title: "Cruelty Free",
      icon: "🐰",
      description: "Our soaps are never tested on animals, and we strictly use ethical suppliers."
    },
    {
      title: "SLS & Paraben Free",
      icon: "🚫",
      description: "No harsh synthetic foaming agents or chemical preservatives that dry out skin."
    },
    {
      title: "Handcrafted in India",
      icon: "🇮🇳",
      description: "Artisanal batches hand-poured with love and care using local botanical extracts."
    }
  ],
  
  // Promo codes (code: { discount %, label })
  promoCodes: {
    'LAUNCH20': { discount: 20, label: '🎉 Launch Special — 20% Off!' },
    'SWEET10':  { discount: 10, label: '🍯 Sweet Deal — 10% Off!' },
    'SWISS15':  { discount: 15, label: '🇨🇭 Swiss Quality — 15% Off!' }
  },
  
  // Free express shipping above this cart value (₹)
  freeExpressThreshold: 499,
  
  // Gift wrap surcharge (₹)
  giftWrapCost: 30
};

// Export configuration for browser scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
