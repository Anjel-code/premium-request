// src/pages/Order.tsx (Now standalone)
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, CheckCircle, Loader2 } from "lucide-react";
// Removed: import { useNavigate } from "react-router-dom"; // No longer needed for standalone component

// Define the Message interface for chat messages
interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Define the ChatHistoryPart for the Gemini API request
interface ChatHistoryPart {
  text: string;
}

// Define the ChatHistoryContent for the Gemini API request
interface ChatHistoryContent {
  role: "user" | "model";
  parts: ChatHistoryPart[];
}

// Basic Navigation Component (extracted to allow prop passing)
interface BasicNavbarProps {
  isProcessing: boolean;
  // Removed: navigate: ReturnType<typeof useNavigate>; // No longer needed
}

const BasicNavbar: React.FC<BasicNavbarProps> = ({ isProcessing }) => {
  const disabledMessage =
    "Hold up! We're processing your request. You cannot navigate at this moment.";

  return (
    <nav className="fixed top-0 left-0 w-full bg-white bg-opacity-90 backdrop-blur-sm z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary">Quibble</div>
        <div>
          <Button
            variant="ghost"
            // Changed: onClick to use window.location.href
            onClick={() => {
              if (!isProcessing) window.location.href = "/";
            }}
            disabled={isProcessing}
            className={isProcessing ? "text-gray-400 cursor-not-allowed" : ""} // Gray out when disabled
            title={isProcessing ? disabledMessage : ""} // Tooltip message
          >
            Home
          </Button>
          <Button
            variant="ghost"
            // Changed: onClick to use window.location.href
            onClick={() => {
              if (!isProcessing) window.location.href = "/dashboard";
            }}
            disabled={isProcessing}
            className={isProcessing ? "text-gray-400 cursor-not-allowed" : ""} // Gray out when disabled
            title={isProcessing ? disabledMessage : ""} // Tooltip message
          >
            Dashboard
          </Button>
        </div>
      </div>
    </nav>
  );
};

// Helper function to convert simple Markdown to HTML
const markdownToHtml = (markdownText: string) => {
  if (!markdownText) return "";

  let html = markdownText;

  // Convert bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert list items:
  // First, convert each list item line to an <li> tag
  html = html.replace(/^- (.*)$/gm, "<li>$1</li>");

  // Then, wrap consecutive <li> tags in <ul> tags
  // This regex looks for one or more <li> tags and wraps them.
  html = html.replace(/(<li>.*?<\/li>(\n<li>.*?<\/li>)*)/gs, "<ul>$1</ul>");

  // Convert double newlines to paragraph breaks, but only if not already within a list
  // This needs to be careful not to break list formatting
  html = html.replace(/(?<!<\/li>)\n\n(?!<li>)/g, "</p><p>");

  // Convert single newlines to line breaks, but only if not within a list and not a paragraph break
  html = html.replace(/(?<!<\/li>)\n(?!<p>)(?!<li>)/g, "<br />");

  // Ensure the whole thing is wrapped in a paragraph if it's not already a list
  if (!html.startsWith("<ul>") && !html.startsWith("<p>")) {
    html = `<p>${html}</p>`;
  } else if (html.startsWith("<ul>") && !html.includes("<p>")) {
    // If it's a list, ensure any preceding text is a paragraph
    const firstUlIndex = html.indexOf("<ul>");
    if (firstUlIndex > 0) {
      const precedingText = html.substring(0, firstUlIndex).trim();
      if (precedingText) {
        html = `<p>${precedingText}</p>${html.substring(firstUlIndex)}`;
      }
    }
  }

  // Clean up any empty paragraph tags that might have been created
  html = html.replace(/<p><\/p>/g, "");

  return html;
};

const Order = () => {
  // Removed: const navigate = useNavigate(); // No longer needed
  // State to manage the current step of the order process
  const [currentStep, setCurrentStep] = useState<
    "chat" | "processing" | "complete"
  >("chat");
  // State to store all chat messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your personal product concierge assistant. I'm here to help you find exactly what you need. Could you please tell me what product or service you're looking for today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  // State to store the current message being typed by the user
  const [currentMessage, setCurrentMessage] = useState("");
  // State to track if the AI is currently processing a response
  const [isLoading, setIsLoading] = useState(false);
  // State to track the current step in the processing phase
  const [processingStep, setProcessingStep] = useState(0);
  // NEW: State to store the AI-generated summary for the team
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [awaitingFinalAnswer, setAwaitingFinalAnswer] = useState(false);

  // Ref for auto-scrolling the chat window
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Static processing steps (can be made dynamic with AI if needed later)
  const processingSteps = [
    "Analyzing your request...",
    "Researching market options...",
    "Comparing prices and quality...",
    "Creating procurement strategy...",
    "Generating delivery timeline...",
    "Creating ticket for our team...",
    "Finalizing your personalized plan...",
  ];

  // Effect to scroll to the bottom of the chat when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to call the Gemini API with exponential backoff
  const callGeminiApi = async (payload: any, retries = 3, delay = 1000) => {
    // For Vite projects, environment variables are accessed via import.meta.env
    // Ensure your .env variable is named VITE_GEMINI_API_KEY
    // If you are using Create React App, it would be process.env.REACT_APP_GEMINI_API_KEY
    // If you are still seeing "import.meta is not available" warning,
    // ensure your vite.config.js build target is set to 'es2020' or 'esnext'.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!apiKey) {
      console.error(
        "GEMINI_API_KEY environment variable is not set. Please ensure it's defined in your .env file (e.g., VITE_GEMINI_API_KEY=YOUR_API_KEY) and your build tool is configured to expose it."
      );
      throw new Error("API key is missing.");
    }
    console.log(
      "Using API Key (first 5 chars):",
      apiKey.substring(0, 5) + "..."
    ); // Log first few chars to confirm it's loaded

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.text(); // Read error body to get more details
          console.error(
            `API error response (status ${response.status}):`,
            errorBody
          );
          if (response.status === 429 && i < retries - 1) {
            // Too Many Requests
            await new Promise((res) => setTimeout(res, delay));
            delay *= 2; // Exponential backoff
            continue;
          }
          throw new Error(
            `API error: ${response.status} ${response.statusText} - ${errorBody}`
          );
        }

        const result = await response.json();
        // Log the full result for debugging unexpected structures
        console.log("Gemini API raw result:", result);

        // Check for prompt feedback which indicates if the prompt itself was blocked
        if (result.promptFeedback && result.promptFeedback.blockReason) {
          console.error(
            "Prompt was blocked by safety settings:",
            result.promptFeedback.blockReason
          );
          throw new Error(
            `Prompt blocked: ${result.promptFeedback.blockReason}`
          );
        }

        // Check if candidates array exists and is not empty
        if (
          result.candidates &&
          result.candidates.length > 0 &&
          result.candidates[0].content &&
          result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0
        ) {
          return result.candidates[0].content.parts[0].text;
        } else {
          // Log specific details if structure is unexpected or content is missing
          console.error(
            "Unexpected API response structure or missing content. Result:",
            JSON.stringify(result, null, 2)
          );

          // Check if candidates array exists but is empty
          if (result.candidates && result.candidates.length === 0) {
            console.error(
              "API response: 'candidates' array is empty. This usually means no content was generated."
            );
            if (result.promptFeedback && result.promptFeedback.safetyRatings) {
              console.error(
                "Prompt safety ratings:",
                result.promptFeedback.safetyRatings
              );
            }
            // Check for a finishReason on the first candidate if it exists
            if (result.candidates[0] && result.candidates[0].finishReason) {
              console.error(
                "Candidate finish reason:",
                result.candidates[0].finishReason
              );
              if (result.candidates[0].safetyRatings) {
                console.error(
                  "Candidate safety ratings:",
                  result.candidates[0].safetyRatings
                );
              }
            }
            throw new Error(
              "API response: No content generated (empty candidates array)."
            );
          }

          // Check if there's a finishReason on the candidate, which can indicate why no text was generated
          if (
            result.candidates &&
            result.candidates.length > 0 &&
            result.candidates[0].finishReason
          ) {
            console.error(
              "Candidate finish reason:",
              result.candidates[0].finishReason
            );
            throw new Error(
              `API response: No generated text. Finish reason: ${result.candidates[0].finishReason}`
            );
          }
          throw new Error(
            "Unexpected API response structure or missing content."
          );
        }
      } catch (error) {
        if (i === retries - 1) {
          console.error(
            "Failed to call Gemini API after multiple retries:",
            error
          );
          throw error;
        }
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }
    throw new Error("API call failed after multiple retries.");
  };

  // NEW: Function to generate the summary for the team
  const generateSummaryForTeam = async () => {
    let summaryText =
      "Failed to generate summary. Please check the console for errors and ensure the AI model can respond to the summary prompt.";
    try {
      // Only use the last 10 messages for summary
      const recentMessages = messages.slice(-10);
      const conversation = recentMessages
        .map((msg) => `${msg.isBot ? "Assistant" : "User"}: ${msg.text}`)
        .join("\n");

      // Simplified summary prompt and higher temperature
      const summaryPrompt = `Please summarize the following conversation for a team:\n\n${conversation}`;

      const payload = {
        contents: [{ role: "user", parts: [{ text: summaryPrompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
        generationConfig: {
          responseMimeType: "text/plain",
          temperature: 0.9, // Increased temperature
          maxOutputTokens: 2048,
        },
      };

      const apiResponseText = await callGeminiApi(payload);
      if (apiResponseText) {
        summaryText = apiResponseText;
      } else {
        console.warn(
          "API call for summary returned no text. Using fallback summary."
        );
        // Attempt to create a basic summary from the first user message as a fallback
        const firstUserMessage = messages.find((msg) => !msg.isBot);
        if (firstUserMessage) {
          summaryText = `AI could not generate a detailed summary. Initial request: "${firstUserMessage.text}"`;
        } else {
          summaryText =
            "AI could not generate a detailed summary, and no initial user request found.";
        }
      }
      setGeneratedSummary(summaryText);
    } catch (error) {
      console.error("Error generating summary:", error);
      // Fallback message if summary generation fails due to an error
      setGeneratedSummary(
        "Failed to generate summary due to an error. Please check the console for details."
      );
    }
  };

  // Function to handle sending messages and interacting with the AI
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: currentMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      // Build chat history for the AI, alternating user and model roles
      const chatHistory: ChatHistoryContent[] = messages.map((msg) => ({
        role: msg.isBot ? "model" : "user",
        parts: [{ text: msg.text }],
      }));
      // Add the current user message to the history for the API call
      chatHistory.push({ role: "user", parts: [{ text: userMessage.text }] });

      // Initial prompt to guide the AI's behavior
      const initialPrompt =
        "You are a personal product concierge assistant. Your goal is to gather detailed information about a product or service the user is looking for. Ask one clear, concise follow-up question at a time. Once you have enough information (product, requirements, budget, preferences, timeline), conclude by saying 'Thank you for all the details! Let me process your request and create a personalized procurement plan for you.' Do not generate the plan, just indicate readiness to process.";

      // Prepend the initial prompt to the chat history for context
      const payload = {
        contents: [
          { role: "user", parts: [{ text: initialPrompt }] },
          ...chatHistory,
        ],
        // NEW: Add safety settings to allow more responses for testing
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
        // Explicitly ask for text output and set temperature
        generationConfig: {
          responseMimeType: "text/plain",
          temperature: 0.9,
          maxOutputTokens: 2048, // or 4096 if supported
        },
      };

      const aiResponseText = await callGeminiApi(payload);

      const botResponse: Message = {
        id: messages.length + 2,
        text: aiResponseText,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);

      if (
        aiResponseText.includes("Thank you for all the details!") ||
        aiResponseText.includes("Let me process your request")
      ) {
        setAwaitingFinalAnswer(true); // Set flag, don't generate summary yet
      } else if (awaitingFinalAnswer) {
        // User just sent their final answer, now generate summary
        setAwaitingFinalAnswer(false);
        await generateSummaryForTeam();
        setTimeout(() => startProcessing(), 500);
      }
    } catch (error) {
      console.error("Error communicating with AI:", error);
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "Oops! Something went wrong with the AI. Please try again.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to start the processing animation
  const startProcessing = () => {
    setCurrentStep("processing");
    setProcessingStep(0); // Start from the beginning

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      currentStepIndex++;
      if (currentStepIndex < processingSteps.length) {
        setProcessingStep(currentStepIndex);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentStep("complete");
        }, 1500); // Delay before showing complete state
      }
    }, 1200); // Interval for each step
  };

  // Handle Enter key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Corrected logic for isNavbarDisabled
  const isNavbarDisabled =
    isLoading || currentStep === "processing" || currentStep === "complete";

  // Render different UIs based on the current step
  if (currentStep === "processing") {
    return (
      <div className="min-h-screen bg-background">
        <BasicNavbar isProcessing={isNavbarDisabled} />{" "}
        {/* Removed navigate prop */}
        <div className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-2xl">
            <Card className="border-0 shadow-premium rounded-xl">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Loader2 className="h-10 w-10 text-accent animate-spin" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-6">
                  Processing Your Request
                </h2>
                <div className="space-y-4">
                  {processingSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                        index <= processingStep
                          ? "bg-accent/10 text-accent"
                          : "text-muted-foreground"
                      }`}
                    >
                      {index < processingStep ? (
                        <CheckCircle className="h-5 w-5 text-accent" />
                      ) : index === processingStep ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted" />
                      )}
                      <span className="font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-background">
        <BasicNavbar isProcessing={isNavbarDisabled} />{" "}
        {/* Removed navigate prop */}
        <div className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-2xl">
            <Card className="border-0 shadow-premium rounded-xl">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="h-10 w-10 text-accent" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-6">
                  Request Submitted Successfully!
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Your order has been passed to our expert team and will be
                  processed soon. You'll receive updates on your dashboard and
                  via email.
                </p>

                {/* NEW: Display the generated summary here */}
                {generatedSummary && (
                  <div className="mt-8 p-6 bg-muted rounded-lg text-left">
                    <h3 className="text-xl font-semibold mb-4 text-primary">
                      Summary for Procurement Team:
                    </h3>
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{
                        __html: markdownToHtml(generatedSummary),
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <Button
                    // Changed: onClick to use window.location.href
                    onClick={() => (window.location.href = "/dashboard")}
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md"
                  >
                    View Dashboard
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="lg"
                    className="border-accent text-accent hover:bg-accent/10 rounded-md"
                  >
                    Submit Another Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Find the index where the assistant asks about the timeline
  const timelineIndex = messages.findIndex(
    (msg) =>
      msg.isBot && msg.text.toLowerCase().includes("acquisition timeline")
  );
  // Include all messages after that point
  const recentMessages =
    timelineIndex !== -1 ? messages.slice(timelineIndex) : messages.slice(-15);

  return (
    <div className="min-h-screen bg-background">
      <BasicNavbar isProcessing={isNavbarDisabled} />{" "}
      {/* Removed navigate prop */}
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Start Your Request
            </h1>
            <p className="text-lg text-muted-foreground">
              Let's have a conversation about what you need. Our AI assistant
              will gather all the details to ensure we find exactly what you're
              looking for.
            </p>
          </div>

          <Card className="border-0 shadow-premium rounded-xl">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
                Quibble Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="h-96 overflow-y-auto p-6 space-y-4"
                ref={messagesEndRef}
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isBot ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.isBot
                          ? "bg-muted text-foreground"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-muted text-foreground">
                      <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border p-6">
                <div className="flex gap-2">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      isLoading
                        ? "AI is responding..."
                        : "Type your message here..."
                    }
                    className="flex-1 min-h-[60px] resize-none rounded-md"
                    rows={2}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 rounded-md"
                    disabled={!currentMessage.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Order;
