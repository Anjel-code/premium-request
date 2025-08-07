import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  X, 
  Eye,
  FileImage,
  FileVideo
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  type: 'image' | 'video';
  placeholder?: string;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value,
  onChange,
  accept,
  type,
  placeholder,
  className = ""
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAccept = type === 'image' 
    ? 'image/*' 
    : 'video/*';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isValidType = type === 'image' 
      ? file.type.startsWith('image/')
      : file.type.startsWith('video/');

    if (!isValidType) {
      toast({
        title: "Invalid File Type",
        description: `Please select a valid ${type} file.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB for images, 50MB for videos)
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `${type === 'image' ? 'Image' : 'Video'} must be less than ${type === 'image' ? '5MB' : '50MB'}.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64 for local storage
      const base64 = await fileToBase64(file);
      
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Update the value with base64 data
      onChange(base64);
      
      toast({
        title: "Upload Successful",
        description: `${type === 'image' ? 'Image' : 'Video'} uploaded successfully.`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleRemoveFile = () => {
    onChange("");
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setPreviewUrl(null);
  };

  const getDisplayValue = () => {
    if (value.startsWith('data:')) {
      return "File uploaded";
    }
    return value || "";
  };

  const getPreviewSource = () => {
    if (value.startsWith('data:')) {
      return value;
    }
    return previewUrl || value;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      
      {/* File Upload Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload {type === 'image' ? 'Image' : 'Video'}
          </Button>
          
          <span className="text-xs text-muted-foreground">
            or enter URL below
          </span>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept || defaultAccept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* URL Input */}
      <div className="flex items-center gap-2">
        {type === 'image' ? (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Video className="h-4 w-4 text-muted-foreground" />
        )}
        <Input
          value={getDisplayValue()}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder || `Enter ${type} URL or upload file`}
          className="flex-1"
        />
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveFile}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Preview */}
      {getPreviewSource() && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Preview</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewUrl(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            {type === 'image' ? (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={getPreviewSource()}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <FileImage className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Invalid image URL</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  src={getPreviewSource()}
                  controls
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <FileVideo className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Invalid video URL</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload; 