import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const btn = [
    { text: "Create New Escrow", path: "/create-escrow" },
    { text: "View All Transactions", path: "/transactions" },
  ];

  const navigate = useNavigate();
  return (
    <div className="flex-1 p-5 border rounded-xl border-gray-300 w-1/2">
      <div className="flex flex-col">
        <h2 className="font-semibold text-lg">Quick Actions</h2>
        <h6 className="text-md font-light text-gray-400">
          Common Tasks you can perform
        </h6>
      </div>

      <div className="mt-5 flex flex-col gap-1">
        {btn.map((b) => {
          return (
            <button
              onClick={() => navigate(b.path)}
              className="p-4 bg-black text-white rounded-2xl flex justify-between hover:bg-gray-700 duration-200 cursor-pointer"
            >
              {b.text} <ArrowRight />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
