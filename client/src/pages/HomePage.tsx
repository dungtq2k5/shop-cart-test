import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import api from '../lib/api';
import type { Product, Page, ProductFilters } from '../types';
import { formatCurrency } from '../utils';
import { ProductModal } from '../components/ProductModal';

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <button
      id={`product-card-${product.id}`}
      onClick={onClick}
      className="group text-left bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[var(--color-accent)]/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Placeholder image area */}
      <div className="h-48 bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-border)] flex items-center justify-center relative overflow-hidden">
        <div className="text-5xl select-none opacity-60">🛍️</div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent opacity-60" />
        {product.stockQty === 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-red-500/90 text-white text-xs font-semibold">
            Sold Out
          </div>
        )}
        {product.stockQty > 0 && product.stockQty < 10 && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-500/90 text-white text-xs font-semibold">
            Low Stock
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-accent-light)] transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-[var(--color-accent-light)]">
            {formatCurrency(product.priceCents)}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {product.stockQty} in stock
          </span>
        </div>
      </div>
    </button>
  );
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Page<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter state
  const [nameFilter, setNameFilter] = useState(searchParams.get('name') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('priceCentsMin') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('priceCentsMax') || '');
  const currentPage = parseInt(searchParams.get('page') || '0', 10);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ProductFilters = {
        page: currentPage,
        size: 12,
      };
      const nameQ = searchParams.get('name');
      const minQ = searchParams.get('priceCentsMin');
      const maxQ = searchParams.get('priceCentsMax');
      if (nameQ) filters.name = nameQ;
      if (minQ) filters.priceCentsMin = parseInt(minQ, 10);
      if (maxQ) filters.priceCentsMax = parseInt(maxQ, 10);

      const params = new URLSearchParams();
      if (filters.name) params.set('name', filters.name);
      if (filters.priceCentsMin != null) params.set('priceCentsMin', String(filters.priceCentsMin));
      if (filters.priceCentsMax != null) params.set('priceCentsMax', String(filters.priceCentsMax));
      params.set('page', String(filters.page ?? 0));
      params.set('size', String(filters.size ?? 12));

      const { data } = await api.get(`/products?${params.toString()}`);
      setProducts(data.data);
    } finally {
      setLoading(false);
    }
  }, [searchParams, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (nameFilter.trim()) params.set('name', nameFilter.trim());
    if (minPrice) params.set('priceCentsMin', String(Math.round(parseFloat(minPrice) * 100)));
    if (maxPrice) params.set('priceCentsMax', String(Math.round(parseFloat(maxPrice) * 100)));
    params.set('page', '0');
    setSearchParams(params);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setNameFilter('');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    setSearchParams(params);
  };

  const hasActiveFilters = searchParams.get('name') || searchParams.get('priceCentsMin') || searchParams.get('priceCentsMax');

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {searchParams.get('name') ? `Results for "${searchParams.get('name')}"` : 'All Products'}
            </h1>
            {products && (
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {products.page.totalElements} products found
              </p>
            )}
          </div>
          <button
            id="filter-toggle-btn"
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              hasActiveFilters
                ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/10'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />}
          </button>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="mb-6 p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="font-semibold text-sm">Filter Products</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Name</label>
                <input
                  id="filter-name"
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Min Price ($)</label>
                <input
                  id="filter-min-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Max Price ($)</label>
                <input
                  id="filter-max-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="999.99"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/50 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                id="filter-apply-btn"
                onClick={applyFilters}
                className="px-5 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                Apply Filters
              </button>
              <button
                id="filter-clear-btn"
                onClick={clearFilters}
                className="px-5 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-[var(--color-surface-2)]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[var(--color-surface-2)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--color-surface-2)] rounded w-full" />
                  <div className="h-3 bg-[var(--color-surface-2)] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products?.content.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-[var(--color-text-muted)]">No products found</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">Try adjusting your filters</p>
            <button onClick={clearFilters} className="mt-4 px-6 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm hover:bg-[var(--color-accent-hover)] transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products?.content.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {products && products.page.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              id="pagination-prev"
              onClick={() => goToPage(currentPage - 1)}
              disabled={products.page.number === 0}
              className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: products.page.totalPages }).map((_, i) => (
              <button
                key={i}
                id={`pagination-page-${i}`}
                onClick={() => goToPage(i)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  i === products.page.number
                    ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-indigo-500/25'
                    : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              id="pagination-next"
              onClick={() => goToPage(currentPage + 1)}
              disabled={products.page.number >= products.page.totalPages - 1}
              className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
