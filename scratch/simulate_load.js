const https = require('https');

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dHJldXNlcHhpbG5mcWZmd2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzA5OTUsImV4cCI6MjA5MDQ0Njk5NX0.AXaOi_ax6esifM7DzwVjNXQrm3XLNPnzT_0yQWm6ahY';

// Mock window/global objects
global.window = {};
global.cats = [
  { id: 1, name: 'Ghee & Oils' },
  { id: 2, name: 'Honey & Jaggery' },
  { id: 4, name: 'Spices' },
  { id: 8, name: 'Bee Products' },
  { id: 9, name: 'Beverages' },
  { id: 10, name: 'Mangoes' }
];

window.mangoPricing = { 'imam': 249, 'alph': 189, 'bang': 179, 'sent': 149 };

function calculateVariantPrice(basePricePerKg, weightKg) {
  const base = Number(basePricePerKg || 0);
  const weight = Number(weightKg || 0);
  return Math.round(base * weight);
}

function formatWeightLabel(weightKg) {
  const weight = Number(weightKg || 0);
  if (!Number.isFinite(weight) || weight <= 0) return '';
  return Number.isInteger(weight) ? `${weight} kg` : `${weight.toFixed(2).replace(/\.?0+$/, '')} kg`;
}

function getProductDescription(p) {
  return p.description || '';
}

const options = {
  hostname: 'jztreusepxilnfqffwka.supabase.co',
  path: '/rest/v1/products?select=id,name,description,image_url,image_url_2,image_url_3,category_id,is_active,is_featured,rating,review_count,base_price_per_kg,compare_at_price_per_kg,price,original_price,weight,in_stock,stock_count,product_type,product_variants(id,label,quantity_kg,price,sku,is_default)&is_active=eq.true',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const prods = JSON.parse(data);
      runSimulation(prods);
    } catch (e) {
      console.error(e);
    }
  });
});

function runSimulation(data) {
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const assetMap = {
    'imam': 'https://drive.google.com/thumbnail?id=1Ov-IVci_5sFoFYP5bepb8EdHBc7lfBkO&sz=w1000',
    'alph': 'https://drive.google.com/thumbnail?id=1fqvfeJycwREQawje_WRYdZf7rXYgDuoe&sz=w1000',
    'bang': 'https://drive.google.com/thumbnail?id=193aZyliqZiPnm6ZDzLnzFX3DgpK6EfgU&sz=w1000',
    'sent': 'https://drive.google.com/thumbnail?id=1GfhzRIHm-CU-hIwkvgxOP-EUlbt_S319&sz=w1000',
    'custom': 'assets/side-01.png'
  };
  const flatVariants = [];
  const groupedProducts = {};

  (data || []).forEach(product => {
    let basePricePerKg = Number(product.base_price_per_kg || 0);
    const compareAtPerKg = Number(product.compare_at_price_per_kg || 0);
    const low = (product.name || '').toLowerCase();

    // Apply Dynamic Mango Pricing Overrides
    for (const k in window.mangoPricing) {
      if (low.includes(k)) {
        basePricePerKg = window.mangoPricing[k];
        break;
      }
    }
    let img = product.image_url;
    if (img && img.includes('unsplash.com')) img = null;

    if (!img) {
      for (const k in assetMap) {
        if (low.includes(k)) {
          img = assetMap[k];
          break;
        }
      }
    }

    if (!img) img = 'assets/placeholder.png';
    const categoryList = global.cats;
    const category = categoryList.find(c => c.id === product.category_id)?.name || 'Products';

    if (product.product_type === 'custom_box') {
      const variants = (product.product_variants || []);
      const boxSizes = variants.filter(v => v.label && !v.label.startsWith('VarietyPool:'));
      const selectionPool = variants.filter(v => v.label && v.label.startsWith('VarietyPool:'));

      const customProduct = {
        id: product.id,
        name: cap(product.name),
        rawName: product.name,
        price: boxSizes[0]?.price || 0,
        wt: boxSizes[0]?.label || '3kg',
        img: img || 'assets/side-01.png',
        inStock: product.in_stock !== false,
        cat: category,
        rating: product.rating || 5.0,
        revs: product.review_count || 10,
        desc: getProductDescription(product),
        isFeatured: product.is_featured,
        isCustomBox: true,
        boxSizes,
        selectionPool,
        sku: product.sku
      };
      
      flatVariants.push(customProduct);
      groupedProducts[product.name] = { ...customProduct, variants: [customProduct] };
      return;
    }

    let variants = (product.product_variants || [])
      .filter(v => v)
      .sort((a, b) => Number(a.quantity_kg || 0) - Number(b.quantity_kg || 0))
      .map(v => {
        const weightKg = Number(v.quantity_kg || 0);
        return {
          id: v.id,
          variantId: v.id,
          productId: product.id,
          name: cap(product.name),
          rawName: product.name,
          price: (window.mangoPricing && Object.keys(window.mangoPricing).some(k => low.includes(k)))
            ? calculateVariantPrice(basePricePerKg, weightKg)
            : (v.price || calculateVariantPrice(basePricePerKg, weightKg)),
          originalPrice: compareAtPerKg > 0 ? calculateVariantPrice(compareAtPerKg, weightKg) : null,
          basePricePerKg,
          wt: v.label || formatWeightLabel(weightKg),
          weightKg,
          img: img || 'assets/placeholder.png',
          img2: product.image_url_2,
          img3: product.image_url_3,
          inStock: product.in_stock !== false,
          stockCount: Number(product.stock_count || 0),
          cat: category,
          badge: product.badge,
          rating: product.rating || 5.0,
          revs: product.review_count || 10,
          desc: getProductDescription(product),
          about_item: product.about_item,
          harvest_journey: product.harvest_journey,
          benefits: product.benefits,
          isFeatured: product.is_featured,
          sku: product.sku
        };
      });

    // Filter variants to only 3kg and 5kg for heritage varieties as per user request
    const varieties = ['imam', 'alph', 'bang', 'sent'];
    if (varieties.some(varName => low.includes(varName))) {
      const sW = new Set();
      variants = variants.filter(v => {
        const wt = (v.wt || '').toLowerCase().trim();
        const isM = /\b3\s*kg\b/i.test(wt) || /\b5\s*kg\b/i.test(wt);
        if (isM && !sW.has(wt)) {
          sW.add(wt);
          return true;
        }
        return false;
      });
    }

    if (!variants.length) {
      const pPrice = Number(product.price || 0);
      const pOrig = Number(product.original_price || 0);
      variants = [{
        id: product.id,
        variantId: product.id,
        productId: product.id,
        name: cap(product.name),
        rawName: product.name,
        price: pPrice,
        originalPrice: pOrig > pPrice ? pOrig : null,
        basePricePerKg: basePricePerKg || pPrice,
        wt: product.weight || '1kg',
        weightKg: parseFloat(product.weight || '1') || 1,
        img: img || 'assets/placeholder.png',
        img2: product.image_url_2,
        img3: product.image_url_3,
        inStock: product.in_stock !== false,
        stockCount: Number(product.stock_count || 0),
        cat: category,
        rating: product.rating || 5.0,
        revs: product.review_count || 10,
        desc: getProductDescription(product),
        isFeatured: product.is_featured
      }];
    }

    variants.forEach(variant => flatVariants.push(variant));

    let baseName = product.name
      .replace(/\(.*\)/g, '')
      .replace(/\s+\d+\s*(kg|g|l|ml|litres|litre|lit|kilo|gram|oz|lb)\s*$/i, '')
      .replace(/ mangoes$/i, '')
      .replace(/ mango$/i, '')
      .replace(/ powder$/i, '')
      .replace(/ oil$/i, '')
      .replace(/ ghee$/i, '')
      .trim();

    if (!groupedProducts[baseName]) {
      groupedProducts[baseName] = { ...variants[0], name: cap(baseName), variants: [] };
    }
    variants.forEach(v => groupedProducts[baseName].variants.push({ ...v, name: cap(baseName) }));
  });

  const sV = new Set();
  const heritageVarieties = ['imam', 'alph', 'bang', 'sent'];
  const filteredVariants = flatVariants.filter(v => {
    const lowName = (v.name || '').toLowerCase();
    const catLow = (v.cat || '').toLowerCase();
    const wt = (v.wt || '').toLowerCase().trim();
    
    const isMango = heritageVarieties.some(k => lowName.includes(k)) || catLow.includes('mango');
    if (isMango) {
      const isM = /\b3\s*kg\b/i.test(wt) || /\b5\s*kg\b/i.test(wt);
      const key = `${lowName}-${wt}`;
      if (isM && !sV.has(key)) {
        sV.add(key);
        return true;
      }
      return false;
    }
    
    const isSmallProduct = catLow.includes('honey') || catLow.includes('ghee') || catLow.includes('powder') || catLow.includes('spice') || catLow.includes('beverage') || lowName.includes('honey') || lowName.includes('ghee') || lowName.includes('coffee');
    if (isSmallProduct) {
      const isS = /\b(100|200|250|500)\s*(g|ml|gram|grams|ml|mliter|mliters)\b/i.test(wt) || 
                  /\b(1|2|5)\s*(kg|l|litre|litres|kilo|kilograms)\b/i.test(wt);
      const key = `${lowName}-${wt}`;
      if (isS && !sV.has(key)) {
        sV.add(key);
        return true;
      }
      return false;
    }

    if (/\b10\s*kg\b/i.test(wt) || /\b15\s*kg\b/i.test(wt)) return false;
    return true;
  });

  console.log("=== SIMULATED window.products (first 10) ===");
  console.log(JSON.stringify(filteredVariants.slice(0, 10).map(v => ({ id: v.id, name: v.name, wt: v.wt, price: v.price })), null, 2));

  console.log("\n=== SIMULATED window.displayProducts ===");
  Object.values(groupedProducts).forEach(p => {
    console.log(`Product: ${p.name}`);
    p.variants.forEach(v => {
      console.log(`  - Variant: ${v.wt} (ID: ${v.id}, Price: ${v.price})`);
    });
  });
}
