"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface NewsItem {
  id: number
  title: string
  description: string
  date: string
  type: "update" | "news" | "announcement"
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: "🚀 Presale Live!",
    description: "OBLM token presale is now active. Get your tokens before the public launch!",
    date: "2025-01-15",
    type: "announcement"
  },
  {
    id: 2,
    title: "⚡ New Boosters Available",
    description: "Check out our new multiplier boosters starting at just 0.035 SOL!",
    date: "2025-01-14",
    type: "update"
  },
  {
    id: 3,
    title: "🎁 Referral Bonus Increased",
    description: "Earn 500 points for every friend you refer to Oblium!",
    date: "2025-01-13",
    type: "news"
  },
  {
    id: 4,
    title: "🔥 Leaderboard Rewards",
    description: "Top 100 miners will receive exclusive bonuses at launch!",
    date: "2025-01-12",
    type: "announcement"
  }
]

export function NewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsItems.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % newsItems.length)
    setIsAutoPlaying(false)
  }

  const previous = () => {
    setCurrentIndex((prev) => (prev - 1 + newsItems.length) % newsItems.length)
    setIsAutoPlaying(false)
  }

  const currentItem = newsItems[currentIndex]

  const typeColors = {
    update: "from-blue-500/20 to-cyan-500/20 border-cyan-500/30",
    news: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    announcement: "from-orange-500/20 to-yellow-500/20 border-yellow-500/30"
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-foreground text-lg">
          📰 News & Updates
        </h3>
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
          className={`bg-gradient-to-br ${typeColors[currentItem.type]} p-6 rounded-2xl border transition-all duration-500`}
          key={currentItem.id}
        >
          <h4 className="font-display font-bold text-foreground text-base mb-2">
            {currentItem.title}
          </h4>
          <p className="text-foreground/70 text-sm mb-3">
            {currentItem.description}
          </p>
          <p className="text-foreground/50 text-xs">
            {new Date(currentItem.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {newsItems.map((_, index) => (
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
