import { useState, useEffect } from 'react';
import { theme } from '../theme';

export default function SearchBar({ value, onChange, placeholder, debounceMs = 300 }) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  return (
    <div style={styles.container}>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder || 'Search...'}
        style={styles.input}
      />
      {localValue && (
        <button
          onClick={() => setLocalValue('')}
          style={styles.clearButton}
          title="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    flex: 1,
    minWidth: '200px',
  },
  input: {
    ...theme.components.input(),
    width: '100%',
    paddingRight: '32px',
  },
  clearButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.lg,
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: theme.transitions.base,
  },
};
