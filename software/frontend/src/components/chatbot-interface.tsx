"use client"

import { useState, useRef, useEffect } from "react"
import { Send, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Message = {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

// Mock initial messages
const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    content: "Hello! I'm your FireLLM assistant. How can I help you understand your fire risk today?",
    sender: "bot",
    timestamp: new Date(),
  },
]

export default function ChatbotInterface() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate bot response after a delay
    setTimeout(() => {
      const botResponses = [
        "Based on your location, the main risk factors are drought conditions and high temperatures.",
        "I recommend creating a defensible space around your property by clearing vegetation within 30 feet of structures.",
        "The historical data shows that your area has experienced 3 significant fires in the past decade.",
        "Your risk score is higher than average due to the combination of dry conditions and nearby vegetation density.",
      ]

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 flex h-[500px] w-[350px] flex-col rounded-lg border bg-white shadow-xl">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="FireLLM Assistant" />
            <AvatarFallback className="bg-orange-100 text-orange-600">FL</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">FireLLM Assistant</h3>
            <p className="text-xs text-gray-500">Ask me about fire risks</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === "user" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="mt-1 text-right text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-gray-100 p-3 text-gray-800">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1"
          />
          <Button type="submit" size="icon" className="h-9 w-9 bg-orange-600 hover:bg-orange-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

