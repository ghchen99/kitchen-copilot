import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { analyzeImage } from '@/lib/api-client';
import { IngredientsResponse } from '@/types';
import { toast } from 'sonner';

interface ImageUploadProps {
  onAnalysisComplete: (result: IngredientsResponse) => void;
  onUploadStart: () => void;
}

export function ImageUpload({ onAnalysisComplete, onUploadStart }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    
    // Clean up function to revoke the object URL when done
    return () => URL.revokeObjectURL(previewUrl);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!previewImage) {
      toast.error('Please select an image first');
      return;
    }

    try {
      onUploadStart();
      setUploading(true);
      

      // Get the original file from the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) {
        throw new Error('No file selected');
      }

      const file = fileInput.files[0];
      const result = await analyzeImage(file);
      
      
      onAnalysisComplete(result);
      
      toast.success('Image analyzed successfully!');
    } catch (error) {
      toast.error('Failed to analyze image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {previewImage ? (
              <div className="space-y-4">
                <div className="relative mx-auto max-w-xs">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="mx-auto max-h-56 rounded-md object-contain" 
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click or drag to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Drag & drop your fridge photo</h3>
                <p className="text-sm text-muted-foreground">
                  or click to browse files (JPEG, PNG)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploading && (
        <div className="space-y-2">
          <Progress value={undefined} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            Analyzing your ingredients...
          </p>
        </div>
      )}

      <Button 
        onClick={handleUpload} 
        disabled={!previewImage || uploading} 
        className="w-full"
      >
        {uploading ? 'Analyzing...' : 'Analyze Ingredients'}
      </Button>
    </div>
  );
}