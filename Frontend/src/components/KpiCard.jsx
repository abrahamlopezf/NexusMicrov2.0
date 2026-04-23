const KpiCard = ({ title, value, subtitle }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#C9A14A]/30 transition-all duration-300 group">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
        {title}
      </p>

      <h2 className="text-3xl font-bold text-[#0A0A0A] mt-2 transition-colors">
        {value}
      </h2>

      <div className="w-8 h-1 bg-[#C9A14A] mt-4 mb-3 rounded-full opacity-60 group-hover:w-16 transition-all duration-500 ease-out"></div>

      <p className="text-sm text-gray-400 font-medium">
        {subtitle}
      </p>
    </div>
  );
};

export default KpiCard;
