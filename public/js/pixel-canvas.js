
    document.addEventListener('DOMContentLoaded', function() {
        const svgns = "http://www.w3.org/2000/svg";
        const grid = document.getElementById('grid');
        const toggleGridButton = document.getElementById('toggleGridButton');
        const uploadIMBAInput = document.getElementById('uploadIMBA');
        const undoButton = document.getElementById('undoButton');
        const redoButton = document.getElementById('redoButton');
        const clearCanvasButton = document.getElementById('clearCanvasButton');
        const eyeDropperButton = document.getElementById('eyeDropperButton');
        const drawModeButton = document.getElementById('drawModeButton');
        const eraseModeButton = document.getElementById('eraseModeButton');
        const gridSizeSelector = document.getElementById('gridSizeSelector');
        let showGrid = true;
        let fillColor = '#000000';
        let backgroundColor = '#1a54f4';
        let isDrawing = false;
        let brushSize = 1;
        let isErasing = false;
        let undoStack = [];
        let redoStack = [];
        let gridSize = 32;


// Variables for modal elements
    const submitButton = document.getElementById('submitButton');
    const submitModal = document.getElementById('submitModal');
    const modalImageContainer = document.getElementById('modalImageContainer');
    const imageTitleInput = document.getElementById('imageTitle');
    const modalBackButton = document.getElementById('modalBackButton');
    const modalSubmitButton = document.getElementById('modalSubmitButton');
    const walletMessage = document.getElementById('walletMessage');

    submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        const profile = JSON.parse(localStorage.getItem('profile'));

        if (!profile) {
            walletMessage.style.display = 'block';
        } else {
            walletMessage.style.display = 'none';
            const svgClone = grid.cloneNode(true);
            modalImageContainer.innerHTML = '';
            modalImageContainer.appendChild(svgClone);
            submitModal.style.display = 'block';
        }
    });

    modalBackButton.addEventListener('click', () => {
        submitModal.style.display = 'none';
    });

    modalSubmitButton.addEventListener('click', async () => {
        const title = imageTitleInput.value.trim();
        if (!title) {
            alert('Please enter a title.');
            return;
        }

        const profile = JSON.parse(localStorage.getItem('profile'));
        if (!profile) {
            walletMessage.style.display = 'block';
            return;
        }

        const imbaString = exportGridToIMBA();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('image', new Blob([imbaString], { type: 'application/json' }));
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

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target == submitModal) {
            submitModal.style.display = 'none';
        }
    });



        const predefinedSwatches = [
            '#FF0000', '#FF6600', '#FFCC00', '#FFFF00', '#CCFF00', '#99FF33',
            '#66FF66', '#33FF99', '#00FF00', '#00FF66', '#00FFCC', '#00FFFF',
            '#00CCFF', '#0099FF', '#0066FF', '#1954f4', '#0000FF', '#6600FF',
            '#9900FF', '#FF00FF', '#FF0099', '#FFFFFF', '#CCCCCC', '#000000'
        ];

        const colorPicker = Pickr.create({
            el: '#colorPickerContainer',
            theme: 'nano',
            default: fillColor,
            swatches: predefinedSwatches,
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    input: true,
                    clear: true
                }
            }
        });

        const backgroundColorPicker = Pickr.create({
            el: '#backgroundColorPickerContainer',
            theme: 'nano',
            default: backgroundColor,
            swatches: predefinedSwatches,
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    input: true,
                    clear: true
                }
            }
        });

        colorPicker.on('change', (color) => {
            fillColor = color.toHEXA().toString();
            colorPicker.applyColor();
        });

        backgroundColorPicker.on('change', (color) => {
            backgroundColor = color.toHEXA().toString();
            grid.querySelectorAll('rect:not(.active)').forEach(rect => {
                rect.style.fill = backgroundColor;
                rect.style.stroke = backgroundColor;
            });
            toggleGridLines(grid, showGrid);
            backgroundColorPicker.applyColor();
        });

        if (window.EyeDropper) {
            eyeDropperButton.style.display = 'block';
            eyeDropperButton.addEventListener('click', () => {
                const eyeDropper = new EyeDropper();
                eyeDropper.open().then(result => {
                    fillColor = result.sRGBHex;
                    colorPicker.setColor(fillColor, true);
                }).catch(e => {
                    console.error(e);
                });
            });
        } else {
            eyeDropperButton.style.display = 'none';
            console.warn('Your browser does not support the EyeDropper API');
        }

        const predefinedPixels = [
            { x: 23, y: 19, color: '#000000' }
        ];

        function setColor(rect, color) {
            if (rect) {
                rect.classList.add('active');
                rect.style.fill = color;
                rect.style.stroke = color;
                rect.style.strokeWidth = "0.1";
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

        function initializeGrid(setPredefined = true) {
            grid.innerHTML = '';
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    const rect = document.createElementNS(svgns, 'rect');
                    rect.setAttribute('x', `${(j / gridSize) * 100}%`);
                    rect.setAttribute('y', `${(i / gridSize) * 100}%`);
                    rect.setAttribute('width', `${100 / gridSize}%`);
                    rect.setAttribute('height', `${100 / gridSize}%`);
                    rect.style.fill = backgroundColor;
                    rect.style.stroke = '#cccccc';
                    rect.style.strokeWidth = "0.5";

                    addRectEventListeners(rect);

                    grid.appendChild(rect);
                }
            }
            if (setPredefined) {
                predefinedPixels.forEach(pixel => {
                    const rectIndex = pixel.y * gridSize + pixel.x;
                    if (rectIndex < grid.children.length) {
                        const rect = grid.children[rectIndex];
                        setColor(rect, pixel.color);
                    }
                });
            }

            saveInitialState();
        }

        function saveInitialState() {
            if (undoStack.length === 0) {
                undoStack.push(exportGridToIMBA());
            }
        }

        function saveState() {
            const currentState = exportGridToIMBA();
            if (currentState !== undoStack[undoStack.length - 1]) {
                undoStack.push(currentState);
                redoStack = [];
            }
        }

        function undo() {
            if (undoStack.length > 1) {
                redoStack.push(undoStack.pop());
                const previousState = undoStack[undoStack.length - 1];
                applyIMBAToGrid(previousState);
            }
        }

        function redo() {
            if (redoStack.length > 0) {
                const nextState = redoStack.pop();
                undoStack.push(nextState);
                applyIMBAToGrid(nextState);
            }
        }

        function clearCanvas() {
            initializeGrid(false);
            saveState();
        }

        function applyIMBAToGrid(imbaString) {
            const data = JSON.parse(imbaString);
            grid.innerHTML = '';
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    const rect = document.createElementNS(svgns, 'rect');
                    rect.setAttribute('x', `${(j / gridSize) * 100}%`);
                    rect.setAttribute('y', `${(i / gridSize) * 100}%`);
                    rect.setAttribute('width', `${100 / gridSize}%`);
                    rect.setAttribute('height', `${100 / gridSize}%`);
                    rect.style.fill = backgroundColor;
                    rect.style.stroke = '#cccccc';
                    rect.style.strokeWidth = "0.5";

                    addRectEventListeners(rect);

                    grid.appendChild(rect);
                }
            }

            data.forEach((item) => {
                const { x, y, color } = item;
                if (x < gridSize && y < gridSize) {
                    const rectIndex = y * gridSize + x;
                    if (rectIndex < grid.children.length) {
                        const rect = grid.children[rectIndex];
                        setColor(rect, color);
                    }
                }
            });

            toggleGridLines(grid, showGrid);
        }

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

        function exportGridToIMBA() {
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

        function downloadSVG(svg, filename) {
            toggleGridLines(svg, false);
            const serializer = new XMLSerializer();
            const source = serializer.serializeToString(svg);
            const rectElements = svg.querySelectorAll("rect");
            rectElements.forEach((rect) => {
                rect.setAttribute("fill", rect.style.fill);
            });
            const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
            toggleGridLines(svg, true);
        }

        function downloadPNG(svg, filename) {
            toggleGridLines(svg, false);
            const originalWidth = 640;
            const originalHeight = 640;
            const newWidth = 1280;
            const newHeight = 1280;

            const serializedSvg = new XMLSerializer().serializeToString(svg);
            const base64Data = btoa(unescape(encodeURIComponent(serializedSvg)));
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, newWidth, newHeight);

                ctx.drawImage(img, 0, 0, originalWidth, originalHeight, 0, 0, newWidth, newHeight);

                canvas.toBlob(function(blob) {
                    const pngUrl = URL.createObjectURL(blob);
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = filename;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(pngUrl);
                }, 'image/png');
            };
            img.src = 'data:image/svg+xml;base64,' + base64Data;
            toggleGridLines(svg, true);
        }

        function downloadIMBA(filename) {
            const imbaString = exportGridToIMBA();
            const imbaBlob = new Blob([imbaString], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(imbaBlob);

            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        }

        function toggleGridLines(svg, show) {
            const rectElements = svg.querySelectorAll("rect");
            rectElements.forEach((rect) => {
                if (show) {
                    rect.style.stroke = '#cccccc';
                    rect.style.strokeWidth = "0.5";
                } else {
                    rect.style.stroke = rect.style.fill;
                    rect.style.strokeWidth = "0";
                }
            });
        }

        document.addEventListener('mouseup', function() {
            if (isDrawing) {
                saveState();
            }
            isDrawing = false;
        });

        document.addEventListener('mouseleave', function() {
            if (isDrawing) {
                saveState();
            }
            isDrawing = false;
        });

        document.addEventListener('touchend', function() {
            if (isDrawing) {
                saveState();
            }
            isDrawing = false;
        });

        document.addEventListener('touchcancel', function() {
            if (isDrawing) {
                saveState();
            }
            isDrawing = false;
        });

        document.querySelectorAll('.brush-size-button').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.brush-size-button').forEach(btn => btn.classList.remove('active'));
                brushSize = parseInt(e.target.getAttribute('data-size'));
                e.target.classList.add('active');
                updateCursor();
            });
        });

        drawModeButton.addEventListener('click', () => {
            isErasing = false;
            drawModeButton.classList.add('active');
            eraseModeButton.classList.remove('active');
            updateCursor();
        });

        eraseModeButton.addEventListener('click', () => {
            isErasing = true;
            eraseModeButton.classList.add('active');
            drawModeButton.classList.remove('active');
            updateCursor();
        });

        function createCursor(size) {
            const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
                    <rect width="${size}" height="${size}" fill="none" stroke="#000" stroke-width="3" style="mix-blend-mode: difference;"/>
                </svg>
            `;
            return `data:image/svg+xml;base64,${btoa(svg)}`;
        }

        function updateCursor() {
            const gridRect = grid.getBoundingClientRect();
            const cursorSize = brushSize * (gridRect.width / gridSize);
            const offset = cursorSize / 2;
            grid.style.cursor = `url(${createCursor(cursorSize)}) ${offset} ${offset}, auto`;
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'd') {
                isErasing = false;
                drawModeButton.classList.add('active');
                eraseModeButton.classList.remove('active');
                updateCursor();
            } else if (e.key === 'e') {
                isErasing = true;
                eraseModeButton.classList.add('active');
                drawModeButton.classList.remove('active');
                updateCursor();
            } else if (e.key === 'ArrowRight') {
                const nextBrushSize = Math.min(brushSize * 2, 4);
                changeBrushSize(nextBrushSize);
            } else if (e.key === 'ArrowLeft') {
                const nextBrushSize = Math.max(brushSize / 2, 1);
                changeBrushSize(nextBrushSize);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        });

        gridSizeSelector.addEventListener('change', (e) => {
            gridSize = parseInt(e.target.value);
            initializeGrid();
            updateCursor();
        });

        function changeBrushSize(size) {
            document.querySelectorAll('.brush-size-button').forEach(btn => btn.classList.remove('active'));
            brushSize = size;
            document.querySelector(`.brush-size-button[data-size="${brushSize}"]`).classList.add('active');
            updateCursor();
        }

        initializeGrid();
        updateCursor();

        document.getElementById('downloadSVG').addEventListener('click', () => {
            downloadSVG(grid, 'itmightbeart.svg');
        });

        document.getElementById('downloadPNG').addEventListener('click', () => {
            downloadPNG(grid, 'itmightbeart.png');
        });

        document.getElementById('downloadIMBA').addEventListener('click', () => {
            downloadIMBA('myGrid.imba');
        });

        toggleGridButton.addEventListener('click', () => {
            showGrid = !showGrid;
            toggleGridLines(grid, showGrid);
            toggleGridButton.textContent = showGrid ? 'Hide Grid' : 'Show Grid';
        });

        uploadIMBAInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imbaString = e.target.result;
                    applyIMBAToGrid(imbaString);
                };
                reader.readAsText(file);
            }
        });

        undoButton.addEventListener('click', undo);
        redoButton.addEventListener('click', redo);
        clearCanvasButton.addEventListener('click', clearCanvas);
    });
