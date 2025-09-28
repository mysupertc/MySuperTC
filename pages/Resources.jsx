import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileText, Home, Scale, Shield, Map, ArrowRight } from 'lucide-react';

export default function Resources() {
  const resources = [
    {
      title: "California Seller Disclosures & Required Home Sale Booklets (2025)",
      description: "Comprehensive guide to California's required seller disclosures, safety booklets, and AB-38 wildfire compliance forms.",
      icon: FileText,
      link: createPageUrl("CaliforniaDisclosures"),
      category: "Legal & Compliance"
    },
    {
      title: "California Pre-Sale Home Inspection & Report Requirements by City",
      description: "Learn which California cities require pre-sale property inspections, reports, and compliance certificates.",
      icon: Map,
      link: createPageUrl("PreSaleInspection"),
      category: "City-Specific Requirements"
    },
    {
      title: "California Point-of-Sale Retrofit Inspections | LA Retrofit Guide",
      description: "Learn California point-of-sale retrofit inspection requirements for Los Angeles & beyond.",
      icon: Home,
      link: createPageUrl("RetrofitInspections"),
      category: "Retrofit & Compliance"
    }
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="text-center py-20 md:py-28 px-6 bg-gray-50/70">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 mb-4">Resource Hub</h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          Essential guides, forms, and compliance information for California real estate professionals.
        </p>
      </div>

      {/* Resources Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, index) => (
            <Link to={resource.link} key={index} className="block group">
              <div className="border border-gray-200 rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-blue-600 group-hover:shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                  <resource.icon className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm text-blue-600 font-medium mb-2">{resource.category}</p>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{resource.title}</h2>
                <p className="text-gray-600 mb-6 flex-grow">{resource.description}</p>
                <span className="font-semibold text-blue-600 flex items-center">
                  View Resource <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

       {/* Coming Soon Section */}
      <div className="bg-gray-50/70 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-gray-900 mb-4">More Resources Coming Soon</h2>
          <p className="text-lg text-gray-600 mb-12">
            We're continuously adding new resources to help you excel.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { icon: Home, title: "Property Management Guides", description: "Comprehensive resources for property managers and landlords." },
              { icon: Scale, title: "Legal Forms Library", description: "Updated legal forms and contracts for real estate transactions." },
              { icon: Shield, title: "Compliance Checklists", description: "Step-by-step compliance guides for various property types." }
            ].map(item => (
              <div key={item.title} className="bg-white border border-gray-200 p-8 rounded-2xl">
                 <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-5">
                    <item.icon className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}