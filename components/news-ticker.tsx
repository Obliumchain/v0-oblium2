"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  description: string
  icon: string
  link?: string
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: "1",
    title: "Presale Live November 21st!",
    description: "Get ready to secure your $OBLM tokens early. Don't miss out!",
    icon: "🔥",
    link: "https://x.com/theobliumchain/status/1988959319681802474",
  },
  {
    id: "2",
    title: "$5,000 USDT & $1,000 OBLM Giveaway",
    description: "Nov. 13th-27th - Enter now for your chance to win big!",
    icon: "🎁",
    link: "https://x.com/theobliumchain/status/1988758584620962052",
  },
  {
    id: "3",
    title: "New Quiz Questions Available!",
    description: "Test your knowledge with fresh questions - 1,000 points per correct answer!",
    icon: "📝",
  },
  {
    id: "4",
    title: "Phantom Wallet Issue Resolved",
    description: "Purchase authentication fixed - Phantom users can now buy boosters!",
    icon: "✅",
  },
  {
    id: "5",
    title: "Complete All Tasks for 10,000 Bonus Points",
    description: "Finish every task to unlock a massive rewards boost!",
    icon: "⚡",
  },
  {
    id: "6",
    title: "5-Day Boosters Now Available",
    description: "Boost your mining rewards with our powerful multipliers!",
    icon: "🚀",
  },
]

export function NewsTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % NEWS_ITEMS.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const handlePrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + NEWS_ITEMS.length) % NEWS_ITEMS.length)
  }

  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % NEWS_ITEMS.length)
  }

  const currentNews = NEWS_ITEMS[currentIndex]

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border border-primary/30 backdrop-blur-sm">
      <div className="flex items-center gap-4 px-6 py-4">
        {/* Icon */}
        <div className="text-3xl flex-shrink-0 animate-pulse">{currentNews.icon}</div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          {currentNews.link ? (
            <a
              href={currentNews.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity"
            >
              <h3 className="font-display font-bold text-foreground text-sm md:text-base truncate">
                {currentNews.title}
              </h3>
              <p className="text-xs md:text-sm text-foreground/60 truncate">{currentNews.description}</p>
            </a>
          ) : (
            <>
              <h3 className="font-display font-bold text-foreground text-sm md:text-base truncate">
                {currentNews.title}
              </h3>
              <p className="text-xs md:text-sm text-foreground/60 truncate">{currentNews.description}</p>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
            aria-label="Previous news"
          >
            <ChevronLeft className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
            aria-label="Next news"
          >
            <ChevronRight className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5">
        {NEWS_ITEMS.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index)
              setIsAutoPlaying(false)
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentIndex ? "bg-primary w-4" : "bg-foreground/30"
            }`}
            aria-label={`Go to news ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
