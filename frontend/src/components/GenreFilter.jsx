import { useState, useRef, useEffect } from 'react';
import { theme } from '../theme';

export default function GenreFilter({ selectedGenres, onChange, availableGenres }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      onChange(selectedGenres.filter(g => g !== genre));
    } else {
      onChange([...selectedGenres, genre]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.button}
      >
        <span>
          {selectedGenres.length === 0
            ? 'Filter by Genre'
            : `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''} selected`}
        </span>
        <span style={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          {availableGenres.length === 0 ? (
            <div style={styles.emptyMessage}>No genres available</div>
          ) : (
            <>
              {availableGenres.map(genre => (
                <label key={genre} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre)}
                    onChange={() => toggleGenre(genre)}
                    style={styles.checkbox}
                  />
                  <span>{genre}</span>
                </label>
              ))}
              {selectedGenres.length > 0 && (
                <button
                  onClick={clearAll}
                  style={styles.clearAllButton}
                >
                  Clear All
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    minWidth: '200px',
  },
  button: {
    ...theme.components.button('secondary'),
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  arrow: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    boxShadow: theme.shadows.lg,
    padding: theme.spacing.sm,
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    cursor: 'pointer',
    borderRadius: theme.radius.sm,
    transition: theme.transitions.base,
    ':hover': {
      background: theme.colors.background,
    },
  },
  checkbox: {
    cursor: 'pointer',
    width: '16px',
    height: '16px',
    accentColor: theme.colors.primary,
  },
  clearAllButton: {
    ...theme.components.button('danger'),
    width: '100%',
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
  },
  emptyMessage: {
    padding: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
};
