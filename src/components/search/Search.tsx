// components/SearchFilterInput.tsx
import React, {
  useState,
  useRef,
  useEffect,
  MouseEvent,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { Search, ChevronDown, X } from "lucide-react";

export type FilterType = "is" | "label" | "type" | "priority" | "name" | "date";

export interface FilterValue {
  id: string;
  label: string;
}

export interface Filter {
  type: FilterType;
  value: FilterValue;
}

export interface FilterOption {
  key: FilterType;
  label?: string;
  description: string;
  color: string;
}

export interface Filters {
  is?: Record<string, FilterValue>;
  label?: Record<string, FilterValue>;
  type?: Record<string, FilterValue>;
  priority?: Record<string, FilterValue>;
  name?: Record<string, FilterValue>;
  date?: Record<string, FilterValue>;
}

export interface SearchFilterInputProps {
  filters: Filters;
  filterOptions: FilterOption[];
  onSearch: (query: string, filters: Filter[]) => void;
}

export const SearchFilterInput: React.FC<SearchFilterInputProps> = ({
  filters,
  filterOptions,
  onSearch,
}) => {
  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterType | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setCurrentFilter(null);
      }
    };
    document.addEventListener(
      "mousedown",
      handleClickOutside as unknown as EventListener
    );
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside as unknown as EventListener
      );
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleSearchBoxClick = (e: MouseEvent<HTMLDivElement>) => {
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).tagName === "INPUT"
    ) {
      inputRef.current?.focus();
      setShowDropdown(true);
      setCurrentFilter(null);
    }
  };

  const handleFilterSelect = (filterKey: FilterType) => {
    setCurrentFilter(filterKey);
  };

  const handleValueSelect = (value: FilterValue) => {
    if (!currentFilter) return;

    const existingFilterIndex = selectedFilters.findIndex(
      (f) => f.type === currentFilter
    );

    const updatedFilters = [...selectedFilters];
    if (existingFilterIndex >= 0) {
      updatedFilters[existingFilterIndex] = {
        type: currentFilter,
        value: value,
      };
    } else {
      updatedFilters.push({ type: currentFilter, value: value });
    }
    setSelectedFilters(updatedFilters);
    onSearch("asda", updatedFilters);
    setCurrentFilter(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeFilter = (filterToRemove: Filter) => {
    setSelectedFilters(selectedFilters.filter((f) => f !== filterToRemove));
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    setSearchText("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      setCurrentFilter(null);
    }
    if (e.key === "Enter") handleSearch();
    if (e.key === "Backspace" && searchText === "" && selectedFilters.length) {
      const newFilters = [...selectedFilters];
      newFilters.pop();
      setSelectedFilters(newFilters);
      onSearch("asda", newFilters);
    }
  };

  const handleSearch = () => {
    const filterQuery = selectedFilters
      .map((filter) => `${filter.type}:"${filter.value}"`)
      .join(" ");
    const fullQuery = [searchText, filterQuery].filter(Boolean).join(" ");
    onSearch(fullQuery, selectedFilters);
  };

  const getFilterColor = (type: FilterType) => {
    return (
      filterOptions.find((f) => f.key === type)?.color ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getAvailableFilters = () => {
    return filterOptions.filter(
      (option) => !selectedFilters.some((f) => f.type === option.key)
    );
  };

  return (
    <div className="relative max-w-sm" ref={containerRef}>
      <div
        className="relative flex items-center gap-2 p-2 cursor-text text-sm"
        onClick={handleSearchBoxClick}
      >
        <Search className="text-gray-200 w-5 h-5 ml-1 flex-shrink-0" />
        {selectedFilters.map((filter, i) => (
          <span
            key={i}
            className={`inline-flex items-center text-[12px] gap-1 px-2 py-1 rounded font-medium border ${getFilterColor(
              filter.type
            )}`}
          >
            {filter.type}:"{filter.value.label}"
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFilter(filter);
              }}
              className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedFilters.length === 0 ? "Search issues..." : ""}
          value={searchText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setShowDropdown(true);
            setCurrentFilter(null);
          }}
          className="flex-1 text-sm min-w-0 outline-none bg-transparent py-1"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          className="flex-shrink-0 p-1 mr-1"
        >
          <ChevronDown
            className={`text-gray-400 w-5 h-5 transition-transform ${
              showDropdown ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#141414] rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {!currentFilter ? (
            <div className="py-2">
              <div className="px-2 py-1 text-[10px] font-semibold text-gray-100 uppercase tracking-wide flex items-center justify-between">
                <span>Add Filters ({selectedFilters.length} selected)</span>
                {selectedFilters.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-red-400 hover:text-red-500 text-xs"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {getAvailableFilters().map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleFilterSelect(option.key)}
                  className="w-full text-left px-2 py-1 hover:bg-gray-800 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${option.color}`}
                    >
                      {option.label}
                    </span>
                    <span className="text-gray-100 text-xs">
                      {option.description}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transform -rotate-90" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-2">
              <div className="px-2 py-1 text-xs font-semibold text-gray-100 uppercase tracking-wide flex items-center justify-between">
                <span>{currentFilter}: options</span>
                <button
                  onClick={() => setCurrentFilter(null)}
                  className="text-blue-600 hover:text-blue-700 text-xs"
                >
                  ← Back
                </button>
              </div>
              {Object.entries(filters[currentFilter] || {}).map(
                ([key, value]) => {
                  const isSelected = selectedFilters.some(
                    (f) => f.type === currentFilter && f.value.id === value.id
                  );
                  return (
                    <button
                      key={key}
                      onClick={() => handleValueSelect(value)}
                      className={`w-full text-left px-2 py-1 hover:bg-gray-800 flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-50 text-blue-900"
                          : "text-gray-100"
                      }`}
                    >
                      <span>{value.label}</span>
                      {isSelected && (
                        <span className="text-xs text-blue-600">
                          ✓ Selected
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
