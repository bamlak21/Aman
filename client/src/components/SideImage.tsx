export const SideImage = () => {
  return (
    <div
      className="h-full w-full bg-cover bg-center flex-1 rounded-2xl"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4')",
      }}
    >
      {/* <p className="p-2 fixed bottom-1 left-1/3 mb-2 ml-7 text-xs text-white bg-[hsl(var(--credits))]/30 rounded-2xl">
          Photo by{" "}
          <a
            href="https://unsplash.com/@itsomidarmin"
            target="_blank"
            className="underline"
          >
            Omid Armin
          </a>{" "}
          on{" "}
          <a
            href="https://unsplash.com/photos/person-holding-fan-of-100-us-dollar-bill-8Nppe0yLmn8"
            target="_blank"
            className="underline"
          >
            Unsplash
          </a>
        </p> */}
    </div>
  );
};
