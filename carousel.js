document.addEventListener("DOMContentLoaded", () => {
  const trackContainers = document.querySelectorAll('.carousel-track-container');
  trackContainers.forEach((trackContainer) => {
    trackContainer.setAttribute('tabindex', '0');
    let scrollAmount = Math.round(trackContainer.clientWidth * 0.75);

    const updateScrollAmount = () => {
      scrollAmount = Math.round(trackContainer.clientWidth * 0.75);
    };

    const resizeObserver = new ResizeObserver(updateScrollAmount);
    resizeObserver.observe(trackContainer);

    trackContainer.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        trackContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      if (event.key === 'ArrowLeft') {
        trackContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    });
  });

  const slides = document.querySelectorAll('.carousel-slide');
  slides.forEach(slide => {
    slide.setAttribute('tabindex', '0');
  });
});
