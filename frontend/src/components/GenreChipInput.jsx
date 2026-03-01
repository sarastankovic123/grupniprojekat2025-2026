import { useState, useEffect } from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';
import { apiFetch } from '../api/apiFetch';

export default function GenreChipInput({ value = [], onChange, label = 'Å½anrovi', placeholder = 'Izaberite ili unesite Å¾anr...' }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    apiFetch('/api/content/artists/genres')
      .then(genres => {
        if (Array.isArray(genres)) {
          setOptions(genres);
        }
      })
      .catch(err => console.warn('Failed to load genres:', err));
  }, []);

  return (
    <Autocomplete
      multiple
      freeSolo
      autoSelect
      options={options.filter(o => !value.includes(o))}
      value={value}
      onChange={(_, newValue) => {
        const cleaned = [...new Set(newValue.map(v => v.trim()).filter(Boolean))];
        onChange(cleaned);
      }}
      onBlur={(e) => {
        const inputVal = e.target.value?.trim();
        if (inputVal && !value.includes(inputVal)) {
          onChange([...value, inputVal]);
        }
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const { key, ...rest } = getTagProps({ index });
          return (
            <Chip
              key={key}
              label={option}
              size="small"
              {...rest}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                fontWeight: 500,
                '& .MuiChip-deleteIcon': {
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': { color: 'white' },
                },
              }}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={value.length === 0 ? placeholder : ''}
          variant="outlined"
          size="small"
        />
      )}
      sx={{ mt: 0.5 }}
    />
  );
}
