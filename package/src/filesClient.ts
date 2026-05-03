import axios, { AxiosInstance, AxiosError } from "axios";
import { FileUploadResponse } from "./types";

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
        `/f/${shortCode}`
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
        `/f/${shortCode}`
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
   * Upload a file to the seed project
   * @param file - The file to upload (File object from browser or Buffer from Node.js)
   * @param filePath - Optional custom path for the file in the repository (default: original filename)
   * @returns Upload response with file details, download URL, and short code
   */
  async uploadFile(
    file: File | Buffer,
    filePath?: string
  ): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();

      // Handle both File (browser) and Buffer (Node.js)
      if (file instanceof File) {
        formData.append("file", file);
      } else if (Buffer.isBuffer(file)) {
        // Convert Buffer to Blob for FormData
        const blob = new Blob([file]);
        formData.append("file", blob, "file");
      } else {
        throw new Error("File must be a File object or Buffer");
      }

      // Add optional path parameter
      if (filePath) {
        formData.append("path", filePath);
      }

      // Create a new instance for file upload without arraybuffer responseType
      const uploadClient = axios.create({
        baseURL: this.client.defaults.baseURL,
        headers: this.client.defaults.headers,
      });

      // Copy interceptors if this.client has them
      if ((this.client as any).interceptors?.request) {
        uploadClient.interceptors.request.handlers =
          (this.client as any).interceptors.request.handlers;
      }

      const response = await uploadClient.post<FileUploadResponse>(
        "/f/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
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
