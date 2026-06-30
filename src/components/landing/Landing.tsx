import React from 'react';
import { motion } from 'motion/react';
import { Cloud, Shield, Zap, Globe, ArrowRight, Github, Twitter, Linkedin, Facebook, Instagram, Check, Command, Lock, HardDrive, Layout } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  const [settings, setSettings] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Failed to load landing settings:', err));
  }, []);

  const getCurrencySymbol = (currency: string) => {
    if (currency === 'EUR') return '€';
    if (currency === 'INR') return '₹';
    return '$';
  };

  const currencySymbol = getCurrencySymbol(settings.currency || 'USD');
  const starterPrice = settings.plan_starter_price ? `${currencySymbol}${settings.plan_starter_price}` : 'Free';
  const proPrice = settings.plan_pro_price ? `${currencySymbol}${settings.plan_pro_price}` : `${currencySymbol}9.99`;
  const enterprisePrice = settings.plan_enterprise_price && settings.plan_enterprise_price !== 'Custom' ? `${currencySymbol}${settings.plan_enterprise_price}` : 'Custom';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-surface-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="https://files.conzex.com/api/files/public/0c3d3463-8d95-49dc-8069-a45d5514f1b9/circle-logo.svg" className="w-8 h-8 object-contain" alt="xFiles Logo" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-lg font-bold font-display tracking-tight text-brand-900 focus:outline-none animate-fade-in">xFiles</span>
                <span className="bg-brand-50 text-brand-600 text-[8px] font-extrabold px-1 py-0.5 rounded border border-brand-100 uppercase tracking-wider">v2.0</span>
              </div>
              <span className="text-[8px] text-slate-400 font-semibold tracking-tight mt-0.5 leading-none">A Conzex Global Product</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-500 transition-colors">Features</a>
            <a href="#compliance" className="text-sm font-medium text-slate-600 hover:text-brand-500 transition-colors">Compliance</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-brand-500 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={onGetStarted}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Log in
            </button>
            <button 
              onClick={onGetStarted}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-all shadow-sm hover:shadow-brand-500/20"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#e0effe_0%,transparent_50%)] pointer-events-none" />
          
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                  Now Available for Self-Hosting
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                  Your Data, <span className="text-brand-500">Your Way.</span>
                </h1>
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                  The enterprise-grade cloud storage core. Secure, fast, and fully customizable for your own environment. Take control of your digital life.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={onGetStarted}
                    className="w-full sm:w-auto px-8 py-4 bg-brand-500 text-white rounded-xl text-lg font-semibold hover:bg-brand-600 transition-all shadow-lg hover:shadow-brand-500/30 flex items-center justify-center gap-2"
                  >
                    Get Started for Free <ArrowRight className="w-5 h-5" />
                  </button>
                  <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-surface-200 rounded-xl text-lg font-semibold hover:bg-surface-50 transition-all">
                    View Documentation
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Floating App Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mt-20 relative max-w-5xl mx-auto"
            >
              <div className="rounded-2xl border border-surface-200 bg-white p-2 shadow-2xl relative z-10 transition-transform hover:scale-[1.005] duration-500 overflow-hidden">
                <div className="rounded-xl overflow-hidden bg-surface-50 border border-surface-100 aspect-[16/10] flex items-center justify-center">
                  <img 
                    src="https://cdn.conzex.com/files/product-images/xFiles-Home.png" 
                    alt="xFiles Core Dashboard" 
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
              </div>
              <div className="absolute -inset-4 bg-brand-500/5 blur-3xl -z-10 rounded-full" />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Enterprise Standards as Standard</h2>
              <p className="text-slate-600 italic">"Security isn't a feature, it's our foundation."</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="w-6 h-6 text-brand-600" />,
                  title: "Military-Grade Security",
                  desc: "AES-256 encryption at rest and TLS in transit. Your tokens, your keys, your rules."
                },
                {
                  icon: <Zap className="w-6 h-6 text-brand-600" />,
                  title: "Lightning Performance",
                  desc: "Optimized streaming uploads and instant search. Find any file in milliseconds."
                },
                {
                  icon: <Globe className="w-6 h-6 text-brand-600" />,
                  title: "Anywhere Access",
                  desc: "Fully responsive web interface that works on any device, anywhere in the world."
                }
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-2xl border border-surface-200 hover:border-brand-200 hover:bg-brand-50/50 transition-all">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-6">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-slate-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance Section */}
        <section id="compliance" className="py-24 bg-surface-50">
          <div className="container mx-auto px-4 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-6">
              Security & Compliance
            </div>
            <h2 className="text-4xl font-bold mb-6 tracking-tight text-slate-900">Built for Enterprise Compliance</h2>
            <p className="text-lg text-slate-600 mb-16 leading-relaxed">
              xFiles is engineered to meet the strictest IT standards. From HIPAA to GDPR, our core gives you the primitives you need to stay compliant and secure your data sovereignty.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <Lock className="w-5 h-5 text-indigo-600" />, title: "Zero Knowledge", desc: "End-to-end encryption capability ensures only you hold the keys." },
                { icon: <Command className="w-5 h-5 text-emerald-600" />, title: "Access Control", desc: "Granular permission sets for users, groups, and automated systems." },
                { icon: <Globe className="w-5 h-5 text-blue-600" />, title: "Data Residency", desc: "Choose exactly where your data lives to comply with local laws." },
                { icon: <HardDrive className="w-5 h-5 text-amber-600" />, title: "Audit Logging", desc: "Every single action is logged and verifiable for strict IT audits." }
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm hover:shadow-md transition-all text-left">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4 border border-slate-100">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-4xl font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h2>
              <p className="text-lg text-slate-600">Choose the plan that fits your storage needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: starterPrice,
                  period: settings.plan_starter_price ? "/mo" : "",
                  desc: "Perfect for students & individuals",
                  features: ["15 GB Storage", "Standard Support", "Shared Infrastructure", "Basic Sharing"],
                  cta: "Get Started",
                  popular: false
                },
                {
                  name: "Professional",
                  price: proPrice,
                  period: "/mo",
                  desc: "Great for power users & creators",
                  features: ["2 TB Storage", "Priority Support", "Advanced Security", "Shared Folders", "100GB Link Transfer"],
                  cta: "Start Free Trial",
                  popular: true
                },
                {
                  name: "Enterprise",
                  price: enterprisePrice,
                  desc: "For security-conscious organizations",
                  features: ["Unlimited Storage", "24/7 Dedicated Support", "SAML SSO / SCIM", "Full Audit Logs", "Custom Data Residency"],
                  cta: "Contact Sales",
                  popular: false
                }
              ].map((plan, i) => (
                <div key={i} className={`relative p-8 rounded-3xl border ${plan.popular ? 'border-brand-500 shadow-xl bg-white' : 'border-surface-200 bg-surface-50'} flex flex-col h-full`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 font-medium">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-8">{plan.desc}</p>
                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                        <Check className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={onGetStarted}
                    className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                      plan.popular 
                        ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20' 
                        : 'bg-white text-slate-700 border border-surface-200 hover:bg-surface-50'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-surface-200 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-6">
                <img src="https://files.conzex.com/api/files/public/0c3d3463-8d95-49dc-8069-a45d5514f1b9/circle-logo.svg" className="w-8 h-8 object-contain" alt="xFiles Logo" />
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-base font-bold font-display text-brand-900">xFiles</span>
                    <span className="bg-brand-50 text-brand-600 text-[8px] font-extrabold px-1 py-0.5 rounded border border-brand-100 uppercase tracking-wider">v2.0</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold tracking-tight mt-0.5 leading-none">A Conzex Global Product</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-6 max-w-xs">
                The most flexible and secure cloud storage core for modern enterprises and developers.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://twitter.com/conzex" target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-5 h-5 text-slate-400 hover:text-brand-500 transition-colors cursor-pointer" />
                </a>
                <a href="https://linkedin.com/company/conzex" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-5 h-5 text-slate-400 hover:text-brand-500 transition-colors cursor-pointer" />
                </a>
                <a href="https://github.com/conzex" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5 text-slate-400 hover:text-brand-500 transition-colors cursor-pointer" />
                </a>
                <a href="https://instagram.com/conzex" target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-5 h-5 text-slate-400 hover:text-brand-500 transition-colors cursor-pointer" />
                </a>
                <a href="https://facebook.com/conzex" target="_blank" rel="noopener noreferrer">
                  <Facebook className="w-5 h-5 text-slate-400 hover:text-brand-500 transition-colors cursor-pointer" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-brand-500 transition-colors">Infrastructure</a></li>
                <li><a href="#" className="hover:text-brand-500 transition-colors">Self-Hosting</a></li>
                <li><a href="#" className="hover:text-brand-500 transition-colors">Enterprise</a></li>
                <li><a href="#" className="hover:text-brand-500 transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="https://docs.conzex.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors">Documentation</a></li>
                <li><a href="https://status.conzex.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors">System Status</a></li>
                <li><a href="https://policies.conzex.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors">Privacy Policy</a></li>
                <li><a href="https://policies.conzex.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="https://conzex.com/about" target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors">About Us</a></li>
                <li><a href="https://conzex.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors">Contact</a></li>
                <li><a href="https://jobs.conzex.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-surface-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400">
              © 2026 xFiles | All rights reserved
            </div>
            <div className="text-sm">
              <a 
                href="https://conzex.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold bg-gradient-to-r from-[#FF9933] via-[#2563EB] to-[#16A34A] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                A Conzex Global Product
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
