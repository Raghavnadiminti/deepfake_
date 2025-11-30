'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Upload, ShieldCheck, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
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

type ModelDetail = {
  name: string;
  status: string;
  confidence: number;
};

type DeepfakeResult = {
  classification: string;
  verdict: string;
  confidence: number;
};

type DetectDeepfakeOutput = {
  overall: DeepfakeResult & {
    manipulatedModelsCount?: number;
    totalModelsUsed?: number;
  };
  details: ModelDetail[];
  rawResult?: any;
  summary?: {
    totalModels: number;
    manipulatedCount: number;
    authenticCount: number;
    detectionLogic: string;
  };
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
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please select a valid image file (JPG, PNG, GIF, or WebP)',
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Maximum file size is 10MB. Please select a smaller image.',
        });
        return;
      }

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
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media: imagePreview,
        }),
      });

      if (!response.ok) {
        const errorBodyText = await response.text();
        console.error('API Error:', response.status, errorBodyText);
        let errorJson;
        try {
          errorJson = JSON.parse(errorBodyText);
        } catch (e) {
          // Not JSON
        }
        throw new Error(
          errorJson?.error || errorBodyText || `API request failed: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log('Analysis Result:', result);

      if (result.error) {
        throw new Error(result.error);
      }

      setAnalysis(result);
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
    const v = verdict.toLowerCase();
    if (v === 'real') return 'default';
    if (v === 'fake' || v === 'deepfake') return 'destructive';
    if (v === 'suspicious') return 'secondary';
    return 'secondary';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'MANIPULATED') {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'MANIPULATED' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20';
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-6">
      <Input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden"
      />
      <Button onClick={handleUploadClick} size="lg" className="bg-accent hover:bg-accent/90">
        <Upload className="mr-2 h-5 w-5" />
        Select Image
      </Button>

      {imagePreview && (
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="relative aspect-video w-full bg-gray-100 rounded-md overflow-hidden">
              <Image
                src={imagePreview}
                alt="Selected image preview"
                fill
                className="object-contain"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4 p-4 pt-0">
            <Button
              onClick={handleAnalyzeClick}
              disabled={isLoading}
              className="w-full"
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              {isLoading ? 'Analyzing...' : 'Analyze Image'}
            </Button>

            {isLoading && (
              <div className="w-full space-y-2 pt-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}

            {analysis && (
              <div className="w-full space-y-4 pt-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-3 text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Detection Results
                  </h3>

                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Overall Verdict:</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={getBadgeVariant(analysis.overall.verdict)}>
                          {analysis.overall.verdict.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Classification:</span>
                      <span className="text-sm">{analysis.overall.classification}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Confidence Score:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              analysis.overall.confidence > 0.7
                                ? 'bg-red-500'
                                : analysis.overall.confidence > 0.4
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${analysis.overall.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono">
                          {(analysis.overall.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {analysis.summary && (
                      <>
                        <hr className="my-2" />
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Total Models Used:</span>
                            <span className="font-semibold">{analysis.summary.totalModels}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Manipulated Detections:</span>
                            <span className={`font-semibold ${analysis.summary.manipulatedCount > 2 ? 'text-red-600' : 'text-yellow-600'}`}>
                              {analysis.summary.manipulatedCount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Authentic Detections:</span>
                            <span className="font-semibold text-green-600">{analysis.summary.authenticCount}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {analysis.details && analysis.details.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-sm">Model Analysis ({analysis.details.length} models):</h4>
                    <div className="overflow-x-auto space-y-2">
                      {analysis.details.map((detail, index) => (
                        <div
                          key={index}
                          className={`rounded-lg p-3 flex items-center justify-between ${getStatusColor(detail.status)}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {getStatusIcon(detail.status)}
                            <div>
                              <p className="text-sm font-medium">{detail.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {detail.status === 'MANIPULATED' ? 'Detected as Manipulated' : 'Detected as Authentic'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={detail.status === 'MANIPULATED' ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {detail.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              {(detail.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex gap-2 text-xs">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">Detection Logic:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>
                        <strong>&gt; 2 models detect MANIPULATED:</strong> Image is marked as FAKE
                      </li>
                      <li>
                        <strong>1-2 models detect MANIPULATED:</strong> Image is marked as SUSPICIOUS
                      </li>
                      <li>
                        <strong>0 models detect MANIPULATED:</strong> Image is marked as REAL
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}