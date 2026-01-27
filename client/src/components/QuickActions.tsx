import { ArrowRight } from "lucide-react";

const QuickActions = () => {
  const btn = ["Create New Escrow", "View All Transactions"];
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
            <button className="p-4 bg-black text-white rounded-2xl flex justify-between hover:bg-gray-700 duration-200 cursor-pointer">
              {b} <ArrowRight />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
