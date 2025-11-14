"use client"

import { useLanguage, type Language } from "@/lib/language-context"
import { useState } from "react"

const languages = [
  { code: "en" as Language, name: "English", flag: "🇺🇸" },
  { code: "es" as Language, name: "Español", flag: "🇪🇸" },
  { code: "fr" as Language, name: "Français", flag: "🇫🇷" },
  { code: "ar" as Language, name: "العربية", flag: "🇸🇦" },
  { code: "de" as Language, name: "Deutsch", flag: "🇩🇪" },
  { code: "zh" as Language, name: "简体中文", flag: "🇨🇳" },
]

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find((l) => l.code === language) || languages[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
      >
        <span className="text-xl">{currentLanguage.flag}</span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-cyan-400">{currentLanguage.code.toUpperCase()}</span>
          <span className="text-xs font-medium text-cyan-400/70">{currentLanguage.code.toUpperCase()}</span>
          <span className="text-xs font-light text-cyan-400/50">{currentLanguage.code.toUpperCase()}</span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-cyan-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-56 bg-background/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-2xl z-50 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-500/10 transition-colors ${
                  language === lang.code ? "bg-cyan-500/20 text-cyan-400" : "text-foreground"
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{lang.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs font-bold opacity-70">{lang.code.toUpperCase()}</span>
                    <span className="text-xs opacity-50">{lang.code.toUpperCase()}</span>
                    <span className="text-xs opacity-30">{lang.code.toUpperCase()}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
