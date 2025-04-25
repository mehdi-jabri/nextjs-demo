import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API endpoint URLs (replace with your actual endpoints)
const API_ENDPOINTS = {
  endpoint1: 'https://api.example.com/search/v1',
  endpoint2: 'https://api.example.com/search/v2',
  endpoint3: 'https://api.example.com/search/v3',
  endpoint4: 'https://api.example.com/search/v4',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchTerm } = body;

    // Validate search term
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.length !== 11) {
      return NextResponse.json(
        {
          success: false,
          message: 'Search term must be exactly 11 characters'
        },
        { status: 400 }
      );
    }

    // Call all endpoints in parallel
    const results = await Promise.allSettled([
      callEndpoint('API One', API_ENDPOINTS.endpoint1, searchTerm),
      callEndpoint('API Two', API_ENDPOINTS.endpoint2, searchTerm),
      callEndpoint('API Three', API_ENDPOINTS.endpoint3, searchTerm),
      callEndpoint('API Four', API_ENDPOINTS.endpoint4, searchTerm),
    ]);

    // Process the results
    const processedResults = {
      'API One': processResult(results[0]),
      'API Two': processResult(results[1]),
      'API Three': processResult(results[2]),
      'API Four': processResult(results[3]),
    };

    return NextResponse.json(processedResults);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process request'
      },
      { status: 500 }
    );
  }
}

// Helper function to call an API endpoint
async function callEndpoint(name: string, url: string, searchTerm: string) {
  try {
    // You can customize the request parameters for each API as needed
    const response = await axios.post(
      url,
      { query: searchTerm },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000 // 5 second timeout
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(`Error calling ${name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper function to process the Promise.allSettled results
function processResult(result: PromiseSettledResult<any>): any {
  if (result.status === 'fulfilled') {
    return result.value;
  } else {
    return {
      success: false,
      error: result.reason?.message || 'Request failed',
    };
  }
}
