import { getBaseUrl } from "@/utils/helpers";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { question, session_id } = req.body as {
      question: string;
      session_id?: string;
    };

    if (!question) {
      res.status(400).json({ error: "Question is required" });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const response = await fetch(
      `${getBaseUrl({ isBackendAPI: true })}/api/chat`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ question, session_id }),
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error from backend" }));
      throw new Error(
        `Backend chat failed: ${response.status} - ${
          errorData.message || response.statusText
        }`
      );
    }

    const responseData = await response.json();
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: (error as Error).message });
  }
}
