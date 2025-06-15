// import { NextRequest, NextResponse } from "next/server";
// // import { getToken } from "next-auth/jwt";
// import { getBaseUrl } from "@/utils/helpers";

// export async function DELETE(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ): Promise<NextResponse> {
//   try {
//     // const token = await getToken({
//     //   req,
//     //   secret: process.env.NEXTAUTH_SECRET ?? "",
//     // });

//     const documentId = params.id;
//     if (!documentId) {
//       return NextResponse.json(
//         { error: "Document ID is required" },
//         { status: 400 }
//       );
//     }

//     const headers: Record<string, string> = {
//       "Content-Type": "application/json",
//     };
//     // if (token?.accessToken) {
//     //   headers["Authorization"] = `Bearer ${token.accessToken}`;
//     // }

//     // Example: Replace with your actual backend endpoint for deleting a document
//     const response = await fetch(
//       `${getBaseUrl({ isBackendAPI: true })}/documents/${documentId}`,
//       {
//         method: "DELETE",
//         headers: headers,
//       }
//     );

//     if (!response.ok) {
//       const errorData = await response
//         .json()
//         .catch(() => ({ message: "Unknown error from backend" }));
//       throw new Error(
//         `Failed to delete document: ${response.status} - ${
//           errorData.message || response.statusText
//         }`
//       );
//     }

//     // Assuming backend returns success confirmation or empty body
//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Error deleting document:", error);
//     return NextResponse.json(
//       { error: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }
import { getBaseUrl } from "@/utils/helpers";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Document ID is required" });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const response = await fetch(
      `${getBaseUrl({ isBackendAPI: true })}/api/documents/${id}`,
      {
        method: "DELETE",
        headers: headers,
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error from backend" }));
      throw new Error(
        `Failed to delete document: ${response.status} - ${
          errorData.message || response.statusText
        }`
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: (error as Error).message });
  }
}
