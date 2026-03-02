import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const textExtensions = [".txt", ".md", ".csv", ".log"];
const docxExtensions = [".docx"];
const pdfExtensions = [".pdf"];

export const supportedDocumentExtensions = [
  ...textExtensions,
  ...docxExtensions,
  ...pdfExtensions,
] as const;

const hasExtension = (fileName: string, extensions: readonly string[]) =>
  extensions.some((extension) => fileName.endsWith(extension));

export const extractTextFromDocument = async (file: File): Promise<string> => {
  const lowerName = file.name.toLowerCase();

  if (hasExtension(lowerName, textExtensions)) {
    return file.text();
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (hasExtension(lowerName, docxExtensions)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  }

  if (hasExtension(lowerName, pdfExtensions)) {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text ?? "";
  }

  throw new Error("UNSUPPORTED_FILE_TYPE");
};

export const isSupportedDocumentName = (fileName: string): boolean =>
  hasExtension(fileName.toLowerCase(), supportedDocumentExtensions);
