export interface IFileStore {
  getUploadUrl(key: string, contentType: string, expiresIn: number): Promise<string>;
  getDownloadUrl(key: string, expiresIn: number): Promise<string>;
  delete(key: string): Promise<void>;
}
