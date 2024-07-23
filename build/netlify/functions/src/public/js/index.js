document.addEventListener('DOMContentLoaded', async () => {
  const teaserContainer = document.getElementById('image-teaser');

  async function loadRandomImages(count = 8) {
    try {
      const response = await fetch(`/api/users/random-images?count=${count}`);
      const result = await response.json();

      if (result.success) {
        result.images.forEach(image => {
          const imageElement = document.createElement('div');
          imageElement.className = 'teaser-item';

          const img = document.createElement('img');
          img.src = `/uploads/${image.imagePath}`;
          img.alt = image.title;

          imageElement.appendChild(img);
          teaserContainer.appendChild(imageElement);
        });
      } else {
        console.error('Failed to load random images');
      }
    } catch (error) {
      console.error('Error fetching random images:', error);
    }
  }

  

  loadRandomImages();
});
