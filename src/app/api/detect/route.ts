import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { media } = await request.json();
    const apiKey = process.env.REALITY_DEFENDER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Reality Defender API key is not configured.' },
        { status: 500 }
      );
    }
    
    if (!media) {
        return NextResponse.json(
            { error: 'Media data is required.' },
            { status: 400 }
        );
    }

    const realityDefenderResponse = await fetch('https://api.realitydefender.com/v1/media/detect', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media: media,
        async: false, // Wait for the result synchronously
      }),
    });

    if (!realityDefenderResponse.ok) {
      const errorBody = await realityDefenderResponse.text(); // Read error as text to avoid JSON parsing errors
      console.error('Reality Defender API Error:', errorBody);
      return NextResponse.json(
        { error: `Failed to detect deepfake: ${errorBody}` },
        { status: realityDefenderResponse.status }
      );
    }

    const result = await realityDefenderResponse.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Proxy API Error:', error);
    return NextResponse.json(
        { error: 'An unexpected error occurred.' },
        { status: 500 }
    );
  }
}
