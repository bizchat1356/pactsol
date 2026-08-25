const scrollToTopBtn = document.getElementById('scrollToTopBtn');

if (scrollToTopBtn) {
  const updateVisibility = () => {
    scrollToTopBtn.hidden = window.scrollY <= 300;
  };

  updateVisibility();

  window.addEventListener('scroll', updateVisibility, {
    passive: true,
  });

  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}