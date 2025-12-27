const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");
const { PDFDocument } = require("pdf-lib");

// --------------------------------------------------
// App setup
// --------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// --------------------------------------------------
// Ensure signed directory exists
// --------------------------------------------------
const SIGNED_DIR = path.join(__dirname, "signed");
if (!fs.existsSync(SIGNED_DIR)) {
  fs.mkdirSync(SIGNED_DIR);
}

// Serve signed PDFs
app.use("/signed", express.static(SIGNED_DIR));

// --------------------------------------------------
// Health check (optional but useful)
// --------------------------------------------------
app.get("/", (req, res) => {
  res.send("Signature Burn-In Engine running");
});

// --------------------------------------------------
// POST /sign-pdf
// --------------------------------------------------
app.post("/sign-pdf", async (req, res) => {
  try {
    const { box, signatureImg } = req.body;

    if (!box || !signatureImg) {
      return res.status(400).json({ error: "Missing payload" });
    }

    // --------------------------------------------------
    // Load base PDF (MUST exist in server folder)
    // --------------------------------------------------
    const pdfPath = path.join(__dirname, "sample.pdf");
    const existingPdfBytes = fs.readFileSync(pdfPath);

    // Audit: hash original PDF
    const originalHash = crypto
      .createHash("sha256")
      .update(existingPdfBytes)
      .digest("hex");

    // --------------------------------------------------
    // Load PDF
    // --------------------------------------------------
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // --------------------------------------------------
    // Convert normalized → PDF coordinates
    // --------------------------------------------------
    const x = box.xPct * width;
    const y = height - (box.yPct * height) - (box.hPct * height);
    const w = box.wPct * width;
    const h = box.hPct * height;

    // --------------------------------------------------
    // Decode signature image
    // --------------------------------------------------
    const base64Data = signatureImg.split(",")[1];
    const imageBytes = Buffer.from(base64Data, "base64");
    const image = await pdfDoc.embedPng(imageBytes);

    // --------------------------------------------------
    // Aspect-ratio safe scaling
    // --------------------------------------------------
    const imgAspect = image.width / image.height;
    const boxAspect = w / h;

    let drawWidth = w;
    let drawHeight = h;

    if (imgAspect > boxAspect) {
      drawHeight = w / imgAspect;
    } else {
      drawWidth = h * imgAspect;
    }

    const offsetX = x + (w - drawWidth) / 2;
    const offsetY = y + (h - drawHeight) / 2;

    page.drawImage(image, {
      x: offsetX,
      y: offsetY,
      width: drawWidth,
      height: drawHeight,
    });

    // --------------------------------------------------
    // Save signed PDF
    // --------------------------------------------------
    const signedPdfBytes = await pdfDoc.save();

    const signedHash = crypto
      .createHash("sha256")
      .update(signedPdfBytes)
      .digest("hex");

    const filename = `signed-${Date.now()}.pdf`;
    const outputPath = path.join(SIGNED_DIR, filename);

    fs.writeFileSync(outputPath, signedPdfBytes);

    // --------------------------------------------------
    // Response
    // --------------------------------------------------
    res.json({
      success: true,
      url: `/signed/${filename}`,
      audit: {
        originalHash,
        signedHash,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sign PDF" });
  }
});

// --------------------------------------------------
// Start server
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
