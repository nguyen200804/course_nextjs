"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface ImageCropperModalProps {
  imageSrc: string;
  onCropSave: (croppedFile: File, croppedPreviewUrl: string) => void;
  onReplace: () => void;
  onCancel: () => void;
}

export default function ImageCropperModal({
  imageSrc,
  onCropSave,
  onReplace,
  onCancel,
}: ImageCropperModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Crop box state in percentage relative to container: { x, y, size } (all in px relative to container)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; size: number }>({
    x: 30,
    y: 30,
    size: 200,
  });

  const [dragMode, setDragMode] = useState<"move" | "resize" | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialBox, setInitialBox] = useState<{ x: number; y: number; size: number }>({
    x: 30,
    y: 30,
    size: 200,
  });

  // When image loads, initialize crop box nicely in center
  const handleImageLoad = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const minDim = Math.min(rect.width, rect.height);
    const initialSize = Math.max(100, Math.round(minDim * 0.7));
    const initialX = Math.round((rect.width - initialSize) / 2);
    const initialY = Math.round((rect.height - initialSize) / 2);

    setCropBox({
      x: initialX,
      y: initialY,
      size: initialSize,
    });
  };

  // Drag Handlers
  const handleStartMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setDragMode("move");
    setStartPos({ x: clientX, y: clientY });
    setInitialBox({ ...cropBox });
  };

  const handleStartResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setDragMode("resize");
    setStartPos({ x: clientX, y: clientY });
    setInitialBox({ ...cropBox });
  };

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragMode || !containerRef.current) return;

      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const dx = clientX - startPos.x;
      const dy = clientY - startPos.y;

      const containerRect = containerRef.current.getBoundingClientRect();

      if (dragMode === "move") {
        let newX = initialBox.x + dx;
        let newY = initialBox.y + dy;

        // Keep inside container
        newX = Math.max(0, Math.min(newX, containerRect.width - initialBox.size));
        newY = Math.max(0, Math.min(newY, containerRect.height - initialBox.size));

        setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (dragMode === "resize") {
        // Uniform 1:1 resize
        const delta = Math.max(dx, dy);
        let newSize = initialBox.size + delta;

        // Boundaries
        newSize = Math.max(60, newSize);
        newSize = Math.min(
          newSize,
          containerRect.width - initialBox.x,
          containerRect.height - initialBox.y
        );

        setCropBox((prev) => ({ ...prev, size: newSize }));
      }
    },
    [dragMode, startPos, initialBox]
  );

  const handlePointerUp = useCallback(() => {
    setDragMode(null);
  }, []);

  useEffect(() => {
    if (dragMode) {
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchmove", handlePointerMove);
      window.addEventListener("touchend", handlePointerUp);
    }
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [dragMode, handlePointerMove, handlePointerUp]);

  // Crop & Save logic
  const handleSave = () => {
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const container = containerRef.current;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (!naturalWidth || !naturalHeight) return;

    // Calculate crop rectangle relative to actual image rendered inside container
    const scaleX = naturalWidth / imgRect.width;
    const scaleY = naturalHeight / imgRect.height;

    // Crop box relative to image position inside container
    const cropXOnImg = (cropBox.x - (imgRect.left - containerRect.left)) * scaleX;
    const cropYOnImg = (cropBox.y - (imgRect.top - containerRect.top)) * scaleY;
    const cropWidthOnImg = cropBox.size * scaleX;
    const cropHeightOnImg = cropBox.size * scaleY;

    const canvas = document.createElement("canvas");
    const outputSize = 500;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);

    ctx.drawImage(
      img,
      Math.max(0, cropXOnImg),
      Math.max(0, cropYOnImg),
      cropWidthOnImg,
      cropHeightOnImg,
      0,
      0,
      outputSize,
      outputSize
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "cropped-avatar.jpeg", { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(blob);
      onCropSave(file, previewUrl);
    }, "image/jpeg", 0.95);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-slate-800 border border-slate-200">
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">Crop Profile Picture</h3>
          <p className="text-xs text-slate-500 mt-1">Move and resize the grid to crop your avatar (1:1)</p>
        </div>

        {/* Image Container with Fixed Image & Draggable Crop Box */}
        <div
          ref={containerRef}
          className="relative w-full aspect-square bg-slate-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center select-none"
        >
          {/* Background Fixed Image */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Original Preview"
            onLoad={handleImageLoad}
            draggable={false}
            className="w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Draggable & Resizable 1:1 Crop Grid Box */}
          <div
            onMouseDown={handleStartMove}
            onTouchStart={handleStartMove}
            style={{
              left: `${cropBox.x}px`,
              top: `${cropBox.y}px`,
              width: `${cropBox.size}px`,
              height: `${cropBox.size}px`,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
            }}
            className="absolute z-30 cursor-move border-2 border-emerald-400 bg-transparent"
          >
            {/* 3x3 Dashed Alignment Grid */}
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/50 border-dashed" />
              <div className="border-r border-b border-white/50 border-dashed" />
              <div className="border-b border-white/50 border-dashed" />
              <div className="border-r border-b border-white/50 border-dashed" />
              <div className="border-r border-b border-white/50 border-dashed" />
              <div className="border-b border-white/50 border-dashed" />
              <div className="border-r border-white/50 border-dashed" />
              <div className="border-r border-white/50 border-dashed" />
              <div />
            </div>

            {/* Corner Resize Handles (Blue Square Dots as in screenshot) */}
            <div
              onMouseDown={handleStartResize}
              onTouchStart={handleStartResize}
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-sky-500 border-2 border-white rounded-sm cursor-se-resize z-40 shadow"
            />
            <div
              onMouseDown={handleStartResize}
              onTouchStart={handleStartResize}
              className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-sky-500 border-2 border-white rounded-sm cursor-ne-resize z-40 shadow"
            />
            <div
              onMouseDown={handleStartResize}
              onTouchStart={handleStartResize}
              className="absolute -top-2 -left-2 w-3.5 h-3.5 bg-sky-500 border-2 border-white rounded-sm cursor-nw-resize z-40 shadow"
            />
            <div
              onMouseDown={handleStartResize}
              onTouchStart={handleStartResize}
              className="absolute -bottom-2 -left-2 w-3.5 h-3.5 bg-sky-500 border-2 border-white rounded-sm cursor-sw-resize z-40 shadow"
            />
          </div>
        </div>

        {/* 3 Action Buttons (Replace, Save, Cancel) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onReplace}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
