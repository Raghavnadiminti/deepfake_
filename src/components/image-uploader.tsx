'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Upload } from 'lucide-react';

export default function ImageUploader() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6">
      <Input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden"
      />
      <Button onClick={handleUploadClick} size="lg">
        <Upload className="mr-2" />
        Select Image
      </Button>
      {imagePreview && (
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="relative aspect-video w-full">
              <Image
                src={imagePreview}
                alt="Selected image preview"
                fill
                className="rounded-md object-contain"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}