import { type LucideProps } from "lucide-react";

type CardProps = {
  title: string;
  value: string | number;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  text: string;
  accent: "yellow" | "teal" | "purple" | "red"|"blue";
};

const accentMap = {
  yellow: {
    bg: "bg-linear-to-tr from-gray-700 to-black",
    border: "border-yellow-200",
    icon: "text-yellow-600",
    iconBg: "bg-gray-900",
  },
  purple: {
    bg: "bg-linear-to-tr from-gray-700 to-black",
    border: "border-purple-200",
    icon: "text-purple-600",
    iconBg: "bg-gray-900",
  },
  teal: {
    bg: "bg-linear-to-tr from-gray-700 to-black",
    border: "border-teal-200",
    icon: "text-teal-600",
    iconBg: "bg-gray-900",
  },
  blue: {
    bg: "bg-linear-to-tr from-gray-700 to-black",
    border: "border-blue-200",
    icon: "text-blue-600",
    iconBg: "bg-gray-900",
  },
  red: {
    bg: "bg-linear-to-tr from-gray-700 to-black",
    border: "border-red-200",
    icon: "text-red-600",
    iconBg: "bg-gray-900",
  },
};

const Cards = ({ title, value, icon, text, accent }: CardProps) => {
  const Icon = icon as React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  const colors = accentMap[accent];

  return (
    <div
      className={`p-5 border rounded-2xl flex flex-col gap-4 min-w-0 ${colors.bg} ${colors.border} hover:shadow-md transition-all duration-200`}
    >
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-lg truncate text-white">{title}</h4>
        <div className={`p-2 rounded-lg ${colors.iconBg}`}>
          <Icon className={colors.icon} size={18} />
        </div>
      </div>
      <div className="flex flex-col">
        <h2 className={`font-semibold text-xl truncate ${colors.icon}`}>
          {value}
        </h2>
        <p className="font-light text-sm text-gray-300 truncate">{text}</p>
      </div>
    </div>
  );
};

export default Cards;
