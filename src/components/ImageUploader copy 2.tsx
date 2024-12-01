import React, { useState, useRef, useEffect } from "react";

type ShapeType = "rectangle" | "circle";

type ShapeDef = { type: ShapeType; x: number; y: number; width?: number; height?: number; radius?: number }

const ImageUploader: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [shapeType, setShapeType] = useState<ShapeType>("rectangle");
  const [shapes, setShapes] = useState<Array<ShapeDef>>([]);
  const [zoom, setZoom] = useState(1); // Zoom level
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // Pan offsets
  const [mode, setMode] = useState<"draw" | "pan">("draw"); // Current mode: draw or pan
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 }); // Starting position for panning
  const isDrawing = useRef(false); // Is the user drawing?
  const startCoords = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  console.log('shapes:', shapes)

  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  }>({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.src = event.target.result as string;
          img.onload = () => {
            const canvas = canvasRef.current;
            if (canvas) {
              const canvasWidth = canvas.width;
              const canvasHeight = canvas.height;
              const aspectRatio = img.width / img.height;

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
              setImageSrc(event.target?.result as string);
            }
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (mode === "pan") handleZoom(-e.deltaY * 0.001, e.clientX, e.clientY); // Adjust zoom based on scroll
  };

  // Handle panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "pan") {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
    } else if (mode === "draw") {
      isDrawing.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      startCoords.current = { x, y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "pan" && isPanning.current) {
      const deltaX = e.clientX - panStart.current.x;
      const deltaY = e.clientY - panStart.current.y;
  
      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
  
      panStart.current = { x: e.clientX, y: e.clientY };
    } 
    else if (mode === "draw" && isDrawing.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
  
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
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
    shapes.forEach((shape) => {
      if (shape.type === "rectangle") {
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, shape.width as number, shape.height as number);
        ctx.stroke();
      } else if (shape.type === "circle") {
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.radius as number, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // Draw the new shape dynamically (circle or rectangle)
    if (shapeType === "rectangle") {
      const width = x - startCoords.current.x;
      const height = y - startCoords.current.y;
      ctx.beginPath();
      ctx.rect(startCoords.current.x, startCoords.current.y, width, height);
      ctx.stroke();
    } 
    else if (shapeType === "circle") {
      const radius = Math.sqrt(Math.pow(x - startCoords.current.x, 2) + Math.pow(y - startCoords.current.y, 2));
      ctx.beginPath();
      ctx.arc(startCoords.current.x, startCoords.current.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "pan") {
      isPanning.current = false;
    } 
    else if (mode === "draw" && isDrawing.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const { x: startX, y: startY } = startCoords.current;
      // const x = rect.left + startX;
      // const y = rect.top + startY;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const width = x - startX;
      const height = y - startY;

      // Save the drawn shape
      let shape: ShapeDef;
      if (shapeType === "rectangle") {
        shape =         {
          type: shapeType,
          x: startX,
          y: startY,
          width: shapeType === "rectangle" ? width : Math.sqrt(width * width + height * height) / 2,
          height: shapeType === "rectangle" ? height : Math.sqrt(width * width + height * height) / 2,
        }
      }
      else {
        const radius = Math.sqrt(Math.pow(x - startCoords.current.x, 2) + Math.pow(y - startCoords.current.y, 2));
        shape = { type: "circle", x: startCoords.current.x, y: startCoords.current.y, radius };
      }
      setShapes((prev) => [
        ...prev,
        shape
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
      shapes.forEach((shape) => {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2 / zoom; // Adjust line width for zoom
        if (shape.type === "rectangle") {
          // ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
          ctx.beginPath();
          ctx.rect(shape.x, shape.y, shape.width as number, shape.height as number);
          ctx.stroke();
        } else if (shape.type === "circle") {
          // ctx.beginPath();
          // ctx.arc(shape.x + shape.width, shape.y + shape.height, shape.width, 0, 2 * Math.PI);
          // ctx.stroke();
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
      const ctx = canvas.getContext("2d");
      if (ctx) redrawCanvas(ctx);
    }
  }, [shapes, imageSrc, panOffset, zoom]);

  // Handle keyboard events for zoom and pan
  const handleKeyDown = (e: KeyboardEvent) => {
    // Pan with arrow keys
    if (mode === "pan") {
      if (e.key === "ArrowUp") {
        setPanOffset((prev) => ({ x: prev.x, y: prev.y - 10 }));
      } else if (e.key === "ArrowDown") {
        setPanOffset((prev) => ({ x: prev.x, y: prev.y + 10 }));
      } else if (e.key === "ArrowLeft") {
        setPanOffset((prev) => ({ x: prev.x - 10, y: prev.y }));
      } else if (e.key === "ArrowRight") {
        setPanOffset((prev) => ({ x: prev.x + 10, y: prev.y }));
      }
    }

    // Zoom with + and - keys
    if (e.key === "+" || e.key === "=") {
      handleZoom(0.1, 400, 300); // Zoom in at the center of the canvas
    } else if (e.key === "-") {
      handleZoom(-0.1, 400, 300); // Zoom out at the center of the canvas
    }
  };

  useEffect(() => {
    // Add keyboard listener for pan and zoom
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      // Cleanup the keyboard event listener
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [zoom, panOffset]);

  return (
    <div>
      {/* File Input */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: "block", marginBottom: "10px" }}
        />
        <span>Choose a shape:</span>
        <select
          value={shapeType}
          onChange={(e) => {
            setShapeType(e.target.value as ShapeType);
            isDrawing.current = false; // Reset drawing state when switching modes
          }}
          style={{ marginLeft: "10px" }}
        >
          <option value="rectangle">Rectangle</option>
          <option value="circle">Circle</option>
        </select>
      </div>

      {/* Zoom controls */}
      <span>Zoom: </span>
      <button onClick={() => handleZoom(0.1, 400, 300)}>+</button>
      <button onClick={() => handleZoom(-0.1, 400, 300)}>-</button>

      {/* Mode Switch */}
      <div>
        <button onClick={() => setMode("draw")}>Draw Mode</button>
        <button onClick={() => setMode("pan")}>Pan Mode</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: "1px solid #ddd",
          cursor: mode === "pan" ? "grab" : "crosshair",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};

export default ImageUploader;