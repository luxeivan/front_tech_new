import { NextResponse } from 'next/server';
import tls from 'tls'
import https from 'https'

const agent = new https.Agent({
  rejectUnauthorized: true
})


export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch(
      // 'http://mvitu.arki.mosreg.ru/api/edds/api_incident/create.php', 
      'https://mvitu.arki.mosreg.ru/api/edds/api_incident/electricity/create.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "HTTP-X-API-TOKEN": "936868a9775a81e51854fa698d1643e9aca3c0c4",
          "Accept": "application/json"
        },
        body: JSON.stringify(body),
age
      }, agent);

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.log("error", error);

    return new NextResponse(error, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    },);
  }
}
