document.addEventListener("DOMContentLoaded", () => {
  async function loadProfile() {
    try {
      const profile = JSON.parse(localStorage.getItem('profile'));
      const username = window.location.pathname.split('/').pop();

      const response = await fetch(`/api/users/profile-data/${username}`);
      const result = await response.json();

      if (result.success) {
        const walletAddressElement = document.getElementById('wallet-address');
        const displayNameElement = document.getElementById('display-name');
        const displayBioElement = document.getElementById('display-bio');
        const profilePictureDisplayElement = document.getElementById('profile-picture-display');
        const voteCountElement = document.getElementById('vote-count');

        if (walletAddressElement) walletAddressElement.textContent = result.user.address;
        if (displayNameElement) displayNameElement.textContent = result.user.name;
        if (displayBioElement) displayBioElement.textContent = result.user.bio;
        if (profilePictureDisplayElement) profilePictureDisplayElement.src = result.user.profilePicture
          ? `/uploads/${result.user.profilePicture}`
          : '/images/default-profile-picture.png';
        if (voteCountElement) voteCountElement.textContent = result.user.votes || 0;

        const profileForm = document.getElementById('profile-form');
        const uploadForm = document.getElementById('upload-form');

        if (!result.isOwner) {
          if (profileForm) profileForm.style.display = 'none';
          if (uploadForm) uploadForm.style.display = 'none';
        } else {
          if (profileForm) profileForm.style.display = 'block';
          if (uploadForm) uploadForm.style.display = 'block';
        }

        // Populate social media fields
        if (result.user.social) {
          const xUsernameInput = document.getElementById('xUsername');
          const warpcastUsernameInput = document.getElementById('warpcastUsername');
          const lensUsernameInput = document.getElementById('lensUsername');
          const instagramUsernameInput = document.getElementById('instagramUsername');

          if (xUsernameInput) xUsernameInput.value = result.user.social.x || '';
          if (warpcastUsernameInput) warpcastUsernameInput.value = result.user.social.warpcast || '';
          if (lensUsernameInput) lensUsernameInput.value = result.user.social.lens || '';
          if (instagramUsernameInput) instagramUsernameInput.value = result.user.social.instagram || '';
        }

        // Benutzerbilder laden
        const galleryElement = document.getElementById('uploaded-images');
        if (galleryElement) {
          galleryElement.innerHTML = '';

          // Sort images by createdAt date descending
          result.images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          result.images.forEach(image => {
            const imageElement = document.createElement('div');
            imageElement.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = `/uploads/${image.imagePath}`;
            img.alt = image.title;

            const infoWrapper = document.createElement('div');
            infoWrapper.className = 'info-wrapper';

            const title = document.createElement('h4');
            title.textContent = image.title;

            const description = document.createElement('p');
            description.textContent = image.description;

            const creator = document.createElement('p');
            creator.innerHTML = `by <a href="/profile/${image.creatorName}">${image.creatorName}</a>`;

            infoWrapper.appendChild(title);
            infoWrapper.appendChild(description);

            const voteWrapper = document.createElement('div');
            voteWrapper.className = 'vote-wrapper';

            const voteButton = document.createElement('button');
            voteButton.className = 'vote-button';
            voteButton.setAttribute('data-id', image._id);

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

            imageElement.appendChild(img);
            imageElement.appendChild(infoWrapper);
            imageElement.appendChild(voteWrapper);

            if (result.isOwner) {
              const deleteButton = document.createElement('button');
              deleteButton.className = 'delete-button';
              deleteButton.textContent = 'Delete';
              deleteButton.addEventListener('click', async () => {
                await deleteImage(image._id);
              });
              imageElement.appendChild(deleteButton);
            }

            galleryElement.appendChild(imageElement);
          });
        }
      } else {
        console.error('Failed to load user profile');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }

  async function deleteImage(imageId) {
    const profile = JSON.parse(localStorage.getItem('profile'));
    const address = profile ? profile.address : null;

    if (!address) {
      showInfoModal('No address found in localStorage', 'error');
      return;
    }

    try {
      const response = await fetch('/api/users/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, imageId }),
      });

      const result = await response.json();

      if (result.success) {
        showInfoModal('Image deleted successfully', 'success');
        loadProfile();
      } else {
        showInfoModal(result.message, 'error');
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      showInfoModal('Failed to delete image', 'error');
    }
  }

  function showInfoModal(message, type) {
    const infoModal = document.getElementById('infoModal');
    const infoModalMessage = document.getElementById('infoModalMessage');

    infoModal.classList.add(type);
    infoModalMessage.textContent = message;
    infoModal.style.display = 'block';

    setTimeout(() => {
      infoModal.style.display = 'none';
      infoModal.classList.remove(type);
    }, 3000);
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
        loadProfile();
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
});
