import axios, { AxiosInstance, AxiosError } from "axios";

/**
 * EPTA Files Client
 * A TypeScript client for interacting with the EPTA Files API
 */
export class EptaFilesClient {
  private client: AxiosInstance;

  constructor(baseURL: string, axiosInstance?: AxiosInstance) {
    if (axiosInstance) {
      this.client = axiosInstance;
    } else {
      this.client = axios.create({
        baseURL,
        headers: {
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      });
    }
  }

  /**
   * Fetch a file by its short code
   * @param shortCode - The short code of the file
   * @returns Buffer containing the file content
   */
  async getFile(shortCode: string): Promise<Buffer> {
    try {
      const response = await this.client.get<ArrayBuffer>(
        `/files/${shortCode}`
      );
      return Buffer.from(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch a file and get its metadata
   * @param shortCode - The short code of the file
   * @returns Object with file buffer and metadata
   */
  async getFileWithMetadata(
    shortCode: string
  ): Promise<{
    buffer: Buffer;
    contentType: string;
    filename?: string;
  }> {
    try {
      const response = await this.client.get<ArrayBuffer>(
        `/files/${shortCode}`
      );

      const contentType = String(
        response.headers["content-type"] || "application/octet-stream"
      );
      const contentDisposition = String(
        response.headers["content-disposition"] || ""
      );

      // Extract filename from Content-Disposition header
      let filename: string | undefined;
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }

      return {
        buffer: Buffer.from(response.data),
        contentType,
        filename,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a file as a Blob (useful for browsers)
   * @param shortCode - The short code of the file
   * @returns Blob containing the file content
   */
  async getFileAsBlob(shortCode: string): Promise<Blob> {
    try {
      const { buffer, contentType } =
        await this.getFileWithMetadata(shortCode);
      return new Blob([buffer], { type: contentType });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a file as Data URL (useful for images, etc.)
   * @param shortCode - The short code of the file
   * @returns Data URL string
   */
  async getFileAsDataUrl(shortCode: string): Promise<string> {
    try {
      const { buffer, contentType } =
        await this.getFileWithMetadata(shortCode);
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Download a file (Node.js - saves to disk)
   * @param shortCode - The short code of the file
   * @param outputPath - Path where to save the file
   */
  async downloadFile(shortCode: string, outputPath: string): Promise<void> {
    try {
      const fs = await import("fs").then((m) => m.promises);
      const { buffer } = await this.getFileWithMetadata(shortCode);
      await fs.writeFile(outputPath, buffer);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle and format API errors
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error: string; message?: string }>;

      if (axiosError.response?.status === 404) {
        const customError = new Error("File not found");
        (customError as any).status = 404;
        return customError;
      }

      if (axiosError.response?.status === 403) {
        const message =
          axiosError.response?.data?.message ||
          "Access denied. This file requires authentication.";
        const customError = new Error(message);
        (customError as any).status = 403;
        return customError;
      }

      const message =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Unknown error occurred";

      const customError = new Error(message);
      (customError as any).status = axiosError.response?.status;
      (customError as any).data = axiosError.response?.data;
      return customError;
    }

    return error instanceof Error ? error : new Error("Unknown error occurred");
  }
}

export default EptaFilesClient;
