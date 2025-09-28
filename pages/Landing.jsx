
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, FileText, Calendar, Users, Shield, DollarSign, MapPin } from 'lucide-react';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const AnimatedCounter = ({ end, duration = 2000, suffix = "", className = "" }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const node = ref.current; // Capture the current ref value
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          let start = 0;
          const range = end - start;
          let startTime = null;

          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * range + start));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (node) { // Use the captured value
      observer.observe(node);
    }

    return () => {
      if (node) { // Use the captured value in the cleanup
        observer.unobserve(node);
      }
    };
  }, [end, duration, hasStarted]);

  return <span ref={ref} className={className}>{count.toLocaleString()}{suffix}</span>;
};


export default function Landing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handleGetStarted = async () => {
    if (user) {
      window.location.href = createPageUrl("Dashboard");
    } else {
      await User.login();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900">
      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            The Future of Transaction Management
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            MySuperTC is the only platform real estate professionals need to manage every deal, client, and deadline with unparalleled precision and intelligence.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleGetStarted} size="lg" className="clay-accent-blue px-8 text-lg">
              {user ? 'Go to Dashboard' : 'Get Started'} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-6xl font-bold text-blue-600"><AnimatedCounter end={50000} suffix="+" /></p>
              <p className="text-sm md:text-base text-gray-500 mt-2">Deals Managed</p>
            </div>
            <div>
              <p className="text-4xl md:text-6xl font-bold text-blue-600"><AnimatedCounter end={2500} suffix="+" /></p>
              <p className="text-sm md:text-base text-gray-500 mt-2">Active Agents</p>
            </div>
            <div>
              <p className="text-4xl md:text-6xl font-bold text-blue-600"><AnimatedCounter end={98} suffix="%" /></p>
              <p className="text-sm md:text-base text-gray-500 mt-2">Success Rate</p>
            </div>
            <div>
              <p className="text-4xl md:text-6xl font-bold text-blue-600">24/7</p>
              <p className="text-sm md:text-base text-gray-500 mt-2">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Everything You Need. Nothing You Don’t.</h2>
            <p className="text-lg text-gray-600">Built for professionals who demand precision, speed, and complete transaction control.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "Smart Transaction Pipeline", description: "Track every deal from contact to closing with intelligent automation and deadline management." },
              { icon: Calendar, title: "Never Miss a Deadline", description: "Advanced calendar integration with smart reminders ensures you're always ahead." },
              { icon: MapPin, title: "Property Intelligence", description: "Instant MLS integration, geocoding, and property insights for a competitive edge." },
              { icon: Users, title: "Advanced Client Management", description: "A sophisticated CRM that tracks every interaction, preference, and opportunity." },
              { icon: DollarSign, title: "Commission Tracking", description: "Real-time commission calculations and financial reporting to keep your business profitable." },
              { icon: Shield, title: "Compliance Ready", description: "Built-in disclosure tracking and compliance tools that protect your license and reputation." }
            ].map(feature => (
              <div key={feature.title} className="bg-gray-50/70 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-6 bg-gray-50/70">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Simple Pricing, Powerful Results</h2>
          <p className="text-lg text-gray-600 mb-12">One plan. Everything included. Cancel anytime.</p>
          
          <div className="border border-gray-200 rounded-3xl p-8 md:p-12 bg-white">
            <h3 className="text-2xl font-bold mb-4">MySuperTC Pro</h3>
            <p className="text-5xl md:text-6xl font-bold mb-2">
              $97<span className="text-xl font-medium text-gray-500">/month</span>
            </p>
            <p className="text-gray-600 mb-8">Complete transaction management for serious agents.</p>
            
            <ul className="space-y-4 text-left max-w-sm mx-auto mb-10">
              {[
                "Unlimited transactions & clients",
                "Advanced calendar & deadline management", 
                "MLS integration & property intelligence",
                "Commission tracking & reporting",
                "24/7 priority support",
                "Compliance & disclosure tracking",
              ].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button onClick={handleGetStarted} size="lg" className="w-full clay-accent-blue text-lg">
              Start 14-Day Free Trial
            </Button>
            <p className="text-sm text-gray-500 mt-4">No credit card required.</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 text-center px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Ready to Dominate Your Market?</h2>
          <p className="text-lg text-gray-600 mb-10">Join thousands of top-performing agents who've transformed their business with MySuperTC.</p>
          <Button onClick={handleGetStarted} size="lg" className="clay-accent-blue px-10 text-xl">
            Sign Up Now <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
