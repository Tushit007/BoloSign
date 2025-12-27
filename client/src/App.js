import { useRef, useState, useEffect } from "react";
import { Document, Page } from "react-pdf";

/**
 * 🔴 CHANGE THIS TO YOUR RENDER BACKEND URL
 */
const API_BASE = "https://bolosign-oxsv.onrender.com";

function App() {
  const containerRef = useRef(null);
  const boxRef = useRef(null);

  const [box, setBox] = useState({
    xPct: 0.3,
    yPct: 0.4,
    wPct: 0.18,
    hPct: 0.07,
  });

  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [signatureImg, setSignatureImg] = useState(null);

  const dragOffset = useRef({ x: 0, y: 0 });
  const aspectRatio = useRef(box.wPct / box.hPct);

  /* ---------------- DRAG ---------------- */
  function onMouseDown(e) {
    e.preventDefault();
    setDragging(true);

    const rect = boxRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  /* ---------------- RESIZE ---------------- */
  function onResizeMouseDown(e) {
    e.stopPropagation();
    setResizing(true);
    aspectRatio.current = box.wPct / box.hPct;
  }

  function onMouseMove(e) {
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    if (dragging) {
      let newLeft =
        e.clientX - container.left - dragOffset.current.x;
      let newTop =
        e.clientY - container.top - dragOffset.current.y;

      newLeft = Math.max(
        0,
        Math.min(newLeft, container.width - boxRef.current.offsetWidth)
      );
      newTop = Math.max(
        0,
        Math.min(newTop, container.height - boxRef.current.offsetHeight)
      );

      setBox((prev) => ({
        ...prev,
        xPct: newLeft / container.width,
        yPct: newTop / container.height,
      }));
    }

    if (resizing) {
      const boxRect = boxRef.current.getBoundingClientRect();
      let newWidthPx = Math.max(50, e.clientX - boxRect.left);
      let newHeightPx = newWidthPx / aspectRatio.current;

      setBox((prev) => ({
        ...prev,
        wPct: newWidthPx / container.width,
        hPct: newHeightPx / container.height,
      }));
    }
  }

  function onMouseUp() {
    setDragging(false);
    setResizing(false);
  }

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  });

  /* ---------------- SIGNATURE UPLOAD ---------------- */
  function onSignatureUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setSignatureImg(reader.result);
    reader.readAsDataURL(file);
  }

  /* ---------------- CALL BACKEND ---------------- */
  const signPdf = async () => {
    if (!signatureImg) {
      alert("Upload signature image first");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/sign-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ box, signatureImg }),
      });

      if (!res.ok) throw new Error("Signing failed");

      const data = await res.json();

      window.open(`${API_BASE}${data.url}`, "_blank");
    } catch (err) {
      console.error(err);
      alert("Failed to sign PDF");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <input type="file" accept="image/*" onChange={onSignatureUpload} />
      <button onClick={signPdf} style={{ marginLeft: 10 }}>
        Sign PDF
      </button>

      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "inline-block",
          marginTop: 20,
        }}
      >
        <Document file="/sample.pdf">
          <Page pageNumber={1} />
        </Document>

        <div
          ref={boxRef}
          onMouseDown={onMouseDown}
          style={{
            position: "absolute",
            left: `${box.xPct * 100}%`,
            top: `${box.yPct * 100}%`,
            width: `${box.wPct * 100}%`,
            height: `${box.hPct * 100}%`,
            border: "2px dashed red",
            background: "rgba(255,0,0,0.05)",
            cursor: "move",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {signatureImg ? (
            <img
              src={signatureImg}
              alt="signature"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <strong>Signature</strong>
          )}

          <div
            onMouseDown={onResizeMouseDown}
            style={{
              position: "absolute",
              width: 12,
              height: 12,
              right: -6,
              bottom: -6,
              background: "red",
              cursor: "nwse-resize",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
