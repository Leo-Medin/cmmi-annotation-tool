import React, { useState } from "react";

const ImageUploader: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null); // State for storing the uploaded image

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag-and-drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
        <span>Or drag and drop an image below:</span>
      </div>

      {/* Drag-and-Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: "2px dashed #ccc",
          borderRadius: "10px",
          padding: "20px",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Uploaded"
            style={{ maxWidth: "100%", maxHeight: "300px" }}
          />
        ) : (
          <p>Drag and drop an image here, or click above to upload.</p>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
