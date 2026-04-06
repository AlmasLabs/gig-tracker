import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const date = searchParams.get('date'); // Format: DD-MM-YYYY

  if (!artist || !date) return NextResponse.json({ error: 'Mangler info' }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artist)}&date=${date}`,
      {
        headers: {
          'Accept': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_SETLIST_API_KEY || '',
        }
      }
    );

    const data = await res.json();
    // Setlist.fm returnerer ofte en liste, vi tar den første matchen
    const setlist = data.setlist ? data.setlist[0] : null;
    return NextResponse.json(setlist);
  } catch (error) {
    return NextResponse.json({ error: 'Kunne ikke hente settliste' }, { status: 500 });
  }
}