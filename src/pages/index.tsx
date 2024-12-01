import React from "react";
import MainArea from "@/components/MainArea";
import TopBar from "@/components/TopBar";
import { useState, useRef } from "react";
import { ModeType, ShapeType } from '@/utils/appTypes';

export default function Home() {
  const [mode, setMode] = useState<ModeType>('pan-zoom'); // Current mode: draw or pan-zoom
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');
  const childRef = useRef<{ handleNew: () => void; importAnnotations: () => void; exportAnnotations: () => void }>(null);

  const handleClickNew = () => {
    if (childRef.current) {
      childRef.current.handleNew();
    }
  };

  const handleClickImport = () => {
    if (childRef.current) {
      childRef.current.importAnnotations();
    }
  };

  const handleClickExport = () => {
    if (childRef.current) {
      childRef.current.exportAnnotations();
    }
  };

  return (
    <div>
      <TopBar 
        mode={mode} 
        setMode={setMode} 
        shapeType={shapeType} 
        setShapeType={setShapeType} 
        handleClickNew={handleClickNew} 
        handleClickImport={handleClickImport} 
        handleClickExport={handleClickExport}
      />
      <MainArea ref={childRef} mode={mode} shapeType={shapeType} />

    </div>
  );
}
