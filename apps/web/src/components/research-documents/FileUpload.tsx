import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, CircleCheck, AlertCircle } from "lucide-react";

const ALLOWED_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv",
  ".ppt", ".pptx", ".txt", ".png", ".jpg", ".jpeg", ".gif",
  ".zip", ".md",
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  uploadProgress?: number;
  isUploading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return `.${ext}`;
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  uploadProgress,
  isUploading = false,
  error,
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type "${ext}" is not supported. Allowed types: ${ALLOWED_EXTENSIONS.slice(0, 5).join(", ")}...`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`;
    }

    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    const file = files[0];
    if (file) {
      handleFile(file);
    }
  }, [disabled, handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const file = files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleRemove = useCallback(() => {
    setValidationError(null);
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onFileRemove]);

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {selectedFile ? (
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 truncate">
                  {selectedFile.name}
                </span>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                    disabled={disabled}
                  >
                    <X size={14} className="text-slate-400" />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatFileSize(selectedFile.size)} • {selectedFile.type || "Unknown type"}
              </div>
              {isUploading && uploadProgress !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {isUploading && uploadProgress === undefined && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </div>
              )}
              {!isUploading && uploadProgress === 100 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                  <CircleCheck size={14} />
                  Upload complete
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragOver
              ? "border-blue-400 bg-blue-50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <Upload size={24} className="mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-600">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Maximum size: {formatFileSize(MAX_FILE_SIZE)}
          </p>
          <p className="text-xs text-slate-400">
            Supported: PDF, DOCX, XLSX, PPTX, CSV, TXT, Images, ZIP
          </p>
        </div>
      )}

      {(validationError || error) && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{validationError || error}</span>
        </div>
      )}
    </div>
  );
}
