document.addEventListener("DOMContentLoaded", async () => {
  await loadIMBAImages('/api/users/imba-collection', 'submissions');
});

async function loadIMBAImages(apiEndpoint, galleryElementId) {
  const galleryElement = document.getElementById(galleryElementId);
  galleryElement.innerHTML = ''; // Clear the gallery before loading new images

  const response = await fetch(apiEndpoint);
  const result = await response.json();

  if (result.success) {
    // Sort images by createdAt date descending
    result.images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    result.images.forEach(async (image) => {
      const imageElement = document.createElement('div');
      imageElement.className = 'gallery-item';

      const imgLink = document.createElement('a');
      imgLink.href = `/profile/${image.creatorName}`;

      const img = document.createElement('img');
      img.src = image.imageUrl;
      img.alt = image.title;

      imgLink.appendChild(img);

      const infoWrapper = document.createElement('div');
      infoWrapper.className = 'info-wrapper';

      const title = document.createElement('h4');
      title.textContent = image.title;

      const description = document.createElement('p');
      description.textContent = image.description;

      const creatorParagraph = document.createElement('p');
      if (image.creatorName) {
        const creatorLink = document.createElement('a');
        creatorLink.href = `/profile/${image.creatorName}`;
        creatorLink.textContent = image.creatorName;
        creatorParagraph.textContent = 'by ';
        creatorParagraph.appendChild(creatorLink);
      }

      infoWrapper.appendChild(title);

      imageElement.appendChild(imgLink); // Append the image link to the gallery item
      imageElement.appendChild(infoWrapper);

      galleryElement.appendChild(imageElement);
    });
  } else {
    console.error('Failed to load IMBA Collection images');
  }
}