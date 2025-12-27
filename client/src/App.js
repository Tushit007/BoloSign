import { useState } from "react";
import { Document, Page } from "react-pdf";

function App() {
  const [numPages, setNumPages] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div style={{ padding: 20 }}>
      <Document
        file="/sample.pdf"
        onLoadSuccess={onDocumentLoadSuccess}
      >
        <Page pageNumber={1} />
      </Document>
    </div>
  );
}

export default App;
