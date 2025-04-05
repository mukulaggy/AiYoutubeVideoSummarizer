"use client"

import { jsPDF } from "jspdf"
import { Button } from "./ui/button"
import { Download } from "lucide-react"

interface PdfDownloadButtonProps {
  content: string
  title: string
}

export function PdfDownloadButton({ content, title }: PdfDownloadButtonProps) {
  const downloadPdf = () => {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text(title, 10, 10)
    
    // Add content
    doc.setFontSize(12)
    const splitText = doc.splitTextToSize(content, 180)
    doc.text(splitText, 10, 20)
    
    // Save the PDF
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.pdf`)
  }

  return (
    <Button variant="outline" onClick={downloadPdf}>
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </Button>
  )
}