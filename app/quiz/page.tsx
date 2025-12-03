"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LiquidCard } from "@/components/ui/liquid-card"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Award, Brain } from "lucide-react"

interface Question {
  id: number
  question: string
  options: { label: string; text: string }[]
  correctAnswer: string
  explanation: string
}

const CURRENT_QUIZ_VERSION = 5

const questions: Question[] = [
  {
    id: 50,
    question: "What is the primary consensus mechanism used by Oblium Chain?",
    options: [
      { label: "A", text: "Proof of Work (PoW)" },
      { label: "B", text: "Proof of Stake (PoS)" },
      { label: "C", text: "Delegated Proof of Stake (DPoS)" },
      { label: "D", text: "Proof of Authority (PoA)" },
    ],
    correctAnswer: "B",
    explanation: "Oblium Chain uses Proof of Stake (PoS) for energy efficiency and network security.",
  },
  {
    id: 51,
    question: "Which feature ensures users retain ownership and control of their data on Oblium?",
    options: [
      { label: "A", text: "Centralized databases" },
      { label: "B", text: "AI-driven analytics" },
      { label: "C", text: "Decentralized storage" },
      { label: "D", text: "Smart contract automation" },
    ],
    correctAnswer: "C",
    explanation: "Decentralized storage ensures users maintain full ownership and control of their data.",
  },
  {
    id: 52,
    question: "Oblium's native token (OBLM) is used for all of the following EXCEPT:",
    options: [
      { label: "A", text: "Paying network fees" },
      { label: "B", text: "Voting on governance proposals" },
      { label: "C", text: "Mining Bitcoin" },
      { label: "D", text: "Participating in staking rewards" },
    ],
    correctAnswer: "C",
    explanation: "OBLM is not used for Bitcoin mining; it powers the Oblium ecosystem.",
  },
  {
    id: 53,
    question: "What is the minimum one-time OBLM balance required in a wallet to finalize the mainnet launch?",
    options: [
      { label: "A", text: "50 OBLM" },
      { label: "B", text: "100 OBLM" },
      { label: "C", text: "150 OBLM" },
      { label: "D", text: "200 OBLM" },
    ],
    correctAnswer: "C",
    explanation: "A minimum of 150 OBLM is required to participate in mainnet finalization.",
  },
  {
    id: 54,
    question: "Which of these best describes Oblium's approach to token launches?",
    options: [
      { label: "A", text: "Multiple presales before mainnet" },
      { label: "B", text: "Single presale before mainnet" },
      { label: "C", text: "Continuous minting without presale" },
      { label: "D", text: "Only private sale, no public launch" },
    ],
    correctAnswer: "B",
    explanation: "Oblium conducts a single presale before mainnet to ensure fair distribution.",
  },
  {
    id: 55,
    question: "Oblium integrates AI in its ecosystem primarily to:",
    options: [
      { label: "A", text: "Replace blockchain validators" },
      { label: "B", text: "Enhance human-centric value and analytics" },
      { label: "C", text: "Automate token mining" },
      { label: "D", text: "Host NFT marketplaces" },
    ],
    correctAnswer: "B",
    explanation: "AI enhances the ecosystem by providing human-centric value and advanced analytics.",
  },
  {
    id: 56,
    question: "Which statement about Oblium governance is TRUE?",
    options: [
      { label: "A", text: "Only founders can vote on proposals" },
      { label: "B", text: "Community voting determines major upgrades" },
      { label: "C", text: "Governance is fully automated by AI" },
      { label: "D", text: "Governance is not part of the chain" },
    ],
    correctAnswer: "B",
    explanation: "Oblium empowers the community through democratic voting on major decisions.",
  },
  {
    id: 57,
    question: "What is a requirement for participating in staking on Oblium?",
    options: [
      { label: "A", text: "Holding a minimum of 10,000 OBLM" },
      { label: "B", text: "Maintaining a one-time OBLM balance in wallet" },
      { label: "C", text: "Paying fiat to the network" },
      { label: "D", text: "Owning an NFT on the chain" },
    ],
    correctAnswer: "B",
    explanation: "Staking requires maintaining the minimum OBLM balance in your wallet.",
  },
  {
    id: 58,
    question: "Oblium ensures liquidity and market stability through:",
    options: [
      { label: "A", text: "Unlimited token printing" },
      { label: "B", text: "Smart wallet structuring and controlled liquidity" },
      { label: "C", text: "Manual daily trading by founders" },
      { label: "D", text: "Central bank backing" },
    ],
    correctAnswer: "B",
    explanation: "Smart wallet structuring and controlled liquidity mechanisms ensure market stability.",
  },
  {
    id: 59,
    question: "Which of the following is NOT a benefit of Oblium's mainnet launch?",
    options: [
      { label: "A", text: "Conversion of SPL OBLM to native OBLM" },
      { label: "B", text: "Access to staking rewards" },
      { label: "C", text: "Guaranteed token price increase" },
      { label: "D", text: "One-time irreversible token migration" },
    ],
    correctAnswer: "C",
    explanation: "While mainnet offers many benefits, token price is determined by market forces.",
  },
  {
    id: 60,
    question: "Oblium's ecosystem focuses on the convergence of:",
    options: [
      { label: "A", text: "DeFi, NFTs, and Gaming" },
      { label: "B", text: "AI, human-centric value, and blockchain" },
      { label: "C", text: "Stablecoins, exchanges, and wallets" },
      { label: "D", text: "Cloud computing and IoT" },
    ],
    correctAnswer: "B",
    explanation: "Oblium uniquely combines AI, human-centric value, and blockchain technology.",
  },
]

export default function QuestionsPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const router = useRouter()

  useEffect(() => {
    checkCompletion()
  }, [])

  async function checkCompletion() {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth")
      return
    }

    setUserId(user.id)

    const { data: completion } = await supabase
      .from("quiz_completions")
      .select("*")
      .eq("user_id", user.id)
      .eq("quiz_version", CURRENT_QUIZ_VERSION)
      .maybeSingle()

    if (completion) {
      setHasCompleted(true)
      setScore(completion.score)
      setShowResults(true)
    }

    setLoading(false)
  }

  const handleAnswerSelect = (questionId: number, answer: string) => {
    if (showResults) return
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answer })
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert("Please answer all questions before submitting.")
      return
    }

    setSubmitting(true)

    let correctCount = 0
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++
      }
    })

    setScore(correctCount)

    const pointsPerCorrect = 1000
    const totalPoints = correctCount * pointsPerCorrect

    const supabase = createClient()

    try {
      const { error: quizError } = await supabase.from("quiz_completions").insert({
        user_id: userId,
        answers: selectedAnswers,
        score: correctCount,
        total_questions: questions.length,
        points_awarded: totalPoints,
        quiz_version: CURRENT_QUIZ_VERSION,
      })

      if (quizError) throw quizError

      const { error: pointsError } = await supabase.rpc("increment_points", {
        user_id: userId,
        points_to_add: totalPoints,
      })

      if (pointsError) throw pointsError

      setShowResults(true)
      setHasCompleted(true)
    } catch (error) {
      console.error("[v0] Quiz submission error:", error)
      alert("Failed to submit quiz. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-32">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navigation />

      <div className="container mx-auto px-4 py-8 pt-32 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-full mb-4">
            <Brain className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-semibold" style={{ fontFamily: "Quantico, sans-serif" }}>
              ObliumChain Quiz v{CURRENT_QUIZ_VERSION}
            </span>
          </div>
          <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "Quantico, sans-serif" }}>
            Test Your Knowledge
          </h1>
          <p className="text-foreground/60">Answer all questions correctly to earn up to 10,000 points!</p>
        </div>

        {!showResults ? (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground/60">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="text-sm text-cyan-400 font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <LiquidCard className="p-8 mb-6">
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "Quantico, sans-serif" }}>
                {currentQ.question}
              </h2>

              <div className="space-y-3">
                {currentQ.options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleAnswerSelect(currentQ.id, option.label)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedAnswers[currentQ.id] === option.label
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-foreground/10 hover:border-cyan-500/50 hover:bg-foreground/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          selectedAnswers[currentQ.id] === option.label
                            ? "bg-cyan-500 text-white"
                            : "bg-foreground/10 text-foreground/60"
                        }`}
                      >
                        {option.label}
                      </div>
                      <span className="flex-1">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </LiquidCard>

            <div className="flex items-center justify-between mb-8">
              <Button onClick={handlePrevious} disabled={currentQuestion === 0} variant="outline">
                Previous
              </Button>

              <div className="flex gap-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      selectedAnswers[questions[index].id]
                        ? "bg-cyan-500"
                        : index === currentQuestion
                          ? "bg-cyan-500/50"
                          : "bg-foreground/20"
                    }`}
                  />
                ))}
              </div>

              {currentQuestion === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={Object.keys(selectedAnswers).length < questions.length || submitting}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!selectedAnswers[currentQ.id]}>
                  Next
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <LiquidCard className="p-8 text-center mb-6">
              <Award className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-3xl font-black mb-2" style={{ fontFamily: "Quantico, sans-serif" }}>
                {score === 10 ? "🎉 Perfect Score!" : "Quiz Completed!"}
              </h2>
              <p className="text-foreground/60 mb-6">
                You answered {score} out of {questions.length} questions correctly
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30">
                <span className="text-2xl font-black text-cyan-400">{score * 1000}</span>
                <span className="text-foreground/60">points earned</span>
              </div>

              {hasCompleted && score < 10 && (
                <p className="text-yellow-500 mt-4 text-sm">
                  You can only take this quiz once. Review the answers below to learn more!
                </p>
              )}
            </LiquidCard>

            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "Quantico, sans-serif" }}>
                Review Answers
              </h3>
              {questions.map((q) => {
                const userAnswer = selectedAnswers[q.id]
                const isCorrect = userAnswer === q.correctAnswer

                return (
                  <LiquidCard key={q.id} className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold mb-2">{q.question}</h4>
                        <p className="text-sm text-foreground/60 mb-2">
                          Your answer:{" "}
                          <span className={isCorrect ? "text-green-400" : "text-red-400"}>{userAnswer}</span>
                          {!isCorrect && (
                            <>
                              {" "}
                              | Correct answer: <span className="text-green-400">{q.correctAnswer}</span>
                            </>
                          )}
                        </p>
                        <p className="text-sm text-cyan-400">📝 {q.explanation}</p>
                      </div>
                    </div>
                  </LiquidCard>
                )
              })}
            </div>

            <div className="text-center mt-8 mb-8">
              <Button onClick={() => router.push("/dashboard")} size="lg">
                Back to Dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
