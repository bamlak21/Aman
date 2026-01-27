type HeadingProps = {
  heading: string;
  subheading: string;
};

const Heading = ({ heading, subheading }: HeadingProps) => {
  return (
    <div>
      <h3 className="font-semibold text-3xl">{heading}</h3>
      <p className="font-light text-gray-700 text-md">{subheading}</p>
    </div>
  );
};

export default Heading;
