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

const questions: Question[] = [
  {
    id: 11,
    question: "What is the purpose of the ObliumChain community education program?",
    options: [
      { label: "A", text: "To train users to trade forex" },
      { label: "B", text: "To help users understand blockchain and transparency principles" },
      { label: "C", text: "To teach coding only" },
      { label: "D", text: "To promote random projects" }
    ],
    correctAnswer: "B",
    explanation: "Education is key to Oblium's mission — helping the community understand blockchain, trust, and transparent innovation."
  },
  {
    id: 12,
    question: "What does \"decentralization\" mean in ObliumChain?",
    options: [
      { label: "A", text: "Control by one central authority" },
      { label: "B", text: "Shared control and power among community members" },
      { label: "C", text: "Randomized token distribution" },
      { label: "D", text: "Only developers make decisions" }
    ],
    correctAnswer: "B",
    explanation: "Oblium believes decentralization empowers the community — giving everyone a voice through DAO governance."
  },
  {
    id: 13,
    question: "Why is transparency important in the Oblium ecosystem?",
    options: [
      { label: "A", text: "It helps hide project information" },
      { label: "B", text: "It builds trust between the team and community" },
      { label: "C", text: "It increases token price" },
      { label: "D", text: "It reduces blockchain speed" }
    ],
    correctAnswer: "B",
    explanation: "Transparency builds long-term trust — a core principle of ObliumChain."
  },
  {
    id: 14,
    question: "What type of reward system does Oblium use to engage its users?",
    options: [
      { label: "A", text: "Proof-of-Stake only" },
      { label: "B", text: "Task-to-Earn model" },
      { label: "C", text: "Traditional mining only" },
      { label: "D", text: "Lottery system" }
    ],
    correctAnswer: "B",
    explanation: "Oblium rewards users for completing educational and community tasks — not just staking or trading."
  },
  {
    id: 15,
    question: "How can users contribute to the growth of ObliumChain?",
    options: [
      { label: "A", text: "By spreading FUD" },
      { label: "B", text: "By engaging in community discussions, sharing ideas, and completing tasks" },
      { label: "C", text: "By selling tokens quickly" },
      { label: "D", text: "By keeping silent" }
    ],
    correctAnswer: "B",
    explanation: "Oblium thrives through active participation and positive community engagement."
  },
  {
    id: 16,
    question: "Which of the following best defines a DAO (Decentralized Autonomous Organization)?",
    options: [
      { label: "A", text: "A central company managing all decisions" },
      { label: "B", text: "A structure where decisions are made collectively using blockchain votes" },
      { label: "C", text: "A government agency" },
      { label: "D", text: "A random Telegram group" }
    ],
    correctAnswer: "B",
    explanation: "Oblium uses DAO principles — empowering token holders to vote and shape future directions."
  },
  {
    id: 17,
    question: "What is one of the key goals of Oblium's partnerships (like with Kraken or DCM)?",
    options: [
      { label: "A", text: "To provide transparency, growth, and credibility to the ecosystem" },
      { label: "B", text: "To make Oblium private and closed" },
      { label: "C", text: "To hide funds" },
      { label: "D", text: "To avoid regulation" }
    ],
    correctAnswer: "A",
    explanation: "Partnerships are meant to strengthen trust and innovation within ObliumChain."
  },
  {
    id: 18,
    question: "What can users expect from participating in Oblium AMAs (Ask Me Anything events)?",
    options: [
      { label: "A", text: "Random entertainment" },
      { label: "B", text: "Insight into project development and transparent updates" },
      { label: "C", text: "Celebrity gossip" },
      { label: "D", text: "Private token tips" }
    ],
    correctAnswer: "B",
    explanation: "AMAs are open conversations to ensure transparency and educate the community on progress."
  },
  {
    id: 19,
    question: "What technology ensures Oblium transactions are traceable and secure?",
    options: [
      { label: "A", text: "Blockchain" },
      { label: "B", text: "Cloud storage" },
      { label: "C", text: "Central database" },
      { label: "D", text: "Email verification" }
    ],
    correctAnswer: "A",
    explanation: "Blockchain ensures transparency, immutability, and security of all transactions."
  },
  {
    id: 20,
    question: "What is ObliumChain's long-term vision for its community?",
    options: [
      { label: "A", text: "To build a strong, educated, and self-sustaining blockchain ecosystem" },
      { label: "B", text: "To focus only on short-term profits" },
      { label: "C", text: "To close operations after token launch" },
      { label: "D", text: "To avoid user interaction" }
    ],
    correctAnswer: "A",
    explanation: "Oblium aims to empower people — creating an educated, transparent, and decentralized global community."
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

    // Check if user has already completed the quiz
    const { data: completion } = await supabase
      .from('quiz_completions')
      .select('*')
      .eq('user_id', user.id)
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

    // Calculate score
    let correctCount = 0
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++
      }
    })

    setScore(correctCount)

    // Calculate points: 1000 per correct answer + 10000 bonus if all correct
    const pointsPerCorrect = 1000
    const bonusPoints = correctCount === 10 ? 10000 : 0
    const totalPoints = correctCount * pointsPerCorrect + bonusPoints

    const supabase = createClient()

    try {
      // Save quiz completion
      const { error: quizError } = await supabase.from('quiz_completions').insert({
        user_id: userId,
        answers: selectedAnswers,
        score: correctCount,
        total_questions: questions.length,
        points_awarded: totalPoints,
      })

      if (quizError) throw quizError

      // Update user points
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-full mb-4">
            <Brain className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-semibold" style={{ fontFamily: 'Quantico, sans-serif' }}>
              ObliumChain Quiz
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
            {/* Progress Bar */}
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

            {/* Question Card */}
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

            {/* Navigation Buttons */}
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
            {/* Results */}
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

            {/* Answer Review */}
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
