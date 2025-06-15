import { NextApiRequest, NextApiResponse } from "next";
import { getBaseUrl } from "@/utils/helpers";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser to handle uploads manually
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const form = formidable({}); // Initialize formidable

    // Parse the incoming request
    const [_, files] = await form.parse(req);

    const file = files.file ? files.file[0] : null; // Access the first file from the 'file' field

    if (!file) {
      return res
        .status(400)
        .json({ error: "No file uploaded or invalid file type" });
    }

    // Read the file content from the temporary path
    const fileBuffer = fs.readFileSync(file.filepath);

    // Create a Blob from the file buffer (for FormData compatibility)
    const fileBlob = new Blob([fileBuffer], {
      type: file.mimetype || "application/octet-stream",
    });

    const backendFormData = new FormData();
    // Append the Blob with its original filename
    backendFormData.append(
      "file",
      fileBlob,
      file.originalFilename || "untitled"
    );

    const headers: Record<string, string> = {};
    // Note: 'Content-Type': 'multipart/form-data' is usually NOT set manually
    // when using FormData in fetch. The browser/Node.js fetch API handles it
    // automatically with the correct boundary. Manually setting it can break it.
    // So, we'll remove it here.

    const response = await fetch(
      `${getBaseUrl({ isBackendAPI: true })}/api/upload`,
      {
        method: "POST",
        headers: headers, // Pass only other headers if any, not Content-Type
        body: backendFormData,
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error from backend" }));
      console.error(
        `Backend upload failed: ${response.status} - ${
          errorData.message || response.statusText
        }`
      );
      return res.status(response.status).json({
        error: `Backend upload failed: ${response.status} - ${
          errorData.message || response.statusText
        }`,
      });
    }

    const responseData = await response.json();
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error uploading PDF:", error);
    // Ensure the error response is always sent, and only once.
    if (!res.headersSent) {
      // Prevent "Headers already sent" error
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
