"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Youtube, Headphones, Sparkles, Zap, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MobileSidebar } from "@/components/sidebar"
import { ModelSelector } from "@/components/ModelSelector"
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card"

// Mock data for the example
const AVAILABLE_LANGUAGES = {
  English: "en",
  Spanish: "es",
  French: "fr",
  German: "de",
  Japanese: "ja",
  Chinese: "zh",
  Korean: "ko",
  Russian: "ru",
}

// Mock function for the example
const extractVideoId = (url: string) => {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  const match = url.match(regex)
  if (!match) throw new Error("Invalid YouTube URL")
  return match[1]
}

export default function Home() {
  const [url, setUrl] = useState("")
  const [language, setLanguage] = useState("English")
  const [mode, setMode] = useState<"video" | "podcast">("video")
  const [aiModel, setAiModel] = useState<"gemini">("gemini")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const videoId = extractVideoId(url)
      const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`
      const encodedUrl = btoa(cleanUrl).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
      const summaryUrl = `/summary/${encodedUrl}?lang=${AVAILABLE_LANGUAGES[language as keyof typeof AVAILABLE_LANGUAGES]}&mode=${mode}&model=${aiModel}`
      router.push(summaryUrl)
    } catch (error) {
      alert("Invalid YouTube URL. Please enter a valid YouTube URL.")
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-background to-background">
      <header className="flex h-14 items-center px-4 border-b border-white/5 md:hidden">
        <MobileSidebar />
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 flex items-center justify-center">
            <Youtube className="h-4 w-4 text-white" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 opacity-50 blur-sm"></div>
          </div>
          <span className="font-bold text-lg glow-text bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400">
            AI Summarizer
          </span>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4  bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-300">
                YouTube AI Summarizer
              </h1>
              <p className="text-lg text-muted-foreground">
                Transform lengthy videos into concise summaries with advanced AI technology
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="glass rounded-lg p-4 flex flex-col items-center text-center">
                <Sparkles className="h-6 w-6 text-blue-400 mb-2" />
                <h3 className="font-medium">Smart Analysis</h3>
                <p className="text-xs text-muted-foreground">Extracts key points</p>
              </div>
              <div className="glass rounded-lg p-4 flex flex-col items-center text-center">
                <Zap className="h-6 w-6 text-purple-400 mb-2" />
                <h3 className="font-medium">Fast Results</h3>
                <p className="text-xs text-muted-foreground">Quick processing</p>
              </div>
              <div className="glass rounded-lg p-4 flex flex-col items-center text-center">
                <Cpu className="h-6 w-6 text-cyan-400 mb-2" />
                <h3 className="font-medium">AI Powered</h3>
                <p className="text-xs text-muted-foreground">Advanced models</p>
              </div>
            </div>
          </div>

          <Card  className="md:ml-auto">
            <CardHeader>
              <CardTitle>Generate Summary</CardTitle>
              <CardDescription>Enter a YouTube URL to get an AI-generated summary</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value.replace(/^@/, ""))}
                    placeholder="https://youtube.com/watch?v=..."
                    required
                    className="glass border-white/10 h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="glass border-white/10 h-12">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      {Object.keys(AVAILABLE_LANGUAGES).map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={mode} onValueChange={(value) => setMode(value as "video" | "podcast")}>
                    <SelectTrigger className="glass border-white/10 h-12">
                      <SelectValue placeholder="Select Mode" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="video">
                        <div className="flex items-center">
                          <Youtube className="mr-2 h-4 w-4 text-blue-400" />
                          <span>Video Summary</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="podcast">
                        <div className="flex items-center">
                          <Headphones className="mr-2 h-4 w-4 text-purple-400" />
                          <span>Podcast Style</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ModelSelector selectedModel={aiModel} onModelChange={(model) => setAiModel(model as "gemini")} />

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 glow"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Summary
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 glass rounded-xl p-6 -border before:bg-gradient-to-r before:from-blue-500 before:via-purple-500 before:to-cyan-400">
          <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <Youtube className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-medium mb-2">1. Paste YouTube URL</h3>
              <p className="text-sm text-muted-foreground">Enter any YouTube video link you want to summarize</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Cpu className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="font-medium mb-2">2. AI Processing</h3>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes the video content and extracts key information
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="font-medium mb-2">3. Get Your Summary</h3>
              <p className="text-sm text-muted-foreground">
                Receive a concise, well-structured summary of the video content
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

