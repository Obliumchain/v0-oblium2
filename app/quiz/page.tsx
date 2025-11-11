"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { BookOpen, CheckCircle2, XCircle, Trophy, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

const quizQuestions = [
  {
    id: 1,
    question: "What is the main vision of ObliumChain?",
    options: [
      "To create another memecoin for quick profits",
      "To build a transparent, community-powered blockchain ecosystem",
      "To compete directly with Bitcoin",
      "To focus only on NFTs",
    ],
    correctAnswer: 1,
    explanation:
      "ObliumChain transforms community energy into a sustainable, transparent blockchain ecosystem — where transparency builds trust.",
  },
  {
    id: 2,
    question: "Which blockchain network was Oblium originally launched on?",
    options: ["Ethereum", "Binance Smart Chain", "Solana", "Polygon"],
    correctAnswer: 2,
    explanation: "Oblium started as a high-utility SPL token on Solana, chosen for its scalability and speed.",
  },
  {
    id: 3,
    question: 'What does the phrase "Transparent Builds Trust" mean for Oblium?',
    options: [
      "Sharing all transactions and community actions openly",
      "Letting users trade without knowing project details",
      "Avoiding audits and reports",
      "Hiding project data from the public",
    ],
    correctAnswer: 0,
    explanation:
      "Transparency is a core principle — every step, partnership, and update is made visible to the community.",
  },
  {
    id: 4,
    question: "What can users do to earn rewards on ObliumChain?",
    options: ["Only buy tokens", "Complete community and learning tasks", "Wait for price pumps", "Stake Bitcoin"],
    correctAnswer: 1,
    explanation:
      'ObliumChain uses "task-to-earn" — where users get rewarded for learning, participating, and engaging transparently.',
  },
  {
    id: 5,
    question: "Which of the following best describes Oblium's approach to memecoins?",
    options: [
      "Use hype for short-term profit",
      "Transform meme culture into lasting community value",
      "Avoid memes completely",
      "Only issue NFTs",
    ],
    correctAnswer: 1,
    explanation: "Oblium redefines memecoins — turning social energy into purpose, not hype.",
  },
  {
    id: 6,
    question: "What kind of governance system does ObliumChain aim to use?",
    options: ["Centralized board decision-making", "DAO-based community voting", "Private ownership", "Random draws"],
    correctAnswer: 1,
    explanation:
      "ObliumChain promotes a DAO (Decentralized Autonomous Organization) model — where holders shape key decisions.",
  },
  {
    id: 7,
    question: "What is the native token of ObliumChain?",
    options: ["OBLM", "OBLC", "OBTC", "OBX"],
    correctAnswer: 0,
    explanation:
      "OBLM is the native token used within the Oblium ecosystem for staking, rewards, and community activities.",
  },
  {
    id: 8,
    question: "Which feature allows Oblium users to earn rewards by participating in tasks?",
    options: ["Yield Farming", "Task-to-Earn", "Liquidity Mining", "Token Burn"],
    correctAnswer: 1,
    explanation: "Oblium incentivizes learning, engagement, and contribution through a Task-to-Earn system.",
  },
  {
    id: 9,
    question: "What makes ObliumChain different from most memecoins?",
    options: [
      "It focuses on short-term hype",
      "It has real-world utility and community governance",
      "It only exists on testnets",
      "It requires no transparency",
    ],
    correctAnswer: 1,
    explanation:
      "Unlike typical memecoins, Oblium builds lasting value via community participation, transparency, and utility.",
  },
  {
    id: 10,
    question: "How can Oblium users participate in governance decisions?",
    options: [
      "By holding OBLM tokens and voting in DAO proposals",
      "By creating memes",
      "By trading on exchanges",
      "By posting on social media",
    ],
    correctAnswer: 0,
    explanation: "Token holders can vote on proposals, shaping the future of ObliumChain through its DAO structure.",
  },
]

export default function QuizPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [pointsAwarded, setPointsAwarded] = useState(0)
  const supabase = createBrowserClient()

  useEffect(() => {
    checkIfCompleted()
  }, [])

  const checkIfCompleted = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from("quiz_completions").select("*").eq("user_id", user.id).single()

    if (data) {
      setHasCompleted(true)
      setScore(data.score)
      setPointsAwarded(data.points_awarded)
    }
  }

  const handleAnswerChange = (questionId: number, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }))
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== quizQuestions.length) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting!",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Calculate score
    let correctAnswers = 0
    quizQuestions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctAnswers++
      }
    })

    const finalScore = correctAnswers
    const points = correctAnswers * 1000 // 1000 points per correct answer

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Save quiz completion
      const { error: quizError } = await supabase.from("quiz_completions").insert({
        user_id: user.id,
        score: finalScore,
        total_questions: quizQuestions.length,
        points_awarded: points,
        answers: answers,
      })

      if (quizError) throw quizError

      // Award points to user
      const { error: pointsError } = await supabase.rpc("increment_points", {
        user_id: user.id,
        points_to_add: points,
      })

      if (pointsError) throw pointsError

      setScore(finalScore)
      setPointsAwarded(points)
      setSubmitted(true)
      setLoading(false)
    } catch (error) {
      console.error("Error submitting quiz:", error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  if (hasCompleted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <CardTitle>Quiz Already Completed</CardTitle>
            </div>
            <CardDescription>You have already completed the ObliumChain quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold">
                Score: {score}/{quizQuestions.length}
              </p>
              <p className="text-lg text-muted-foreground">Points Earned: {pointsAwarded.toLocaleString()}</p>
            </div>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">ObliumChain Quiz — Learn & Earn</h1>
        </div>
        <p className="text-muted-foreground">
          Test your knowledge about ObliumChain and earn 1,000 points for each correct answer!
        </p>
      </div>

      {!submitted ? (
        <div className="space-y-6">
          {quizQuestions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {question.id}: {question.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[question.id]?.toString()}
                  onValueChange={(value) => handleAnswerChange(question.id, Number.parseInt(value))}
                >
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                      <RadioGroupItem value={index.toString()} id={`q${question.id}-${index}`} />
                      <Label htmlFor={`q${question.id}-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

          <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Quiz"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Alert>
            <Trophy className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold">
                Quiz Complete! You scored {score}/{quizQuestions.length}
              </p>
              <p>Points Earned: {pointsAwarded.toLocaleString()}</p>
            </AlertDescription>
          </Alert>

          {quizQuestions.map((question) => {
            const userAnswer = answers[question.id]
            const isCorrect = userAnswer === question.correctAnswer

            return (
              <Card key={question.id} className={isCorrect ? "border-green-500" : "border-red-500"}>
                <CardHeader>
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        Question {question.id}: {question.question}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          index === question.correctAnswer
                            ? "bg-green-500/10 border border-green-500"
                            : index === userAnswer && !isCorrect
                              ? "bg-red-500/10 border border-red-500"
                              : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {index === question.correctAnswer && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {index === userAnswer && !isCorrect && <XCircle className="h-4 w-4 text-red-500" />}
                          <span>{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
                    <p className="text-sm font-semibold mb-1">Explanation:</p>
                    <p className="text-sm text-muted-foreground">{question.explanation}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <Button onClick={() => router.push("/dashboard")} className="w-full" size="lg">
            Back to Dashboard
          </Button>
        </div>
      )}
    </div>
  )
}
