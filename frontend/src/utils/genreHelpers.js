import { theme } from '../theme';

export function getGenreGradient(genre) {
  const genreLower = genre.toLowerCase();
  if (genreLower.includes('rock')) return theme.gradients.genreRock;
  if (genreLower.includes('pop')) return theme.gradients.genrePop;
  if (genreLower.includes('jazz')) return theme.gradients.genreJazz;
  if (genreLower.includes('metal')) return theme.gradients.genreMetal;
  if (genreLower.includes('electronic') || genreLower.includes('edm')) return theme.gradients.genreElectronic;
  if (genreLower.includes('classical')) return theme.gradients.genreClassical;
  if (genreLower.includes('hip')) return theme.gradients.genreHipHop;
  if (genreLower.includes('blues')) return theme.gradients.genreBlues;
  return theme.gradients.genreRock;
}

export function getGenreIcon(genre) {
  const icons = {
    rock: '🎸',
    pop: '🎤',
    jazz: '🎺',
    metal: '🥁',
    electronic: '🎧',
    edm: '🎧',
    classical: '🎻',
    hip: '🎙️',
    blues: '🎷',
  };

  const genreLower = genre.toLowerCase();
  for (const [key, icon] of Object.entries(icons)) {
    if (genreLower.includes(key)) return icon;
  }
  return '🎵';
}
