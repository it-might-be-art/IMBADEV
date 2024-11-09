document.addEventListener('DOMContentLoaded', function() {
    const svgns = "http://www.w3.org/2000/svg";
    const grid = document.getElementById('grid');
    const toggleGridButton = document.getElementById('toggleGridButton');
    const uploadIMBAInput = document.getElementById('uploadIMBA');
    const uploadArea = document.getElementById('upload-area');
    const undoButton = document.getElementById('undoButton');
    const redoButton = document.getElementById('redoButton');
    const clearCanvasButton = document.getElementById('clearCanvasButton');
    const eyeDropperButton = document.getElementById('eyeDropperButton');
    const drawModeButton = document.getElementById('drawModeButton');
    const eraseModeButton = document.getElementById('eraseModeButton');
    const gridSizeSelector = document.getElementById('gridSizeSelector');
    const submitButton = document.getElementById('submitButton');
    const walletMessage = document.getElementById('walletMessage');

    let showGrid = true;
    let fillColor = '#000000';
    let backgroundColor = '#d9d9d9';
    let isDrawing = false;
    let brushSize = 1;
    let isErasing = false;
    let undoStack = [];
    let redoStack = [];
    let gridSize = 32;

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

    submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        const profile = JSON.parse(localStorage.getItem('profile'));

        if (!profile) {
            showInfoModal('Please log in to submit your artwork.', 'error');
        } else {
            walletMessage.style.display = 'none';
            window.uploadModule.showSubmitModal(grid, gridSize, backgroundColor);
        }
    });

    const predefinedSwatches = [
        '#D41515', '#EB4429', '#EA3A2D', '#FA5B67', '#E84AA9', '#6C31D7', '#4A2387', '#3D43B3', '#2480BD', '#4291A8', '#81D1EC', '#9AD9FB', '#77D3DE', '#3EB8A1', '#5FCD8C', '#63C23C', '#A7CA45', '#B5F13B', '#F9DA4A', '#F9A45C', '#EF8C37', '#F2A93C', '#E8424E', '#FA5B67'
    ];

    const colorPicker = Pickr.create({
        el: '#colorPickerContainer',
        theme: 'nano',
        default: fillColor,
        swatches: predefinedSwatches,
        components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
                hex: true,
                rgba: false,
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
            opacity: false,
            hue: true,
            interaction: {
                hex: true,
                rgba: false,
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
        window.uploadModule.toggleGridLines(grid, showGrid);
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

    //const predefinedPixels = [
        //{ x: 23, y: 19, color: '#000000' }
    //];
    
    const predefinedPixels30x30 = [
        { x: 11, y: 23, color: '#ECC189' },
        { x: 12, y: 23, color: '#ECC189' },
        { x: 16, y: 23, color: '#ECC189' },
        { x: 17, y: 23, color: '#ECC189' },

        { x: 11, y: 22, color: '#ECC189' },
        { x: 12, y: 22, color: '#ECC189' },
        { x: 13, y: 22, color: '#ECC189' },
        
        { x: 15, y: 22, color: '#ECC189' },
        { x: 16, y: 22, color: '#ECC189' },
        { x: 17, y: 22, color: '#ECC189' },

        { x: 11, y: 21, color: '#ECC189' },
        { x: 12, y: 21, color: '#ECC189' },
        { x: 13, y: 21, color: '#ECC189' },
        { x: 14, y: 21, color: '#ECC189' },        
        { x: 15, y: 21, color: '#ECC189' },
        { x: 16, y: 21, color: '#ECC189' },
        { x: 17, y: 21, color: '#ECC189' },


        { x: 9, y: 20, color: '#ECC189' },
        { x: 10, y: 20, color: '#DBB077' },
        { x: 11, y: 20, color: '#ECC189' },
        { x: 12, y: 20, color: '#ECC189' },
        { x: 13, y: 20, color: '#ECC189' },
        { x: 14, y: 20, color: '#ECC189' },        
        { x: 15, y: 20, color: '#ECC189' },
        { x: 16, y: 20, color: '#ECC189' },
        { x: 17, y: 20, color: '#ECC189' },
        { x: 18, y: 20, color: '#DBB077' },
        { x: 19, y: 20, color: '#ECC189' },

        { x: 9, y: 19, color: '#ECC189' },
        { x: 10, y: 19, color: '#DBB077' },
        { x: 11, y: 19, color: '#ECC189' },
        { x: 12, y: 19, color: '#ECC189' },
        { x: 13, y: 19, color: '#ECC189' },
        { x: 14, y: 19, color: '#ECC189' },        
        { x: 15, y: 19, color: '#ECC189' },
        { x: 16, y: 19, color: '#ECC189' },
        { x: 17, y: 19, color: '#ECC189' },
        { x: 18, y: 19, color: '#DBB077' },
        { x: 19, y: 19, color: '#ECC189' },

        { x: 9, y: 18, color: '#ECC189' },
        { x: 10, y: 18, color: '#ECC189' },
        { x: 11, y: 18, color: '#ECC189' },
        { x: 12, y: 18, color: '#DBB077' },
        { x: 13, y: 18, color: '#ECC189' },
        { x: 14, y: 18, color: '#ECC189' },        
        { x: 15, y: 18, color: '#ECC189' },
        { x: 16, y: 18, color: '#DBB077' },
        { x: 17, y: 18, color: '#ECC189' },
        { x: 18, y: 18, color: '#ECC189' },
        { x: 19, y: 18, color: '#ECC189' },

        { x: 10, y: 17, color: '#ECC189' },
        { x: 11, y: 17, color: '#ECC189' },
        { x: 12, y: 17, color: '#ECC189' },
        { x: 13, y: 17, color: '#ECC189' },
        { x: 14, y: 17, color: '#ECC189' },        
        { x: 15, y: 17, color: '#ECC189' },
        { x: 16, y: 17, color: '#ECC189' },
        { x: 17, y: 17, color: '#ECC189' },
        { x: 18, y: 17, color: '#ECC189' },
,
        { x: 11, y: 16, color: '#DBB077' },
        { x: 12, y: 16, color: '#DBB077' },
        { x: 13, y: 16, color: '#DBB077' },
        { x: 14, y: 16, color: '#DBB077' },        
        { x: 15, y: 16, color: '#DBB077' },
        { x: 16, y: 16, color: '#DBB077' },
        { x: 17, y: 16, color: '#DBB077' },

        { x: 11, y: 15, color: '#ECC189' },
        { x: 12, y: 15, color: '#ECC189' },
        { x: 13, y: 15, color: '#ECC189' },
        { x: 14, y: 15, color: '#ECC189' },        
        { x: 15, y: 15, color: '#ECC189' },
        { x: 16, y: 15, color: '#ECC189' },
        { x: 17, y: 15, color: '#ECC189' },
        { x: 18, y: 15, color: '#ECC189' },

        { x: 10, y: 14, color: '#ECC189' },
        { x: 11, y: 14, color: '#ECC189' },
        { x: 12, y: 14, color: '#ECC189' },
        { x: 13, y: 14, color: '#ECC189' },
        { x: 14, y: 14, color: '#ECC189' },        
        { x: 15, y: 14, color: '#ECC189' },
        { x: 16, y: 14, color: '#ECC189' },
        { x: 17, y: 14, color: '#ECC189' },
        { x: 18, y: 14, color: '#ECC189' },
        { x: 19, y: 14, color: '#ECC189' },

        { x: 9, y: 13, color: '#DBB077' },
        { x: 10, y: 13, color: '#ECC189' },
        { x: 11, y: 13, color: '#ECC189' },
        { x: 12, y: 13, color: '#ffffff' },
        { x: 13, y: 13, color: '#000000' },
        { x: 14, y: 13, color: '#DBB077' },        
        { x: 15, y: 13, color: '#DBB077' },
        { x: 16, y: 13, color: '#DBB077' },
        { x: 17, y: 13, color: '#ffffff' },
        { x: 18, y: 13, color: '#000000' },
        { x: 19, y: 13, color: '#ECC189' },

        { x: 9, y: 12, color: '#DBB077' },
        { x: 10, y: 12, color: '#ECC189' },
        { x: 11, y: 12, color: '#ECC189' },
        { x: 12, y: 12, color: '#ffffff' },
        { x: 13, y: 12, color: '#000000' },
        { x: 14, y: 12, color: '#ECC189' },        
        { x: 15, y: 12, color: '#ECC189' },
        { x: 16, y: 12, color: '#ECC189' },
        { x: 17, y: 12, color: '#ffffff' },
        { x: 18, y: 12, color: '#000000' },
        { x: 19, y: 12, color: '#ECC189' },

        { x: 10, y: 11, color: '#ECC189' },
        { x: 11, y: 11, color: '#ECC189' },
        { x: 12, y: 11, color: '#ECC189' },
        { x: 13, y: 11, color: '#ECC189' },
        { x: 14, y: 11, color: '#ECC189' },        
        { x: 15, y: 11, color: '#ECC189' },
        { x: 16, y: 11, color: '#ECC189' },
        { x: 17, y: 11, color: '#ECC189' },
        { x: 18, y: 11, color: '#ECC189' },
        { x: 19, y: 11, color: '#ECC189' },

        { x: 10, y: 10, color: '#ECC189' },
        { x: 11, y: 10, color: '#ECC189' },
        { x: 12, y: 10, color: '#ECC189' },
        { x: 13, y: 10, color: '#ECC189' },
        { x: 14, y: 10, color: '#ECC189' },        
        { x: 15, y: 10, color: '#ECC189' },
        { x: 16, y: 10, color: '#ECC189' },
        { x: 17, y: 10, color: '#ECC189' },
        { x: 18, y: 10, color: '#ECC189' },
        { x: 19, y: 10, color: '#ECC189' },

        { x: 11, y: 9, color: '#ECC189' },
        { x: 12, y: 9, color: '#ECC189' },
        { x: 13, y: 9, color: '#ECC189' },
        { x: 14, y: 9, color: '#ECC189' },        
        { x: 15, y: 9, color: '#ECC189' },
        { x: 16, y: 9, color: '#ECC189' },
        { x: 17, y: 9, color: '#ECC189' },
        { x: 18, y: 9, color: '#ECC189' },
        

    ];

    const predefinedPixels32x32 = [
        { x: 8, y: 23, color: '#000000' }, { x: 7, y: 22, color: '#000000' }, { x: 7, y: 21, color: '#000000' },
        { x: 7, y: 20, color: '#000000' }, { x: 7, y: 19, color: '#000000' }, { x: 6, y: 19, color: '#000000' },
        { x: 5, y: 18, color: '#000000' }, { x: 5, y: 17, color: '#000000' }, { x: 5, y: 16, color: '#000000' },
        { x: 5, y: 15, color: '#000000' }, { x: 5, y: 14, color: '#000000' }, { x: 5, y: 13, color: '#000000' },
        { x: 6, y: 12, color: '#000000' }, { x: 7, y: 12, color: '#000000' }, { x: 7, y: 11, color: '#000000' },
        { x: 7, y: 10, color: '#000000' }, { x: 7, y: 9, color: '#000000' }, { x: 8, y: 8, color: '#000000' },
        { x: 9, y: 7, color: '#000000' }, { x: 10, y: 7, color: '#000000' }, { x: 11, y: 7, color: '#000000' },
        { x: 12, y: 7, color: '#000000' }, { x: 13, y: 7, color: '#000000' }, { x: 14, y: 7, color: '#000000' },
        { x: 15, y: 7, color: '#000000' }, { x: 16, y: 7, color: '#000000' }, { x: 17, y: 7, color: '#000000' },
        { x: 18, y: 7, color: '#000000' }, { x: 19, y: 7, color: '#000000' }, { x: 20, y: 7, color: '#000000' },
        { x: 21, y: 7, color: '#000000' }, { x: 22, y: 7, color: '#000000' }, { x: 23, y: 8, color: '#000000' },
        { x: 24, y: 9, color: '#000000' }, { x: 24, y: 10, color: '#000000' }, { x: 24, y: 11, color: '#000000' },
        { x: 24, y: 12, color: '#000000' }, { x: 24, y: 13, color: '#000000' }, { x: 24, y: 14, color: '#000000' },
        { x: 24, y: 15, color: '#000000' }, { x: 24, y: 16, color: '#000000' }, { x: 24, y: 17, color: '#000000' },
        { x: 24, y: 18, color: '#000000' }, { x: 24, y: 19, color: '#000000' }, { x: 24, y: 20, color: '#000000' },
        { x: 24, y: 21, color: '#000000' }, { x: 24, y: 22, color: '#000000' }, { x: 23, y: 23, color: '#000000' },
        { x: 9, y: 24, color: '#000000' }, { x: 10, y: 24, color: '#000000' }, { x: 11, y: 24, color: '#000000' },
        { x: 12, y: 24, color: '#000000' }, { x: 13, y: 24, color: '#000000' }, { x: 14, y: 24, color: '#000000' },
        { x: 15, y: 24, color: '#000000' }, { x: 16, y: 24, color: '#000000' }, { x: 17, y: 24, color: '#000000' },
        { x: 18, y: 24, color: '#000000' }, { x: 19, y: 24, color: '#000000' }, { x: 20, y: 24, color: '#000000' },
        { x: 21, y: 24, color: '#000000' }, { x: 22, y: 24, color: '#000000' }, { x: 7, y: 31, color: '#000000' },
        { x: 7, y: 30, color: '#000000' }, { x: 7, y: 29, color: '#000000' }, { x: 8, y: 28, color: '#000000' },
        { x: 9, y: 27, color: '#000000' }, { x: 10, y: 27, color: '#000000' }, { x: 11, y: 27, color: '#000000' },
        { x: 12, y: 27, color: '#000000' }, { x: 13, y: 27, color: '#000000' }, { x: 14, y: 27, color: '#000000' },
        { x: 15, y: 27, color: '#000000' }, { x: 16, y: 27, color: '#000000' }, { x: 17, y: 27, color: '#000000' },
        { x: 18, y: 27, color: '#000000' }, { x: 19, y: 27, color: '#000000' }, { x: 20, y: 27, color: '#000000' },
        { x: 21, y: 27, color: '#000000' }, { x: 22, y: 27, color: '#000000' }, { x: 23, y: 28, color: '#000000' },
        { x: 24, y: 29, color: '#000000' }, { x: 24, y: 30, color: '#000000' }, { x: 24, y: 31, color: '#000000' },
        { x: 11, y: 22, color: '#000000' }, { x: 12, y: 22, color: '#000000' }, { x: 13, y: 22, color: '#000000' },
        { x: 14, y: 22, color: '#000000' }, { x: 15, y: 22, color: '#000000' }, { x: 16, y: 22, color: '#000000' },
        { x: 17, y: 22, color: '#000000' }, { x: 18, y: 22, color: '#000000' }, { x: 19, y: 22, color: '#000000' },
        { x: 20, y: 22, color: '#000000' }, { x: 21, y: 22, color: '#000000' }, { x: 22, y: 22, color: '#000000' },
        { x: 23, y: 22, color: '#000000' }, { x: 11, y: 19, color: '#ffffff' }, { x: 12, y: 19, color: '#ffffff' },
        { x: 13, y: 19, color: '#ffffff' }, { x: 14, y: 19, color: '#000000' }, { x: 15, y: 19, color: '#000000' },
        { x: 16, y: 19, color: '#000000' }, { x: 18, y: 19, color: '#ffffff' }, { x: 19, y: 19, color: '#ffffff' },
        { x: 20, y: 19, color: '#ffffff' }, { x: 21, y: 19, color: '#000000' }, { x: 22, y: 19, color: '#000000' },
        { x: 23, y: 19, color: '#000000' },

        { x: 9, y: 8, color: '#713F1E' },
        { x: 10, y: 8, color: '#713F1E' },
        { x: 11, y: 8, color: '#713F1E' },
        { x: 12, y: 8, color: '#713F1E' },
        { x: 13, y: 8, color: '#713F1E' },
        { x: 14, y: 8, color: '#713F1E' },
        { x: 15, y: 8, color: '#713F1E' },
        { x: 16, y: 8, color: '#713F1E' },
        { x: 17, y: 8, color: '#713F1E' },
        { x: 18, y: 8, color: '#713F1E' },
        { x: 19, y: 8, color: '#713F1E' },
        { x: 20, y: 8, color: '#713F1E' },
        { x: 21, y: 8, color: '#713F1E' },
        { x: 22, y: 8, color: '#713F1E' },

        { x: 8, y: 9, color: '#713F1E' },
        { x: 9, y: 9, color: '#713F1E' },
        { x: 10, y: 9, color: '#713F1E' },
        { x: 11, y: 9, color: '#713F1E' },
        { x: 12, y: 9, color: '#713F1E' },
        { x: 13, y: 9, color: '#713F1E' },
        { x: 14, y: 9, color: '#713F1E' },
        { x: 15, y: 9, color: '#713F1E' },
        { x: 16, y: 9, color: '#713F1E' },
        { x: 17, y: 9, color: '#713F1E' },
        { x: 18, y: 9, color: '#713F1E' },
        { x: 19, y: 9, color: '#713F1E' },
        { x: 20, y: 9, color: '#713F1E' },
        { x: 21, y: 9, color: '#713F1E' },
        { x: 22, y: 9, color: '#713F1E' },
        { x: 23, y: 9, color: '#713F1E' },

        { x: 8, y: 10, color: '#713F1E' },
        { x: 9, y: 10, color: '#713F1E' },
        { x: 10, y: 10, color: '#713F1E' },
        { x: 11, y: 10, color: '#713F1E' },
        { x: 12, y: 10, color: '#713F1E' },
        { x: 13, y: 10, color: '#713F1E' },
        { x: 14, y: 10, color: '#713F1E' },
        { x: 15, y: 10, color: '#713F1E' },
        { x: 16, y: 10, color: '#713F1E' },
        { x: 17, y: 10, color: '#713F1E' },
        { x: 18, y: 10, color: '#713F1E' },
        { x: 19, y: 10, color: '#713F1E' },
        { x: 20, y: 10, color: '#713F1E' },
        { x: 21, y: 10, color: '#713F1E' },
        { x: 22, y: 10, color: '#713F1E' },
        { x: 23, y: 10, color: '#713F1E' },

        { x: 8, y: 11, color: '#713F1E' },
        { x: 9, y: 11, color: '#713F1E' },
        { x: 17, y: 11, color: '#713F1E' },
        { x: 8, y: 12, color: '#713F1E' },
        { x: 9, y: 12, color: '#713F1E' },
        { x: 8, y: 13, color: '#713F1E' },
        { x: 8, y: 14, color: '#713F1E' },
        { x: 8, y: 15, color: '#713F1E' },
        { x: 8, y: 16, color: '#713F1E' },
        { x: 8, y: 17, color: '#713F1E' },
        { x: 8, y: 18, color: '#713F1E' },
        { x: 8, y: 19, color: '#713F1E' },
        { x: 8, y: 20, color: '#713F1E' },
        { x: 8, y: 21, color: '#713F1E' },
        { x: 8, y: 22, color: '#713F1E' },
        { x: 9, y: 23, color: '#713F1E' },

        { x: 9, y: 28, color: '#713F1E' },
        { x: 10, y: 28, color: '#713F1E' },
        { x: 11, y: 28, color: '#713F1E' },
        { x: 12, y: 28, color: '#713F1E' },
        { x: 13, y: 28, color: '#713F1E' },
        { x: 14, y: 28, color: '#713F1E' },
        { x: 15, y: 28, color: '#713F1E' },
        { x: 16, y: 28, color: '#713F1E' },
        { x: 17, y: 28, color: '#713F1E' },
        { x: 18, y: 28, color: '#713F1E' },
        { x: 19, y: 28, color: '#713F1E' },
        { x: 20, y: 28, color: '#713F1E' },
        { x: 21, y: 28, color: '#713F1E' },
        { x: 22, y: 28, color: '#713F1E' },

        { x: 8, y: 29, color: '#713F1E' },
        { x: 9, y: 29, color: '#713F1E' },
        { x: 10, y: 29, color: '#713F1E' },
        { x: 11, y: 29, color: '#713F1E' },
        { x: 12, y: 29, color: '#713F1E' },
        { x: 13, y: 29, color: '#713F1E' },
        { x: 14, y: 29, color: '#713F1E' },
        { x: 15, y: 29, color: '#713F1E' },
        { x: 16, y: 29, color: '#713F1E' },
        { x: 17, y: 29, color: '#713F1E' },
        { x: 18, y: 29, color: '#713F1E' },
        { x: 19, y: 29, color: '#713F1E' },
        { x: 20, y: 29, color: '#713F1E' },
        { x: 21, y: 29, color: '#713F1E' },
        { x: 22, y: 29, color: '#713F1E' },
        { x: 23, y: 29, color: '#713F1E' },

        { x: 8, y: 30, color: '#713F1E' },
        { x: 9, y: 30, color: '#713F1E' },
        { x: 10, y: 30, color: '#713F1E' },
        { x: 8, y: 31, color: '#713F1E' },
        { x: 9, y: 31, color: '#713F1E' },
        { x: 10, y: 31, color: '#713F1E' },

        { x: 10, y: 11, color: '#E4C8A1' },
        { x: 11, y: 11, color: '#E4C8A1' },
        { x: 12, y: 11, color: '#E4C8A1' },
        { x: 13, y: 11, color: '#E4C8A1' },
        { x: 14, y: 11, color: '#E4C8A1' },
        { x: 15, y: 11, color: '#E4C8A1' },
        { x: 16, y: 11, color: '#E4C8A1' },
        { x: 18, y: 11, color: '#E4C8A1' },
        { x: 19, y: 11, color: '#E4C8A1' },
        { x: 20, y: 11, color: '#E4C8A1' },
        { x: 21, y: 11, color: '#E4C8A1' },
        { x: 22, y: 11, color: '#E4C8A1' },
        { x: 23, y: 11, color: '#E4C8A1' },

        { x: 10, y: 12, color: '#E4C8A1' },
        { x: 11, y: 12, color: '#E4C8A1' },
        { x: 12, y: 12, color: '#E4C8A1' },
        { x: 13, y: 12, color: '#E4C8A1' },
        { x: 14, y: 12, color: '#E4C8A1' },
        { x: 15, y: 12, color: '#E4C8A1' },
        { x: 16, y: 12, color: '#E4C8A1' },
        { x: 17, y: 12, color: '#E4C8A1' },
        { x: 18, y: 12, color: '#E4C8A1' },
        { x: 19, y: 12, color: '#E4C8A1' },
        { x: 20, y: 12, color: '#E4C8A1' },
        { x: 21, y: 12, color: '#E4C8A1' },
        { x: 22, y: 12, color: '#E4C8A1' },
        { x: 23, y: 12, color: '#E4C8A1' },

        { x: 6, y: 13, color: '#E4C8A1' },
        { x: 7, y: 13, color: '#E4C8A1' },
        { x: 9, y: 13, color: '#E4C8A1' },
        { x: 10, y: 13, color: '#E4C8A1' },
        { x: 17, y: 13, color: '#E4C8A1' },
        { x: 6, y: 14, color: '#E4C8A1' },
        { x: 9, y: 14, color: '#E4C8A1' },
        { x: 10, y: 14, color: '#E4C8A1' },
        { x: 17, y: 14, color: '#E4C8A1' },
        { x: 6, y: 15, color: '#E4C8A1' },
        { x: 9, y: 15, color: '#E4C8A1' },
        { x: 10, y: 15, color: '#E4C8A1' },
        { x: 17, y: 15, color: '#E4C8A1' },
        { x: 6, y: 16, color: '#E4C8A1' },
        { x: 9, y: 16, color: '#E4C8A1' },
        { x: 10, y: 16, color: '#E4C8A1' },
        { x: 17, y: 16, color: '#E4C8A1' },
        { x: 6, y: 17, color: '#E4C8A1' },
        { x: 9, y: 17, color: '#E4C8A1' },
        { x: 10, y: 17, color: '#E4C8A1' },
        { x: 17, y: 17, color: '#E4C8A1' },
        { x: 6, y: 18, color: '#E4C8A1' },
        { x: 7, y: 18, color: '#E4C8A1' },
        { x: 9, y: 18, color: '#E4C8A1' },
        { x: 10, y: 18, color: '#E4C8A1' },
        { x: 17, y: 18, color: '#E4C8A1' },
        { x: 9, y: 19, color: '#E4C8A1' },
        { x: 10, y: 19, color: '#E4C8A1' },
        { x: 17, y: 19, color: '#E4C8A1' },

        { x: 9, y: 20, color: '#E4C8A1' },
        { x: 10, y: 20, color: '#E4C8A1' },
        { x: 11, y: 20, color: '#E4C8A1' },
        { x: 12, y: 20, color: '#E4C8A1' },
        { x: 13, y: 20, color: '#E4C8A1' },
        { x: 14, y: 20, color: '#E4C8A1' },
        { x: 15, y: 20, color: '#E4C8A1' },
        { x: 16, y: 20, color: '#E4C8A1' },
        { x: 17, y: 20, color: '#E4C8A1' },
        { x: 18, y: 20, color: '#E4C8A1' },
        { x: 19, y: 20, color: '#E4C8A1' },
        { x: 20, y: 20, color: '#E4C8A1' },
        { x: 21, y: 20, color: '#E4C8A1' },
        { x: 22, y: 20, color: '#E4C8A1' },
        { x: 23, y: 20, color: '#E4C8A1' },

        { x: 9, y: 21, color: '#E4C8A1' },
        { x: 10, y: 21, color: '#E4C8A1' },
        { x: 11, y: 21, color: '#E4C8A1' },
        { x: 12, y: 21, color: '#E4C8A1' },
        { x: 13, y: 21, color: '#E4C8A1' },
        { x: 14, y: 21, color: '#E4C8A1' },
        { x: 15, y: 21, color: '#E4C8A1' },
        { x: 16, y: 21, color: '#E4C8A1' },
        { x: 17, y: 21, color: '#E4C8A1' },
        { x: 18, y: 21, color: '#E4C8A1' },
        { x: 19, y: 21, color: '#E4C8A1' },
        { x: 20, y: 21, color: '#E4C8A1' },
        { x: 21, y: 21, color: '#E4C8A1' },
        { x: 22, y: 21, color: '#E4C8A1' },
        { x: 23, y: 21, color: '#E4C8A1' },

        { x: 9, y: 22, color: '#E4C8A1' },
        { x: 10, y: 22, color: '#E4C8A1' },

        { x: 10, y: 23, color: '#E4C8A1' },
        { x: 11, y: 23, color: '#E4C8A1' },
        { x: 12, y: 23, color: '#E4C8A1' },
        { x: 13, y: 23, color: '#E4C8A1' },
        { x: 14, y: 23, color: '#E4C8A1' },
        { x: 15, y: 23, color: '#E4C8A1' },
        { x: 16, y: 23, color: '#E4C8A1' },
        { x: 17, y: 23, color: '#E4C8A1' },
        { x: 18, y: 23, color: '#E4C8A1' },
        { x: 19, y: 23, color: '#E4C8A1' },
        { x: 20, y: 23, color: '#E4C8A1' },
        { x: 21, y: 23, color: '#E4C8A1' },
        { x: 22, y: 23, color: '#E4C8A1' },

        { x: 10, y: 30, color: '#E4C8A1' },
        { x: 11, y: 30, color: '#E4C8A1' },
        { x: 12, y: 30, color: '#E4C8A1' },
        { x: 13, y: 30, color: '#E4C8A1' },
        { x: 14, y: 30, color: '#E4C8A1' },
        { x: 15, y: 30, color: '#E4C8A1' },
        { x: 16, y: 30, color: '#E4C8A1' },
        { x: 17, y: 30, color: '#E4C8A1' },
        { x: 18, y: 30, color: '#E4C8A1' },
        { x: 19, y: 30, color: '#E4C8A1' },
        { x: 20, y: 30, color: '#E4C8A1' },
        { x: 21, y: 30, color: '#E4C8A1' },
        { x: 22, y: 30, color: '#E4C8A1' },
        { x: 23, y: 30, color: '#E4C8A1' },
        
        { x: 10, y: 31, color: '#E4C8A1' },
        { x: 11, y: 31, color: '#E4C8A1' },
        { x: 12, y: 31, color: '#E4C8A1' },
        { x: 13, y: 31, color: '#E4C8A1' },
        { x: 14, y: 31, color: '#E4C8A1' },
        { x: 15, y: 31, color: '#E4C8A1' },
        { x: 16, y: 31, color: '#E4C8A1' },
        { x: 17, y: 31, color: '#E4C8A1' },
        { x: 18, y: 31, color: '#E4C8A1' },
        { x: 19, y: 31, color: '#E4C8A1' },
        { x: 20, y: 31, color: '#E4C8A1' },
        { x: 21, y: 31, color: '#E4C8A1' },
        { x: 22, y: 31, color: '#E4C8A1' },
        { x: 23, y: 31, color: '#E4C8A1' },

        { x: 7, y: 14, color: '#AB9679' },
        { x: 7, y: 15, color: '#AB9679' },
        { x: 7, y: 16, color: '#AB9679' },
        { x: 7, y: 17, color: '#AB9679' },

        { x: 11, y: 13, color: '#AF8D5F' },
        { x: 12, y: 13, color: '#AF8D5F' },
        { x: 13, y: 13, color: '#AF8D5F' },
        { x: 14, y: 13, color: '#AF8D5F' },
        { x: 15, y: 13, color: '#AF8D5F' },
        { x: 16, y: 13, color: '#AF8D5F' },
        { x: 18, y: 13, color: '#AF8D5F' },
        { x: 19, y: 13, color: '#AF8D5F' },
        { x: 20, y: 13, color: '#AF8D5F' },
        { x: 21, y: 13, color: '#AF8D5F' },
        { x: 22, y: 13, color: '#AF8D5F' },
        { x: 23, y: 13, color: '#AF8D5F' },

        { x: 11, y: 14, color: '#AF8D5F' },
        { x: 12, y: 14, color: '#AF8D5F' },
        { x: 13, y: 14, color: '#AF8D5F' },
        { x: 14, y: 14, color: '#AF8D5F' },
        { x: 15, y: 14, color: '#AF8D5F' },
        { x: 16, y: 14, color: '#AF8D5F' },
        { x: 18, y: 14, color: '#AF8D5F' },
        { x: 19, y: 14, color: '#AF8D5F' },
        { x: 20, y: 14, color: '#AF8D5F' },
        { x: 21, y: 14, color: '#AF8D5F' },
        { x: 22, y: 14, color: '#AF8D5F' },
        { x: 23, y: 14, color: '#AF8D5F' },

        { x: 11, y: 15, color: '#AF8D5F' },
        { x: 12, y: 15, color: '#AF8D5F' },
        { x: 13, y: 15, color: '#AF8D5F' },
        { x: 14, y: 15, color: '#AF8D5F' },
        { x: 15, y: 15, color: '#AF8D5F' },
        { x: 16, y: 15, color: '#AF8D5F' },
        { x: 18, y: 15, color: '#AF8D5F' },
        { x: 19, y: 15, color: '#AF8D5F' },
        { x: 20, y: 15, color: '#AF8D5F' },
        { x: 21, y: 15, color: '#AF8D5F' },
        { x: 22, y: 15, color: '#AF8D5F' },
        { x: 23, y: 15, color: '#AF8D5F' },

        { x: 11, y: 16, color: '#AF8D5F' },
        { x: 12, y: 16, color: '#AF8D5F' },
        { x: 13, y: 16, color: '#AF8D5F' },
        { x: 14, y: 16, color: '#AF8D5F' },
        { x: 15, y: 16, color: '#AF8D5F' },
        { x: 16, y: 16, color: '#AF8D5F' },
        { x: 18, y: 16, color: '#AF8D5F' },
        { x: 19, y: 16, color: '#AF8D5F' },
        { x: 20, y: 16, color: '#AF8D5F' },
        { x: 21, y: 16, color: '#AF8D5F' },
        { x: 22, y: 16, color: '#AF8D5F' },
        { x: 23, y: 16, color: '#AF8D5F' },

        { x: 11, y: 17, color: '#AF8D5F' },
        { x: 12, y: 17, color: '#AF8D5F' },
        { x: 13, y: 17, color: '#AF8D5F' },
        { x: 14, y: 17, color: '#AF8D5F' },
        { x: 15, y: 17, color: '#AF8D5F' },
        { x: 16, y: 17, color: '#AF8D5F' },
        { x: 18, y: 17, color: '#AF8D5F' },
        { x: 19, y: 17, color: '#AF8D5F' },
        { x: 20, y: 17, color: '#AF8D5F' },
        { x: 21, y: 17, color: '#AF8D5F' },
        { x: 22, y: 17, color: '#AF8D5F' },
        { x: 23, y: 17, color: '#AF8D5F' },

        { x: 11, y: 18, color: '#AF8D5F' },
        { x: 12, y: 18, color: '#AF8D5F' },
        { x: 13, y: 18, color: '#AF8D5F' },
        { x: 14, y: 18, color: '#AF8D5F' },
        { x: 15, y: 18, color: '#AF8D5F' },
        { x: 16, y: 18, color: '#AF8D5F' },
        { x: 18, y: 18, color: '#AF8D5F' },
        { x: 19, y: 18, color: '#AF8D5F' },
        { x: 20, y: 18, color: '#AF8D5F' },
        { x: 21, y: 18, color: '#AF8D5F' },
        { x: 22, y: 18, color: '#AF8D5F' },
        { x: 23, y: 18, color: '#AF8D5F' },

    ];

    const predefinedPixels = gridSize === 30 ? predefinedPixels30x30 : gridSize === 32 ? predefinedPixels32x32 : [];

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
    
        // Berechne das Array `predefinedPixels` basierend auf gridSize erneut, um sicherzustellen, dass die richtige Konfiguration geladen wird
        const predefinedPixels = gridSize === 30 ? predefinedPixels30x30 : gridSize === 32 ? predefinedPixels32x32 : [];
    
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
    
        // Überprüfe und setze die vordefinierten Pixel, falls `setPredefined` und das `predefinedPixels` Array vorhanden sind
        if (setPredefined && predefinedPixels.length > 0) {
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
            undoStack.push(window.uploadModule.exportGridToIMBA(grid, gridSize, backgroundColor));
        }
    }

    function saveState() {
        const currentState = exportGridToIMBA();
        if (undoStack.length === 0 || currentState !== undoStack[undoStack.length - 1]) {
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
        const newGridSize = data.gridSize;
        const pixels = data.pixels || [];

        if (newGridSize && newGridSize !== gridSize) {
            gridSize = newGridSize;
            initializeGrid(false);
            gridSizeSelector.value = gridSize;
        }

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

        pixels.forEach((item) => {
            const { x, y, color } = item;
            if (x < gridSize && y < gridSize) {
                const rectIndex = y * gridSize + x;
                if (rectIndex < grid.children.length) {
                    const rect = grid.children[rectIndex];
                    setColor(rect, color);
                }
            }
        });

        window.uploadModule.toggleGridLines(grid, showGrid);
    }

    function handleFileUpload(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imbaString = e.target.result;
                applyIMBAToGrid(imbaString);
            };
            reader.readAsText(file);
        }
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
    // Berechne die x- und y-Position mit Math.round, um sicherzustellen, dass Rundungsfehler minimiert werden
    const x = Math.round(parseFloat(rect.getAttribute('x')) / (100 / gridSize));
    const y = Math.round(parseFloat(rect.getAttribute('y')) / (100 / gridSize));
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

    function exportGridToIMBA() {
        const data = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const rectIndex = i * gridSize + j;
                const rect = grid.children[rectIndex];

                if (!rect) {
                    console.error(`Undefined rect at index ${rectIndex} for gridSize ${gridSize}`);
                    continue;
                }

                const color = rect.style.fill;
                if (color !== backgroundColor) {
                    data.push({ x: j, y: i, color });
                }
            }
        }
        // Fügen Sie die gridSize-Informationen hinzu
        const exportData = {
            gridSize: gridSize,
            pixels: data
        };
        return JSON.stringify(exportData, null, 2);
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
        window.uploadModule.toggleGridLines(grid, showGrid);
        toggleGridButton.textContent = showGrid ? 'Hide Grid' : 'Show Grid';
    });

    uploadIMBAInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        handleFileUpload(file);
    });

    uploadArea.addEventListener('click', () => {
        uploadIMBAInput.click();
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragging');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragging');
        });
    });

    uploadArea.addEventListener('drop', (event) => {
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    undoButton.addEventListener('click', undo);
    redoButton.addEventListener('click', redo);
    clearCanvasButton.addEventListener('click', clearCanvas);
});
