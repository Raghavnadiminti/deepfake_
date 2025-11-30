import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';

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

    // Sightengine API credentials
    const API_USER = process.env.SIGHTENGINE_API_USER;
    const API_SECRET = process.env.SIGHTENGINE_API_SECRET;

    if (!API_USER || !API_SECRET) {
      return NextResponse.json(
        { error: 'API credentials not configured' },
        { status: 500 }
      );
    }

    console.log('Starting Sightengine API call');
    console.log('API_USER configured:', !!API_USER);
    console.log('API_SECRET configured:', !!API_SECRET);

    // Convert base64 to buffer
    let imageBuffer: Buffer;
    
    if (media.startsWith('data:image')) {
      const base64Data = media.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = Buffer.from(media, 'base64');
    }

    console.log('Image buffer size:', imageBuffer.length, 'bytes');

    // Create FormData using form-data npm package
    const FormData = require('form-data');
    const form = new FormData();
    
    // Create readable stream from buffer
    const stream = Readable.from(imageBuffer);
    
    // Append in correct order - API parameters first, then media
    form.append('api_user', API_USER);
    form.append('api_secret', API_SECRET);
    form.append('models', 'deepfake');
    form.append('media', stream, 'image.jpg');

    console.log('FormData created successfully');

    // Get headers before sending
    const headers = form.getHeaders();
    console.log('Headers:', Object.keys(headers));

    // Call Sightengine API with proper timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: form,
      headers: headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text();
    console.log('Sightengine Response Status:', response.status);
    console.log('Sightengine Response Body:', responseText);

    // Check for HTTP errors
    if (!response.ok) {
      console.error('HTTP Error:', response.status);
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    // Parse response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response:', responseText);
      throw new Error(`Invalid JSON response from Sightengine: ${responseText}`);
    }

    console.log('Parsed result:', JSON.stringify(result, null, 2));

    // Check for API errors in response body
    if (result.status === 'failure') {
      const errorMsg = result.error?.message || 'Unknown error';
      console.error('Sightengine API failure:', errorMsg);
      throw new Error(`Sightengine API failure: ${errorMsg}`);
    }

    // Map Sightengine response to our format
    let overallVerdict = 'REAL';
    let classification = 'Authentic Image';
    let overallConfidence = result.score || 0;

    if (result.status === 'MANIPULATED') {
      overallVerdict = 'FAKE';
      classification = 'Deepfake/Manipulated Image';
      overallConfidence = result.score || 0.9;
      console.log('Result: Image detected as MANIPULATED');
    } else if (result.status === 'AUTHENTIC') {
      overallVerdict = 'REAL';
      classification = 'Authentic Image';
      overallConfidence = 1 - (result.score || 0);
      console.log('Result: Image detected as AUTHENTIC');
    }

    // Extract model details
    const modelDetails: any[] = [];
    let manipulatedCount = 0;
    let totalModels = 0;

    if (result.models && Array.isArray(result.models)) {
      totalModels = result.models.length;
      
      result.models.forEach((model: any) => {
        if (model.status === 'MANIPULATED') {
          manipulatedCount++;
        }
        
        modelDetails.push({
          name: model.name,
          status: model.status,
          confidence: model.score,
        });
      });
      
      console.log(`Models: ${totalModels} total, ${manipulatedCount} manipulated`);
    }

    // Transform result to expected format
    const transformedResult = {
      overall: {
        classification: classification,
        verdict: overallVerdict,
        confidence: overallConfidence,
        manipulatedModelsCount: manipulatedCount,
        totalModelsUsed: totalModels,
      },
      details: modelDetails,
      rawResult: result,
      summary: {
        totalModels: totalModels,
        manipulatedCount: manipulatedCount,
        authenticCount: totalModels - manipulatedCount,
        detectionLogic: 'Using Sightengine overall status: MANIPULATED → FAKE; AUTHENTIC → REAL',
      },
    };

    console.log('Returning transformed result');
    return NextResponse.json(transformedResult);

  } catch (error: any) {
    console.error('Detection error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Image analysis failed' },
      { status: 500 }
    );
  }
}