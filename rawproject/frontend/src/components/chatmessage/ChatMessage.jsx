export default function ChatMessage({ sender, text }) {
  return (
    <div
      className={`p-4 rounded-lg mb-4 whitespace-pre-wrap ${
        sender === "user"
          ? "bg-[#c2a878] text-black ml-auto max-w-[70%]"
          : "bg-[#2b2b2b] text-white mr-auto max-w-[70%]"
      }`}
    >
      {text}
    </div>
  );
}