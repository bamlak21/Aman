import { type LucideProps } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  heading: string;
  subheading: string;
  btnTxt: string;
  btnPath: string;
};

const Placeholder = ({ icon, heading, subheading, btnTxt, btnPath }: Props) => {
  const navigate = useNavigate();
  const Icon = icon as React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  return (
    <div className="mt-10 border border-gray-300 p-20 rounded-2xl">
      <div className="flex flex-col justify-center items-center gap-2">
        <Icon size={40} />
        <h4 className="text-2xl font-medium">{heading}</h4>
        <p className="font-light text-gray-500">{subheading}</p>
        <button
          onClick={() => navigate(btnPath)}
          className="bg-black text-white rounded-xl p-2 text-sm cursor-pointer"
        >
          {btnTxt}
        </button>
      </div>
    </div>
  );
};

export default Placeholder;
