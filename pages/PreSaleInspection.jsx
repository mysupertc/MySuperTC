
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Phone, DollarSign, ExternalLink } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


const CityRequirement = ({ city, report, phone, cost, link }) => (
  <div className="py-4 border-b last:border-b-0 border-gray-200">
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
      <div className="flex-1">
        <p className="font-bold text-gray-800">{city}</p>
        <p className="text-sm text-gray-600">{report}</p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm mt-2 sm:mt-0">
        {phone && <div className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4 text-gray-500" /> {phone}</div>}
        {cost && <div className="flex items-center gap-2 text-gray-700"><DollarSign className="w-4 h-4 text-gray-500" /> {cost}</div>}
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
              <ExternalLink className="w-3 h-3 mr-2" />
              Website
            </Button>
          </a>
        )}
      </div>
    </div>
  </div>
);

const FAQItem = ({ question, children }) => (
  <div className="py-6 border-b border-gray-200 last:border-0">
    <h3 className="font-semibold text-lg mb-2">{question}</h3>
    <div className="text-gray-600 space-y-4">{children}</div>
  </div>
);


export default function PreSaleInspection() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [activeAccordion, setActiveAccordion] = React.useState("los-angeles-county");

    const countyData = {
      "los-angeles-county": {
        name: "Los Angeles County",
        cities: [
          { city: "Azusa", report: "Real Property Records Report", phone: "626-812-5265", cost: "$255 and up", link: "https://www.azusaca.gov/2200/RPRR-Pre-Sale-Inspection" },
          { city: "Bell", report: "Pre-Sale Report", phone: "323-588-6211", cost: "$200 and up", link: "https://www.cityofbell.org/?NavID=253" },
          { city: "Beverly Hills", report: "Sale of Property Affidavit", phone: "310-285-1141", cost: "No cost", link: "https://www.beverlyhills.org/306/Building-Inspection" },
          { city: "Burbank", report: "Retrofit Upon Sale Certificate of Compliance", phone: "818-238-3730", cost: "No cost", link: "https://www.burbankca.gov/web/community-development/building-inspections" },
          { city: "Compton", report: "Pre-Sale Inspection Report", phone: "310-605-5509", cost: "$129 and up", link: "https://www.comptoncity.org/home/showpublisheddocument/2/638650992595393234" },
          { city: "Cudahy", report: "Pre-Inspection Report", phone: "323-773-5143", cost: "$255 and up", link: "https://www.cityofcudahyca.gov/documentcenter/view/160" },
          { city: "Culver City", report: "Report for Residential Building Record", phone: "310-253-5800", cost: "$96", link: "https://www.culvercity.gov/City-Hall/City-Departments/Planning-and-Development/Building-Safety" },
          { city: "El Monte", report: "Real Property Inspection", phone: "626-580-2050", cost: "$423.82 and up", link: "https://www.ci.el-monte.ca.us/477/Real-Property-Inspection-Program" },
          { city: "Gardena", report: "Property Information Report", phone: "310-217-9530", cost: "$435 and up", link: "https://cityofgardena.org/truth-in-sales/" },
          { city: "Hawaiian Gardens", report: "Pre-Sale Inspection Report", phone: "562-420-2641", cost: "$174 and up", link: "https://www.hgcity.org/home/showpublisheddocument/4284/638902506739650739" },
          { city: "Hermosa Beach", report: "Report for Residential Building Record", phone: "310-318-0235", cost: "$246 and up", link: "https://www.hermosabeach.gov/our-government/community-development/applications-forms-handouts" },
          { city: "Huntington Park", report: "Presale Records & Inspection Report", phone: "323-584-6271", cost: "$165 and up", link: "https://www.hpca.gov/documentcenter/view/11478" },
          { city: "Inglewood", report: "Pre-Sale Report", phone: "310-412-5294", cost: "$263 and up", link: "https://www.cityofinglewood.org/1587/A-Presale-Report-of-Building-Records-and" },
          { city: "Lawndale", report: "Residential Property Report", phone: "310-973-3230", cost: "$240", link: "https://www.lawndale.ca.gov/cms/one.aspx?portalId=16676137&pageId=17107997" },
          { city: "Long Beach", report: "Garage Inspection Report", phone: "562-570-2633", cost: "$113 and up", link: "https://www.longbeach.gov/lbcd/enforcement/garage/" },
          { city: "Los Angeles (City)", report: "9A Residential Property Report", phone: "213-485-2216", cost: "$70.85", link: "https://dbs.lacity.gov/services/zoning/residential-property-report" },
          { city: "Lynwood", report: "Real Property Report", phone: "310-603-0220 x289", cost: "$276 and up", link: "https://www.lynwoodca.gov/170/Building-Safety-Division" },
          { city: "Manhattan Beach", report: "Residential Building Report", phone: "310-802-5500", cost: "$309", link: "https://www.manhattanbeach.gov/departments/community-development/building-and-safety" },
          { city: "Maywood", report: "Pre-Sale Report", phone: "323-562-5723", cost: "$110", link: "https://cityofmaywood.com/379/Pre-Sale-Inspections" },
          { city: "Palos Verdes Estates", report: "Real Property Records", phone: "310-378-0383", cost: "$183", link: "https://www.pvestates.org/services/building-safety/building-forms" },
          { city: "Pasadena", report: "Presale Certificate of Completion or Inspection", phone: "626-744-4633", cost: "$174 and up", link: "https://www.cityofpasadena.net/planning/code-compliance/presale-program/" },
          { city: "Redondo Beach", report: "Report of Residential Building Records", phone: "310-318-0636", cost: "$147", link: "https://redondo.org/departments/community_development/building_and_safety/residential_building_reports.php" },
          { city: "Rolling Hills Estates", report: "Pre-Sale Inspection Report", phone: "310-377-1577", cost: "$280 and up", link: "https://www.rollinghillsestates.gov/departments/presale-inspection-report" },
          { city: "San Marino", report: "Residential Compliance Certificate", phone: "626-300-0700", cost: "$70", link: "https://sanmarinoca.gov/Community%20Development%20Department/Applications%20and%20Guidelines%20Page/Building%20Applications,%20Forms,%20Handouts/Residential%20Compliance%20Application%20Updated%207-13-25.pdf" },
          { city: "Santa Monica", report: "Residential Building Report", phone: "310-458-8355", cost: "$330", link: "https://www.santamonica.gov/process-explainers/how-to-request-a-residential-building-report" },
          { city: "South Gate", report: "Pre-Sale Inspection", phone: "323-563-9549", cost: "$72", link: "https://www.cityofsouthgate.org/Home" },
          { city: "Torrance", report: "Smoke Detector Certificate of Compliance", phone: "310-618-5910", cost: "No cost", link: "https://www.torranceca.gov/home/showpublisheddocument/3136/638551030758330000" },
        ]
      },
      "orange-county": {
        name: "Orange County",
        cities: [
            { city: "Laguna Beach", report: "Real Property Report", phone: "949-497-0712", cost: "$40", link: "https://www.lagunabeachcity.net/government/departments/community-development/planning-zoning/applications-handouts/real-property-reports" },
            { city: "Newport Beach / Newport Coast", report: "RBR Optional; No Longer Required", phone: "949-644-3215", cost: "$214", link: "https://www.newportbeachca.gov/government/departments/community-development/building-division" },
            { city: "Huntington Beach", report: "Residential Pre-Sale Inspection Program", phone: "323-584-6271", cost: "No cost" },
        ]
      },
      "ventura-county": {
        name: "Ventura County",
        cities: [
            { city: "Oxnard", report: "Building Records Disclosure Report", phone: "805-654-7869", cost: "$97", link: "https://www.oxnard.gov/community-development/building-engineering" },
            { city: "Port Hueneme", report: "Residential & Commercial Building Records", phone: "805-986-6512", cost: "$48 and up", link: "https://www.ci.port-hueneme.ca.us/documentcenter/view/2515" },
            { city: "Thousand Oaks", report: "No Longer Required", phone: "805-449-2320", cost: "$0", link: "https://www.toaks.org/departments/community-development/building" },
            { city: "Ventura (City)", report: "Building Records Disclosure Report", phone: "805-654-7869", cost: "$97", link: "https://www.cityofventura.ca.gov/documentcenter/view/46029" }
        ]
      },
       "riverside-county": {
        name: "Riverside County",
        cities: [
            { city: "Cathedral City", report: "Smoke Detector Inspection", phone: "760-770-8200", cost: "$52" },
            { city: "Palm Springs", report: "Smoke Detector Inspection", phone: "760-323-8186", cost: "$111–$186" },
            { city: "Perris", report: "Water Service (transfer/deposit requirements)", phone: "951-943-4610", cost: "$125 + deposits" }
        ]
      },
      "san-diego-county": {
        name: "San Diego County",
        cities: [
            { city: "San Diego (City)", report: "No longer required", phone: "619-515-3500" }
        ]
      },
      "bay-area-northern": {
        name: "Bay Area / Northern CA",
        cities: [
             { city: "Belvedere", report: "Residential Building Record Report", phone: "415-435-3838", cost: "$300", link: "https://www.cityofbelvedere.org/documents/residential-report-application/" },
            { city: "Corte Madera", report: "Application for Report of Residential Record", phone: "415-927-5062", cost: "$130", link: "https://www.cortemadera.gov/DocumentCenter/View/792" },
            { city: "Daly City", report: "Residential Requirements Report (3R)", phone: "650-991-8061", cost: "$122", link: "https://www.dalycity.org/267/Residential-Requirements-Report-3R" },
            { city: "Del Rey Oaks", report: "Residential Property Inspection (RPI)", phone: "831-394-8511", cost: "$250 and up", link: "https://www.delreyoaks.org/cityhall/page/residential-property-inspection" },
            { city: "Livermore", report: "Residential Permit", phone: "925-960-4410", cost: "$108.12", link: "https://www.livermoreca.gov/home/showpublisheddocument/8834/638877568271700000" },
            { city: "Marina", report: "Residential Property Report", phone: "831-884-1214", cost: "$185", link: "https://www.cityofmarina.org/885/Residential-Property-Inspection-Reports" },
            { city: "Monterey", report: "Residential Property Report", phone: "831-646-3890", cost: "$168 and up", link: "https://monterey.gov/city_hall/community_development/building___safety/residential_property_inspections.php" },
            { city: "Piedmont", report: "Property Records Search", phone: "510-420-3040", cost: "$101 and up", link: "https://piedmont.ca.gov/common/pages/GetFile.ashx?key=Xo8CAaNx" },
            { city: "Ross", report: "Report of Residential Building Record", phone: "415-453-1453 Opt 4", cost: "$691-$1062", link: "https://www.townofrossca.gov/building/page/permit-services" },
            { city: "Salinas", report: "Residential Building Record Report", phone: "831-758-7251", cost: "$71.14", link: "https://www.salinas.gov/files/sharedassets/city/v/1/community-development/building-permits-images/eresidential-building-record-25-26.pdf" },
            { city: "San Francisco", report: "Report of Residential Building Record", phone: "628-652-3420", cost: "$214", link: "https://www.sf.gov/request3r" },
            { city: "San Pablo", report: "Residential Health & Safety Inspection", phone: "510-215-3030", cost: "$536 and up", link: "https://www.sanpabloca.gov/865/Residential-Health-Safety" },
            { city: "Sausalito", report: "Residential Building Record Report", phone: "415-289-4128", cost: "$490", link: "https://www.sausalito.gov/departments/community-development/building-division/resale-requirements" },
            { city: "Seaside", report: "Real Property Disclosure Report", phone: "831-899-6825", cost: "$182", link: "https://ci.seaside.ca.us/documentcenter/view/15496" }
        ]
      },
      "additional-cities": {
        name: "Additional Cities",
        cities: [
            { city: "Carpinteria", report: "No Longer Required", phone: "805-684-5405 x451", cost: "$0" },
            { city: "Chico", report: "Energy Retrofit Inspection", phone: "530-896-7200", cost: "Varies", link: "https://chicoca.gov/Departments/Community-Development/Building-Division/City-Residential-Retrofit-Program/index.html" }
        ]
      }
    };

    const filteredCounties = Object.keys(countyData).map(key => {
      const county = countyData[key];
      const filteredCities = county.cities.filter(city => 
          city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city.report.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { ...county, cities: filteredCities, id: key };
    }).filter(county => county.cities.length > 0);

  return (
    <>
      <div style={{ display: 'none' }}>
        <meta name="description" content="See which California cities require pre-sale inspections or reports before closing. Phone numbers, costs, and links to official pages for easy compliance." />
        <title>California Pre-Sale Home Inspection & Report Requirements by City (2025) - MySuperTC</title>
      </div>
      
      <div className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
            <Link to={createPageUrl("Resources")} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Resource Hub
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">
              California Pre-Sale Property Inspection Requirements (By City)
            </h1>
            <p className="text-lg text-gray-600">
              While California has no statewide pre-sale inspection law, many cities require sellers to obtain inspection reports or property records before closing. This guide helps you navigate local ordinances.
            </p>
          </div>

        <div className="sticky top-20 bg-white/80 backdrop-blur-md z-30 border-b border-t border-gray-200">
            <div className="max-w-5xl mx-auto px-6">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3">
                    {Object.keys(countyData).map(key => (
                         <a key={key} href={`#${key}`} onClick={() => setActiveAccordion(key)} className="text-sm font-medium text-gray-600 hover:text-blue-600 whitespace-nowrap">
                            {countyData[key].name}
                        </a>
                    ))}
                </div>
            </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="mb-12">
                 <input
                    type="search"
                    placeholder="Search by city name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
          
            <Accordion type="single" collapsible value={activeAccordion} onValueChange={setActiveAccordion} className="w-full space-y-4">
              {filteredCounties.map(county => (
                <AccordionItem value={county.id} key={county.id} id={county.id} className="border bg-gray-50/70 rounded-xl px-6">
                  <AccordionTrigger className="text-xl font-bold text-gray-900 hover:no-underline py-5">{county.name}</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="divide-y divide-gray-200">
                      {county.cities.map(item => <CityRequirement key={item.city} {...item} />)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
             {searchTerm && filteredCounties.length === 0 && (
                <p className="text-gray-600 text-center py-12">No cities found matching "{searchTerm}"</p>
            )}
        </div>
        
        <div className="max-w-5xl mx-auto px-6 py-20 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
            <div className="divide-y divide-gray-200">
              <FAQItem question="Does California require pre-sale inspections statewide?">
                  <p>No — California does not have a state-level pre-sale inspection or reporting requirement. Instead, individual cities or counties may impose specific mandates (such as building record reports, safety inspections, or certificates) that sellers must complete before closing. Always check with your local jurisdiction’s building or planning department to confirm local requirements.</p>
              </FAQItem>
              <FAQItem question="What is the “9A Report” in Los Angeles?">
                  <p>In Los Angeles, the “9A Report” (also called the Residential Property Report (RPR) or Form 9) is a mandatory city-issued record of the property’s building permits, violations, and special assessments. Sellers must obtain and deliver it to the buyer prior to entering into a purchase agreement or before close of escrow, in compliance with L.A. Municipal Code § 96.300. The fee is approximately $70.85 per report.</p>
              </FAQItem>
              <FAQItem question="What is the SF “3R Report”?">
                  <p>The Report of Residential Building Record (3R Report) is a San Francisco-issued record that shows the legal use and building permit history of a residential property as documented in city department records. It is not a physical inspection, but a compilation of official permit and zoning history.</p>
              </FAQItem>
              <FAQItem question="Why get a pre-listing inspection if city mandates may not require one?">
                  <p>A pre-listing inspection helps identify hidden defects—such as foundation issues, plumbing leaks, or electrical problems—before buyers’ inspections. Addressing these proactively can reduce renegotiation, withdrawn offers, and delays in escrow. It gives sellers more control over pricing and disclosures.</p>
              </FAQItem>
               <FAQItem question="What happens if a seller fails to comply with a city’s pre-sale report requirement?">
                  <p>If a seller fails to comply with required city-level inspections or reporting, escrow may be delayed or cancelled, or the transaction may be invalidated. The buyer could use noncompliance as a negotiation lever or seek legal recourse. Always confirm and satisfy local requirements well before listing.</p>
              </FAQItem>
            </div>
        </div>
      </div>
    </>
  );
}
