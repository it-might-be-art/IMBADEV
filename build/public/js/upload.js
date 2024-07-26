document.addEventListener('DOMContentLoaded', function() {
    const uploadIMBAInput = document.getElementById('uploadIMBA');
    const submitModal = document.getElementById('submitModal');
    const modalImageContainer = document.getElementById('modalImageContainer');
    const imageTitleInput = document.getElementById('imageTitle');
    const imageDescriptionInput = document.getElementById('imageDescription');
    const modalBackButton = document.getElementById('modalBackButton');
    const modalSubmitButton = document.getElementById('modalSubmitButton');
    const walletMessage = document.getElementById('walletMessage');
    const grid = document.getElementById('grid');
    const backgroundColor = '#1a54f4'; // Define your background color here

    uploadIMBAInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imbaString = e.target.result;
                uploadModule.applyIMBAToGrid(imbaString, grid, backgroundColor, true, addRectEventListeners);
                uploadModule.showSubmitModal(grid, backgroundColor);
            };
            reader.readAsText(file);
        }
    });

    modalBackButton.addEventListener('click', () => {
        submitModal.style.display = 'none';
    });

    modalSubmitButton.addEventListener('click', async () => {
  const title = imageTitleInput.value.trim();
  const description = imageDescriptionInput.value.trim();
  if (!title) {
    alert('Please enter a title.');
    return;
  }

  const profile = JSON.parse(localStorage.getItem('profile'));
  if (!profile) {
    walletMessage.style.display = 'block';
    return;
  }

  const imbaString = uploadModule.exportGridToIMBA(grid);
  const pngBlob = await uploadModule.createPngBlob(grid);

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('imba', new Blob([imbaString], { type: 'application/json' }));
  formData.append('image', pngBlob);
  formData.append('address', profile.address);

  try {
    const response = await fetch('/api/users/upload-image', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      alert('Image uploaded successfully.');
      submitModal.style.display = 'none';
      clearCanvas();
    } else {
      alert('Failed to upload image: ' + result.message);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    alert('Error uploading image');
  }
});

    function addRectEventListeners(rect) {
        rect.addEventListener('mousedown', function() {
            isDrawing = true;
            saveState();
            paint(rect);
        });
        rect.addEventListener('mousemove', function() {
            if (isDrawing) {
                paint(rect);
            }
        });
        rect.addEventListener('mouseup', function() {
            if (isDrawing) {
                saveState();
            }
            isDrawing = false;
        });
        rect.addEventListener('mouseleave', function() {
            if (isDrawing) {
                saveState();
            }
            isDrawing = false;
        });
        rect.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });

        rect.addEventListener('touchstart', function(e) {
            e.preventDefault();
            isDrawing = true;
            saveState();
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.tagName === 'rect') {
                paint(element);
            }
        });
        rect.addEventListener('touchmove', function(e) {
            e.preventDefault();
            if (isDrawing) {
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                if (element && element.tagName === 'rect') {
                    paint(element);
                }
            }
        });
        rect.addEventListener('touchend', function(e) {
            e.preventDefault();
            if (isDrawing) {
                saveState();
            }
            isDrawing = false;
        });
        rect.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            if (isDrawing) {
                saveState();
            }
            isDrawing = false;
        });
    }

    function paint(rect) {
        const x = Math.floor(parseFloat(rect.getAttribute('x')) / (100 / gridSize));
        const y = Math.floor(parseFloat(rect.getAttribute('y')) / (100 / gridSize));
        const offset = Math.floor(brushSize / 2);

        for (let i = -offset; i < brushSize - offset; i++) {
            for (let j = -offset; j < brushSize - offset; j++) {
                const newX = x + i;
                const newY = y + j;
                if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
                    const index = newY * gridSize + newX;
                    if (isErasing) {
                        clearColor(grid.children[index]);
                    } else {
                        setColor(grid.children[index], fillColor);
                    }
                }
            }
        }
    }

    function clearColor(rect) {
        if (rect) {
            rect.classList.remove('active');
            rect.style.fill = backgroundColor;
            rect.style.stroke = backgroundColor;
            rect.style.strokeWidth = "0.5";
        }
    }

    function saveState() {
        const currentState = uploadModule.exportGridToIMBA(grid);
        if (currentState !== undoStack[undoStack.length - 1]) {
            undoStack.push(currentState);
            redoStack = [];
        }
    }

    function clearCanvas() {
        initializeGrid(false);
        saveState();
    }
});
