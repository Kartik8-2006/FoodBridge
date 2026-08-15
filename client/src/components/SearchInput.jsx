import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Search, X, MapPin, FileText, CornerDownLeft } from 'lucide-react';

const getSuggestionsData = (t) => [
  { key: "home", label: t("HOME"), category: "Page", path: "/" },
  { key: "our-story", label: t("Our Story Section"), category: "Section", path: "/#our-story" },
  { key: "impact-facts", label: t("Impact Facts Section"), category: "Section", path: "/#impact-facts" },
  { key: "latest-updates", label: t("Latest News Section"), category: "Section", path: "/#latest-updates" },
  { key: "donate-food", label: t("DONATE FOOD"), category: "Page", path: "/donate-food" },
  { key: "donate-funds", label: t("Donate Funds Section"), category: "Section", path: "/donate-food#donate-funds" },
  { key: "food-safety", label: t("Food Safety Section"), category: "Section", path: "/donate-food#food-safety" },
  { key: "pickup-prep", label: t("Pickup Prep Section"), category: "Section", path: "/donate-food#pickup-preparation" },
  { key: "find-food", label: t("FIND FOOD"), category: "Page", path: "/find-food" },
  { key: "available-food", label: t("Available Food Section"), category: "Section", path: "/find-food#available-food" },
  { key: "request-food", label: t("Request Food Section"), category: "Section", path: "/find-food#request-food" },
  { key: "distribution-points", label: t("Distribution Points Section"), category: "Section", path: "/find-food#distribution-points" },
  { key: "emergency-assistance", label: t("Emergency Support Section"), category: "Section", path: "/find-food#emergency-assistance" },
  { key: "volunteer", label: t("BECOME VOLUNTEER"), category: "Page", path: "/volunteer" },
  { key: "volunteer-signup", label: t("Volunteer Signup Section"), category: "Section", path: "/volunteer#volunteer-signup" },
  { key: "ngos", label: t("NGOS"), category: "Page", path: "/ngos" },
  { key: "ngo-registration", label: t("NGO Registration Section"), category: "Section", path: "/ngos#ngo-registration" },
  { key: "beneficiaries", label: t("NGO Beneficiaries"), category: "Section", path: "/ngos#beneficiaries" },
  { key: "resources", label: t("RESOURCES"), category: "Page", path: "/resources" },
  { key: "donor-handbook", label: t("Donor Handbook Section"), category: "Section", path: "/resources#donor-handbook" },
  { key: "volunteer-guide", label: t("Volunteer Guide Section"), category: "Section", path: "/resources#volunteer-guide" },
  { key: "reports-section", label: t("Reports Section"), category: "Section", path: "/resources#reports-section" },
  { key: "about", label: t("ABOUT"), category: "Page", path: "/about" },
  { key: "project-objective", label: t("Project Objectives"), category: "Section", path: "/about#project-objective" },
  { key: "how-platform-works", label: t("How It Works Section"), category: "Section", path: "/about#how-platform-works" },
  { key: "our-mission", label: t("Our Mission Section"), category: "Section", path: "/about#our-mission" },
  { key: "contact", label: t("CONTACT"), category: "Page", path: "/contact" },
  { key: "support-email", label: t("Support Email Details"), category: "Section", path: "/contact#support-email" },
  { key: "partner-support", label: t("Partner Support Details"), category: "Section", path: "/contact#partner-support" }
];

export default function SearchInput({ onExpandChange }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  
  const modalCardRef = useRef(null);
  const inlineContainerRef = useRef(null);
  const inputRef = useRef(null);

  const suggestionsList = getSuggestionsData(t);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    onExpandChange?.(expanded);
  }, [expanded, onExpandChange]);

  // Handle auto-close on scroll OR outside click for mobile pop-up and desktop inline
  useEffect(() => {
    if (!expanded) return;

    function handleScroll() {
      setExpanded(false);
      setQuery('');
      setSuggestions([]);
    }

    function handleClickOutside(event) {
      if (isMobile) {
        if (modalCardRef.current && !modalCardRef.current.contains(event.target)) {
          setExpanded(false);
          setQuery('');
          setSuggestions([]);
        }
      } else {
        if (inlineContainerRef.current && !inlineContainerRef.current.contains(event.target)) {
          setExpanded(false);
          setQuery('');
          setSuggestions([]);
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded, isMobile]);

  // Update suggestions when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const cleanQuery = query.toLowerCase();
    const filtered = suggestionsList.filter(item => {
      const matchLabel = item.label.toLowerCase().includes(cleanQuery);
      const matchCategory = item.category.toLowerCase().includes(cleanQuery);
      const matchKey = item.key.toLowerCase().includes(cleanQuery);
      return matchLabel || matchCategory || matchKey;
    });

    setSuggestions(filtered);
    setActiveIndex(-1);
  }, [query, language]);

  const selectItem = (item) => {
    setQuery('');
    setExpanded(false);
    navigate(item.path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setExpanded(false);
      setQuery('');
      return;
    }

    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        selectItem(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        selectItem(suggestions[0]);
      }
    }
  };

  const handleSearchClick = () => {
    if (!expanded) {
      setExpanded(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else if (!isMobile && query.trim() && suggestions.length > 0) {
      selectItem(suggestions[0]);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
    if (!isMobile && !query) {
      setExpanded(false);
    }
  };

  // Render Mobile Pop-up Overlay Modal
  if (isMobile) {
    return (
      <div className="search-input-container">
        <button type="button" className="search-trigger-btn" onClick={handleSearchClick} aria-label="Search">
          <Search size={20} />
        </button>

        {expanded && (
          <div className="search-overlay-backdrop">
            <div className="search-modal-card" ref={modalCardRef}>
              <form className="search-popup-form" onSubmit={(e) => { e.preventDefault(); if (suggestions[0]) selectItem(suggestions[0]); }}>
                <Search size={20} className="search-icon-inside" />
                <input
                  type="text"
                  className="search-modal-input"
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("SEARCH...") || "Search..."}
                  autoComplete="off"
                />
                <button type="button" className="search-close-modal-btn" onClick={() => setExpanded(false)} aria-label="Close search">
                  <X size={20} />
                </button>
              </form>

              {suggestions.length > 0 && (
                <ul className="search-suggestions-list">
                  {suggestions.map((item, index) => (
                    <li
                      key={item.path + item.label}
                      className={`search-suggestion-item ${index === activeIndex ? 'active' : ''}`}
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      {item.category === 'Page' ? <FileText size={15} /> : <MapPin size={15} />}
                      <span>{item.label}</span>
                      <span className="category">{item.category}</span>
                      {index === activeIndex && <CornerDownLeft size={13} className="enter-hint" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Desktop / Tablet Inline Search Bar
  return (
    <div className="search-input-container" ref={inlineContainerRef}>
      <div className={`search-inline-wrapper ${expanded ? 'expanded' : ''}`}>
        <button type="button" className="search-trigger-btn" onClick={handleSearchClick} aria-label="Search">
          <Search size={20} />
        </button>

        <input
          type="text"
          className="search-inline-input"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("SEARCH...") || "Search..."}
          autoComplete="off"
        />

        {expanded && query && (
          <button type="button" className="search-clear-btn" onClick={handleClear} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      {expanded && suggestions.length > 0 && (
        <ul className="search-inline-dropdown">
          {suggestions.map((item, index) => (
            <li
              key={item.path + item.label}
              className={`search-suggestion-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => selectItem(item)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {item.category === 'Page' ? <FileText size={14} /> : <MapPin size={14} />}
              <span>{item.label}</span>
              <span className="category">{item.category}</span>
              {index === activeIndex && <CornerDownLeft size={11} className="enter-hint" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}



