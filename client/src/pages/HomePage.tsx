import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import api from "../lib/api";
import type { Product, Page } from "../types";
import ProductModal from "../components/ProductModal";
import ProductCard from "../components/ProductCard";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Page<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter state
  const [nameFilter, setNameFilter] = useState(searchParams.get("name") || "");
  const [minPrice, setMinPrice] = useState(
    searchParams.get("priceCentsMin") || "",
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get("priceCentsMax") || "",
  );
  const currentPage = Number.parseInt(searchParams.get("page") ?? "0", 10);

  // Inline the async fetch inside useEffect to avoid cascading-setState lint error
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const nameQ = searchParams.get("name");
        const minQ = searchParams.get("priceCentsMin");
        const maxQ = searchParams.get("priceCentsMax");
        if (nameQ) params.set("name", nameQ);
        if (minQ) params.set("priceCentsMin", minQ);
        if (maxQ) params.set("priceCentsMax", maxQ);
        params.set("page", String(currentPage));
        params.set("size", "12");

        const { data } = await api.get(`/products?${params.toString()}`);
        if (!cancelled) setProducts(data.data as Page<Product>);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [searchParams, currentPage]);

  const applyFilters = (): void => {
    const params = new URLSearchParams();
    if (nameFilter.trim()) params.set("name", nameFilter.trim());
    if (minPrice)
      params.set(
        "priceCentsMin",
        String(Math.round(Number.parseFloat(minPrice) * 100)),
      );
    if (maxPrice)
      params.set(
        "priceCentsMax",
        String(Math.round(Number.parseFloat(maxPrice) * 100)),
      );
    params.set("page", "0");
    setSearchParams(params);
    setFilterOpen(false);
  };

  const clearFilters = (): void => {
    setNameFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSearchParams({});
  };

  const goToPage = (page: number): void => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    setSearchParams(params);
  };

  const hasActiveFilters =
    searchParams.get("name") ||
    searchParams.get("priceCentsMin") ||
    searchParams.get("priceCentsMax");

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-(--color-text)">
              {searchParams.get("name")
                ? `Results for "${searchParams.get("name")}"`
                : "All Products"}
            </h1>
            {products && (
              <p className="text-sm text-(--color-text-muted) mt-1">
                {products.page.totalElements} products found
              </p>
            )}
          </div>
          <button
            id="filter-toggle-btn"
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              hasActiveFilters
                ? "border-(--color-accent) text-(--color-accent) bg-(--color-accent)/10"
                : "border-(--color-border) text-(--color-text-muted) hover:border-(--color-accent) hover:text-(--color-text)"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-(--color-accent) animate-pulse" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="mb-6 p-5 rounded-2xl bg-(--color-surface) border border-(--color-border) shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-4 h-4 text-(--color-accent)" />
              <h2 className="font-semibold text-sm">Filter Products</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="filter-name"
                  className="block text-xs text-(--color-text-muted) mb-1"
                >
                  Name
                </label>
                <input
                  id="filter-name"
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full px-3 py-2 text-sm rounded-lg bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)/50 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-min-price"
                  className="block text-xs text-(--color-text-muted) mb-1"
                >
                  Min Price ($)
                </label>
                <input
                  id="filter-min-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)/50 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="filter-max-price"
                  className="block text-xs text-(--color-text-muted) mb-1"
                >
                  Max Price ($)
                </label>
                <input
                  id="filter-max-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="999.99"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)/50 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                id="filter-apply-btn"
                onClick={applyFilters}
                className="px-5 py-2 rounded-lg bg-(--color-accent) hover:bg-(--color-accent-hover) text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                Apply Filters
              </button>
              <button
                id="filter-clear-btn"
                onClick={clearFilters}
                className="px-5 py-2 rounded-lg border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-(--color-surface) border border-(--color-border) rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-(--color-surface-2)" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-(--color-surface-2) rounded w-3/4" />
                  <div className="h-3 bg-(--color-surface-2) rounded w-full" />
                  <div className="h-3 bg-(--color-surface-2) rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products?.content.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-(--color-text-muted)">
              No products found
            </h2>
            <p className="text-sm text-(--color-text-muted) mt-2">
              Try adjusting your filters
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 rounded-lg bg-(--color-accent) text-white text-sm hover:bg-(--color-accent-hover) transition-colors"
            >
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
              className="p-2 rounded-lg border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: products.page.totalPages }, (_, i) => (
              <button
                key={`page-${i}`}
                id={`pagination-page-${i}`}
                onClick={() => goToPage(i)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  i === products.page.number
                    ? "bg-(--color-accent) text-white shadow-lg shadow-indigo-500/25"
                    : "border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-accent)"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              id="pagination-next"
              onClick={() => goToPage(currentPage + 1)}
              disabled={products.page.number >= products.page.totalPages - 1}
              className="p-2 rounded-lg border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
