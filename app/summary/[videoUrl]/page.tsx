"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AVAILABLE_LANGUAGES } from "@/lib/youtube";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Youtube, Headphones, Subtitles, Archive, Download } from "lucide-react";
import { use } from "react";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";

interface ProcessingStatus {
  currentChunk: number;
  totalChunks: number;
  stage: "analyzing" | "processing" | "finalizing" | "saving";
  message: string;
}

interface SummaryData {
  content: string;
  title?: string;
}

function urlSafeBase64Decode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const paddedBase64 = pad ? base64 + "=".repeat(4 - pad) : base64;
  return atob(paddedBase64);
}

interface PageProps {
  params: Promise<{ videoUrl: string }>;
}

export default function SummaryPage({ params }: PageProps) {
  const [summary, setSummary] = useState<SummaryData>({ content: "" });
  const [source, setSource] = useState<"youtube" | "cache" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    currentChunk: 0,
    totalChunks: 0,
    stage: "analyzing",
    message: "Analyzing video content...",
  });

  const searchParams = useSearchParams();
  const languageCode = searchParams.get("lang") || "en";
  const mode = (searchParams.get("mode") || "video") as "video" | "podcast";
  const aiModel = (searchParams.get("model") || "gemini") as
    | "gemini"
  const { videoUrl } = use(params);

  const cleanContentForPdf = (content: string): string => {
    // First preserve important structure
    let cleaned = content
      .replace(/^#+\s+(.*)$/gm, "\n\n$1\n") // Convert headings to plain text with spacing
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italics
      .replace(/`{3}[\s\S]*?`{3}/g, "") // Remove code blocks
      .replace(/`(.*?)`/g, "$1") // Remove inline code
      .replace(/\[(.*?)\]\(.*?\)/g, "$1"); // Remove links but keep text

    // Then remove emojis and special formatting
    cleaned = cleaned
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uD83C][\uDF00-\uDFFF]|[\uD83D][\uDC00-\uDE4F]|[\uD83D][\uDE80-\uDEFF]/g, "") // Remove emojis
    .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
    .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
    .trim();

    return cleaned;
  };

  const downloadPdf = () => {
    try {
      // Initialize PDF document with better defaults
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });
  
      // Layout constants
      const margin = 15;
      const lineHeight = 6;
      const paragraphSpacing = 8;
      let yPos = margin;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - 2 * margin;
  
      // Font settings
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
  
      // Add title with improved formatting
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      const title = summary.title || `${mode === "podcast" ? "Podcast" : "Video"} Summary`;
      const titleLines = doc.splitTextToSize(title, maxWidth);
      
      // Title with subtle underline
      doc.text(titleLines, margin, yPos);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos + 2, margin + doc.getTextWidth(titleLines.join(' ')), yPos + 2);
      yPos += (titleLines.length * lineHeight) + 12;
  
      // Add metadata with better visual separation
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      
      const metadata = [
        `Language: ${displayLanguage}`,
        `Source: ${getSourceDisplay()}`,
        `Generated: ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`
      ];
      
      doc.text(metadata.join(' • '), margin, yPos);
      yPos += lineHeight * 2;
  
      // Add subtle divider
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += lineHeight * 2;
  
      // Process content with improved formatting
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
  
      const processContent = (content: string) => {
        // Split into logical sections
        const sections = content.split(/\n\s*\n/).filter(s => s.trim().length > 0);
  
        sections.forEach(section => {
          section = section.trim();
          if (!section) return;
  
          // Handle headings
          if (section.startsWith('## ')) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            const headingText = section.replace(/^#+\s*/, '');
            const lines = doc.splitTextToSize(headingText, maxWidth);
            
            if (yPos + (lines.length * lineHeight) > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              yPos = margin;
            }
            
            doc.text(lines, margin, yPos);
            yPos += (lines.length * lineHeight) + 4;
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            return;
          }
  
          // Handle bullet points
          if (section.startsWith('• ') || section.startsWith('- ') || section.match(/^\d+\./)) {
            const items = section.split('\n');
            
            items.forEach(item => {
              // Clean up bullet markers
              item = item.replace(/^[•\-]\s+/, '• ').replace(/^\d+\./, '•');
              
              const lines = doc.splitTextToSize(item, maxWidth - 5);
              
              if (yPos + (lines.length * lineHeight) > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                yPos = margin;
              }
              
              // Indent bullet points
              doc.text(lines, margin + 5, yPos);
              yPos += (lines.length * lineHeight) + 2;
            });
            
            yPos += 2;
            return;
          }
  
          // Handle regular paragraphs
          const lines = doc.splitTextToSize(section, maxWidth);
          
          if (yPos + (lines.length * lineHeight) > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = margin;
          }
          
          doc.text(lines, margin, yPos);
          yPos += (lines.length * lineHeight) + paragraphSpacing;
        });
      };
  
      // Clean content before processing
      const cleanContent = summary.content
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1')    // Remove italic
        .replace(/`{3}[\s\S]*?`{3}/g, '') // Remove code blocks
        .replace(/`(.*?)`/g, '$1')      // Remove inline code
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // Remove emojis
        .replace(/\n{3,}/g, '\n\n');    // Normalize newlines
  
      processContent(cleanContent);
  
      // Add professional footer
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by YouTube AI Summarizer • Page ${doc.internal.getNumberOfPages()}`, 
        margin, doc.internal.pageSize.getHeight() - 10);
  
      // Save with clean filename
      const cleanTitle = title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${cleanTitle}_summary_${timestamp}.pdf`;
      
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = urlSafeBase64Decode(videoUrl);
        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            language: languageCode,
            mode,
            aiModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate summary");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to read response stream");
        }

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          try {
            const data = JSON.parse(chunk);

            if (data.type === "progress") {
              setStatus({
                currentChunk: data.currentChunk,
                totalChunks: data.totalChunks,
                stage: data.stage,
                message: data.message,
              });
            } else if (data.type === "complete") {
              setSummary({
                content: data.summary,
                title: data.title || `YouTube ${mode === "podcast" ? "Podcast" : "Video"} Summary`
              });
              setSource(data.source);
              break;
            }
          } catch (e) {
            console.error("Error parsing chunk:", e);
          }
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while generating the summary"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [videoUrl, languageCode, mode, aiModel]);

  const displayLanguage =
    Object.entries(AVAILABLE_LANGUAGES).find(
      ([_, code]) => code === languageCode
    )?.[0] || "English";

  const getSourceIcon = () => {
    switch (source) {
      case "youtube":
        return <Subtitles className="h-4 w-4" />;
      case "cache":
        return <Archive className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSourceDisplay = () => {
    switch (source) {
      case "youtube":
        return "YouTube subtitles";
      case "cache":
        return "Cached summary";
      default:
        return "";
    }
  };

  if (loading) {
    const progress = status.totalChunks
      ? (status.currentChunk / status.totalChunks) * 100
      : 0;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Generating Summary
            </CardTitle>
            <CardDescription>
              Please wait while we process your video
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{status.message}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status.stage === "analyzing"
                        ? "bg-primary animate-pulse"
                        : "bg-muted"
                    }`}
                  />
                  <span
                    className={
                      status.stage === "analyzing"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    Analyzing video content
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status.stage === "processing"
                        ? "bg-primary animate-pulse"
                        : "bg-muted"
                    }`}
                  />
                  <span
                    className={
                      status.stage === "processing"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    Processing chunks ({status.currentChunk}/
                    {status.totalChunks})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status.stage === "finalizing"
                        ? "bg-primary animate-pulse"
                        : "bg-muted"
                    }`}
                  />
                  <span
                    className={
                      status.stage === "finalizing"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    Creating final summary
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status.stage === "saving"
                        ? "bg-primary animate-pulse"
                        : "bg-muted"
                    }`}
                  />
                  <span
                    className={
                      status.stage === "saving"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    Saving to history
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4">
      <Card className="w-full max-w-4xl mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              {mode === "podcast" ? (
                <Headphones className="mr-2" />
              ) : (
                <Youtube className="mr-2" />
              )}
              <span className="text-2xl font-bold">
                {mode === "podcast" ? "Podcast-Style Summary" : "Video Summary"}
              </span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{displayLanguage}</Badge>
              {source && (
                <Badge variant="outline" className="flex items-center">
                  {getSourceIcon()}
                  <span className="ml-1">{getSourceDisplay()}</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown>{summary.content}</ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
      
      {!loading && !error && (
        <button
          onClick={downloadPdf}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      )}
    </div>
  );
}