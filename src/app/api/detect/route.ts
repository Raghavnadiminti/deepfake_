import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { media } = body;

    if (!media) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer if needed
    let imageBuffer: Buffer;
    if (media.startsWith('data:image')) {
      // Remove data URL prefix
      const base64Data = media.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = Buffer.from(media, 'base64');
    }

    // Save to temporary file for Reality Defender SDK
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `deepfake_${Date.now()}.jpg`);

    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, imageBuffer);

    // Initialize Reality Defender SDK
    const { RealityDefender } = require('@realitydefender/realitydefender');
    const realityDefender = new RealityDefender({
      apiKey: process.env.REALITY_DEFENDER_API_KEY,
    });

    // Detect deepfake
    const result = await realityDefender.detect({
      filePath: tempFilePath,
    });

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    // ===== NEW LOGIC: Count MANIPULATED models =====
  const models = result?.models || [];
  console.log(models) 
  console.log(result) 
  
const manipulatedCount = models.filter(
  (m: any) => m.status == "MANIPULATED"
).length;

console.log(manipulatedCount)
    // If more than 2 models detected as MANIPULATED, override verdict to FAKE
    let classification = result.classification || 'unknown';
    let verdict = result.verdict || 'unknown';
    let confidence = result.confidence || 0;

    if (manipulatedCount > 2) {
      classification = 'FAKE';
      verdict = 'FAKE';
      // Optionally calculate confidence from models
      if (result.rawResult?.score) {
        confidence = result.rawResult.score;
      }
    }
    else{
      classification = 'Real';
      verdict = 'Real'
    }

    // Transform result to match expected format
    const transformedResult = {
      overall: {
        classification,
        verdict,
        confidence,
      },
      details: result.details || [],
      rawResult: result.rawResult || result,
      // Optional: include manipulated model count for debugging
      _metadata: {
        manipulatedModelCount: manipulatedCount,
      },
    };

    return NextResponse.json(transformedResult);
  } catch (error: any) {
    console.error('Deepfake detection error:', error);
    return NextResponse.json(
      { error: error.message || 'Deepfake detection failed' },
      { status: 500 }
    );
  }
}