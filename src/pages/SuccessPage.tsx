import React, { useEffect, useState } from "react";

// Define a functional component for the success page
const App: React.FC = () => {
  // State to store the ticket ID
  const [ticketId, setTicketId] = useState<string | null>(null);

  // useEffect hook to run code after the component mounts
  useEffect(() => {
    // Get the URL search parameters (e.g., "?ticketId=HbX17uOH8gMvKuEq8J6L")
    const urlParams = new URLSearchParams(window.location.search);
    // Extract the 'ticketId' parameter
    const id = urlParams.get("ticketId");
    // Set the ticketId state
    setTicketId(id);
  }, []); // Empty dependency array means this effect runs once after initial render

  // Function to handle the button click and navigate to the ticket page
  const handleGoToTicket = () => {
    if (ticketId) {
      // Construct the URL for the specific ticket page
      window.location.href = `http://localhost:8080/ticket/${ticketId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <svg
            className="w-20 h-20 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. Your order has been successfully
          processed.
        </p>

        {/* Display ticket ID if available */}
        {ticketId && (
          <p className="text-gray-500 text-sm mb-6">
            Your Ticket ID:{" "}
            <span className="font-mono text-blue-600">{ticketId}</span>
          </p>
        )}

        {/* Button to go back to the ticket */}
        <button
          onClick={handleGoToTicket}
          // Disable button if ticketId is not found
          disabled={!ticketId}
          className={`
            py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
            ${
              ticketId
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-400 cursor-not-allowed text-gray-700"
            }
          `}
        >
          {ticketId ? "Go Back to Your Ticket" : "Ticket ID not found"}
        </button>
      </div>
    </div>
  );
};

export default App; // Export the component as default
