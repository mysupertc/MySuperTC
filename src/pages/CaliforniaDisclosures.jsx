
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, ArrowLeft, Shield, AlertTriangle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const DocumentLink = ({ title, description, url, name }) => (
  <div className="py-6 border-b border-gray-200 last:border-b-0">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600 mt-1">{description}</p>
        </div>
        {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 sm:mt-0">
              <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                View {name.replace('.pdf', '')}
              </Button>
            </a>
        ) : (
            <div className="text-sm text-gray-500 italic mt-2 sm:mt-0">Document coming soon.</div>
        )}
    </div>
  </div>
);

const HighlightCard = ({ icon: Icon, title, description, color = "blue" }) => (
  <div className={`p-6 rounded-2xl bg-${color}-50 border border-${color}-100`}>
    <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const RequirementItem = ({ date, children }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600"/>
            </div>
            <p className="text-xs text-blue-700 font-semibold mt-1">{date}</p>
        </div>
        <div className="border-l-2 border-dashed border-gray-300 pl-6 pb-8 pt-2 flex-1">
             <p className="text-gray-700">{children}</p>
        </div>
    </div>
);


export default function CaliforniaDisclosures() {
  return (
    <>
      <div style={{ display: 'none' }}>
        <meta name="description" content="Discover California's required seller disclosures, safety booklets, and AB-38 wildfire compliance forms for residential and commercial real estate sales." />
        <meta name="keywords" content="California real estate disclosures, California seller disclosure requirements, AB-38 fire safety disclosure, defensible space law California, California home hardening requirements, California home sale booklets, real estate disclosure forms California, California residential safety booklets" />
        <title>California Seller Disclosures & Required Home Sale Booklets (2025) - MySuperTC</title>
      </div>

      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <Link to={createPageUrl("Resources")} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resource Hub
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">
            California Home Sale Booklets & Disclosures
          </h1>
          <p className="text-lg text-gray-600">
            A guide to state-mandated booklets and disclosures for residential and commercial transactions in California, providing critical information on safety, environmental hazards, and property conditions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-6 pb-20 space-y-16">
          
           <div className="p-8 md:p-10 bg-gray-50/70 rounded-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Residential Properties</h2>
            <div className="space-y-4">
              <DocumentLink
                title="Home Energy Rating Guide"
                description="Explains how to understand a home's energy rating and improve efficiency, essential for all California homeowners."
                url="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb322e42428715dccc80ce/7c665e105_energyrating_cec_bw.pdf"
                name="Home Energy Rating Guide.pdf"
              />
              <DocumentLink
                title="Homeowner's Guide to Earthquake Safety"
                description="Helps sellers complete the Residential Earthquake Hazards Report and provides information on strengthening homes against earthquake damage."
                url="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb322e42428715dccc80ce/bcf559853_govbookletsearthquake.pdf"
                name="Earthquake Safety Guide.pdf"
              />
              <DocumentLink
                title="Residential Environmental Hazards Guide"
                description="Educates homeowners and buyers on environmental hazards like asbestos, formaldehyde, and radon that may affect residential properties."
                url="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb322e42428715dccc80ce/119cc59a8_govenviro.pdf"
                name="Environmental Hazards Booklet.pdf"
              />
              <DocumentLink
                title="Protect Your Family From Lead in Your Home"
                description="An EPA-published booklet explaining how to protect families from potential lead hazards in residential properties."
                url="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb322e42428715dccc80ce/f2d0535dd_govbookletsleadinsert.pdf"
                name="Lead in Your Home Booklet.pdf"
              />
               <DocumentLink
                title="Mold in My Home: What Do I Do?"
                description="Provides guidance for homeowners on health concerns, detection, cleanup, and safe removal of mold-contaminated materials."
                url="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb322e42428715dccc80ce/04c4d9f74_govbookletsmoldfaq.pdf"
                name="Mold FAQ.pdf"
              />
               <DocumentLink
                title="Acknowledgement of Receipt"
                description="A sign-off form for buyers to confirm they have received all state-required safety guides."
                url="#"
                name="Acknowledgement Receipt"
              />
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">AB-38 Fire Safety & Defensible Space</h2>
            <p className="text-gray-700 mb-8">
                According to the California Department of Forestry and Fire Protection (CAL FIRE), approximately one in four homes in the state are located in High or Very High Fire Hazard Severity Zones (FHSZ). Assembly Bill 38 (AB-38) created California’s first statewide fire retrofit program, creating critical disclosure and compliance requirements for sellers in these zones.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <HighlightCard icon={AlertTriangle} title="Fire Hazard Zones" description="Sellers must disclose if the property is in a High or Very High Fire Hazard Severity Zone." color="red" />
                <HighlightCard icon={Shield} title="Defensible Space" description="Properties near flammable vegetation must maintain at least 100 feet of defensible space." color="green" />
            </div>

            <div className="p-8 md:p-10 bg-blue-50/70 rounded-2xl border border-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Seller Compliance Timeline</h3>
                <div className="space-y-4">
                    <RequirementItem date="Jan 1, 2020">
                        For new construction, sellers must provide the buyer with a copy of the final inspection report regarding home hardening compliance.
                    </RequirementItem>
                    <RequirementItem date="Jan 1, 2021">
                        For homes built before 2010, sellers must provide written notice of fire-hardening best practices and features that make the home vulnerable.
                    </RequirementItem>
                     <RequirementItem date="Jul 1, 2021">
                        Sellers must provide documentation proving compliance with state defensible space laws and local vegetation management ordinances.
                    </RequirementItem>
                    <RequirementItem date="Jul 1, 2021">
                        If compliance documentation is unavailable, buyer and seller must agree in writing for compliance to be achieved within one year of closing.
                    </RequirementItem>
                    <RequirementItem date="Jul 1, 2025">
                       Sellers must provide a list of low-cost retrofits to harden the home and disclose which, if any, have been completed.
                    </RequirementItem>
                </div>
            </div>
             <p className="text-sm text-gray-600 mt-8">
                High and Very High Fire Hazard Severity Zones have been part of California’s legally required real estate disclosures for decades. AB-38 strengthens these protections by requiring sellers to be more proactive in disclosing compliance with fire safety standards.
            </p>
             <a href="https://www.fire.ca.gov/dspace" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
              <Button>
                Learn More at fire.ca.gov
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>


          <div className="p-8 md:p-10 bg-gray-50/70 rounded-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Commercial Properties</h2>
             <DocumentLink
                title="Commercial Property Owner's Guide to Earthquake Safety"
                description="Helps sellers complete the Commercial Earthquake Hazards Report and provides recommendations for strengthening commercial buildings."
                url="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb322e42428715dccc80ce/b77b14fd1_govbookletsearthquakecomm.pdf"
                name="Commercial Earthquake Safety Guide.pdf"
              />
          </div>
        </div>
      </div>
    </>
  );
}
