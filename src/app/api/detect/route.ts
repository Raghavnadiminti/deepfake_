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
      const errorBody = await realityDefenderResponse.text();
      console.error('Reality Defender API Error:', errorBody);
      // Forward the actual error from Reality Defender
      return new NextResponse(errorBody, {
        status: realityDefenderResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await realityDefenderResponse.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Proxy API Error:', error);
    // This will catch errors from request.json() or if the fetch itself fails
    return NextResponse.json(
        { error: error.message || 'An unexpected error occurred in the proxy.' },
        { status: 500 }
    );
  }
}
