async function loadImages(apiEndpoint, galleryElementId) {
  const galleryElement = document.getElementById(galleryElementId);
  galleryElement.innerHTML = ''; // Clear the gallery before loading new images

  const response = await fetch(apiEndpoint);
  const result = await response.json();

  if (result.success) {
    const profile = JSON.parse(localStorage.getItem('profile'));
    const address = profile ? profile.address : null;

    result.images.forEach(async (image) => {
      const imageElement = document.createElement('div');
      imageElement.className = 'gallery-item';

      const img = document.createElement('img');
      img.src = `/uploads/${image.imagePath}`;
      img.alt = image.title;

      const infoWrapper = document.createElement('div');
      infoWrapper.className = 'info-wrapper';

      const title = document.createElement('h3');
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
      infoWrapper.appendChild(description); // Add description to the infoWrapper
      infoWrapper.appendChild(creatorParagraph);

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

      fetch(`/api/users/votes/${image._id}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            voteCount.textContent = data.votesCount;
            updateProgressBar(image._id, data.votesCount);
          } else {
            voteCount.textContent = '0';
            updateProgressBar(image._id, 0);
          }
        })
        .catch(error => {
          console.error('Error fetching votes:', error);
        });

      voteWrapper.appendChild(voteButton);
      voteWrapper.appendChild(voteCount);

      const progressBarWrapper = document.createElement('div');
      progressBarWrapper.className = 'progress-bar-wrapper';

      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      progressBar.id = `progress-bar-${image._id}`;

      progressBarWrapper.appendChild(progressBar);

      imageElement.appendChild(img);
      imageElement.appendChild(infoWrapper);
      imageElement.appendChild(voteWrapper);
      imageElement.appendChild(progressBarWrapper);

      galleryElement.appendChild(imageElement);
    });
  } else {
    console.error('Failed to load images');
  }
}

async function voteImage(imageId) {
  const profile = JSON.parse(localStorage.getItem('profile'));
  const address = profile.address;
  const response = await fetch('/api/users/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, imageId })
  });

  const result = await response.json();
  if (result.success) {
    const voteCount = document.getElementById(`vote-count-${imageId}`);
    voteCount.textContent = result.votesCount;

    const voteButton = document.querySelector(`button.vote-button[data-id="${imageId}"]`);
    if (voteButton) {
      voteButton.classList.add('active');
    }

    updateProgressBar(imageId, result.votesCount);
  } else {
    alert(result.message);
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

document.addEventListener("DOMContentLoaded", () => {
  const profileLink = document.getElementById('profile-link');
  const profile = JSON.parse(localStorage.getItem('profile'));

  if (profile) {
    profileLink.href = `/profile/${profile.name}`;
  }
});
