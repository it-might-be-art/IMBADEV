document.addEventListener("DOMContentLoaded", () => {
  async function loadProfile() {
    try {
      const profile = JSON.parse(localStorage.getItem('profile'));
      const username = window.location.pathname.split('/').pop();

      const response = await fetch(`/api/users/profile?username=${username}`);
      const result = await response.json();

      if (result.success) {
        document.getElementById('wallet-address').textContent = result.user.address;
        document.getElementById('display-name').textContent = result.user.name;
        document.getElementById('display-bio').textContent = result.user.bio;
        document.getElementById('profile-picture-display').src = result.user.profilePicture
          ? `/uploads/${result.user.profilePicture}`
          : '/images/default-profile-picture.png';
        document.getElementById('vote-count').textContent = result.user.votes || 0;

        const profileForm = document.getElementById('profile-form');
        const uploadForm = document.getElementById('upload-form');

        if (!profile || profile.address !== result.user.address) {
          if (profileForm) profileForm.style.display = 'none';
          if (uploadForm) uploadForm.style.display = 'none';
        } else {
          if (profileForm) profileForm.style.display = 'block';
          if (uploadForm) uploadForm.style.display = 'block';
        }
      } else {
        console.error('Failed to load user profile');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }

  async function loadUploadedImages() {
    try {
      const username = window.location.pathname.split('/').pop();

      const response = await fetch(`/api/users/images?username=${username}`);
      const result = await response.json();

      if (result.success) {
        const galleryElement = document.getElementById('uploaded-images');
        galleryElement.innerHTML = '';

        result.images.forEach(image => {
          const imageElement = document.createElement('div');
          imageElement.className = 'gallery-item';

          const img = document.createElement('img');
          img.src = `/uploads/${image.imagePath}`;
          img.alt = image.title;

          const infoWrapper = document.createElement('div');
          infoWrapper.className = 'info-wrapper';

          const title = document.createElement('h3');
          title.textContent = image.title;

          const creator = document.createElement('p');
          creator.innerHTML = `by <a href="/profile/${image.creatorName}">${image.creatorName}</a>`;

          infoWrapper.appendChild(title);
          infoWrapper.appendChild(creator);

          const voteWrapper = document.createElement('div');
          voteWrapper.className = 'vote-wrapper';

          const voteButton = document.createElement('button');
          voteButton.className = 'vote-button';
          voteButton.setAttribute('data-id', image._id);

          const voteCount = document.createElement('span');
          voteCount.className = 'vote-count';
          voteCount.id = `vote-count-${image._id}`;

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
        console.error('Failed to load user images');
      }
    } catch (error) {
      console.error('Failed to fetch user images:', error);
    }
  }

  async function submitProfileForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const profile = JSON.parse(localStorage.getItem('profile'));
    const address = profile ? profile.address : null;

    if (!address) {
      alert('No address found in localStorage');
      return;
    }

    try {
      const response = await fetch(`/api/users/update-profile?address=${address}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        loadProfile();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  }

  async function submitUploadForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const profile = JSON.parse(localStorage.getItem('profile'));
    const address = profile ? profile.address : null;

    if (!address) {
      alert('No address found in localStorage');
      return;
    }

    formData.append('address', address);

    try {
      const response = await fetch('/api/users/upload-image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        loadUploadedImages();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    }
  }

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', submitProfileForm);
  }

  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', submitUploadForm);
  }

  loadProfile();
  loadUploadedImages();
});
