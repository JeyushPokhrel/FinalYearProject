import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScaleBalanced } from "@fortawesome/free-solid-svg-icons";

export default function LawCard({ law, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-6 cursor-pointer hover:border-blue-600 dark:hover:border-[#c2a878] transition duration-300 shadow-sm"
             >
      <FontAwesomeIcon
        icon={faScaleBalanced}
        className="text-blue-600 dark:text-[#c2a878] text-3xl mb-4"
      />

      <h2 className="text-gray-900 dark:text-white text-xl font-bold">{law.title}</h2>
    </div>
  );
}