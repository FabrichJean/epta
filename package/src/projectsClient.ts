import axios, { AxiosInstance, AxiosError } from "axios";
import {
  Project,
  CreateProjectResponse,
  GetProjectsResponse,
  GetContentsResponse,
  CreateFileResponse,
  CreateFolderResponse,
  UploadFileResponse,
  GetStarredFilesResponse,
  StarFileResponse,
  UnstarFileResponse,
  UpdateProjectResponse,
  DeleteProjectResponse,
  ErrorResponse,
} from "./types";

/**
 * EPTA Projects Client
 * A TypeScript client for managing projects and project files
 * Note: Authentication is handled by EptaApp
 */
export class EptaProjectsClient {
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
   * Create a new project with a GitHub repository
   * Requires valid JWT token
   * @param name - Project name
   * @param description - Optional project description
   * @returns CreateProjectResponse with the new project
   */
  async createProject(
    name: string,
    description?: string
  ): Promise<CreateProjectResponse> {
    try {
      const response = await this.client.post<CreateProjectResponse>(
        "/projects",
        { name, description }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all projects
   * Requires valid JWT token
   * @returns GetProjectsResponse with all projects
   */
  async getProjects(): Promise<GetProjectsResponse> {
    try {
      const response = await this.client.get<GetProjectsResponse>(
        "/projects"
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a single project by ID
   * Requires valid JWT token
   * @param projectId - The project ID
   * @returns Project data
   */
  async getProject(projectId: number): Promise<{ project: Project }> {
    try {
      const response = await this.client.get<{ project: Project }>(
        `/projects/${projectId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get contents of a path in the project repository
   * Requires valid JWT token
   * @param projectId - The project ID
   * @param path - The path within the repository (e.g., "src/index.ts")
   * @returns GetContentsResponse with file or directory contents
   */
  async getContents(projectId: number, path: string = ""): Promise<GetContentsResponse> {
    try {
      const response = await this.client.get<GetContentsResponse>(
        `/projects/${projectId}/contents/${path}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create or update a file with text content
   * Requires valid JWT token
   * @param projectId - The project ID
   * @param path - The file path (e.g., "src/index.ts")
   * @param content - The file content
   * @param message - Optional commit message
   * @returns CreateFileResponse with file details
   */
  async createFile(
    projectId: number,
    path: string,
    content: string,
    message?: string
  ): Promise<CreateFileResponse> {
    try {
      const response = await this.client.post<CreateFileResponse>(
        `/projects/${projectId}/contents/${path}`,
        { content, message }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a file with new content
   * Requires valid JWT token
   * @param projectId - The project ID
   * @param path - The file path
   * @param content - The new file content
   * @param message - Optional commit message
   * @returns CreateFileResponse with updated file details
   */
  async updateFile(
    projectId: number,
    path: string,
    content: string,
    message?: string
  ): Promise<CreateFileResponse> {
    try {
      const response = await this.client.put<CreateFileResponse>(
        `/projects/${projectId}/contents/${path}`,
        { content, message }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a folder in the project repository
   * Requires valid JWT token
   * @param projectId - The project ID
   * @param folderPath - The folder path (e.g., "src/components")
   * @param message - Optional commit message
   * @returns CreateFolderResponse with folder creation details
   */
  async createFolder(
    projectId: number,
    folderPath: string,
    message?: string
  ): Promise<CreateFolderResponse> {
    try {
      const response = await this.client.post<CreateFolderResponse>(
        `/projects/${projectId}/folders/${folderPath}`,
        { message }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload a file to the project repository
   * Requires valid JWT token
   * @param projectId - The project ID
   * @param file - The file to upload
   * @param path - The destination path in the repository
   * @returns UploadFileResponse with uploaded file details
   */
  async uploadFile(
    projectId: number,
    file: File,
    path: string
  ): Promise<UploadFileResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path);

      const response = await this.client.post<UploadFileResponse>(
        `/projects/${projectId}/upload`,
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
   * Get all starred files for the current user
   * Requires valid JWT token
   * @returns GetStarredFilesResponse with starred files
   */
  async getStarredFiles(): Promise<GetStarredFilesResponse> {
    try {
      const response = await this.client.get<GetStarredFilesResponse>(
        "/projects/starred/list"
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if a file is starred
   * Requires valid JWT token
   * @param projectId - The project ID
   * @param path - The file path
   * @returns Object with starred status
   */
  async checkIsStarred(
    projectId: number,
    path: string
  ): Promise<{ isStarred: boolean; stared: any | null }> {
    try {
      const response = await this.client.get<{
        isStarred: boolean;
        stared: any | null;
      }>(`/projects/starred/check/${projectId}/${encodeURIComponent(path)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Star a file
   * Requires valid JWT token
   * @param projectId - The project ID
   * @param path - The file path to star
   * @returns StarFileResponse with starred file details
   */
  async starFile(projectId: number, path: string): Promise<StarFileResponse> {
    try {
      const response = await this.client.post<StarFileResponse>(
        `/projects/starred/${projectId}`,
        { path }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Unstar a file
   * Requires valid JWT token
   * @param projectId - The project ID
   * @param path - The file path to unstar
   * @returns UnstarFileResponse with confirmation
   */
  async unstarFile(
    projectId: number,
    path: string
  ): Promise<UnstarFileResponse> {
    try {
      const response = await this.client.delete<UnstarFileResponse>(
        `/projects/starred/${projectId}`,
        { data: { path } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a project
   * Requires valid JWT token
   * @param projectId - The project ID
   * @param name - Optional new project name
   * @param description - Optional new description
   * @returns UpdateProjectResponse with updated project
   */
  async updateProject(
    projectId: number,
    name?: string,
    description?: string
  ): Promise<UpdateProjectResponse> {
    try {
      const response = await this.client.put<UpdateProjectResponse>(
        `/projects/${projectId}`,
        { name, description }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a project
   * Requires valid JWT token
   * @param projectId - The project ID
   * @param deleteFromGithub - Optional: also delete from GitHub
   * @returns DeleteProjectResponse with confirmation
   */
  async deleteProject(
    projectId: number,
    deleteFromGithub?: boolean
  ): Promise<DeleteProjectResponse> {
    try {
      const response = await this.client.delete<DeleteProjectResponse>(
        `/projects/${projectId}`,
        { data: { deleteFromGithub } }
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

export default EptaProjectsClient;
