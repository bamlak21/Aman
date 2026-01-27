const RecentTransactions = () => {
  return (
    <div className="flex-2 border border-gray-300 p-5 rounded-2xl">
      <div>
        <h2 className="font-semibold text-lg">Recent Transactions</h2>
        <h6 className="text-md font-light text-gray-400">
          Your latest Escrow transactions
        </h6>
      </div>

      <div className="mt-3 w-full">
        <div className="flex flex-col gap-3">
          <div className="flex p-2 rounded justify-between border border-gray-300">
            <div className="flex flex-col">
              <h2>
                To John Business{" "}
                <span className="px-2 bg-red-100 rounded-2xl text-red-700">
                  disputed
                </span>
              </h2>
              <p className="text-sm font-light text-gray-600">
                Product delivery and approval
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-sm">$2500</h2>
              <p className="font-light text-sm text-gray-600">1/22/2026</p>
            </div>
          </div>
          <div className="flex p-2 rounded justify-between border border-gray-300">
            <div>
              <h2>
                From John Business{" "}
                <span className="px-2 bg-blue-100 rounded-2xl text-blue-700">
                  funded
                </span>
              </h2>
              <p className="text-sm font-light text-gray-600">
                Website development completion
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-sm">$5000</h2>
              <p className="font-light text-sm text-gray-600">1/15/2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactions;
