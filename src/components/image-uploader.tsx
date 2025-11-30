'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Upload, Wand2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { describeImage } from '@/ai/flows/describe-image-flow';

export default function ImageUploader() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnalysis(null);
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

  const handleAnalyzeClick = async () => {
    if (!imagePreview) return;

    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await describeImage({ photoDataUri: imagePreview });
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysis('Sorry, an error occurred while analyzing the image.');
    } finally {
      setIsLoading(false);
    }
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
          <CardFooter className="flex flex-col items-start gap-4 p-4 pt-0">
            <Button
              onClick={handleAnalyzeClick}
              disabled={isLoading}
              className="w-full"
            >
              <Wand2 className="mr-2" />
              {isLoading ? 'Analyzing...' : 'Analyze Image'}
            </Button>
            {isLoading && (
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            )}
            {analysis && (
              <div className="text-sm text-muted-foreground">
                <h3 className="font-semibold text-foreground mb-2">
                  AI Analysis:
                </h3>
                <p>{analysis}</p>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
