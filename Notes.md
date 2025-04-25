// lib/api/server-fetch.ts (Create this new file)
import { auth } from '@/auth'; // Adjust path to your NextAuth/Auth.js config
import { NextResponse } from 'next/server';

// Define a standard error response structure for your internal API routes
interface ErrorResponse {
message: string;
status: number; // HTTP status code
details?: any;  // Optional field for more specific error info from external API
}

/**
* Creates a standardized JSON error response.
  */
  function createErrorResponse(message: string, status: number, details?: any): NextResponse<ErrorResponse> {
  console.error(`[API Error Response] Status: ${status}, Message: ${message}`, details ? `Details: ${JSON.stringify(details)}` : '');
  return NextResponse.json({ message, status, details }, { status });
  }

/**
* Options for the server fetch helper. Extends standard RequestInit.
  */
  interface ServerFetchOptions extends RequestInit {
  // You can add custom options here if needed later
  }

/**
* Reusable helper to perform authenticated fetch calls from Next.js server environments (Route Handlers, Server Actions).
* Handles authentication, executes fetch, parses response, and returns standardized NextResponse objects.
* Leverages Next.js extended fetch for caching/deduplication (unless overridden in options).
*
* @param externalUrl The full URL to the external API endpoint.
* @param options Standard fetch options (method, headers, body, cache, next options etc.).
* @param requiresAuth If true (default), fetches server session and adds Authorization header.
* @returns A NextResponse promise containing either the successful data or a standardized error object.
  */
  export async function makeServerFetch(
  externalUrl: string,
  options: ServerFetchOptions = {},
  requiresAuth: boolean = true
  ): Promise<NextResponse> {

  let accessToken: string | undefined;

  // 1. Authentication
  if (requiresAuth) {
  try {
  const session = await auth(); // Get session on the server
  if (!session?.access_token) {
  return createErrorResponse('Unauthorized: No valid session found.', 401);
  }
  accessToken = session.access_token;
  } catch (authError) {
  console.error("[Server Fetch] Authentication error:", authError);
  return createErrorResponse('Authentication failed.', 500);
  }
  }

  // 2. Prepare Fetch Request
  const fetchOptions: RequestInit = {
  ...options, // Spread user options first
  headers: {
  'Content-Type': 'application/json', // Default, can be overridden below
  ...options.headers, // Spread user headers, potentially overriding Content-Type
  ...(accessToken && { Authorization: `Bearer ${accessToken}` }), // Add Auth token if available/required
  },
  };

  // Ensure body is stringified if it's an object and content type is JSON
  if (fetchOptions.body && typeof fetchOptions.body === 'object' && (fetchOptions.headers as Record<string, string>)['Content-Type'] === 'application/json') {
  try {
  fetchOptions.body = JSON.stringify(fetchOptions.body);
  } catch (stringifyError) {
  console.error("[Server Fetch] Error stringifying request body:", stringifyError);
  return createErrorResponse('Internal Server Error: Could not process request body.', 500);
  }
  }

  // 3. Execute Fetch and Handle Response
  try {
  console.log(`[Server Fetch] Requesting: ${fetchOptions.method || 'GET'} ${externalUrl}`);
  const response = await fetch(externalUrl, fetchOptions);

       // Attempt to parse response body for both success and error cases
       let responseData: any = null;
       const contentType = response.headers.get("content-type");
       if (contentType && contentType.includes("application/json")) {
            try {
                responseData = await response.json();
            } catch (parseError) {
                console.warn(`[Server Fetch] Failed to parse JSON response from ${externalUrl} (Status: ${response.status}):`, parseError);
                // If it was supposed to be JSON but failed, treat it as an error condition unless status is 2xx
                if (!response.ok) {
                    return createErrorResponse(`External API Error: Invalid JSON response received. Status: ${response.status}`, response.status);
                }
                // If it was 2xx but not parsable JSON, maybe return empty or handle differently?
                // For now, we proceed but responseData will be null.
            }
       } else if (response.status === 204) {
           // Handle No Content response
           return new NextResponse(null, { status: 204 });
       }
       // else: Non-JSON response, responseData remains null.

       // 4. Handle HTTP Errors (response not ok)
       if (!response.ok) {
           // Use details from parsed error response if available, otherwise use status text
           const message = responseData?.message || responseData?.error || `External API Error: ${response.statusText}`;
           const details = responseData ? (responseData.details || responseData) : undefined; // Pass along any other data
           return createErrorResponse(message, response.status, details);
       }

       // 5. Handle Success
       console.log(`[Server Fetch] Success: ${response.status} from ${externalUrl}`);
       // Return parsed data (which might be null for non-JSON or failed parse on 2xx)
       // Status code from the original response is preserved
       return NextResponse.json(responseData, { status: response.status });

  } catch (networkError: any) {
  // Handle network errors (DNS, connection refused, etc.)
  console.error(`[Server Fetch] Network or fetch execution error for ${externalUrl}:`, networkError);
  return createErrorResponse('Internal Server Error: Failed to connect to external service.', 500, networkError.message);
  }
  }

// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { makeServerFetch } from '@/lib/api/server-fetch'; // Adjust path

const USERS_API_URL = process.env.USERS_API_URL;

export async function GET(request: NextRequest) {
if (!USERS_API_URL) {
// Use NextResponse directly for config errors
return NextResponse.json({ message: 'Configuration error: Users API URL not set.' }, { status: 500 });
}

    const endpoint = `${USERS_API_URL}/users`;

    // Example: Default Next.js fetch caching will apply.
    // To force no cache: const options = { cache: 'no-store' as RequestCache };
    // To revalidate: const options = { next: { revalidate: 60 } }; // Revalidate every 60 seconds
    return makeServerFetch(endpoint, { method: 'GET' });
}

// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { makeServerFetch } from '@/lib/api/server-fetch'; // Adjust path

const MAIN_API_URL = process.env.MAIN_API_URL;

export async function POST(request: NextRequest) {
if (!MAIN_API_URL) {
return NextResponse.json({ message: 'Configuration error: Main API URL not set.' }, { status: 500 });
}

    let requestBody: any;
    try {
        requestBody = await request.json(); // Parse body sent from client
    } catch (e) {
        return NextResponse.json({ message: 'Invalid request body: Must be valid JSON.' }, { status: 400 });
    }

    const endpoint = `${MAIN_API_URL}/posts`;

    // The helper function handles stringifying the body object
    const response = await makeServerFetch(endpoint, {
        method: 'POST',
        body: requestBody, // Pass the parsed JS object
    });

    // Optional: Adjust status code if needed (e.g., return 201 Created)
    // The helper returns the status from the external API. If it's 200, but you want 201:
    if (response.ok && response.status === 200) {
        try {
            const data = await response.json(); // Re-parse (or ideally adjust helper to return parsed data)
            return NextResponse.json(data, { status: 201 });
        } catch {
             // Handle potential re-parsing error, though unlikely if response.ok
            return response; // return original 200 response
        }
    }

    return response; // Return the response from the helper (could be success or error)
}

// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { makeServerFetch } from '@/lib/api/server-fetch'; // Adjust path

const ANALYTICS_API_URL = process.env.ANALYTICS_API_URL;

export async function GET(request: NextRequest) {
if (!ANALYTICS_API_URL) {
return NextResponse.json({ message: 'Configuration error: Analytics API URL not set.' }, { status: 500 });
}

    const endpoint = `${ANALYTICS_API_URL}/dashboard`;

    // Example: Force fetch to bypass cache for this specific request
    const options = { cache: 'no-store' as RequestCache };

    return makeServerFetch(endpoint, { method: 'GET', ...options });
}

// Example client-side fetch and error handling
async function fetchUsersFromInternalApi() {
try {
const response = await fetch('/api/users'); // Call internal route handler
if (!response.ok) {
// Attempt to parse the standardized error from the route handler
const errorData = await response.json();
console.error('API Error:', errorData);
// Throw an object matching the expected structure for UI handling
throw {
message: errorData.message || `HTTP error! status: ${response.status}`,
status: errorData.status || response.status,
details: errorData.details
};
}
const users = await response.json();
return users;
} catch (error) {
console.error('Failed to fetch users:', error);
// Re-throw the structured error or handle it
throw error;
}
}

// In your component's error display:
// if (error) {
//   return <div>Error: {error.message} {error.details ? JSON.stringify(error.details) : ''}</div>
// }
