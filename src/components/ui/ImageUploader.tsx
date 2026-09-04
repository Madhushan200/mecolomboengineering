'use client';

import React, { useRef, useState } from 'react';
import { Camera, UploadCloud, X, Image as ImageIcon, CheckCircle2, Loader2, Eye } from 'lucide-react';
import { compressAndOptimizeImage, formatBytes } from '@/lib/image-utils';

interface ImageUploaderProps {
  label?: string;
  sublabel?: string;
  description?: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  required?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label = 'Attach Issue Photo (Optional)',
  sublabel,
  description,
  value,
  onChange,
  required = false,
}) => {
  const subtitleText = description || sublabel || 'Take a real photo with camera or upload from device gallery';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [fileStats, setFileStats] = useState<{ origSize: number; compSize: number } | null>(null);

  const processFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    try {
      setIsProcessing(true);
      const originalSize = file.size;
      const optimizedDataUrl = await compressAndOptimizeImage(file, 1280, 1280, 0.78);

      // Estimate compressed size in bytes (base64 length * 0.75)
      const compressedSize = Math.round(optimizedDataUrl.length * 0.75);

      setFileStats({
        origSize: originalSize,
        compSize: compressedSize,
      });

      onChange(optimizedDataUrl);
    } catch (err) {
      console.error('Error processing uploaded image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setFileStats(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remove Photo</span>
          </button>
        )}
      </div>

      {/* Hidden File & Camera Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Box / Image Preview */}
      {!value ? (
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-5 text-center transition-all">
          {isProcessing ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-blue-900">Optimizing & Uploading Image...</p>
              <span className="text-[10px] text-slate-400">Compressing for high-speed cloud sync</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                <Camera className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800">
                  Take a photo or choose from device
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{subtitleText}</p>
              </div>

              {/* Action Buttons for Mobile & Desktop */}
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo with Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-slate-500" />
                  <span>Browse Device Gallery</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Image Preview Box */
        <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 group">
          <div className="relative h-48 sm:h-56 w-full flex items-center justify-center bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded maintenance issue"
              className="max-h-full max-w-full object-contain cursor-pointer transition-transform group-hover:scale-[1.02]"
              onClick={() => setPreviewModalOpen(true)}
            />

            {/* Overlay Bar */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-[11px]">Real Photo Attached</span>
                {fileStats && (
                  <span className="text-[10px] text-slate-300 hidden sm:inline">
                    ({formatBytes(fileStats.compSize)} optimized)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[11px] font-bold backdrop-blur-xs flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewModalOpen && value && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Full size maintenance issue"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-2xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
