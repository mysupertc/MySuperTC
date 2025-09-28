import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <Link to={createPageUrl("Landing")} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg max-w-none text-gray-700 prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-10 prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:underline">
          <section>
            <h2>Introduction</h2>
            <p>
              My Super TC ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our real estate transaction management application ("Platform"). By using the Platform, you agree to the practices described in this Privacy Policy.
            </p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>Information We Collect</h2>
            <p>We collect two types of information: (1) information you provide directly, and (2) information generated through your use of the Platform.</p>
            
            <h3>Personal & Professional Information</h3>
            <ul className="list-disc list-outside pl-6">
              <li>Name, email address, and contact information</li>
              <li>Professional details (e.g., DRE number, brokerage affiliation)</li>
              <li>Transaction, client, and contact data you input into the Platform</li>
            </ul>
            
            <h3>Gmail Integration Data</h3>
            <p>If you connect your Gmail account, we may collect:</p>
            <ul className="list-disc list-outside pl-6">
              <li>Email metadata (headers, subjects, recipients)</li>
              <li>Email content for threads linked to your active transactions</li>
            </ul>
            <p>This data is used exclusively to power the email integration features within your account and is not used for advertising or unrelated purposes.</p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>How We Use Your Information</h2>
            <p>Your data is used only to operate, improve, and support the Platform:</p>
            <ul className="list-disc list-outside pl-6">
              <li>To provide and maintain My Super TC services</li>
              <li>To enable Gmail integration (sending, receiving, and organizing transaction-related emails)</li>
              <li>To communicate with you regarding your account, updates, and support</li>
              <li>To improve application functionality and user experience</li>
            </ul>
          </section>

          <hr className="my-8" />

          <section>
            <h2>Google API Services User Data Policy</h2>
            <p>My Super TC's use and transfer of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.</p>
            <ul className="list-disc list-outside pl-6">
              <li>Data from Google APIs is used solely to provide and improve My Super TC's Gmail integration.</li>
              <li>We do not transfer Google user data to third parties except as required to provide the integration or comply with law.</li>
              <li>We do not use Google user data for advertising.</li>
            </ul>
          </section>

          <hr className="my-8" />

          <section>
            <h2>Data Sharing & Disclosure</h2>
            <p>We do not sell, rent, or trade your personal or transaction data. We may disclose information only in the following circumstances:</p>
            <ol className="list-decimal list-outside pl-6">
              <li><strong>Service providers</strong> – To trusted vendors who help operate the Platform (e.g., Google for API communication), subject to confidentiality obligations.</li>
              <li><strong>Legal compliance</strong> – When required by law, subpoena, or government request.</li>
              <li><strong>Business transfers</strong> – If My Super TC undergoes a merger, acquisition, or asset sale, your data may be transferred as part of that transaction, subject to this Policy.</li>
            </ol>
          </section>

          <hr className="my-8" />

          <section>
            <h2>Data Security</h2>
            <p>We implement industry-standard safeguards to protect your data, including:</p>
            <ul className="list-disc list-outside pl-6">
              <li>Encryption in transit and at rest</li>
              <li>Access controls and authentication safeguards</li>
              <li>Regular security monitoring</li>
            </ul>
            <p>However, no system is completely secure. By using the Platform, you acknowledge that no data transmission or storage system can be guaranteed to be 100% secure.</p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>Your Rights & Choices</h2>
            <p>Depending on your jurisdiction (e.g., CCPA, GDPR), you may have the right to:</p>
            <ul className="list-disc list-outside pl-6">
              <li>Access and update your personal information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Revoke Gmail access at any time through your Google account settings</li>
              <li>Opt-out of non-essential communications</li>
            </ul>
            <p>Requests to exercise these rights may be submitted to support@mysupertc.com.</p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>Data Retention</h2>
            <p>
              We retain your data only as long as necessary to provide services or comply with legal obligations. When no longer needed, data will be securely deleted.
            </p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>Children's Privacy</h2>
            <p>
              Our Platform is not directed to children under 18, and we do not knowingly collect data from minors. If we become aware of such data, we will delete it promptly.
            </p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>International Users</h2>
            <p>
              If you access the Platform outside the United States, be aware that your information may be transferred to and stored in the United States, where privacy laws may differ.
            </p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>Changes to this Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Effective Date." Material changes will be communicated directly when required by law.
            </p>
          </section>

          <hr className="my-8" />

          <section>
            <h2>Contact Us</h2>
            <p>
              For questions about this Privacy Policy or our data practices, please contact:<br />
              📧 support@mysupertc.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}