const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PDFDocument } = require("pdf-lib");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

app.post("/sign-pdf", async (req, res) => {
  try {
    const { box, signatureImg } = req.body;
    if (!box || !signatureImg) {
      return res.status(400).json({ error: "Missing payload" });
    }

    const pdfPath = path.join(__dirname, "../client/public/sample.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);
    const originalHash = sha256(pdfBytes);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();

    const x = box.xPct * width;
    const y = height - box.yPct * height - box.hPct * height;
    const w = box.wPct * width;
    const h = box.hPct * height;

    const base64Data = signatureImg.split(",")[1];
    const imageBytes = Buffer.from(base64Data, "base64");
    const img = await pdfDoc.embedPng(imageBytes);

    const imgRatio = img.width / img.height;
    const boxRatio = w / h;

    let drawW, drawH;
    if (imgRatio > boxRatio) {
      drawW = w;
      drawH = w / imgRatio;
    } else {
      drawH = h;
      drawW = h * imgRatio;
    }

    page.drawImage(img, {
      x: x + (w - drawW) / 2,
      y: y + (h - drawH) / 2,
      width: drawW,
      height: drawH,
    });

    const signedPdfBytes = await pdfDoc.save();
    const signedHash = sha256(signedPdfBytes);

    const outputPath = path.join(
      __dirname,
      "signed",
      `signed-${Date.now()}.pdf`
    );

    fs.writeFileSync(outputPath, signedPdfBytes);

    console.log("Audit Trail:", { originalHash, signedHash });

    res.json({
      success: true,
      url: `/signed/${path.basename(outputPath)}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sign PDF" });
  }
});

app.use("/signed", express.static(path.join(__dirname, "signed")));

app.listen(5000, () =>
  console.log("Server running on http://localhost:5000")
);
