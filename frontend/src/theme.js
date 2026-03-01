33// Olive Green Theme Configuration (Darker Shades)

export const theme = {
  colors: {
    primary: '#556B2F',           // Dark olive green (main brand color)
    primaryDark: '#3D4B1F',       // Very dark olive (headers, dark accents)
    primaryMedium: '#6B8E23',     // Medium olive (hover states, highlights)
    primaryLight: '#D8E4C0',      // Pale olive (subtle backgrounds)

    background: '#F5F2ED',        // Cream (page backgrounds)
    surface: '#FAFAF7',           // Warm white (card backgrounds)
    border: '#C9C9C0',            // Soft gray (borders)

    text: {
      primary: '#1F2B14',         // Very dark olive-gray (main text)
      secondary: '#4A5940',       // Medium-dark olive-gray (secondary text)
      light: '#6B7566',           // Olive gray (meta info, light text)
    },

    semantic: {
      success: '#556B2F',         // Primary olive (success states)
      error: '#A84842',           // Darker muted red (errors)
      warning: '#C29863',         // Darker warm amber (warnings)
      info: '#4A7575',            // Darker teal (info)
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },

  radius: {
    sm: '6px',      // Small elements, badges
    md: '10px',     // Buttons, inputs
    lg: '14px',     // Cards, containers
  },

  shadows: {
    sm: '0 1px 3px rgba(85, 107, 47, 0.1)',
    md: '0 4px 12px rgba(85, 107, 47, 0.15)',
    lg: '0 8px 24px rgba(85, 107, 47, 0.2)',
  },

  transitions: {
    fast: '0.15s ease',
    base: '0.2s ease',
    slow: '0.3s ease',
  },

  typography: {
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      md: '15px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  components: {
    button: (variant = 'primary') => {
      const base = {
        padding: '10px 16px',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: '0.2s ease',
        border: 'none',
        fontWeight: 500,
        fontSize: '14px',
        display: 'inline-block',
        textDecoration: 'none',
        textAlign: 'center',
      };

      const variants = {
        primary: {
          background: '#556B2F',
          color: 'white',
        },
        secondary: {
          background: 'white',
          color: '#556B2F',
          border: '1px solid #556B2F',
        },
        danger: {
          background: '#A84842',
          color: 'white',
        },
      };

      return { ...base, ...variants[variant] };
    },

    input: () => ({
      padding: '10px 12px',
      borderRadius: '10px',
      border: '1px solid #C9C9C0',
      background: 'white',
      fontSize: '14px',
      transition: '0.2s ease',
      outline: 'none',
      width: '100%',
      color: '#1F2B14',
    }),

    card: () => ({
      background: '#FAFAF7',
      borderRadius: '14px',
      padding: '20px',
      border: '1px solid #C9C9C0',
      boxShadow: '0 1px 3px rgba(85, 107, 47, 0.1)',
      transition: '0.2s ease',
    }),

    link: () => ({
      color: '#556B2F',
      textDecoration: 'none',
      transition: '0.2s ease',
    }),

    badge: (variant = 'primary') => {
      const base = {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-block',
      };

      const variants = {
        primary: {
          background: '#556B2F',
          color: 'white',
        },
        error: {
          background: '#A84842',
          color: 'white',
        },
        warning: {
          background: '#C29863',
          color: 'white',
        },
      };

      return { ...base, ...variants[variant] };
    },

    label: () => ({
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      fontWeight: 600,
      fontSize: '14px',
      color: '#1F2B14',
    }),

    page: () => ({
      padding: '24px',
      background: '#F5F2ED',
      minHeight: '100vh',
    }),

    topbar: () => ({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      padding: '16px 24px',
      background: '#FAFAF7',
      borderRadius: '14px',
      border: '1px solid #C9C9C0',
      boxShadow: '0 1px 3px rgba(85, 107, 47, 0.1)',
    }),
  },

  gradients: {
    heroOlive: 'linear-gradient(135deg, #556B2F 0%, #3D4B1F 50%, #2A3416 100%)',
    cardOverlay: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
    genreRock: 'linear-gradient(135deg, #C2411A 0%, #8B2F14 100%)',
    genrePop: 'linear-gradient(135deg, #E85D99 0%, #B8256F 100%)',
    genreJazz: 'linear-gradient(135deg, #4A7575 0%, #2F4F4F 100%)',
    genreMetal: 'linear-gradient(135deg, #1A1A1A 0%, #4A4A4A 100%)',
    genreElectronic: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
    genreClassical: 'linear-gradient(135deg, #7C2D12 0%, #431407 100%)',
    genreHipHop: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
    genreBlues: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
    statCard: 'linear-gradient(135deg, #D8E4C0 0%, #C4D6A8 100%)',
  },

  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(85, 107, 47, 0.15)',
  },

  animations: {
    hoverLift: {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: '0 12px 40px rgba(85, 107, 47, 0.3)',
    },
    scaleHover: {
      transform: 'scale(1.05)',
    },
  },
};

export const hoverState = {
  button: {
    primary: {
      background: '#6B8E23',
    },
    secondary: {
      background: '#F5F2ED',
      borderColor: '#6B8E23',
    },
    danger: {
      background: '#8F3B36',
    },
  },
  link: {
    color: '#6B8E23',
  },
  card: {
    boxShadow: '0 4px 12px rgba(85, 107, 47, 0.15)',
  },
};

export const focusState = {
  input: {
    borderColor: '#556B2F',
    boxShadow: '0 0 0 3px rgba(85, 107, 47, 0.1)',
  },
};

export default theme;
