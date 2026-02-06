import { CheckCircle } from "lucide-react";
import Heading from "../components/Heading";
import Placeholder from "../components/Placeholder";

const h = {
  heading: "Release Escrow Funds",
  subheading: "Review completed work and release funds to payees",
};

const p = {
  icon: CheckCircle,
  heading: "No funded transactions",
  subheading: "You don't have any funded escrow transactions ready for release",
  btnTxt: "Fund Escrow",
  btnPath: "/fund-escrow",
};

const ReleaseFunds = () => {
  return (
    <>
      <Heading heading={h.heading} subheading={h.subheading} />

      <Placeholder
        icon={p.icon}
        heading={p.heading}
        subheading={p.subheading}
        btnTxt={p.btnTxt}
        btnPath={p.btnPath}
      />
    </>
  );
};

export default ReleaseFunds;
