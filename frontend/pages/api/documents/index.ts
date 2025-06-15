import { getBaseUrl } from "@/utils/helpers";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const headers: Record<string, string> = {};

    const response = await fetch(
      `${getBaseUrl({ isBackendAPI: true })}/api/documents`,
      {
        method: "GET",
        headers: headers,
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error from backend" }));
      throw new Error(
        `Failed to fetch documents: ${response.status} - ${
          errorData.message || response.statusText
        }`
      );
    }

    const responseData = await response.json();
    console.log(responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: (error as Error).message });
  }
}
