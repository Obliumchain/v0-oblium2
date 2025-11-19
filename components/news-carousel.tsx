"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface NewsItem {
  id: number
  title: string
  description: string
  date: string
  category: "news" | "update"
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: "New Quiz Available!",
    description: "Test your ObliumChain knowledge with 10 new questions! Answer all correctly to earn 20,000 points.",
    date: "2024-11-16", // Changed from 2025-01-16 to November 2024
    category: "update"
  },
  {
    id: 2,
    title: "Presale Coming Soon!",
    description: "OBLM token presale starts November 21, 2025. Be ready for the launch! Early participants get exclusive bonuses.",
    date: "2024-11-15", // Changed from 2025-01-15 to November 2024
    category: "news"
  },
  {
    id: 3,
    title: "New Boosters Available",
    description: "Check out our new multiplier boosters starting at just 0.035 SOL!",
    date: "2024-11-14", // Changed from 2025-01-14 to November 2024
    category: "update"
  },
  {
    id: 4,
    title: "Downtime Apology",
    description: "We apologize for the recent downtime. Our team has resolved the issues and implemented improvements to prevent future occurrences.",
    date: "2024-11-13", // Changed from 2025-01-13 to November 2024
    category: "news"
  },
]

export function NewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [activeTab, setActiveTab] = useState<"news" | "update" | "all">("all")

  const filteredItems = activeTab === "all" 
    ? newsItems 
    : newsItems.filter(item => item.category === activeTab)

  useEffect(() => {
    if (!isAutoPlaying || filteredItems.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredItems.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, filteredItems.length])

  useEffect(() => {
    setCurrentIndex(0)
  }, [activeTab])

  const next = () => {
    if (filteredItems.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length)
    setIsAutoPlaying(false)
  }

  const previous = () => {
    if (filteredItems.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
    setIsAutoPlaying(false)
  }

  if (filteredItems.length === 0) return null

  const currentItem = filteredItems[currentIndex]

  const categoryColors = {
    update: "from-blue-500/20 to-cyan-500/20 border-cyan-500/30",
    news: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-bold text-foreground text-lg">
            📰 Latest
          </h3>
          <div className="flex items-center gap-1 bg-foreground/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("all")}
              type="button" // Added type button to prevent form submission
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === "all" 
                  ? "bg-cyan-500/20 text-cyan-400 shadow-sm" 
                  : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
              }`}
              style={{ fontFamily: 'Quantico, sans-serif' }}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("news")}
              type="button" // Added type button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === "news" 
                  ? "bg-purple-500/20 text-purple-400 shadow-sm" 
                  : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
              }`}
              style={{ fontFamily: 'Quantico, sans-serif' }}
            >
              News
            </button>
            <button
              onClick={() => setActiveTab("update")}
              type="button" // Added type button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === "update" 
                  ? "bg-cyan-500/20 text-cyan-400 shadow-sm" 
                  : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
              }`}
              style={{ fontFamily: 'Quantico, sans-serif' }}
            >
              Updates
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={previous}
            className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className={`bg-gradient-to-br ${categoryColors[currentItem.category]} p-6 rounded-2xl border transition-all duration-500`}
          key={currentItem.id}
        >
          <h4 className="font-display font-bold text-foreground text-base mb-2">
            {currentItem.title}
          </h4>
          <p className="text-foreground/70 text-sm mb-3">
            {currentItem.description}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-foreground/50 text-xs">
              {new Date(currentItem.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              currentItem.category === "news" 
                ? "bg-purple-500/20 text-purple-400" 
                : "bg-cyan-500/20 text-cyan-400"
            }`}>
              {currentItem.category.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {filteredItems.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index)
              setIsAutoPlaying(false)
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-primary"
                : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
