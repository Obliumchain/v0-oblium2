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
    question: "What is the purpose of the ObliumChain community education program?",
    options: [
      "To train users to trade forex",
      "To help users understand blockchain and transparency principles",
      "To teach coding only",
      "To promote random projects",
    ],
    correctAnswer: 1,
    explanation:
      "Education is key to Oblium's mission — helping the community understand blockchain, trust, and transparent innovation.",
  },
  {
    id: 2,
    question: 'What does "decentralization" mean in ObliumChain?',
    options: [
      "Control by one central authority",
      "Shared control and power among community members",
      "Randomized token distribution",
      "Only developers make decisions",
    ],
    correctAnswer: 1,
    explanation:
      "Oblium believes decentralization empowers the community — giving everyone a voice through DAO governance.",
  },
  {
    id: 3,
    question: "Why is transparency important in the Oblium ecosystem?",
    options: [
      "It helps hide project information",
      "It builds trust between the team and community",
      "It increases token price",
      "It reduces blockchain speed",
    ],
    correctAnswer: 1,
    explanation: "Transparency builds long-term trust — a core principle of ObliumChain.",
  },
  {
    id: 4,
    question: "What type of reward system does Oblium use to engage its users?",
    options: ["Proof-of-Stake only", "Task-to-Earn model", "Traditional mining only", "Lottery system"],
    correctAnswer: 1,
    explanation: "Oblium rewards users for completing educational and community tasks — not just staking or trading.",
  },
  {
    id: 5,
    question: "How can users contribute to the growth of ObliumChain?",
    options: [
      "By spreading FUD",
      "By engaging in community discussions, sharing ideas, and completing tasks",
      "By selling tokens quickly",
      "By keeping silent",
    ],
    correctAnswer: 1,
    explanation: "Oblium thrives through active participation and positive community engagement.",
  },
  {
    id: 6,
    question: "Which of the following best defines a DAO (Decentralized Autonomous Organization)?",
    options: [
      "A central company managing all decisions",
      "A structure where decisions are made collectively using blockchain votes",
      "A government agency",
      "A random Telegram group",
    ],
    correctAnswer: 1,
    explanation: "Oblium uses DAO principles — empowering token holders to vote and shape future directions.",
  },
  {
    id: 7,
    question: "What is one of the key goals of Oblium's partnerships (like with Kraken or DCM)?",
    options: [
      "To provide transparency, growth, and credibility to the ecosystem",
      "To make Oblium private and closed",
      "To hide funds",
      "To avoid regulation",
    ],
    correctAnswer: 0,
    explanation: "Partnerships are meant to strengthen trust and innovation within ObliumChain.",
  },
  {
    id: 8,
    question: "What can users expect from participating in Oblium AMAs (Ask Me Anything events)?",
    options: [
      "Random entertainment",
      "Insight into project development and transparent updates",
      "Celebrity gossip",
      "Private token tips",
    ],
    correctAnswer: 1,
    explanation: "AMAs are open conversations to ensure transparency and educate the community on progress.",
  },
  {
    id: 9,
    question: "What technology ensures Oblium transactions are traceable and secure?",
    options: ["Blockchain", "Cloud storage", "Central database", "Email verification"],
    correctAnswer: 0,
    explanation: "Blockchain ensures transparency, immutability, and security of all transactions.",
  },
  {
    id: 10,
    question: "What is ObliumChain's long-term vision for its community?",
    options: [
      "To build a strong, educated, and self-sustaining blockchain ecosystem",
      "To focus only on short-term profits",
      "To close operations after token launch",
      "To avoid user interaction",
    ],
    correctAnswer: 0,
    explanation:
      "Oblium aims to empower people — creating an educated, transparent, and decentralized global community.",
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
