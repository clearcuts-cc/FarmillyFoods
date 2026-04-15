// Simple production-ready example for Supabase dynamic pricing.
// Assumes:
// - products.base_price_per_kg stores the base price
// - product_variants.weight_kg stores only the weight
// - final variant price is calculated in JavaScript

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

function calculatePrice(basePricePerKg, weightKg) {
  return Number(basePricePerKg) * Number(weightKg);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

async function loadProductsForStorefront() {
  const { data, error } = await supabaseClient
    .from('products')
    .select(`
      id,
      name,
      description,
      image_url,
      base_price_per_kg,
      product_variants (
        id,
        weight_kg,
        stock_count,
        is_active,
        sort_order
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to load products:', error);
    return;
  }

  const normalizedProducts = (data || []).map(product => ({
    ...product,
    variants: (product.product_variants || [])
      .filter(variant => variant.is_active !== false && Number(variant.stock_count || 0) > 0)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map(variant => ({
        id: variant.id,
        weightKg: Number(variant.weight_kg),
        stockCount: Number(variant.stock_count || 0),
        price: calculatePrice(product.base_price_per_kg, variant.weight_kg)
      }))
  }));

  renderProducts(normalizedProducts);
}

function renderProducts(products) {
  const container = document.getElementById('products');
  if (!container) return;

  container.innerHTML = products.map(product => `
    <article class="product-card">
      <h3>${product.name}</h3>
      <p>${product.description || ''}</p>
      <div>Base price: ${formatCurrency(product.base_price_per_kg)}/kg</div>
      <ul>
        ${product.variants.map(variant => `
          <li>
            ${variant.weightKg}kg - ${formatCurrency(variant.price)}
          </li>
        `).join('')}
      </ul>
    </article>
  `).join('');
}

loadProductsForStorefront();
