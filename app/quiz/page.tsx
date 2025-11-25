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

const CURRENT_QUIZ_VERSION = 4

const questions: Question[] = [
  {
    id: 41,
    question: "What is the purpose of the Oblium referral system?",
    options: [
      { label: "A", text: "To reward users for bringing in new, active community members" },
      { label: "B", text: "To punish inactive users" },
      { label: "C", text: "To limit access to the platform" },
      { label: "D", text: "To reduce user rewards" },
    ],
    correctAnswer: "A",
    explanation:
      "The referral system helps Oblium grow organically by rewarding users who invite real, engaged participants.",
  },
  {
    id: 42,
    question: "What does the Oblium Task Hub focus on?",
    options: [
      { label: "A", text: "Educative missions, community activities, and transparent engagement" },
      { label: "B", text: "Selling random NFTs" },
      { label: "C", text: "Only gaming tasks" },
      { label: "D", text: "Hiding important activities" },
    ],
    correctAnswer: "A",
    explanation: "The Task Hub keeps users actively involved through meaningful, verifiable tasks.",
  },
  {
    id: 43,
    question: "What happens when a user reaches a higher XP level?",
    options: [
      { label: "A", text: "They gain more credibility, access to higher rewards, and better opportunities" },
      { label: "B", text: "They lose their account" },
      { label: "C", text: "Their rewards decrease" },
      { label: "D", text: "Nothing changes" },
    ],
    correctAnswer: "A",
    explanation: "Higher XP reflects commitment and unlocks additional benefits within the ecosystem.",
  },
  {
    id: 44,
    question: "How does the Oblium presale benefit early supporters?",
    options: [
      { label: "A", text: "Early supporters gain allocation priority, lower entry prices, and bonus incentives" },
      { label: "B", text: "They lose their tokens" },
      { label: "C", text: "They get no advantages" },
      { label: "D", text: "They only receive dust tokens" },
    ],
    correctAnswer: "A",
    explanation: "Presales reward early believers with better pricing and long-term advantages.",
  },
  {
    id: 45,
    question: "What makes Oblium different from typical meme or hype tokens?",
    options: [
      { label: "A", text: "Its focus on transparency, education, real utility, and community-based growth" },
      { label: "B", text: "It relies only on hype" },
      { label: "C", text: "It has no use cases" },
      { label: "D", text: "It hides important data" },
    ],
    correctAnswer: "A",
    explanation: "Oblium is built on authenticity and value, not temporary hype.",
  },
  {
    id: 46,
    question: "What is one of the key responsibilities of an Oblium Ambassador?",
    options: [
      { label: "A", text: "Educating their region about Web3 and Oblium's mission" },
      { label: "B", text: "Removing users from the platform" },
      { label: "C", text: "Controlling token prices" },
      { label: "D", text: "Hiding updates" },
    ],
    correctAnswer: "A",
    explanation: "Ambassadors are educators and community builders, helping spread accurate information globally.",
  },
  {
    id: 47,
    question: 'What is the goal of Oblium\'s "Learn & Earn" model?',
    options: [
      { label: "A", text: "To reward users for improving their Web3 knowledge" },
      { label: "B", text: "To distract users" },
      { label: "C", text: "To make learning more difficult" },
      { label: "D", text: "To reduce platform activity" },
    ],
    correctAnswer: "A",
    explanation: "Users gain tokens and XP by learning, making education both fun and profitable.",
  },
  {
    id: 48,
    question: "How does Oblium ensure fairness during token conversion?",
    options: [
      { label: "A", text: "Through a points-based system where higher contributors receive higher allocations" },
      { label: "B", text: "Random selection" },
      { label: "C", text: "Hidden calculations" },
      { label: "D", text: "Team-only distribution" },
    ],
    correctAnswer: "A",
    explanation: "The transparent, merit-based system ensures rewards match effort and engagement.",
  },
  {
    id: 49,
    question: "What does the Oblium roadmap represent?",
    options: [
      { label: "A", text: "A clear plan of milestones, development stages, and future goals" },
      { label: "B", text: "A collection of unrelated pictures" },
      { label: "C", text: "A private team-only document" },
      { label: "D", text: "A list of random ideas" },
    ],
    correctAnswer: "A",
    explanation: "The roadmap gives the community confidence by showing what is being built and when.",
  },
  {
    id: 50,
    question: "Why is the Oblium community considered the heart of the ecosystem?",
    options: [
      { label: "A", text: "Because users drive decisions, growth, education, and transparency" },
      { label: "B", text: "Because the community has no role" },
      { label: "C", text: "Because only the team controls everything" },
      { label: "D", text: "Because users are not allowed to participate" },
    ],
    correctAnswer: "A",
    explanation: "Oblium thrives through active community involvement — from tasks to governance.",
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
