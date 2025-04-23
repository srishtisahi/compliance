import { SupportedFileType } from '@/lib/models/UploadedDocument'; // <-- Will be created next
import { logger } from '@/lib/utils/logger'; // <-- Use migrated logger

/**
 * Utility for validating documents
 */
export class DocumentValidator {
  /**
   * Check if a file type is supported
   * @param mimeType MIME type to check
   * @returns Boolean indicating if the file type is supported
   */
  isFileTypeSupported(mimeType: string): boolean {
    // Ensure SupportedFileType is imported before use
    return Object.values(SupportedFileType).includes(mimeType as SupportedFileType);
  }

  /**
   * Get supported file types as a formatted string
   * @returns String of supported file types
   */
  getSupportedFileTypesString(): string {
    // Ensure SupportedFileType is imported before use
    const typeMap: Record<string, string> = {
      [SupportedFileType.PDF]: 'PDF',
      [SupportedFileType.DOCX]: 'DOCX',
      [SupportedFileType.DOC]: 'DOC',
      [SupportedFileType.TXT]: 'TXT',
      [SupportedFileType.PNG]: 'PNG',
      [SupportedFileType.JPG]: 'JPG/JPEG'
    };

    return Object.entries(typeMap)
      .map(([_, desc]) => desc)
      .join(', ');
  }

  /**
   * Detect file type from buffer
   * @param buffer File buffer
   * @returns Promise resolving to the detected MIME type or null if not detected
   */
  async detectFileType(buffer: Buffer): Promise<string | null> {
    try {
      // Dynamic import remains the same
      const { fileTypeFromBuffer } = await import('file-type');
      const result = await fileTypeFromBuffer(buffer);
      return result?.mime || null;
    } catch (error) {
      logger.error('Error detecting file type:', error);
      return null;
    }
  }

  /**
   * Validate file size
   * @param size File size in bytes
   * @param maxSize Maximum allowed size in bytes
   * @returns Boolean indicating if the file size is valid
   */
  isValidFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
    return size > 0 && size <= maxSize;
  }

  /**
   * Format file size for display
   * @param bytes File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  }

  /**
   * Simple check if file might be malicious
   * This is a basic check and should be enhanced with more robust security measures
   * @param buffer File buffer to check
   * @param filename Original filename
   * @returns Promise resolving to a boolean indicating if the file might be malicious
   */
  async mightBeMalicious(buffer: Buffer, filename: string): Promise<boolean> {
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.js', '.vbs', '.php'];
    if (dangerousExtensions.some(ext => filename.toLowerCase().endsWith(ext))) {
      return true;
    }

    const detectedType = await this.detectFileType(buffer);
    if (!detectedType) {
      return true; // Can't detect type - be cautious
    }

    const suspiciousHeaders = [
      Buffer.from([0x4D, 0x5A]), // MZ
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF
    ];

    if (suspiciousHeaders.some(header =>
      buffer.length >= header.length &&
      buffer.subarray(0, header.length).equals(header)
    )) {
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const documentValidator = new DocumentValidator(); 