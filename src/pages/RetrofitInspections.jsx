import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Shield, Droplet, Home, AlertTriangle } from 'lucide-react';

const CityRetrofitRequirement = ({ city, requirements }) => (
  <div className="py-6 border-b border-gray-200 last:border-b-0">
    <h3 className="text-xl font-semibold text-gray-800 mb-3">{city}</h3>
    <ul className="space-y-2">
      {requirements.map((req, index) => (
        <li key={index} className="flex items-start gap-3 text-gray-700">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <span>{req}</span>
        </li>
      ))}
    </ul>
  </div>
);

const RetrofitHighlight = ({ icon: Icon, title, description, color = "blue" }) => (
  <div className={`p-6 rounded-2xl bg-${color}-50 border border-${color}-100`}>
    <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default function RetrofitInspections() {
  const retrofitItems = [
    "Seismic gas shut-off valves",
    "Proper smoke and carbon monoxide detectors",
    "Double strapped water heaters",
    "Window safety glazing in hazardous areas",
    "Low-flow toilets, faucets, and shower heads"
  ];

  const cityRequirements = {
    "Los Angeles (City of L.A.)": [
      "Certificate of Compliance (DWP COC)",
      "Seismic Gas Shut-Off Valve (SGSOV)",
      "Double-strapped water heater",
      "Low-flow toilets (1.28 gpf; 1.6 gpf acceptable if existing)",
      "Low-flow shower heads (2.5 gpm)",
      "Smoke detectors (hardwired with battery backup or 10-year sealed battery)",
      "Safety glazing in sliding doors (where not tempered)",
      "Carbon monoxide detectors (all levels, including basements/attics)"
    ],
    "Los Angeles County (Unincorporated)": [
      "Water-conserving fixtures",
      "Double-strapped water heater",
      "Smoke detectors in bedrooms, hallways, and every level",
      "Carbon monoxide detectors on every level"
    ],
    "Beverly Hills": [
      "Water conservation affidavit required",
      "Ultra low-flow toilets (1.6 gpf or less)",
      "Low-flow shower heads and faucets",
      "Hardwired smoke detectors with battery backup (must be interconnected)",
      "Carbon monoxide detectors (all levels, including basements)",
      "Water heater strapping"
    ],
    "Burbank": [
      "Certificate of Compliance required",
      "Low-flow toilets (1.6 gpf), shower heads (2.5 gpm), faucets (2.2 gpm)",
      "Double-strapped water heater",
      "Smoke detectors in bedrooms, hallways, and each level",
      "Carbon monoxide detectors (all levels)"
    ],
    "Calabasas": [
      "Water-conserving fixtures required",
      "Double-strapped water heater",
      "Smoke detectors (electric or 10-year battery)",
      "Carbon monoxide detectors (all levels, including basements)"
    ],
    "Culver City": [
      "Report of Building Records required",
      "Seismic gas shut-off valve",
      "Water-conserving fixtures",
      "Double-strapped water heater",
      "Smoke detectors in bedrooms and hallways",
      "Carbon monoxide detectors on each level"
    ],
    "Glendale": [
      "Water-conserving fixtures",
      "Double-strapped water heater",
      "Smoke detectors in bedrooms, hallways, and each level",
      "Carbon monoxide detectors (all levels)"
    ],
    "Inglewood": [
      "Water-conserving fixtures",
      "Double-strapped water heater",
      "Smoke detectors (hardwired with battery backup)",
      "Carbon monoxide detectors on each level"
    ],
    "Malibu": [
      "Seismic gas shut-off valve required",
      "Water-conserving fixtures",
      "Double-strapped water heater",
      "Smoke and carbon monoxide detectors on every level"
    ],
    "Manhattan Beach": [
      "Retrofit declaration required",
      "Toilets must be 1.28 gpf or less",
      "Water heater strapping",
      "Smoke detectors and carbon monoxide detectors on each level"
    ],
    "Pasadena": [
      "Certificate of Occupancy required",
      "Water-conserving fixtures",
      "Double-strapped water heater",
      "Smoke and carbon monoxide detectors in hallways and each level"
    ],
    "San Fernando": [
      "Pre-Sale Inspection Report required",
      "Seismic gas shut-off valve",
      "Water heater strapping",
      "Smoke and carbon monoxide detectors in bedrooms, hallways, and each level",
      "GFCI outlets as needed"
    ],
    "Santa Clarita / Valencia": [
      "Water-conserving fixtures",
      "Water heater strapping",
      "Smoke detectors and carbon monoxide detectors in bedrooms, hallways, and each level"
    ],
    "Santa Monica": [
      "Retrofit inspection required",
      "Seismic gas shut-off valve",
      "Water-conserving fixtures",
      "Double-strapped water heater",
      "Smoke and carbon monoxide detectors (all levels)"
    ],
    "Ventura County (Unincorporated)": [
      "Water-conserving fixtures",
      "Double-strapped water heater",
      "Smoke and carbon monoxide detectors (all levels, including basements)"
    ],
    "West Hollywood": [
      "Retrofit inspection required",
      "Seismic gas shut-off valve (installed within 12 months of escrow closing)",
      "Double-strapped water heater",
      "Smoke detectors in bedrooms, hallways, and all levels",
      "Carbon monoxide detectors (all levels, including basements)",
      "Pressure relief valve & drain pipe on water heater"
    ]
  };

  return (
    <>
      <div style={{ display: 'none' }}>
        <meta name="description" content="Learn California point-of-sale retrofit inspection requirements for Los Angeles & beyond. Gas shut-off valves, smoke/CO detectors, water-saving retrofits." />
        <meta name="keywords" content="point of sale retrofit inspection, Los Angeles retrofit requirements, retrofit inspection checklist California, retrofit inspection Los Angeles County, seismic gas shut-off valve requirement, water conservation retrofit law SB-407, low-flow toilet retrofit compliance, retrofit certificate of compliance Los Angeles, smoke detector retrofit requirement California" />
        <title>California Point-of-Sale Retrofit Inspections | LA Retrofit Guide - MySuperTC</title>
      </div>
      
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <Link to={createPageUrl("Resources")} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resource Hub
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">
            California Point-of-Sale Retrofit Inspections
          </h1>
          <p className="text-lg text-gray-600">
            A guide to mandatory retrofit inspections in Los Angeles and other Southern California municipalities, ensuring compliance with safety and water conservation laws at the time of property transfer.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-6 pb-20 space-y-16">
          
          <div className="p-8 md:p-10 bg-gray-50/70 rounded-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
            <p className="text-gray-700 mb-6">
              Point-of-sale retrofit inspections apply whenever residential or non-residential properties transfer ownership. They ensure compliance with fire safety codes, water conservation laws, and seismic safety measures.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {retrofitItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full">
                     <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-800">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RetrofitHighlight icon={Shield} title="Legal Compliance" description="Required to close escrow in many California cities." color="green" />
            <RetrofitHighlight icon={AlertTriangle} title="Safety First" description="Ensures protection against fire, gas leaks, and seismic risks." color="red" />
            <RetrofitHighlight icon={Droplet} title="Water Conservation" description="Aligns with California's aggressive water-saving mandates." color="blue" />
          </div>

          <div className="p-8 md:p-10 bg-blue-50/70 rounded-2xl border border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">California Water Conservation Law (SB-407)</h2>
            <p className="text-gray-700 mb-6">
              Effective January 1, 2017, California State Bill SB-407 requires sellers to disclose and replace non-compliant plumbing fixtures in properties built before 1994.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3"><span className="text-blue-600 mt-1.5 font-bold">&bull;</span><span>Fixtures include toilets (1.6 gpf or less), shower heads (2.5 gpm), and faucets (2.2 gpm).</span></li>
              <li className="flex items-start gap-3"><span className="text-blue-600 mt-1.5 font-bold">&bull;</span><span>Compliance is required for transfer, and non-compliant fixtures must be disclosed in writing.</span></li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">City-by-City Retrofit Requirements</h2>
            <div className="space-y-8">
              {Object.entries(cityRequirements).map(([city, requirements]) => (
                <div key={city} className="p-8 bg-gray-50/70 rounded-2xl">
                    <CityRetrofitRequirement 
                        city={city}
                        requirements={requirements}
                    />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}