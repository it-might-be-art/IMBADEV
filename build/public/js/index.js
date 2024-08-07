document.addEventListener('DOMContentLoaded', async () => {
  const teaserContainer = document.getElementById('image-teaser');

  async function loadRandomImages(count = 10) {
    try {
      const response = await fetch(`/api/users/random-images?count=${count}`);
      const result = await response.json();

      if (result.success) {
        result.images.forEach(image => {
          const imageElement = document.createElement('div');
          imageElement.className = 'teaser-item';

          const imgLink = document.createElement('a');
          imgLink.href = `/profile/${image.creatorName}`;

          const img = document.createElement('img');
          img.src = image.imagePath; // Using the S3 URL directly
          img.alt = image.title;

          imgLink.appendChild(img);
          imageElement.appendChild(imgLink);
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
