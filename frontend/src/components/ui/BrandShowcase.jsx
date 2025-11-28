const brands = [
  { name: 'Apple', logo: '🍎' },
  { name: 'Samsung', logo: '📱' },
  { name: 'Sony', logo: '🎮' },
  { name: 'Nike', logo: '✔️' },
  { name: 'Adidas', logo: '⚡' },
  { name: 'LG', logo: '📺' },
  { name: 'Canon', logo: '📷' },
  { name: 'Dell', logo: '💻' },
];

const BrandShowcase = () => {
  return (
    <section className="py-12 bg-white border-y">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500 mb-8 text-sm uppercase tracking-wider">
          Trusted by Top Brands
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {brands.map((brand) => (
            <div
              key={brand.name}
              className="group flex flex-col items-center transition-transform hover:scale-110 cursor-pointer"
            >
              <span className="text-4xl mb-2 grayscale group-hover:grayscale-0 transition-all">
                {brand.logo}
              </span>
              <span className="text-sm text-gray-400 group-hover:text-gray-700 transition-colors">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandShowcase;
