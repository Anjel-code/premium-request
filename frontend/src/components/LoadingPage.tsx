
const LoadingPage: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center z-50">
      <div className="relative flex flex-col items-center justify-center">
        {/* Main loading container */}
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse"></div>
          
          {/* Animated ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          
          {/* Inner circle */}
          <div className="absolute inset-2 bg-primary/10 rounded-full flex items-center justify-center">
            {/* Purple dot */}
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-primary mb-2 animate-pulse">
            Quibble
          </h2>
          <p className="text-muted-foreground animate-pulse">
            Loading your premium experience...
          </p>
        </div>
        
        {/* Floating dots */}
        <div className="absolute -top-8 -left-8 w-4 h-4 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="absolute -top-4 -right-4 w-3 h-3 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="absolute -bottom-6 -left-4 w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        <div className="absolute -bottom-8 -right-8 w-3 h-3 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></div>
      </div>
    </div>
  );
};

export default LoadingPage; 