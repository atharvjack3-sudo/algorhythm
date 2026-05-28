import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/client";

export default function EditProfileModal({ isOpen, onClose, user, onUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Send the file to your backend route (which handles the Cloudinary upload)
      await api.post(`/upload-profile-picture`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (onUpdate) await onUpdate();
      handleClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to update profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  // Determine what to display: Local Preview > Existing Profile Link > Fallback Initial
  const displayUrl = previewUrl || user?.profile;
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : "?";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 w-full max-w-sm rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            EDIT PROFILE
          </div>
          <button 
            onClick={handleClose}
            disabled={uploading}
            className="font-mono text-[11px] text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none p-1 disabled:opacity-50"
          >
            CLOSE [X]
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 flex flex-col items-center gap-6 bg-slate-50 dark:bg-[#0d1117]">
          
          {/* Avatar Display - Using rounded-md to match your Dashboard style */}
          <div className="relative group">
            {displayUrl ? (
              <img 
                src={displayUrl} 
                alt="Profile Preview" 
                className="w-32 h-32 rounded-md object-cover border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900"
              />
            ) : (
              <div className={`w-32 h-32 rounded-md flex items-center justify-center font-sans text-6xl font-bold text-slate-900 dark:text-white shadow-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800`}>
                {initial}
              </div>
            )}
            
            {/* Hidden file input */}
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          <div className="flex flex-col items-center gap-2 w-full text-center">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="font-mono text-[11px] font-bold tracking-[0.08em] uppercase rounded-[3px] transition-colors bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-6 py-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedFile ? "CHANGE SELECTION" : "SELECT IMAGE"}
            </button>
            <p className="font-mono text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-1">
              JPG, PNG, WEBP. MAX 5MB.
            </p>
          </div>

          {error && (
            <div className="w-full px-4 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[3px] text-center shadow-sm">
              <span className="font-mono text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-widest">
                [ERROR] {error}
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white dark:bg-slate-900 px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button 
            onClick={handleClose}
            disabled={uploading}
            className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase rounded-[3px] transition-colors bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 px-4 py-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!selectedFile || uploading}
            className="font-mono text-[11px] font-bold tracking-[0.12em] rounded-[3px] transition-opacity duration-150 cursor-pointer bg-blue-600 text-white border-none px-6 py-2 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
          >
            {uploading ? "UPLOADING..." : "SAVE →"}
          </button>
        </div>

      </div>
    </div>
  );
}