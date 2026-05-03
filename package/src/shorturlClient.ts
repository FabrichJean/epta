import axios, { AxiosInstance, AxiosError } from "axios";
import {
  CreateShortUrlResponse,
  MyShortUrlsResponse,
  DeleteShortUrlResponse,
  ErrorResponse,
} from "./types";

/**
 * EPTA Short URL Client
 * A TypeScript client for managing short URLs
 * Note: Authentication is handled by EptaApp
 */
export class EptaShortUrlClient {
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
      });
    }
  }

  /**
   * Create a short URL for a given URL
   * Requires valid JWT token
   * @param url - The URL to shorten
   * @returns CreateShortUrlResponse with the short URL
   */
  async shortenUrl(url: string): Promise<CreateShortUrlResponse> {
    try {
      const response = await this.client.post<CreateShortUrlResponse>(
        "/s/shorten",
        { url }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all short URLs created by the current user
   * Requires valid JWT token
   * @returns MyShortUrlsResponse with all user's short URLs
   */
  async getMyShortUrls(): Promise<MyShortUrlsResponse> {
    try {
      const response = await this.client.get<MyShortUrlsResponse>(
        "/s/my-urls"
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a short URL
   * Requires valid JWT token
   * @param shortCode - The short code of the URL to delete
   * @returns DeleteShortUrlResponse with deletion confirmation
   */
  async deleteShortUrl(shortCode: string): Promise<DeleteShortUrlResponse> {
    try {
      const response = await this.client.delete<DeleteShortUrlResponse>(
        `/s/${shortCode}`
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
      const axiosError = error as AxiosError<ErrorResponse>;
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

export default EptaShortUrlClient;
