document.addEventListener('DOMContentLoaded', function() {
    const submitModal = document.getElementById('submitModal');
    const modalImageContainer = document.getElementById('modalImageContainer');
    const imageTitleInput = document.getElementById('imageTitle');
    const imageDescriptionInput = document.getElementById('imageDescription');
    const modalBackButton = document.getElementById('modalBackButton');
    const modalSubmitButton = document.getElementById('modalSubmitButton');
    const walletMessage = document.getElementById('walletMessage');
    const grid = document.getElementById('grid');
    const gridSizeSelector = document.getElementById('gridSizeSelector');
    let backgroundColor = '#1a54f4';

    modalBackButton.addEventListener('click', () => {
        submitModal.style.display = 'none';
    });

    modalSubmitButton.addEventListener('click', async () => {
        const title = imageTitleInput.value.trim();
        const description = imageDescriptionInput.value.trim();
        if (!title) {
            window.uploadModule.showInfoModal('Please enter a title.', 'error');
            return;
        }

        const profile = JSON.parse(localStorage.getItem('profile'));
        if (!profile) {
            walletMessage.style.display = 'block';
            window.uploadModule.showInfoModal('Please connect your wallet to submit.', 'error');
            return;
        }

        const gridSize = parseInt(gridSizeSelector.value);

        window.uploadModule.toggleGridLines(grid, false);
        const imbaString = window.uploadModule.exportGridToIMBA(grid, gridSize, backgroundColor);
        const pngBlob = await window.uploadModule.createPngBlob(grid, backgroundColor);
        window.uploadModule.toggleGridLines(grid, true);

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
                window.uploadModule.showInfoModal('Image uploaded successfully.', 'success');
                submitModal.style.display = 'none';
            } else {
                window.uploadModule.showInfoModal('Failed to upload image: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            window.uploadModule.showInfoModal('Error uploading image', 'error');
        }
    });

    async function createPngBlob(svg, backgroundColor) {
        const originalWidth = 640;
        const originalHeight = 640;
        const newWidth = 1280;
        const newHeight = 1280;

        const serializedSvg = new XMLSerializer().serializeToString(svg);
        const base64Data = btoa(unescape(encodeURIComponent(serializedSvg)));
        const img = new Image();
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');

        return new Promise((resolve, reject) => {
            img.onload = function() {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, newWidth, newHeight);
                ctx.drawImage(img, 0, 0, originalWidth, originalHeight, 0, 0, newWidth, newHeight);
                canvas.toBlob(function(blob) {
                    resolve(blob);
                }, 'image/png');
            };
            img.src = 'data:image/svg+xml;base64,' + base64Data;
        });
    }

    function toggleGridLines(svg, show) {
        const rectElements = svg.querySelectorAll("rect");
        rectElements.forEach((rect) => {
            if (show) {
                rect.style.stroke = '#cccccc';
                rect.style.strokeWidth = "0.5";
            } else {
                rect.style.stroke = 'none';
            }
        });
    }

    function exportGridToIMBA(grid, gridSize, backgroundColor) {
        const data = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const rectIndex = i * gridSize + j;
                const rect = grid.children[rectIndex];
                const color = rect.style.fill;
                if (color !== backgroundColor) {
                    data.push({ x: j, y: i, color });
                }
            }
        }
        return JSON.stringify(data, null, 2);
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

    window.uploadModule = {
        showSubmitModal: function(grid, gridSize, backgroundColor) {
            const svgClone = grid.cloneNode(true);
            modalImageContainer.innerHTML = '';
            modalImageContainer.appendChild(svgClone);
            toggleGridLines(svgClone, false);
            createPngBlob(svgClone, backgroundColor).then((blob) => {
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.src = url;
                modalImageContainer.innerHTML = '';
                modalImageContainer.appendChild(img);
            });
            submitModal.style.display = 'block';
        },
        createPngBlob,
        exportGridToIMBA,
        toggleGridLines,
        showInfoModal
    };
});
