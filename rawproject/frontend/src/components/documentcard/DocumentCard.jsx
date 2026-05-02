export default function DocumentCard({ section }) {
  return (
    <div className="bg-[#1e1e1e] border border-[#333] rounded-xl p-6 mb-6">
      <h2 className="text-[#c2a878] text-xl font-bold mb-3">
        {section.section}
      </h2>

      <h3 className="text-white text-lg mb-4">
        {section.title}
      </h3>

      <p className="text-gray-300 whitespace-pre-wrap">
        {section.content}
      </p>
    </div>
  );
}