'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LiquidCard } from '@/components/ui/liquid-card'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Award, Brain } from 'lucide-react'

interface Question {
  id: number
  question: string
  options: { label: string; text: string }[]
  correctAnswer: string
  explanation: string
}

const CURRENT_QUIZ_VERSION = 2

const questions: Question[] = [
  {
    id: 21,
    question: "What is the best way to keep your OBLM tokens safe?",
    options: [
      { label: "A", text: "Share your private keys with friends" },
      { label: "B", text: "Store them in a secure wallet and never reveal your private key" },
      { label: "C", text: "Keep them on public websites" },
      { label: "D", text: "Save them in screenshots" }
    ],
    correctAnswer: "B",
    explanation: "Always store OBLM tokens in a secure wallet and never share your private keys — security starts with you."
  },
  {
    id: 22,
    question: "What is staking in ObliumChain?",
    options: [
      { label: "A", text: "Spending tokens on ads" },
      { label: "B", text: "Locking OBLM tokens to support the network and earn rewards" },
      { label: "C", text: "Burning tokens" },
      { label: "D", text: "Trading tokens rapidly" }
    ],
    correctAnswer: "B",
    explanation: "Staking allows users to lock tokens, helping secure the ecosystem while earning passive rewards."
  },
  {
    id: 23,
    question: "How does ObliumChain promote community growth?",
    options: [
      { label: "A", text: "By allowing members to vote, learn, and earn" },
      { label: "B", text: "By limiting access to a few users" },
      { label: "C", text: "By hiding development progress" },
      { label: "D", text: "By discouraging collaboration" }
    ],
    correctAnswer: "A",
    explanation: "Oblium thrives on inclusivity, letting members shape the future through DAO voting and educational tasks."
  },
  {
    id: 24,
    question: "What does \"Proof of Transparency\" mean in the Oblium context?",
    options: [
      { label: "A", text: "A system that hides blockchain data" },
      { label: "B", text: "Every action and transaction can be verified by the public" },
      { label: "C", text: "Only admins can see project details" },
      { label: "D", text: "A manual process done by the team" }
    ],
    correctAnswer: "B",
    explanation: "\"Proof of Transparency\" means all operations and data on Oblium are open and verifiable by anyone."
  },
  {
    id: 25,
    question: "What type of content can users create to support Oblium's mission?",
    options: [
      { label: "A", text: "Memes, videos, or educational posts promoting transparency" },
      { label: "B", text: "Negative comments" },
      { label: "C", text: "Fake news" },
      { label: "D", text: "Spam messages" }
    ],
    correctAnswer: "A",
    explanation: "Oblium encourages creative and positive content that educates others about its mission and values."
  },
  {
    id: 26,
    question: "What role do partnerships play in the Oblium ecosystem?",
    options: [
      { label: "A", text: "They provide credibility, exposure, and development support" },
      { label: "B", text: "They control the community" },
      { label: "C", text: "They replace community members" },
      { label: "D", text: "They only focus on price movement" }
    ],
    correctAnswer: "A",
    explanation: "Strategic partnerships help Oblium expand responsibly and bring innovation to the ecosystem."
  },
  {
    id: 27,
    question: "Why is education important for Web3 adoption according to Oblium?",
    options: [
      { label: "A", text: "Because knowledge reduces scams and increases trust" },
      { label: "B", text: "Because it makes trading easier" },
      { label: "C", text: "Because it replaces governance" },
      { label: "D", text: "Because it increases inflation" }
    ],
    correctAnswer: "A",
    explanation: "Oblium believes an informed community is a powerful one — education drives safe, smart adoption."
  },
  {
    id: 28,
    question: "What happens when you complete a task in the Oblium dApp?",
    options: [
      { label: "A", text: "You earn OBLM or XP rewards and strengthen your profile" },
      { label: "B", text: "Nothing" },
      { label: "C", text: "Your tokens disappear" },
      { label: "D", text: "The app resets" }
    ],
    correctAnswer: "A",
    explanation: "Completing verified tasks increases user rewards and builds trust through engagement."
  },
  {
    id: 29,
    question: "What is the goal of the Oblium quiz section?",
    options: [
      { label: "A", text: "To educate the community about blockchain, transparency, and Oblium's mission" },
      { label: "B", text: "To test random topics" },
      { label: "C", text: "To waste users' time" },
      { label: "D", text: "To reduce engagement" }
    ],
    correctAnswer: "A",
    explanation: "The quiz section helps users learn key concepts and earn rewards through education."
  },
  {
    id: 30,
    question: "How does ObliumChain encourage long-term commitment from users?",
    options: [
      { label: "A", text: "By offering consistent learning rewards and transparent updates" },
      { label: "B", text: "By closing tasks early" },
      { label: "C", text: "By reducing communication" },
      { label: "D", text: "By hiding information" }
    ],
    correctAnswer: "A",
    explanation: "Oblium builds loyalty through consistent transparency, education, and community-based rewards."
  }
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
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    setUserId(user.id)

    const { data: completion } = await supabase
      .from('quiz_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('quiz_version', CURRENT_QUIZ_VERSION)
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
      alert('Please answer all questions before submitting.')
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
    const bonusPoints = correctCount === 10 ? 10000 : 0
    const totalPoints = correctCount * pointsPerCorrect + bonusPoints

    const supabase = createClient()

    try {
      const { error: quizError } = await supabase.from('quiz_completions').insert({
        user_id: userId,
        answers: selectedAnswers,
        score: correctCount,
        total_questions: questions.length,
        points_awarded: totalPoints,
        quiz_version: CURRENT_QUIZ_VERSION,
      })

      if (quizError) throw quizError

      const { error: pointsError } = await supabase.rpc('increment_points', {
        user_id: userId,
        points_to_add: totalPoints,
      })

      if (pointsError) throw pointsError

      setShowResults(true)
      setHasCompleted(true)
    } catch (error) {
      console.error('[v0] Quiz submission error:', error)
      alert('Failed to submit quiz. Please try again.')
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
            <span className="text-cyan-400 font-semibold" style={{ fontFamily: 'Quantico, sans-serif' }}>
              ObliumChain Quiz v{CURRENT_QUIZ_VERSION}
            </span>
          </div>
          <h1 className="text-4xl font-black mb-2" style={{ fontFamily: 'Quantico, sans-serif' }}>
            Test Your Knowledge
          </h1>
          <p className="text-foreground/60">
            Answer all 10 questions correctly to earn 20,000 points!
          </p>
        </div>

        {!showResults ? (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground/60">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="text-sm text-cyan-400 font-semibold">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <LiquidCard className="p-8 mb-6">
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Quantico, sans-serif' }}>
                {currentQ.question}
              </h2>

              <div className="space-y-3">
                {currentQ.options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleAnswerSelect(currentQ.id, option.label)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedAnswers[currentQ.id] === option.label
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-foreground/10 hover:border-cyan-500/50 hover:bg-foreground/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          selectedAnswers[currentQ.id] === option.label
                            ? 'bg-cyan-500 text-white'
                            : 'bg-foreground/10 text-foreground/60'
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
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      selectedAnswers[questions[index].id]
                        ? 'bg-cyan-500'
                        : index === currentQuestion
                        ? 'bg-cyan-500/50'
                        : 'bg-foreground/20'
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
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
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
              <h2 className="text-3xl font-black mb-2" style={{ fontFamily: 'Quantico, sans-serif' }}>
                {score === 10 ? '🎉 Perfect Score!' : 'Quiz Completed!'}
              </h2>
              <p className="text-foreground/60 mb-6">
                You answered {score} out of {questions.length} questions correctly
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30">
                <span className="text-2xl font-black text-cyan-400">
                  {score * 1000 + (score === 10 ? 10000 : 0)}
                </span>
                <span className="text-foreground/60">points earned</span>
              </div>

              {hasCompleted && score < 10 && (
                <p className="text-yellow-500 mt-4 text-sm">
                  You can only take this quiz once. Review the answers below to learn more!
                </p>
              )}
            </LiquidCard>

            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Quantico, sans-serif' }}>
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
                          Your answer: <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>{userAnswer}</span>
                          {!isCorrect && (
                            <> | Correct answer: <span className="text-green-400">{q.correctAnswer}</span></>
                          )}
                        </p>
                        <p className="text-sm text-cyan-400">
                          📝 {q.explanation}
                        </p>
                      </div>
                    </div>
                  </LiquidCard>
                )
              })}
            </div>

            <div className="text-center mt-8 mb-8">
              <Button onClick={() => router.push('/dashboard')} size="lg">
                Back to Dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
