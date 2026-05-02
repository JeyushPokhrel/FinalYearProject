// src/components/ChatBubble.jsx
export default function ChatBubble({ sender, text }) {
  return (
    <div
      className={`p-4 rounded-xl whitespace-pre-wrap max-w-[70%] ${
        sender === "user"
          ? "bg-blue-600 ml-auto"
          : "bg-gray-800 mr-auto"
      }`}
    >
      {text}
    </div>
  );
}