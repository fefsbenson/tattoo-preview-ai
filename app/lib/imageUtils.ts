// Client-side image helpers. Runs only in the browser (uses FileReader / canvas).

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.85;

/** Reads a File into a base64 data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Não foi possível ler a imagem."));
      }
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo de imagem."));
    reader.readAsDataURL(file);
  });
}

/** Loads a data URL into an HTMLImageElement. */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    img.src = dataUrl;
  });
}

/**
 * Downscales an image so its longest side is <= MAX_DIMENSION and re-encodes
 * it as JPEG at JPEG_QUALITY. Returns a data URL. Keeps aspect ratio.
 * Runs before upload to keep payloads small and under the 5 MB server limit.
 */
export async function downscaleImage(file: File): Promise<string> {
  const original = await fileToDataUrl(file);
  const img = await loadImage(original);

  const { width, height } = img;
  const longest = Math.max(width, height);

  // Already small enough and not obviously huge — still normalize to JPEG.
  const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Canvas unavailable — fall back to the original data URL.
    return original;
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

/** Triggers a browser download of a data URL as a file. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
