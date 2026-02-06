import { CreditCard } from "lucide-react";
import Heading from "../components/Heading";
import Placeholder from "../components/Placeholder";

const h = {
  heading: "Fund Escrow Transactions",
  subheading: "Review and fund your pending escrow transactions",
};

const p = {
  icon: CreditCard,
  heading: "No Pending Transactions",
  subheading: "All your escrow transactions have been funded",
  btnTxt: "Create New Escrow",
  btnPath: "/create-escrow",
};

const FundEscrow = () => {
  return (
    <>
      <Heading heading={h.heading} subheading={h.subheading} />

      <div className="p-5">
        <Placeholder
          icon={p.icon}
          heading={p.heading}
          subheading={p.subheading}
          btnTxt={p.btnTxt}
          btnPath={p.btnPath}
        />
      </div>
    </>
  );
};

export default FundEscrow;
