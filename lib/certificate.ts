import { jsPDF } from "jspdf";
import { Credential } from "./types";
import { formatDate, truncateAddress } from "./formatters";
import { generateQrCodeDataUrl } from "./qr";

/**
 * Generate and download a professional vector PDF certificate for a credential
 */
export async function downloadCertificatePdf(credential: Credential, origin?: string): Promise<void> {
  const baseAppUrl =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL) ||
    "http://localhost:3000";

  const verificationUrl = `${baseAppUrl}/verify/${credential.id}`;
  const qrDataUrl = await generateQrCodeDataUrl(verificationUrl);

  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = 297;
  const height = 210;

  // Background tint
  doc.setFillColor(252, 253, 254);
  doc.rect(0, 0, width, height, "F");

  // Outer decorative border (Deep Navy)
  doc.setDrawColor(11, 17, 32); // #0b1120
  doc.setLineWidth(1.8);
  doc.rect(10, 10, width - 20, height - 20);

  // Inner accent border (Teal / Emerald)
  doc.setDrawColor(13, 148, 136); // #0d9488
  doc.setLineWidth(0.6);
  doc.rect(14, 14, width - 28, height - 28);

  // Corner decorations
  const cornerSize = 8;
  doc.setFillColor(13, 148, 136);
  doc.circle(14, 14, 1.5, "F");
  doc.circle(width - 14, 14, 1.5, "F");
  doc.circle(14, height - 14, 1.5, "F");
  doc.circle(width - 14, height - 14, 1.5, "F");

  // Top Brand Header
  doc.setTextColor(11, 17, 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CREDORA", width / 2, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("DECENTRALIZED DIGITAL CREDENTIAL & VERIFICATION REGISTRY", width / 2, 33, {
    align: "center",
  });

  // Thin separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(60, 36, width - 60, 36);

  // Title: Certificate of Achievement
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("CERTIFICATE OF RECOGNITION", width / 2, 46, { align: "center" });

  // Preamble
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text("This official credential certifies that", width / 2, 56, { align: "center" });

  // Recipient Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(3, 105, 161); // Brand Blue #0369a1
  doc.text(credential.recipientName, width / 2, 68, { align: "center" });

  // Recipient Underline Accent
  doc.setDrawColor(3, 105, 161);
  doc.setLineWidth(0.6);
  const nameWidth = doc.getTextWidth(credential.recipientName);
  doc.line(width / 2 - nameWidth / 2 - 4, 71, width / 2 + nameWidth / 2 + 4, 71);

  // Reason / Fulfillment
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text("has successfully completed all requirements and been awarded:", width / 2, 81, {
    align: "center",
  });

  // Achievement Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(credential.achievementTitle, width / 2, 92, { align: "center" });

  // Optional Description
  if (credential.description && credential.description.trim()) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const splitDesc = doc.splitTextToSize(credential.description, 200);
    doc.text(splitDesc, width / 2, 101, { align: "center" });
  }

  // Issuing Organization
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text("Conferred by authorized institution:", width / 2, 118, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(credential.issuingOrganization, width / 2, 126, { align: "center" });

  // Blockchain Details Box (Bottom Left/Center)
  const boxX = 22;
  const boxY = 142;
  const boxWidth = 180;
  const boxHeight = 44;

  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "FD");

  // Metadata labels & values inside the box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("ON-CHAIN VERIFICATION RECORD", boxX + 8, boxY + 8);

  // Status Badge in Box
  if (credential.revoked) {
    doc.setFillColor(254, 226, 226); // red 100
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(boxX + 130, boxY + 4, 38, 6, 1, 1, "FD");
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    doc.text("STATUS: REVOKED", boxX + 149, boxY + 8.5, { align: "center" });
  } else {
    doc.setFillColor(209, 250, 229); // emerald 100
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(boxX + 130, boxY + 4, 38, 6, 1, 1, "FD");
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    doc.text("STATUS: VERIFIED VALID", boxX + 149, boxY + 8.5, { align: "center" });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  doc.text("Credential Identifier:", boxX + 8, boxY + 16);
  doc.text("Date of Issuance:", boxX + 8, boxY + 23);
  doc.text("Issuer Ethereum Address:", boxX + 8, boxY + 30);
  doc.text("Protocol / Network:", boxX + 8, boxY + 37);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(credential.formattedId, boxX + 54, boxY + 16);
  doc.text(formatDate(credential.issuedAt), boxX + 54, boxY + 23);
  doc.text(truncateAddress(credential.issuer, 10, 8), boxX + 54, boxY + 30);
  doc.text("Ethereum Localhost (Chain ID: 31337)", boxX + 54, boxY + 37);

  // QR Code Box (Bottom Right)
  const qrX = 222;
  const qrY = 142;
  const qrSize = 38;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(qrX, qrY, 52, boxHeight, 2, 2, "FD");

  // Insert QR Code
  doc.addImage(qrDataUrl, "PNG", qrX + 7, qrY + 3, qrSize, qrSize);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Scan to verify on-chain", qrX + 26, qrY + boxHeight - 2, { align: "center" });

  // Bottom Notice
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Notice: Physical or PDF certificates are representations only. Legal validity and revocation status must be independently confirmed directly against the CredentialRegistry smart contract.",
    width / 2,
    height - 13,
    { align: "center" }
  );

  // Trigger browser download
  const filename = `Credora-${credential.formattedId}.pdf`;
  doc.save(filename);
}
