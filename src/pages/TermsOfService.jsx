import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="bg-white">
       <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
         <Link to={createPageUrl("Landing")} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg max-w-none text-gray-700 prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-10 prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:underline">
          <section>
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using the My Super TC platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms constitute a legally binding agreement between you and My Super TC.
            </p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>2. Description of Service</h2>
            <p>
              My Super TC is a real estate transaction management platform designed for licensed professionals and authorized parties involved in real estate transactions. The Service enables users to organize deals, manage client relationships, track deadlines, and handle communications and documentation.
            </p>
          </section>
          
          <hr className="my-8" />

           <section>
            <h2>3. User Accounts</h2>
            <p>To use the Service, you must register for an account. You agree to:</p>
            <ul className="list-disc list-outside pl-6">
              <li>Provide accurate, current, and complete information.</li>
              <li>Maintain the security of your login credentials.</li>
              <li>Accept all responsibility for activity under your account.</li>
              <li>Use the Service only if you are a licensed real estate professional or an authorized party engaged in real estate transactions.</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts found to be misrepresenting identity, credentials, or authorization.</p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
             <ul className="list-disc list-outside pl-6">
                <li>Violate any applicable laws, regulations, or codes of conduct.</li>
                <li>Upload or transmit any malicious, unlawful, or infringing content.</li>
                <li>Interfere with or disrupt the integrity or performance of the Service.</li>
                <li>Attempt unauthorized access to the Service, other accounts, or our systems.</li>
            </ul>
            <p>Violation of this section may result in immediate suspension or termination of your account.</p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>5. Data and Privacy</h2>
            <p>
              Your use of the Service is governed by our <Link to={createPageUrl("PrivacyPolicy")}>Privacy Policy</Link>, which describes how we collect, use, and safeguard your information. You are solely responsible for the accuracy and legality of the data you upload.
            </p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>6. Intellectual Property</h2>
            <p>
              The Service, including its software, features, content, and branding, is the exclusive property of My Super TC and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            <ul className="list-disc list-outside pl-6">
              <li>You are granted a limited, non-exclusive, non-transferable license to use the Service for lawful business purposes.</li>
              <li>You may not copy, modify, distribute, reverse-engineer, or create derivative works of the Service without our prior written consent.</li>
            </ul>
          </section>

          <hr className="my-8" />

          <section>
            <h2>7. Fees and Payment</h2>
            <p>
              The Service is provided on a subscription basis. By subscribing, you agree to:
            </p>
            <ul className="list-disc list-outside pl-6">
              <li>Pay all applicable fees as described on our pricing page.</li>
              <li>Acknowledge that subscriptions auto-renew unless canceled before the renewal date.</li>
              <li>Accept that fees may change, with reasonable prior notice.</li>
            </ul>
            <p>Unpaid fees may result in suspension or termination of your account.</p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>8. Service Availability & Termination</h2>
            <p>
              We strive for continuous service availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue the Service at any time.
            </p>
            <ul className="list-disc list-outside pl-6">
              <li>You may terminate your account at any time.</li>
              <li>We may suspend or terminate your account if you violate these Terms, fail to pay fees, or engage in misuse of the Service.</li>
            </ul>
            <p>Upon termination, your right to access the Service ceases immediately, and certain sections of these Terms will survive (e.g., Limitation of Liability, Indemnification, Governing Law).</p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>
             To the maximum extent permitted by law:
            </p>
            <ul className="list-disc list-outside pl-6">
              <li>My Super TC will not be liable for indirect, incidental, special, consequential, or punitive damages, including lost profits, data, or goodwill.</li>
              <li>Our total liability for any claim arising under these Terms shall not exceed the amount you paid us in the 12 months preceding the claim.</li>
            </ul>
          </section>

          <hr className="my-8" />

          <section>
            <h2>10. Disclaimers</h2>
            <ul className="list-disc list-outside pl-6">
              <li>The Service is provided on an "as-is" and "as-available" basis without warranties of any kind.</li>
              <li>We disclaim all warranties, express or implied, including fitness for a particular purpose and non-infringement.</li>
              <li>We do not warrant that the Service will be error-free, secure, or uninterrupted.</li>
            </ul>
          </section>

          <hr className="my-8" />

          <section>
            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless My Super TC, its officers, employees, and agents from and against any claims, liabilities, damages, losses, or expenses (including attorney's fees) arising out of or related to your:
            </p>
            <ul className="list-disc list-outside pl-6">
              <li>Use of the Service,</li>
              <li>Violation of these Terms, or</li>
              <li>Infringement of any third-party rights.</li>
            </ul>
          </section>

          <hr className="my-8" />

          <section>
            <h2>12. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of the State of California, without regard to conflict of laws principles.
            </p>
            <ul className="list-disc list-outside pl-6">
              <li>Any disputes shall first be attempted through good-faith negotiation.</li>
              <li>If unresolved, disputes shall be submitted to binding arbitration in Los Angeles County, California, under the rules of the American Arbitration Association (AAA).</li>
              <li>You waive the right to participate in class actions against My Super TC.</li>
            </ul>
          </section>

          <hr className="my-8" />

          <section>
            <h2>13. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Any changes will be posted with an updated Effective Date. Continued use of the Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>14. User Data & Compliance Addendum</h2>
            
            <p><strong>14.1 Roles & Definitions.</strong> For purposes of data protection laws: under the CCPA/CPRA, Customer is the "Business" and My Super TC is a "Service Provider"; under the GDPR, Customer is the "Controller" and My Super TC is a "Processor." "Customer Data" means information you or your users upload to, or generate within, the Service (including transaction records, documents, and email integration data).</p>

            <p><strong>14.2 Processing Instructions.</strong> We will process Customer Data solely (a) in accordance with your documented instructions, (b) as necessary to provide, maintain, secure, and improve the Service, and (c) as required by applicable law. If we are legally required to process Customer Data beyond your instructions, we will (where lawful) notify you.</p>

            <p><strong>14.3 Prohibited Data.</strong> You agree not to upload the following without a separate written agreement with us: government-issued identifiers (e.g., SSN), protected health information (PHI) under HIPAA, payment card data subject to PCI-DSS, biometric identifiers, or other regulated/sensitive data categories requiring specialized safeguards. We are not a HIPAA Business Associate and do not provide PCI-compliant storage unless expressly agreed in writing.</p>

            <p><strong>14.4 CCPA/CPRA Service Provider; No "Sale" or "Sharing."</strong> We do not "sell" or "share" personal information (as those terms are defined by CPRA) and will not use Customer Data for cross-context behavioral advertising. We will only use Customer Data to perform the Service, for security/debugging, or as otherwise permitted by the Service Provider exception.</p>

            <p><strong>14.5 GDPR Processor Terms.</strong> Where GDPR applies, we will: (a) implement appropriate technical and organizational measures; (b) assist you with data subject requests we receive that reasonably relate to your use of the Service; and (c) upon request, make available information reasonably necessary to demonstrate compliance (e.g., security summaries, audits/certifications or questionnaires). If EEA/UK data is transferred to the U.S., we will rely on a valid transfer mechanism (e.g., SCCs or a successor framework).</p>

            <p><strong>14.6 Sub-processors.</strong> You grant us general authorization to engage sub-processors (e.g., cloud infrastructure, email delivery). We remain responsible for our sub-processors' performance and will ensure they are bound by data protection obligations no less protective than these Terms. A current list is available upon request; we will provide notice of material changes where required.</p>

            <p><strong>14.7 Security.</strong> We use industry-standard safeguards including encryption in transit and at rest, access controls, and monitoring. You are responsible for securing your accounts, users, endpoints, and the accuracy and lawfulness of Customer Data.</p>

            <p><strong>14.8 Incident Response.</strong> If we become aware of a breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to Customer Data, we will notify you without undue delay and provide information reasonably available to help you meet any obligations. Notification is not an admission of fault or liability.</p>

            <p><strong>14.9 Data Retention & Deletion.</strong> During the Subscription Term, you may export Customer Data through available features or by written request. Upon termination, we will delete or de-identify Customer Data within a commercially reasonable period, except where retention is required by law, for dispute resolution, or to maintain business records (in which case data will be protected and isolated).</p>

            <p><strong>14.10 Government & Third-Party Requests.</strong> If a governmental body or litigant demands Customer Data, we will (where lawful) notify you to allow you to seek protective measures. We may disclose limited Customer Data where we reasonably believe disclosure is legally required or necessary to protect rights, safety, or the integrity of the Service.</p>

            <p><strong>14.11 No Legal Advice.</strong> The Service may facilitate compliance workflows (e.g., disclosures, timelines), but we do not provide legal advice. You are solely responsible for compliance with real estate, privacy, retention, and disclosure obligations in your jurisdictions.</p>

            <p><strong>14.12 Escrow & Email Integrations.</strong> For email integrations (e.g., Gmail), we access only the minimum necessary data to provide the features you enable. Our use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including Limited Use.</p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>15. Fees; Billing; Changes</h2>
            
            <p><strong>15.1 Fees & Taxes.</strong> You agree to pay all fees stated at purchase and any applicable taxes, duties, and government charges (excluding our net income taxes). If required by law to withhold taxes, you will provide valid documentation so we can reclaim or reduce such amounts.</p>

            <p><strong>15.2 Billing & Auto-Renewal.</strong> Subscriptions renew automatically for the then-current term unless canceled before renewal. You authorize us (and our payment processors) to charge your payment method for recurring fees and any overages or add-ons you elect.</p>

            <p><strong>15.3 Pricing Changes.</strong> We may modify pricing upon reasonable prior notice, effective on the next renewal term, unless otherwise agreed.</p>

            <p><strong>15.4 No Refunds.</strong> Except where required by law or expressly stated otherwise, all fees are non-refundable.</p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>16. Late Payments; Suspension; Collections</h2>
            
            <p><strong>16.1 Late Payments & Interest.</strong> Amounts not received when due may accrue interest at the lesser of 1.5% per month (18% per annum) or the maximum amount allowed by law, from the due date until paid. We may also charge reasonable late or re-billing fees for failed or reversed payments.</p>

            <p><strong>16.2 Dunning; Suspension.</strong> If a charge is declined or an invoice remains unpaid, we may attempt to re-process and will send notices to your billing contact. We may suspend or restrict access (in whole or in part) for non-payment after reasonable notice. Suspension does not relieve you of the obligation to pay accrued fees.</p>

            <p><strong>16.3 Collections; Assignment of Receivables.</strong> If your account remains past due, you agree that we may (a) refer the account to a third-party collection agency, (b) engage counsel to collect, and/or (c) sell, assign, or otherwise transfer our right to receive payment (in whole or in part) to a third party, to the fullest extent permitted by applicable law. We may provide such third parties with necessary account, contact, and billing information strictly for collection and enforcement purposes. We will provide notice of assignment to your last known billing email where required by law.</p>

            <p><strong>16.4 Costs of Collection; Attorneys' Fees.</strong> You agree to reimburse all reasonable costs of collection, including agency fees, court costs, and reasonable attorneys' fees, incurred due to your non-payment, to the extent permitted by law.</p>

            <p><strong>16.5 Chargebacks & Disputes.</strong> Initiating a chargeback without first providing us a reasonable opportunity to resolve a billing dispute constitutes a material breach. We may assess administrative fees and suspend the account pending resolution.</p>

            <p><strong>16.6 Data Access During Delinquency.</strong> During suspension for non-payment, we may disable certain features, downloads, exports, or API functionality until the account is brought current, except as otherwise required by law. Upon cure, we will restore access within a commercially reasonable time.</p>

            <p><strong>16.7 Termination for Non-Payment.</strong> If amounts remain unpaid after suspension and notice, we may terminate the account. Following termination, we may delete Customer Data in accordance with Section 14.9.</p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>17. Additional Terms; Priority</h2>
            
            <p><strong>17.1 Conflicts.</strong> If there is a conflict between this Addendum (Sections 14–17) and other Terms, these Sections control with respect to data protection, billing, delinquency, and collections.</p>

            <p><strong>17.2 Severability.</strong> If any provision of Sections 14–17 is held unenforceable, it will be modified to the minimum extent necessary to be enforceable, and the remainder will remain in effect.</p>

            <p><strong>17.3 Reservation of Rights.</strong> We reserve all rights not expressly granted herein.</p>
          </section>

          <hr className="my-8" />
          
          <section>
            <h2>18. Contact Information</h2>
            <p>
              For questions regarding these Terms, please contact us at:<br />
              📧 support@mysupertc.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}