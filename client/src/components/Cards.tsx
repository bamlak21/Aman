import { type LucideProps } from "lucide-react";

type CardProps = {
  title: string;
  value: string | number;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  text: string;
  accent: "yellow" | "teal" | "purple" | "red";
};

const accentMap = {
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", icon: "text-yellow-600", iconBg: "bg-yellow-100" },
  purple: { bg: "bg-purple-50",  border: "border-purple-200",  icon: "text-purple-600",  iconBg: "bg-purple-100" },
  teal:   { bg: "bg-teal-50",    border: "border-teal-200",    icon: "text-teal-600",    iconBg: "bg-teal-100" },
  red:    { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-600",     iconBg: "bg-red-100" },
};

const Cards = ({ title, value, icon, text, accent }: CardProps) => {
  const Icon = icon as React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  const colors = accentMap[accent];

  return (
    <div className={`p-5 border rounded-2xl flex flex-col gap-4 min-w-0 ${colors.bg} ${colors.border} hover:shadow-md transition-all duration-200`}>
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-lg truncate">{title}</h4>
        <div className={`p-2 rounded-lg ${colors.iconBg}`}>
          <Icon className={colors.icon} size={18} />
        </div>
      </div>
      <div className="flex flex-col">
        <h2 className={`font-semibold text-xl truncate ${colors.icon}`}>{value}</h2>
        <p className="font-light text-sm text-gray-500 truncate">{text}</p>
      </div>
    </div>
  );
};

export default Cards;
