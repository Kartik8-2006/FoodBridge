import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
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

export default function SearchInput() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const suggestionsList = getSuggestionsData(t);

  // Handle click outside to collapse
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        if (!query.trim()) {
          setExpanded(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

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
    setIsOpen(false);
    setExpanded(false);
    navigate(item.path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setExpanded(false);
      setQuery('');
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

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
      }, 100);
    } else if (query.trim() && suggestions.length > 0) {
      // If already expanded and has text, select first match on click
      selectItem(suggestions[0]);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
    if (!query) {
      setExpanded(false);
    }
  };

  return (
    <Container ref={containerRef}>
      <SearchWrapper expanded={expanded}>
        <SearchIconBtn type="button" onClick={handleSearchClick} aria-label="Search">
          <Search size={20} />
        </SearchIconBtn>
        
        <StyledInput
          type="text"
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("SEARCH...") || "Search..."}
          expanded={expanded}
          autoComplete="off"
        />

        <ClearIconBtn 
          type="button" 
          visible={expanded && !!query} 
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={16} />
        </ClearIconBtn>
      </SearchWrapper>

      {expanded && isOpen && suggestions.length > 0 && (
        <SuggestionsDropdown>
          {suggestions.map((item, index) => (
            <SuggestionItem
              key={item.path + item.label}
              className={index === activeIndex ? 'active' : ''}
              onClick={() => selectItem(item)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {item.category === 'Page' ? <FileText size={14} /> : <MapPin size={14} />}
              <span>{item.label}</span>
              <span className="category">{item.category}</span>
              {index === activeIndex && <CornerDownLeft size={11} className="enter-hint" />}
            </SuggestionItem>
          ))}
        </SuggestionsDropdown>
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  width: ${props => props.expanded ? '250px' : '40px'};
  height: 40px;
  background: ${props => props.expanded ? '#ffffff' : 'transparent'};
  border: 1px solid ${props => props.expanded ? '#d8dce2' : 'transparent'};
  border-radius: 20px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: ${props => props.expanded ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none'};

  &:hover {
    background: ${props => props.expanded ? '#ffffff' : 'rgba(0, 0, 0, 0.04)'};
    border-color: ${props => props.expanded ? '#c0c4cc' : 'transparent'};
  }
`;

const StyledInput = styled.input`
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  outline: none;
  padding: 0 34px 0 38px;
  font-size: 14px;
  color: #303133;
  opacity: ${props => props.expanded ? 1 : 0};
  transition: opacity 0.2s ease;
  pointer-events: ${props => props.expanded ? 'auto' : 'none'};
  font-family: inherit;
  box-sizing: border-box;
`;

const SearchIconBtn = styled.button`
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  background: transparent;
  border: none;
  color: #5e6167;
  cursor: pointer;
  border-radius: 50%;
  z-index: 2;
  transition: color 0.25s;

  &:hover {
    color: #ed8b00;
  }
`;

const ClearIconBtn = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  background: transparent;
  border: none;
  color: #909399;
  cursor: pointer;
  border-radius: 50%;
  z-index: 2;
  opacity: ${props => props.visible ? 1 : 0};
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
  transition: all 0.2s ease;

  &:hover {
    color: #303133;
    background: rgba(0, 0, 0, 0.08);
  }
`;

const SuggestionsDropdown = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  min-width: 260px;
  background: white;
  border-radius: 8px;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.12);
  margin: 6px 0 0 0;
  padding: 6px 0;
  list-style: none;
  z-index: 1000;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  box-sizing: border-box;

  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 10px;
  }
`;

const SuggestionItem = styled.li`
  padding: 8px 14px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
  text-align: left;
  font-weight: 500;
  box-sizing: border-box;

  &:hover, &.active {
    background: #f5f7fa;
    color: #303133;
  }

  .category {
    font-size: 9px;
    color: #ed8b00;
    text-transform: uppercase;
    font-weight: 700;
    margin-left: auto;
    background: #fdf6ec;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }

  .enter-hint {
    color: #c0c4cc;
    margin-left: 4px;
  }
`;
