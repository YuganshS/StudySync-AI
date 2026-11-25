import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category');
    const teacherEmail = formData.get('teacherEmail');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check if backend is deployed
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    console.log('Backend URL from env:', backendUrl);
    // Forward to backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('category', category || 'general');
    if (teacherEmail) {
      backendFormData.append('teacherEmail', teacherEmail);
      backendFormData.append('uploadedBy', teacherEmail);
    }

    const fullUrl = `${backendUrl.replace(/\/$/, '')}/upload-file`;
    console.log('Fetching backend URL:', fullUrl);
    const response = await fetch(fullUrl, {
      method: 'POST',
      body: backendFormData,
    });

    // Backend might return non-JSON on crashes/proxy errors; capture raw body for debugging.
    const raw = await response.text();
    let result;
    try {
      result = raw ? JSON.parse(raw) : {};
    } catch {
      result = { error: 'Backend returned non-JSON response', raw };
    }

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    // Return upload result; ingestion is handled inside the backend upload route
    return NextResponse.json({ ...result });
  } catch (error) {
    console.error('Upload proxy error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed - proxy error',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
