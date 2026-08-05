import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HiLink, HiChartBar, HiCurrencyDollar, HiShieldCheck, HiGlobe, HiUsers } from 'react-icons/hi';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  const features = [
    { icon: HiLink, title: 'Shorten URLs', description: 'Create short, memorable links in seconds.' },
    { icon: HiChartBar, title: 'Advanced Analytics', description: 'Track clicks, countries, devices, and more.' },
    { icon: HiCurrencyDollar, title: 'Earn Money', description: 'Get paid for every click on your links.' },
    { icon: HiGlobe, title: 'Custom Domains', description: 'Use your own domain for branded links.' },
    { icon: HiUsers, title: 'Referral Program', description: 'Earn 10% commission from referrals.' },
    { icon: HiShieldCheck, title: 'Secure', description: 'Enterprise-grade security with encryption.' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight">
              Shorten Links, <span className="text-yellow-300">Earn Money</span>
            </h1>
            <p className="mt-6 text-xl text-indigo-100">
              Peage is the modern URL shortener that pays you for every click.
              Create short links, track analytics, and monetize your traffic.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 text-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 text-lg">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="btn border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need</h2>
            <p className="mt-4 text-lg text-gray-500">
              Powerful features to manage and monetize your links
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CPM Tiers */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Earn by Country</h2>
            <p className="mt-4 text-lg text-gray-500">
              Different CPM rates based on visitor location
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { tier: 'Tier 1', rate: '$4.00', countries: 'US, UK, Canada, Western Europe', color: 'border-green-500' },
              { tier: 'Tier 2', rate: '$2.00', countries: 'Eastern Europe, Japan, Korea', color: 'border-blue-500' },
              { tier: 'Tier 3', rate: '$0.50', countries: 'Brazil, India, Indonesia', color: 'border-yellow-500' },
              { tier: 'Tier 4', rate: '$0.10', countries: 'Rest of the world', color: 'border-gray-500' },
            ].map((tier) => (
              <div key={tier.tier} className={`card p-6 border-t-4 ${tier.color}`}>
                <p className="text-sm text-gray-500">{tier.tier}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{tier.rate}</p>
                <p className="text-sm text-gray-500 mt-1">per 1,000 views</p>
                <p className="text-xs text-gray-400 mt-3">{tier.countries}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 Peage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
