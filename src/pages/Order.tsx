// src/pages/Order.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, CheckCircle, Loader2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // Corrected to "../firebase"

// Define the Message interface for chat messages
interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Define the ChatMessage for OpenRouter API request
interface ChatMessage {
  role: "user" | "assistant" | "system"; // OpenRouter/OpenAI roles
  content: string;
}

// Define the UserProfile interface (matching what's stored in Firestore)
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  // Add other fields if necessary, e.g., photoURL
}

// Basic Navigation Component (extracted to allow prop passing)
interface BasicNavbarProps {
  isProcessing: boolean;
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
            onClick={() => {
              if (!isProcessing) window.location.href = "/";
            }}
            disabled={isProcessing}
            className={isProcessing ? "text-gray-400 cursor-not-allowed" : ""}
            title={isProcessing ? disabledMessage : ""}
          >
            Home
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (!isProcessing) window.location.href = "/dashboard";
            }}
            disabled={isProcessing}
            className={isProcessing ? "text-gray-400 cursor-not-allowed" : ""}
            title={isProcessing ? disabledMessage : ""}
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

// Props for the Order component to receive user information and appId
interface OrderProps {
  user: UserProfile | null;
  appId: string; // NEW: Add appId to props
}

const Order: React.FC<OrderProps> = ({ user, appId }) => {
  // Accept appId here
  const [currentStep, setCurrentStep] = useState<
    "chat" | "processing" | "complete"
  >("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your personal product concierge assistant. I'm here to help you find exactly what you need. Could you please tell me what product or service you're looking for today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [awaitingFinalAnswer, setAwaitingFinalAnswer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const processingSteps = [
    "Analyzing your request...",
    "Researching market options...",
    "Comparing prices and quality...",
    "Creating procurement strategy...",
    "Generating delivery timeline...",
    "Creating ticket for our team...",
    "Finalizing your personalized plan...",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to call the OpenRouter API (for Kimi K2) with exponential backoff
  const callOpenRouterApi = async (payload: any, retries = 3, delay = 1000) => {
    const apiKey = import.meta.env.VITE_MOONSHOT_API_KEY || ""; // Use the new API key variable
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

    if (!apiKey) {
      console.error(
        "VITE_MOONSHOT_API_KEY environment variable is not set. Please ensure it's defined in your .env file."
      );
      throw new Error("Moonshot API key is missing.");
    }

    // Optional: Site URL and title for OpenRouter leaderboards
    const httpReferer = window.location.origin; // Your site's URL
    const xTitle = "Quibble Concierge"; // Your application's title

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": httpReferer,
            "X-Title": xTitle,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            `OpenRouter API error (status ${response.status}):`,
            errorBody
          );
          if (response.status === 429 && i < retries - 1) {
            // Too Many Requests
            await new Promise((res) => setTimeout(res, delay));
            delay *= 2;
            continue;
          }
          throw new Error(
            `OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`
          );
        }

        const result = await response.json();
        console.log("OpenRouter API raw result:", result);

        // OpenRouter's response structure is OpenAI-compatible
        if (
          result.choices &&
          result.choices.length > 0 &&
          result.choices[0].message &&
          result.choices[0].message.content
        ) {
          return result.choices[0].message.content;
        } else {
          console.error(
            "Unexpected OpenRouter API response structure or missing content. Result:",
            JSON.stringify(result, null, 2)
          );
          throw new Error(
            "Unexpected OpenRouter API response structure or missing content."
          );
        }
      } catch (error) {
        if (i === retries - 1) {
          console.error(
            "Failed to call OpenRouter API after multiple retries:",
            error
          );
          throw error;
        }
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }
    throw new Error("OpenRouter API call failed after multiple retries.");
  };

  // Function to generate the summary for the team using Kimi K2
  const generateSummaryForTeam = async (): Promise<string | null> => {
    let summaryText =
      "Failed to generate summary. Please check the console for errors and ensure the AI model can respond to the summary prompt.";
    try {
      // Use the entire conversation for summary, or a subset if too long for context window
      const conversationForSummary: ChatMessage[] = messages.map((msg) => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.text,
      }));

      const summaryPrompt: ChatMessage[] = [
        {
          role: "system",
          content:
            "You are an expert summarizer for a product procurement team. Summarize the following conversation concisely, highlighting the key product, requirements, budget, preferences, and timeline. Format it as a clear, actionable summary for the team.",
        },
        ...conversationForSummary,
        {
          role: "user",
          content:
            "Please provide a concise summary of this conversation for our procurement team.",
        },
      ];

      const payload = {
        model: "moonshotai/kimi-k2:free",
        messages: summaryPrompt,
        temperature: 0.7, // Keep temperature moderate for summarization
        max_tokens: 500, // Limit summary length
      };

      const apiResponseText = await callOpenRouterApi(payload);
      if (apiResponseText) {
        summaryText = apiResponseText;
        setGeneratedSummary(summaryText);
        return summaryText;
      } else {
        console.warn(
          "API call for summary returned no text. Using fallback summary."
        );
        const firstUserMessage = messages.find((msg) => !msg.isBot);
        const fallback = firstUserMessage
          ? `AI could not generate a detailed summary. Initial request: "${firstUserMessage.text}"`
          : "AI could not generate a detailed summary, and no initial user request found.";
        setGeneratedSummary(fallback);
        return fallback;
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      const errorFallback =
        "Failed to generate summary due to an error. Please check the console for details.";
      setGeneratedSummary(errorFallback);
      return null;
    }
  };

  // Function to save the entire order (conversation + summary) to Firestore
  const saveOrderToFirestore = async (summary: string) => {
    if (!user || !user.uid) {
      console.error("User not authenticated. Cannot save order.");
      return;
    }
    if (!db) {
      console.error("Firestore DB not initialized. Cannot save order.");
      return;
    }

    // --- NEW: Debugging Logs ---
    console.log("Attempting to save order to Firestore:");
    console.log("  appId:", appId);
    console.log("  userId:", user.uid);
    console.log("  userEmail:", user.email);
    console.log("  userName:", user.displayName);
    console.log("  summary:", summary);
    console.log("  conversation length:", messages.length);
    // --- END Debugging Logs ---

    try {
      const ordersCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/orders`
      );

      await addDoc(ordersCollectionRef, {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        conversation: messages.map((msg) => ({
          text: msg.text,
          isBot: msg.isBot,
          timestamp: msg.timestamp.toISOString(),
        })),
        summary: summary,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("Order saved to Firestore successfully!");
    } catch (error) {
      console.error("Error saving order to Firestore:", error);
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
      // Build chat history for the AI in OpenRouter/OpenAI format
      const chatHistoryForAPI: ChatMessage[] = [];

      // Initial prompt to guide the AI's behavior (can be a system message or first user message)
      const initialPromptContent =
        "You are a personal product concierge assistant. Your goal is to gather detailed information about a product or service the user is looking for. Ask one clear, concise follow-up question at a time. Once you have enough information (product, requirements, budget, preferences, timeline), conclude by saying 'Thank you for all the details! Let me process your request and create a personalized procurement plan for you.' Do not generate the plan, just indicate readiness to process.";

      // Add the initial prompt as a system message or first user message
      // Using 'user' role for initial prompt as per OpenRouter's example for simplicity
      chatHistoryForAPI.push({ role: "user", content: initialPromptContent });

      // Add previous messages from state to chat history for context
      messages.forEach((msg) => {
        chatHistoryForAPI.push({
          role: msg.isBot ? "assistant" : "user",
          content: msg.text,
        });
      });
      // Add the current user message to the history for the API call
      chatHistoryForAPI.push({ role: "user", content: userMessage.text });

      const payload = {
        model: "moonshotai/kimi-k2:free", // Specify the model
        messages: chatHistoryForAPI, // Pass the formatted chat history
        temperature: 0.9, // Adjust as needed for creativity
        max_tokens: 1000, // Limit response length
      };

      const aiResponseText = await callOpenRouterApi(payload);

      const botResponse: Message = {
        id: messages.length + 2,
        text: aiResponseText,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);

      // Check if the AI's response indicates completion
      if (
        aiResponseText.includes("Thank you for all the details!") ||
        aiResponseText.includes("Let me process your request")
      ) {
        setAwaitingFinalAnswer(true); // Set flag to indicate AI is ready to conclude
      } else if (awaitingFinalAnswer) {
        // User just sent their final answer, now generate summary and save order
        setAwaitingFinalAnswer(false);
        const finalSummary = await generateSummaryForTeam(); // Get the summary from Kimi K2
        if (finalSummary) {
          await saveOrderToFirestore(finalSummary); // Save the order to Firestore
        }
        setTimeout(() => startProcessing(), 500); // Then start processing animation
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
        <BasicNavbar isProcessing={isNavbarDisabled} />
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
        <BasicNavbar isProcessing={isNavbarDisabled} />
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

                {/* Display the generated summary here */}
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

  return (
    <div className="min-h-screen bg-background">
      <BasicNavbar isProcessing={isNavbarDisabled} />
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
