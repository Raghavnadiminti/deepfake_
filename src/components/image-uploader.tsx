'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Upload, ShieldCheck } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { useToast } from '@/hooks/use-toast';

// Define the types for the API response
type DeepfakeResult = {
  classification: string;
  verdict: string;
  confidence: number;
};

type DetectDeepfakeOutput = {
  overall: DeepfakeResult;
  details: DeepfakeResult[];
};

export default function ImageUploader() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DetectDeepfakeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media: imagePreview,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error('API Proxy Error:', response.status, errorBody);
        throw new Error(errorBody.error || `API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      const transformResult = (res: any): DeepfakeResult => ({
        classification: res.classification,
        verdict: res.verdict,
        confidence: res.confidence,
      });
      
      const details = result.results ? Object.values(result.results).map(transformResult) : [];

      setAnalysis({
        overall: transformResult(result.overall),
        details: details,
      });

    } catch (error: any) {
      console.error('Error detecting deepfake:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error.message || 'Could not analyze the image. Please try again.',
      });
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeVariant = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'real':
        return 'default';
      case 'fake':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-6">
      <Input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden"
      />
      <Button onClick={handleUploadClick} size="lg" className="bg-accent hover:bg-accent/90">
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
              <ShieldCheck className="mr-2" />
              {isLoading ? 'Detecting...' : 'Detect Deepfake'}
            </Button>
            {isLoading && (
              <div className="w-full space-y-2 pt-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {analysis && (
              <div className="w-full text-sm text-muted-foreground pt-4">
                <h3 className="font-semibold text-foreground mb-2 text-lg">
                  Deepfake Detection Result:
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-base font-medium">Overall Verdict:</h4>
                  <Badge
                    variant={getBadgeVariant(analysis.overall.verdict)}
                    className="text-base"
                  >
                    {analysis.overall.verdict}
                  </Badge>
                  <span className="text-xs">
                    ({(analysis.overall.confidence * 100).toFixed(2)}%
                    confidence)
                  </span>
                </div>

                <h4 className="font-semibold text-foreground mb-2">Details:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Verdict</TableHead>
                      <TableHead className="text-right">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.details.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {detail.classification}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(detail.verdict)}>
                            {detail.verdict}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(detail.confidence * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
