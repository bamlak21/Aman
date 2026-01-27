import { type LucideProps } from "lucide-react";

type CardProps = {
  title: string;
  value: number;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  text: string;
};
const Cards = ({ title, value, icon, text }: CardProps) => {
  const Icon = icon as React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  return (
    <div className="p-5 border border-gray-300 rounded-2xl flex flex-col gap-6 w-75">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-xl">{title}</h4>
        <Icon className="text-gray-500" />
      </div>
      <div className="flex flex-col">
        <h2 className="font-semibold text-2xl">
          {title === "Total Value" ? "$" : ""}
          {value}
        </h2>
        <p className="font-light text-sm text-gray-500">{text}</p>
      </div>
    </div>
  );
};

export default Cards;
