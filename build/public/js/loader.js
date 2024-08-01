document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById('loader');
  const content = document.getElementById('content');

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('fade-out');
      content.classList.add('visible');

      setTimeout(() => {
        loader.style.display = 'none';
      }, 1500); // Dauer des Fade-Out-Effekts sollte mit der CSS-Animation übereinstimmen
    }, 500); // Verzögerung vor dem Einblenden des Inhalts
  });
});