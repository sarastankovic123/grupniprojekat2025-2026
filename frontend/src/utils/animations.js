
export const animations = {
  fadeInUp: {
    animation: 'fadeInUp 0.6s ease-out forwards',
  },
  fadeIn: {
    animation: 'fadeIn 0.8s ease-in forwards',
  },
  scaleIn: {
    animation: 'scaleIn 0.5s ease-out forwards',
  },
  slideInLeft: {
    animation: 'slideInLeft 0.7s ease-out forwards',
  },
};

export const keyframes = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
`;
