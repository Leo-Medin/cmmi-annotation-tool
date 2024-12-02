import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, ChangeEvent } from 'react';
import { ModeType, ShapeType, Severity, AnnotationDef, ShapeDef } from '@/utils/appTypes';
import { Snackbar, Alert, Button } from '@mui/material';
import AnnotationsList from './AnnotationsList';
import { organismClasses } from '@/utils/appConstants';
import { uploadFile } from '@/utils/cloud-storage-functions'
import AIAssistant from './AIAssistant';

const MainArea = forwardRef(({ mode, shapeType }: { mode: ModeType, shapeType: ShapeType }, ref) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Array<AnnotationDef>>([]);
  const [zoom, setZoom] = useState(1); // Zoom level
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // Pan offsets
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 }); // Starting position for panning
  const isDrawing = useRef(false); // Is the user drawing?
  const startCoords = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [innerWidth, setInnerWidth] = useState(600);
  const [innerHeight, setInnerHeight] = useState(600);
  const [snackbar, setSnackbar] = useState<{ children: string; severity: Severity } | null>(null)
  // const [isLoading, setIsLoading] = useState(false)

  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  }>({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  useEffect(()=>{
    isDrawing.current = false; // Reset drawing state when switching modes
  },[shapeType])

  useEffect(()=>{
    if (imageSrc) {
      if (mode === 'pan-zoom') setSnackbar({ children: 'Use the mouse: Drag to pan, scroll the wheel to zoom.', severity: 'info' })
      else if (mode === 'draw') {
        if (shapeType === 'rectangle') setSnackbar({ children: 'Place the cursor at one corner of the area, press the mouse button, and drag to the desired size.', severity: 'info' })
        if (shapeType === 'circle') setSnackbar({ children: 'Place the cursor at the center of the area, press the mouse button, and drag to the desired size.', severity: 'info' })
      }
    }
    else setSnackbar({ children: 'Kindly add the image first.', severity: 'info' })
  },[mode, shapeType])

  const handleNew = () => {
    setImageSrc(null)
    setAnnotations([])
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
    imageRef.current = null; 
  }

  useImperativeHandle(ref, () => ({
    handleNew, // Expose handleNew function to parent
    importAnnotations,
    exportAnnotations
  }));

  // Handle zoom
  const handleZoom = (delta: number, centerX: number, centerY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = centerX - rect.left;
    const mouseY = centerY - rect.top;

    // Calculate new zoom level
    const newZoom = Math.min(Math.max(zoom + delta, 0.5), 5); // Clamp zoom level between 0.5x and 5x

    // Adjust panOffset to keep zoom centered on the mouse pointer
    const zoomFactor = newZoom / zoom;
    setPanOffset((prev) => ({
      x: mouseX - zoomFactor * (mouseX - prev.x),
      y: mouseY - zoomFactor * (mouseY - prev.y),
    }));

    setZoom(newZoom);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (mode === 'pan-zoom') handleZoom(-e.deltaY * 0.001, e.clientX, e.clientY); // Adjust zoom based on scroll
  };

  // Handle panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === 'pan-zoom') {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
    } 
    else if (mode === 'draw') {
      isDrawing.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      // Get mouse position relative to canvas
      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      startCoords.current = { x, y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === 'pan-zoom' && isPanning.current) {
      const deltaX = e.clientX - panStart.current.x;
      const deltaY = e.clientY - panStart.current.y;
  
      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
  
      panStart.current = { x: e.clientX, y: e.clientY };
    } 
    else if (mode === 'draw' && isDrawing.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
        
      // Adjust mouse position relative to canvas
      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      // Apply zoom and pan transformations
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);
  
      // Draw the image only once (not in every mouse move)
      if (!imageRef.current) {
        const img = new Image();
        img.src = imageSrc!;
        img.onload = () => {
          imageRef.current = img;  // Save the image reference for later use
          ctx.drawImage(img, imageDimensions.offsetX, imageDimensions.offsetY, imageDimensions.width, imageDimensions.height);
          drawShapes(ctx, x, y); // Draw shapes after the image is loaded
        };
      } else {
        ctx.drawImage(imageRef.current, imageDimensions.offsetX, imageDimensions.offsetY, imageDimensions.width, imageDimensions.height);
        drawShapes(ctx, x, y);  // Draw shapes
      }
  
      ctx.restore();
    }
  };
    
  // Function to draw all shapes
  const drawShapes = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Draw all existing shapes
    annotations.forEach(({shape, color}) => {
      ctx.strokeStyle = color;
      if (shape.type === 'rectangle') {
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, shape.width as number, shape.height as number);
        ctx.stroke();
      } else if (shape.type === 'circle') {
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.radius as number, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // Draw the new shape dynamically (circle or rectangle)
    if (shapeType === 'rectangle') {
      const width = x - startCoords.current.x;
      const height = y - startCoords.current.y;

      ctx.beginPath();
      ctx.rect(startCoords.current.x, startCoords.current.y, width, height);
      ctx.stroke();
    } 
    else if (shapeType === 'circle') {
      const radius = Math.sqrt(Math.pow(x - startCoords.current.x, 2) + Math.pow(y - startCoords.current.y, 2));
      ctx.beginPath();
      ctx.arc(startCoords.current.x, startCoords.current.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === 'pan-zoom') {
      isPanning.current = false;
    } 
    else if (mode === 'draw' && isDrawing.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const { x: startX, y: startY } = startCoords.current;
      // const x = rect.left + startX;
      // const y = rect.top + startY;
      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;
      const width = x - startX;
      const height = y - startY;

      // Save the drawn shape
      let shape: ShapeDef;
      if (shapeType === 'rectangle') {
        shape =         {
          type: shapeType,
          x: startX,
          y: startY,
          width: shapeType === 'rectangle' ? width : Math.sqrt(width * width + height * height) / 2,
          height: shapeType === 'rectangle' ? height : Math.sqrt(width * width + height * height) / 2,
        }
      }
      else {
        const radius = Math.sqrt(Math.pow(x - startCoords.current.x, 2) + Math.pow(y - startCoords.current.y, 2));
        shape = { type: 'circle', x: startCoords.current.x, y: startCoords.current.y, radius };
      }
      const randomOrganismClass = organismClasses[Math.floor(Math.random() * organismClasses.length)];
      const tmpAnnotations = JSON.parse(JSON.stringify(annotations)); // deep clone
      tmpAnnotations.forEach((element: AnnotationDef) => {
        element.selected = false; // deselect everything
      });

      setAnnotations([
        ...tmpAnnotations,
        { shape, organismClass: randomOrganismClass.organismClass, color: randomOrganismClass.color, description: '', selected: true}
      ]);

    }
    isDrawing.current = false;
  };

  // Redraw canvas
  const redrawCanvas = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    const { width, height } = imageDimensions;
    const { x: panX, y: panY } = panOffset;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply pan and zoom transformations
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Draw the image
    const img = new Image();
    img.src = imageSrc!;
    img.onload = () => {
      ctx.drawImage(img, imageDimensions.offsetX, imageDimensions.offsetY, width, height);

      // Draw all shapes
      annotations.forEach(({shape, color, selected}) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = (selected? 8: 2) / zoom; // Adjust line width for zoom
        if (shape.type === 'rectangle') {
          ctx.beginPath();
          ctx.rect(shape.x, shape.y, shape.width as number, shape.height as number);
          ctx.stroke();
        } else if (shape.type === 'circle') {
          ctx.beginPath();
          ctx.arc(shape.x, shape.y, shape.radius as number, 0, 2 * Math.PI); // Circle's center and radius
          ctx.stroke();
        }
      });

      ctx.restore();
    };
  };

  // Update canvas on shape, pan, or zoom change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && imageSrc) {
      const ctx = canvas.getContext('2d');
      if (ctx) redrawCanvas(ctx);
    }
    else if (canvas) { // no image => clear canvas
      const ctx = canvas.getContext('2d');  
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);      
    }
  }, [annotations, imageSrc, panOffset, zoom]);

  useEffect(()=>{
    if (canvasRef.current) {
      const tmpInnerWidth = window.visualViewport? window.visualViewport.width: window.innerWidth; // to correctly work in Chrome
      const tmpInnerHeight = window.visualViewport? window.visualViewport.height: window.innerHeight; 
      setInnerWidth(tmpInnerWidth);
      canvasRef.current.width = tmpInnerWidth*77/100;
      canvasRef.current.height = tmpInnerHeight*92/100;
      setInnerHeight(tmpInnerHeight - 40); // minus topbar height
    }
  }, [])

  // Handle keyboard events for zoom and pan
  const handleKeyDown = (e: KeyboardEvent) => {
    // Pan with arrow keys
    if (mode === 'pan-zoom') {
      if (e.key === 'ArrowUp') {
        setPanOffset((prev) => ({ x: prev.x, y: prev.y - 10 }));
      } else if (e.key === 'ArrowDown') {
        setPanOffset((prev) => ({ x: prev.x, y: prev.y + 10 }));
      } else if (e.key === 'ArrowLeft') {
        setPanOffset((prev) => ({ x: prev.x - 10, y: prev.y }));
      } else if (e.key === 'ArrowRight') {
        setPanOffset((prev) => ({ x: prev.x + 10, y: prev.y }));
      }
    }

    // Zoom with + and - keys
    if (e.key === '+' || e.key === '=') {
      handleZoom(0.1, 400, 300); // Zoom in at the center of the canvas
    } else if (e.key === '-') {
      handleZoom(-0.1, 400, 300); // Zoom out at the center of the canvas
    }
  };

  useEffect(() => {
    // Add keyboard listener for pan and zoom
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Cleanup the keyboard event listener
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoom, panOffset]);

  const exportAnnotations = () => {
    if (!imageSrc) {
      setSnackbar({ children: 'Kindly add the image first.', severity: 'info' })

      return;
    }

    const annotationsToExport = annotations.map((annotation) => {
        return {
            shape: {
                type: annotation.shape.type,
                // x: annotation.shape.x * zoom + panOffset.x,  // Adjust position with zoom and pan
                // y: annotation.shape.y * zoom + panOffset.y,
                // width: annotation.shape.width ? annotation.shape.width * zoom : undefined,  // Adjust size with zoom
                // height: annotation.shape.height ? annotation.shape.height * zoom : undefined,
                // radius: annotation.shape.radius ? annotation.shape.radius * zoom : undefined,
                x: annotation.shape.x,  // Adjust position with zoom and pan
                y: annotation.shape.y,
                width: annotation.shape.width ? annotation.shape.width : undefined,  // Adjust size with zoom
                height: annotation.shape.height ? annotation.shape.height : undefined,
                radius: annotation.shape.radius ? annotation.shape.radius : undefined,
            },
            organismClass: annotation.organismClass,
            color: annotation.color,
            description: annotation.description
        };
    });
    const dataToExport = {
      imageURL: imageSrc,
      zoom,
      panOffset,
      annotations: annotationsToExport
    }

    // Convert annotations to JSON
    // const json = JSON.stringify(annotationsToExport, null, 2); // Pretty-print with 2 spaces
    const json = JSON.stringify(dataToExport, null, 2); // Pretty-print with 2 spaces

    // Create a Blob with the JSON data
    const blob = new Blob([json], { type: 'application/json' });

    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'annotations.json';  // Name the file to be downloaded

    // Trigger the download
    link.click();
  };
  
  const handleJSONFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('file:', file)
    if (file) {
        console.log('file:', file)
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                try {
                    // Parse the JSON data
                    const data = JSON.parse(event.target.result as string);

                    setAnnotations(data.annotations)
                    // setImageSrc(data.imageURL)
                    setZoom(data.zoom)
                    setPanOffset(data.panOffset)
                    loadImageFromURL(data.imageURL)

                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            }
        };
        reader.readAsText(file);
    }
  };

  // Handle file drag-and-drop
  const handleFileDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const loadImageFromURL = (imageUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;

      const canvas = canvasRef.current;
      if (canvas) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const aspectRatio = imgWidth / imgHeight;

        let displayWidth = canvasWidth;
        let displayHeight = canvasHeight;

        if (aspectRatio > 1) {
          displayHeight = canvasWidth / aspectRatio;
        } else {
          displayWidth = canvasHeight * aspectRatio;
        }

        const offsetX = (canvasWidth - displayWidth) / 2;
        const offsetY = (canvasHeight - displayHeight) / 2;

        setImageDimensions({ width: displayWidth, height: displayHeight, offsetX, offsetY });
        setImageSrc(imageUrl as string);
      }
    };

    img.src = imageUrl as string; // Set the image source to the uploaded URL

  }

  const loadImageFromFile = (file: File) => {
    // setIsLoading(true);
    uploadFile(file, 'cmmi')
    .then(imageUrl => {
        console.log('uploaded', imageUrl)

        loadImageFromURL(imageUrl as string)                                    

    })
    .catch(error => {
        alert('Upload failed: ' + error)
    })
    .finally(() => {
        // setIsLoading(false);
    })

  }
  
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadImageFromFile(file)
    }
  };

  const importAnnotations = ()=>{
    handleNew(); // to clear previous settings

    const input = document.createElement('input')
    input.type = 'file'
    input.accept='.json'
    input.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;

      // Create a mock ChangeEvent
      const changeEvent = {
        ...event,
        target,
        currentTarget: target,
        bubbles: true,
        cancelBubble: false,
        cancelable: true,
        composed: true,
        defaultPrevented: false,
        isDefaultPrevented: () => false,
        isPropagationStopped: () => false,
        persist: () => {}
      } as unknown as ChangeEvent<HTMLInputElement>;

      handleJSONFileInput(changeEvent);
    });
    input.click()
  }


  return (
    <div className='main-area-wrapper' style={{ height: innerHeight }}>
      <div className='canvas-panel' >

          {/* Zoom controls */}
          {/* <span>Zoom: </span>
          <button onClick={() => handleZoom(0.1, 400, 300)}>+</button>
          <button onClick={() => handleZoom(-0.1, 400, 300)}>-</button> */}

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            style={{
              cursor: mode === 'pan-zoom' ? 'grab' : 'crosshair',
              display: !imageSrc? 'none': ''
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          />

          {/* File Drag-and-Drop Area */}
          {!imageSrc &&
            <div
              className='file-dropper'
              onDragOver={handleFileDragOver}
              onDrop={handleFileDrop}
              // onDrop={handleFileInput}
              style={{
                border: '2px dashed #ccc',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                margin: '16px'
              }}
            >
              <p>Drag and drop an image here, or click below to upload.</p>

              {/* File Input */}
              <div style={{ margin: '20px', display: 'flex', justifyContent: 'space-around' }}>
                {/* <input
                  type='file'
                  accept='image/*'
                  onChange={handleFileInput}
                  style={{ display: 'block', marginBottom: '10px' }}
                /> */}
                {/* <Button
                  variant='outlined'
                  onClick={()=>{
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept='image/*'
                    input.addEventListener('change', (event: Event) => {
                      const target = event.target as HTMLInputElement;
                
                      // Create a mock ChangeEvent
                      const changeEvent = {
                        ...event,
                        target,
                        currentTarget: target,
                        bubbles: true,
                        cancelBubble: false,
                        cancelable: true,
                        composed: true,
                        defaultPrevented: false,
                        isDefaultPrevented: () => false,
                        isPropagationStopped: () => false,
                        persist: () => {}
                      } as unknown as ChangeEvent<HTMLInputElement>;
                
                      handleFileInput(changeEvent);
                    });
                    input.click()
                
                  }}
                  sx={{ mt: '20px' }}
                >
                  Select File
                </Button> */}

                                <Button component='label' variant='contained' htmlFor='account-settings-upload-image' sx={{ mt: 2, whiteSpace: 'nowrap' }}>
                                    Upload Image
                                    <input
                                        hidden
                                        type='file'
                                        onChange={event => {
                                          if (event.target.files) {
                                            loadImageFromFile(event.target.files[0])

                                          }
                                        }}
                                        accept='image/png, image/jpeg'
                                        id='account-settings-upload-image'
                                    />
                                </Button>

              </div>
            </div>
          }


      </div>

      <div className='right-panel' style={{ width: innerWidth*20/100 }}>
        <AnnotationsList annotations={annotations} setAnnotations={setAnnotations} />
      </div>

      {!!imageSrc &&
        <AIAssistant imageUrl={imageSrc} />
      }

      {!!snackbar && (
        <Snackbar
          open
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          onClose={() => setSnackbar(null)}
          autoHideDuration={6000}
        >
          <Alert {...snackbar} onClose={() => setSnackbar(null)} />
        </Snackbar>
      )}
    </div>
  );
});

MainArea.displayName = 'MainArea'; // ESLint requires this attribute for components created with forwardRef

export default MainArea;
