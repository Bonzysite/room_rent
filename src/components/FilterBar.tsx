import React from 'react';
import { Search, SlidersHorizontal, Zap, CheckCircle2, RotateCcw, MapPin } from 'lucide-react';
import { Room } from '../types';

export interface FilterState {
  searchQuery: string;
  selectedCity: string;
  selectedRoomType: string;
  maxPrice: number;
  billsIncludedOnly: boolean;
  sortBy: 'recommended' | 'price-asc' | 'price-desc' | 'newest';
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  totalResults: number;
}

const ROOM_TYPES = [
  'All Types',
  'Single Room',
  'Self-Contained',
  'Master Bedroom',
  'Entire Apartment',
  'Studio',
  'Shared Room'
];

const GHANA_CITIES = ['All Cities', 'Accra', 'Kumasi', 'Takoradi', 'Tema', 'Cape Coast', 'Tamale', 'Sunyani', 'Koforidua', 'Ho'];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  totalResults
}) => {
  const resetFilters = () => {
    onFilterChange({
      searchQuery: '',
      selectedCity: 'All Cities',
      selectedRoomType: 'All Types',
      maxPrice: 25000,
      billsIncludedOnly: false,
      sortBy: 'recommended'
    });
  };

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.selectedCity !== 'All Cities' ||
    filters.selectedRoomType !== 'All Types' ||
    filters.maxPrice < 25000 ||
    filters.billsIncludedOnly;

  return (
    <div className="space-y-4">
      {/* Primary Search and Quick Controls Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
          
          {/* Real-time search query */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Search by neighborhood (East Legon, Osu), city, or amenities..."
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* City Selector */}
          <div className="relative md:col-span-3">
            <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
            <select
              value={filters.selectedCity}
              onChange={(e) => onFilterChange({ ...filters, selectedCity: e.target.value })}
              className="w-full appearance-none rounded-xl border border-slate-700/80 bg-slate-950/80 pl-10 pr-8 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            >
              {GHANA_CITIES.map((city) => (
                <option key={city} value={city} className="bg-slate-900 text-white">
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="md:col-span-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            >
              <option value="recommended" className="bg-slate-900">Recommended</option>
              <option value="price-asc" className="bg-slate-900">Price: Low to High</option>
              <option value="price-desc" className="bg-slate-900">Price: High to Low</option>
              <option value="newest" className="bg-slate-900">Newest Listings</option>
            </select>
          </div>

          {/* Bills included quick toggle */}
          <div className="md:col-span-2 flex items-center justify-end">
            <button
              onClick={() => onFilterChange({ ...filters, billsIncludedOnly: !filters.billsIncludedOnly })}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                filters.billsIncludedOnly
                  ? 'border-emerald-500/80 bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'border-slate-700/80 bg-slate-950/80 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${filters.billsIncludedOnly ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              Bills Bundled
            </button>
          </div>
        </div>

        {/* One-Tap Ghana City Quick Chips */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-emerald-400" /> Cities:
          </span>
          {GHANA_CITIES.map((city) => {
            const active = filters.selectedCity === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => onFilterChange({ ...filters, selectedCity: city })}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Row: Room Type Pills & Granular Price Slider */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Room Type Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {ROOM_TYPES.map((type) => {
              const active = filters.selectedRoomType === type;
              return (
                <button
                  key={type}
                  onClick={() => onFilterChange({ ...filters, selectedRoomType: type })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Price Range Slider (GH₵ 300 to GH₵ 25,000) */}
          <div className="flex items-center gap-4 bg-slate-950/60 rounded-xl px-4 py-2 border border-slate-800">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Max Rent</span>
              <span className="text-xs font-bold text-emerald-400">
                GH₵ {filters.maxPrice.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/mo</span>
              </span>
            </div>
            <input
              type="range"
              min={300}
              max={25000}
              step={100}
              value={filters.maxPrice}
              onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
              className="h-1.5 w-32 sm:w-44 accent-emerald-500 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Filter status & Reset button */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-white">{totalResults}</strong> verified {totalResults === 1 ? 'home' : 'homes'} in Ghana
          </span>
          {isFiltered && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" /> Filters active
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Reset all
          </button>
        )}
      </div>
    </div>
  );
};
