import { NextRequest, NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";
import { getBaseUrl } from "@/utils/helpers";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // const token = await getToken({
    //   req,
    //   secret: process.env.NEXTAUTH_SECRET ?? "",
    // });

    const requestBody = await req.json(); // Assuming data is sent in JSON body

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // if (token?.accessToken) {
    //   headers["Authorization"] = `Bearer ${token.accessToken}`;
    // }

    // Example: Replace with your actual backend endpoint for generating charts
    const response = await fetch(
      `${getBaseUrl({ isBackendAPI: true })}/analysis/generate-chart`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error from backend" }));
      throw new Error(
        `Backend chart generation failed: ${response.status} - ${
          errorData.message || response.statusText
        }`
      );
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error generating chart:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
