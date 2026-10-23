import QRCode from "qrcode";

/**
 * Generate a high-resolution base64 PNG data URL for a given URL or text
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: "#0b1120", // Deep navy
        light: "#ffffff", // Pure white
      },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
    throw err;
  }
}
