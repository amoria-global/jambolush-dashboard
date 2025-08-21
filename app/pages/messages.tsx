import React, { useState, useEffect } from 'react';

// Define the type for a single message
interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'support';
  timestamp: Date;
}

// Define the type for a single ticket
interface Ticket {
  id: string;
  subject: string;
  createdAt: Date;
  status: 'open' | 'closed';
  lastMessage: string;
  messages: Message[];
}

// Modal component for displaying the message thread
interface MessageModalProps {
  ticket: Ticket;
  messages: Message[];
  newMessage: string;
  setNewMessage: (text: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onClose: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({
  ticket,
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-[#083A85] w-full h-full md:w-2/3 md:h-5/6 rounded-lg p-6 flex flex-col relative overflow-hidden">
        {/* Close button for the modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        >
          <i className="bi bi-x-circle-fill text-3xl"></i>
        </button>

        {/* Modal Header */}
        <div className="mb-6 pb-4 border-b border-[#062c64]">
          <h2 className="text-3xl font-bold text-pink-400">{ticket.subject}</h2>
          <p className="text-gray-400 mt-2">
            Status: <span className="capitalize font-semibold">{ticket.status}</span>
          </p>
        </div>

        {/* Message List */}
        <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center mt-8">No messages in this ticket yet.</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-xl p-3 max-w-lg shadow-lg
                  ${msg.sender === 'customer' ? 'bg-[#062c64] text-white rounded-br-none' : 'bg-[#073377] text-white rounded-bl-none'}`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <span className="block text-right text-xs mt-1 opacity-75 text-gray-400">
                    {msg.timestamp?.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input Form */}
        <form onSubmit={onSendMessage} className="flex items-center gap-4 mt-6">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            className="flex-grow p-3 rounded-lg bg-[#062c64] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none transition"
            required
          />
          <button
            type="submit"
            className="p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition-colors duration-200"
          >
            <i className="bi bi-send-fill text-xl"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

// Main App component for the ticket system
function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  // Initialize isMobile to false to prevent the window is not defined error
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize for mobile view
  useEffect(() => {
    // Set the initial value of isMobile here where window is defined
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync messages with the selected ticket
  useEffect(() => {
    if (selectedTicket) {
      setMessages(selectedTicket.messages);
    } else {
      setMessages([]);
    }
  }, [selectedTicket]);

  // Handle new ticket creation
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) return;

    // Create a unique ID for the new ticket
    const newTicketId = Date.now().toString();

    const newTicket: Ticket = {
      id: newTicketId,
      subject: newTicketSubject,
      createdAt: new Date(),
      status: 'open',
      lastMessage: 'Ticket created.',
      messages: [],
    };

    const updatedTickets = [...tickets, newTicket];
    setTickets(updatedTickets);
    setNewTicketSubject('');
    setSelectedTicket(newTicket);
  };

  // Handle new message submission
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'customer',
      timestamp: new Date(),
    };

    // Find the selected ticket and update its messages
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        const updatedMessages = [...(ticket.messages || []), newMsg];
        const updatedTicket = {
          ...ticket,
          messages: updatedMessages,
          lastMessage: newMsg.text,
        };
        // Also update the selected ticket in state
        setSelectedTicket(updatedTicket);
        return updatedTicket;
      }
      return ticket;
    });

    setTickets(updatedTickets);
    setNewMessage('');
  };

  return (
    <div className="mt-8 flex flex-col md:flex-row h-screen bg-[#083A85] text-white font-sans mt-16">
      {/* Main content container */}
      <div className="w-full p-6 flex flex-col border-r border-[#062c64] bg-[#073377] md:w-1/3">
        <h1 className="text-3xl font-bold mb-6 text-pink-400">Support Tickets</h1>

        {/* Create New Ticket Form */}
        <form onSubmit={handleCreateTicket} className="flex gap-2 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              value={newTicketSubject}
              onChange={(e) => setNewTicketSubject(e.target.value)}
              placeholder="Subject of new ticket..."
              className="w-full p-3 pl-10 text-white bg-[#062c64] rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              required
            />
            <i className="bi bi-plus-circle-fill absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
          </div>
          <button
            type="submit"
            className="p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors duration-200"
          >
            Create
          </button>
        </form>

        {/* Ticket List */}
        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
          {tickets.length === 0 ? (
            <div className="text-gray-400 text-center mt-8">No tickets yet. Create one above!</div>
          ) : (
            tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`flex items-center p-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200
                  ${selectedTicket?.id === ticket.id ? 'bg-[#062c64] text-white shadow-xl' : 'bg-transparent hover:bg-[#062c64]'}`}
              >
                <i className={`bi bi-ticket-fill mr-4 text-2xl ${selectedTicket?.id === ticket.id ? 'text-white' : 'text-pink-400'}`}></i>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{ticket.subject}</h3>
                  <p className={`text-sm mt-1 truncate ${selectedTicket?.id === ticket.id ? 'text-gray-200' : 'text-gray-400'}`}>
                    {ticket.lastMessage}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conditionally render the message modal */}
      {isMobile && selectedTicket && (
        <MessageModal
          ticket={selectedTicket}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={handleSendMessage}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Right pane for desktop view */}
      {!isMobile && (
        <div className="w-2/3 p-6 flex flex-col bg-[#083A85]">
          {!selectedTicket ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-lg">
              Select a ticket to view the conversation.
            </div>
          ) : (
            <>
              <div className="mb-6 pb-4 border-b border-[#062c64]">
                <h2 className="text-3xl font-bold text-pink-400">{selectedTicket.subject}</h2>
                <p className="text-gray-400 mt-2">
                  Status: <span className="capitalize font-semibold">{selectedTicket.status}</span>
                </p>
              </div>

              {/* Message List */}
              <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-gray-400 text-center mt-8">No messages in this ticket yet.</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`rounded-xl p-3 max-w-lg shadow-lg
                        ${msg.sender === 'customer' ? 'bg-[#062c64] text-white rounded-br-none' : 'bg-[#073377] text-white rounded-bl-none'}`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <span className="block text-right text-xs mt-1 opacity-75 text-gray-400">
                          {msg.timestamp?.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-4 mt-6">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={6}
                  className="flex-grow p-3 rounded-lg bg-[#062c64] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none transition"
                  required
                />
                <button
                  type="submit"
                  className="p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition-colors duration-200"
                >
                  <i className="bi bi-send-fill text-xl cursor-pointer"></i>
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
