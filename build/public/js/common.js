async function loadImages(apiEndpoint, galleryElementId) {
  const galleryElement = document.getElementById(galleryElementId);
  galleryElement.innerHTML = ''; // Clear the gallery before loading new images

  const response = await fetch(apiEndpoint);
  const result = await response.json();

  if (result.success) {
    const profile = JSON.parse(localStorage.getItem('profile'));
    const address = profile ? profile.address : null;

    // Sort images by createdAt date descending
    result.images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    result.images.forEach(async (image) => {
      const imageElement = document.createElement('div');
      imageElement.className = 'gallery-item';

      const imgLink = document.createElement('a');
      imgLink.href = `/profile/${image.creatorName}`;

      const img = document.createElement('img');
      img.src = image.imageUrl;  // Use the S3 URL
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
      //infoWrapper.appendChild(description); // Add description to the infoWrapper
      //infoWrapper.appendChild(creatorParagraph);

      const voteWrapper = document.createElement('div');
      voteWrapper.className = 'vote-wrapper';

      const voteButton = document.createElement('button');
      voteButton.className = 'vote-button';
      voteButton.setAttribute('data-id', image._id);

      if (address) {
        const hasVotedResponse = await fetch(`/api/users/has-voted?address=${address}&imageId=${image._id}`);
        const hasVotedResult = await hasVotedResponse.json();
        if (hasVotedResult.success && hasVotedResult.hasVoted) {
          voteButton.classList.add('active');
        }
      }

      voteButton.addEventListener('click', () => voteImage(image._id));

      const voteCount = document.createElement('span');
      voteCount.className = 'vote-count';
      voteCount.id = `vote-count-${image._id}`;
      voteCount.textContent = image.votesCount || 0;

      voteWrapper.appendChild(voteButton);
      voteWrapper.appendChild(voteCount);

      const progressBarWrapper = document.createElement('div');
      progressBarWrapper.className = 'progress-bar-wrapper';

      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      progressBar.id = `progress-bar-${image._id}`;

      progressBarWrapper.appendChild(progressBar);

      imageElement.appendChild(imgLink); // Append the image link to the gallery item
      imageElement.appendChild(infoWrapper);
      imageElement.appendChild(voteWrapper);
      //imageElement.appendChild(progressBarWrapper);

      galleryElement.appendChild(imageElement);
    });
  } else {
    console.error('Failed to load images');
  }
}

async function voteImage(imageId) {
  const profile = JSON.parse(localStorage.getItem('profile'));
  if (!profile) {
    showInfoModal('Please log in to vote.', 'error');
    return;
  }
  const address = profile.address;
  const response = await fetch('/api/users/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, imageId })
  });

  if (response.ok) {
    const result = await response.json();
    const voteCount = document.getElementById(`vote-count-${imageId}`);
    voteCount.textContent = result.votesCount;

    const voteButton = document.querySelector(`button.vote-button[data-id="${imageId}"]`);
    if (voteButton) {
      voteButton.classList.add('active');
    }

    updateProgressBar(imageId, result.votesCount);
  } else {
    const result = await response.json();
    showInfoModal(result.message, 'error');
  }
}

function updateProgressBar(imageId, votesCount) {
  const maxVotes = 100;
  const progressBar = document.getElementById(`progress-bar-${imageId}`);
  if (progressBar) {
    const percentage = (votesCount / maxVotes) * 100;
    progressBar.style.width = `${percentage}%`;
  }
}

function showInfoModal(message, type) {
  const infoModal = document.getElementById('infoModal');
  const infoModalMessage = document.getElementById('infoModalMessage');

  infoModalMessage.innerText = message;
  infoModal.className = `info-modal ${type}`;
  infoModal.style.display = 'block';

  setTimeout(() => {
    infoModal.style.display = 'none';
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  const profileLink = document.getElementById('profile-link');
  const profile = JSON.parse(localStorage.getItem('profile'));

  if (profile) {
    profileLink.href = `/profile/${profile.name}`;
    }
});