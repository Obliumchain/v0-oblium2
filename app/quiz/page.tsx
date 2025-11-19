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

const CURRENT_QUIZ_VERSION = 3

const questions: Question[] = [
  {
    id: 31,
    question: "What is the main purpose of Oblium's booster system?",
    options: [
      { label: "A", text: "To slow down point accumulation" },
      { label: "B", text: "To help users multiply their points and gain higher token allocation" },
      { label: "C", text: "To remove points from inactive users" },
      { label: "D", text: "To limit new users" }
    ],
    correctAnswer: "B",
    explanation: "Boosters give users an advantage by accelerating point growth, increasing their token allocation during conversion."
  },
  {
    id: 32,
    question: "What does the Oblium whitepaper provide?",
    options: [
      { label: "A", text: "A full breakdown of the project's vision, tokenomics, utilities, and roadmap" },
      { label: "B", text: "Only memes" },
      { label: "C", text: "Only the team members' birthdays" },
      { label: "D", text: "A list of random crypto facts" }
    ],
    correctAnswer: "A",
    explanation: "The whitepaper is the foundation of the project, detailing everything from technology to governance."
  },
  {
    id: 33,
    question: "What is the purpose of the Oblium Ambassador Program?",
    options: [
      { label: "A", text: "To empower community leaders to educate, promote, and support global adoption" },
      { label: "B", text: "To restrict information" },
      { label: "C", text: "To remove users from the platform" },
      { label: "D", text: "To only reward influencers" }
    ],
    correctAnswer: "A",
    explanation: "Ambassadors act as educators and representatives, helping Oblium grow across regions and communities."
  },
  {
    id: 34,
    question: "What does \"community-first development\" mean for Oblium?",
    options: [
      { label: "A", text: "The team makes decisions based on community feedback and transparency" },
      { label: "B", text: "Only developers decide everything" },
      { label: "C", text: "No one is allowed to give feedback" },
      { label: "D", text: "Updates are kept secret" }
    ],
    correctAnswer: "A",
    explanation: "Oblium ensures users are part of the growth process through open discussions and DAO-driven decisions."
  },
  {
    id: 35,
    question: "What is the Oblium Mainnet designed to achieve?",
    options: [
      { label: "A", text: "High scalability, low fees, and transparent operations" },
      { label: "B", text: "Slow transactions" },
      { label: "C", text: "High gas fees" },
      { label: "D", text: "Limited accessibility" }
    ],
    correctAnswer: "A",
    explanation: "The Mainnet aims to provide a fast, efficient, and open ecosystem for users and developers."
  },
  {
    id: 36,
    question: "Why is transparency important in the Oblium ecosystem?",
    options: [
      { label: "A", text: "It builds trust and shows users every decision made" },
      { label: "B", text: "It hides team mistakes" },
      { label: "C", text: "It is only for marketing" },
      { label: "D", text: "It reduces user participation" }
    ],
    correctAnswer: "A",
    explanation: "Transparency allows the community to verify updates, ensuring accountability and trust."
  },
  {
    id: 37,
    question: "How can new users start earning on Oblium?",
    options: [
      { label: "A", text: "By completing tasks, quizzes, referrals, and using boosters" },
      { label: "B", text: "By waiting for a giveaway" },
      { label: "C", text: "By hacking the system" },
      { label: "D", text: "By doing nothing" }
    ],
    correctAnswer: "A",
    explanation: "Tasks and learning modules give every user a fair chance to earn, regardless of experience."
  },
  {
    id: 38,
    question: "What is the meaning of \"community verification\" in Oblium?",
    options: [
      { label: "A", text: "Users help confirm tasks, content, and activities to prevent fraud" },
      { label: "B", text: "Only admins verify everything" },
      { label: "C", text: "Verification doesn't exist" },
      { label: "D", text: "It is used to delete user accounts" }
    ],
    correctAnswer: "A",
    explanation: "Community verification strengthens trust by ensuring that submitted activities are authentic."
  },
  {
    id: 39,
    question: "What does XP represent in the Oblium platform?",
    options: [
      { label: "A", text: "Experience points showing user engagement and credibility" },
      { label: "B", text: "A new token" },
      { label: "C", text: "A penalty system" },
      { label: "D", text: "Data used only for marketing" }
    ],
    correctAnswer: "A",
    explanation: "XP reflects how active and committed a user is, helping build a strong personal profile."
  },
  {
    id: 40,
    question: "Why does Oblium encourage global participation?",
    options: [
      { label: "A", text: "Because decentralization thrives when people from all regions contribute" },
      { label: "B", text: "Because only one country should control Web3" },
      { label: "C", text: "Because it wants limited growth" },
      { label: "D", text: "Because it avoids multi-language support" }
    ],
    correctAnswer: "A",
    explanation: "A global user base strengthens the network, increases knowledge-sharing, and expands adoption."
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
    const totalPoints = correctCount * pointsPerCorrect

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
            Answer all questions correctly to earn up to 10,000 points!
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
                  {score * 1000}
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
