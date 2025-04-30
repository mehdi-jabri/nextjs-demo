// lib/api/server-fetch.ts
// ... other imports

// Interface representing RFC 7807 Problem Details structure
// (Common fields used by Spring Boot)
interface ProblemDetail {
type?: string;       // URI identifier for the problem type
title?: string;      // Short, human-readable summary
status?: number;     // HTTP status code (should match response status)
detail?: string;     // Human-readable explanation specific to this occurrence
instance?: string;   // URI identifying the specific occurrence
// Allow any other custom extension properties
[key: string]: any;
}

// Optional: Type guard to check if an object resembles ProblemDetail
function isProblemDetail(obj: any): obj is ProblemDetail {
return (
obj &&
typeof obj === 'object' &&
(typeof obj.title === 'string' || typeof obj.detail === 'string') && // Require at least title or detail
typeof obj.status === 'number' // Require status
// You could add more checks here (e.g., for 'type') if needed
);
}

// ... ErrorResponse interface and createErrorResponse function ...
// ... ServerFetchOptions interface ...


// lib/api/server-fetch.ts

export async function makeServerFetch(
externalUrl: string,
options: ServerFetchOptions = {},
requiresAuth: boolean = true
): Promise<NextResponse> {

// ... (1. Authentication and 2. Prepare Fetch Request sections remain the same) ...

// 3. Execute Fetch and Handle Response
try {
console.log(`[Server Fetch] Requesting: ${options.method || 'GET'} ${externalUrl}`);
const response = await fetch(externalUrl, fetchOptions);

    let responseData: any = null;
    const contentType = response.headers.get("content-type");

    // Attempt to parse JSON body, especially if it's application/problem+json
    if (contentType && (contentType.includes("application/json") || contentType.includes("application/problem+json"))) {
         try {
             responseData = await response.json();
         } catch (parseError) {
             console.warn(`[Server Fetch] Failed to parse JSON/ProblemDetail response from ${externalUrl} (Status: ${response.status}):`, parseError);
             if (!response.ok) {
                 // If it failed, and we expected JSON/ProblemDetail, return a generic error
                 return createErrorResponse(`External API Error: Invalid JSON response. Status: ${response.status} ${response.statusText}`, response.status);
             }
             // If OK status but failed parse, responseData remains null
         }
    } else if (response.status === 204) {
        return new NextResponse(null, { status: 204 });
    }
    // else: Non-JSON/Problem response, responseData remains null.

    // --- UPDATED Error Handling Block ---
    if (!response.ok) {
        let message: string;
        let details: any = responseData; // Default details to the parsed body

        // Check if the parsed response body looks like a ProblemDetail
        if (isProblemDetail(responseData)) {
            console.log("[Server Fetch] Detected ProblemDetail response.");
            // Prioritize ProblemDetail fields for the message
            message = responseData.title || responseData.detail || `External API Error (${responseData.status || response.status})`;
            // The entire ProblemDetail object becomes the details
            details = responseData;
        } else {
            // Fallback for non-ProblemDetail errors or if parsing failed
            message = responseData?.message || responseData?.error || `External API Error: ${response.status} ${response.statusText}`;
            // Keep parsed responseData as details if available
            details = responseData || undefined;
        }

        // Call createErrorResponse with extracted/fallback message and details
        // Use response.status as the authoritative status code
        return createErrorResponse(message, response.status, details);
    }
    // --- End of UPDATED Error Handling Block ---

    // 5. Handle Success (remains the same)
    console.log(`[Server Fetch] Success: ${response.status} from ${externalUrl}`);
    return NextResponse.json(responseData, { status: response.status });

} catch (networkError: any) {
// ... (Network error handling remains the same) ...
console.error(`[Server Fetch] Network or fetch execution error for ${externalUrl}:`, networkError);
return createErrorResponse('Internal Server Error: Failed to connect to external service.', 500, networkError.message);
}
}

// ... The rest of the file (example usage in app/api/users/route.ts) ...
