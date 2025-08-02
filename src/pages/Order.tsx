import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, CheckCircle, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useNavigate } from "react-router-dom";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Order = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'chat' | 'processing' | 'complete'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your personal product concierge assistant. I'm here to help you find exactly what you need. Could you please tell me what product or service you're looking for today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  
  const followUpQuestions = [
    "That sounds interesting! Could you tell me more about your specific requirements or preferences?",
    "Great! What's your ideal budget range for this purchase?",
    "Perfect. Do you have any specific brands, features, or quality standards in mind?",
    "Excellent information. When would you ideally like to receive this product?",
    "Thank you for all the details! Let me process your request and create a personalized procurement plan for you."
  ];

  const processingSteps = [
    "Analyzing your request...",
    "Researching market options...",
    "Comparing prices and quality...",
    "Creating procurement strategy...",
    "Generating delivery timeline...",
    "Creating ticket for our team...",
    "Finalizing your personalized plan..."
  ];

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: currentMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    setTimeout(() => {
      if (questionIndex < followUpQuestions.length) {
        const botResponse: Message = {
          id: messages.length + 2,
          text: followUpQuestions[questionIndex],
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
        
        if (questionIndex === followUpQuestions.length - 1) {
          setTimeout(() => startProcessing(), 2000);
        }
        setQuestionIndex(prev => prev + 1);
      }
    }, 1000);
  };

  const startProcessing = () => {
    setCurrentStep('processing');
    
    const processSteps = () => {
      if (processingStep < processingSteps.length - 1) {
        setTimeout(() => {
          setProcessingStep(prev => prev + 1);
          processSteps();
        }, 1200);
      } else {
        setTimeout(() => {
          setCurrentStep('complete');
        }, 1500);
      }
    };
    
    processSteps();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (currentStep === 'processing') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-2xl">
            <Card className="border-0 shadow-premium">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Loader2 className="h-10 w-10 text-accent animate-spin" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-6">Processing Your Request</h2>
                <div className="space-y-4">
                  {processingSteps.map((step, index) => (
                    <div key={index} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                      index <= processingStep ? 'bg-accent/10 text-accent' : 'text-muted-foreground'
                    }`}>
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

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-2xl">
            <Card className="border-0 shadow-premium">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="h-10 w-10 text-accent" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-6">Request Submitted Successfully!</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Your order has been passed to our expert team and will be processed soon. You'll receive updates on your dashboard and via email.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    size="lg" 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    View Dashboard
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline" 
                    size="lg"
                    className="border-accent text-accent hover:bg-accent/10"
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
      <Navigation />
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Start Your Request</h1>
            <p className="text-lg text-muted-foreground">
              Let's have a conversation about what you need. Our AI assistant will gather all the details to ensure we find exactly what you're looking for.
            </p>
          </div>

          <Card className="border-0 shadow-premium">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
                Product Concierge Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.isBot 
                        ? 'bg-muted text-foreground' 
                        : 'bg-accent text-accent-foreground'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-border p-6">
                <div className="flex gap-2">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    className="flex-1 min-h-[60px] resize-none"
                    rows={2}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground px-4"
                    disabled={!currentMessage.trim()}
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