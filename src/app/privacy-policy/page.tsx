'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#e6f0f3] to-[#1a4d5c]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1a4d5c] mb-4">Privacy Policy</h1>
            <p className="text-gray-600">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to SnapScape ("we," "our," or "us"). SnapScape is operated by Center For Development Of Advanced Technology LLC, 
                located in Ruwi, Muscat, Sultanate of Oman. We are committed to protecting your privacy and ensuring the security of your personal information.
              </p>
              <p className="text-gray-700 mb-4">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
                snapscape.app and use our photography competition platform services. Please read this privacy policy carefully.
              </p>
              <p className="text-gray-700">
                By using SnapScape, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">2. Contact Information</h2>
              <div className="bg-[#fffbe6] border border-[#e0c36a] rounded-lg p-4">
                <p className="text-gray-700 mb-2"><strong>Company:</strong> Center For Development Of Advanced Technology LLC</p>
                <p className="text-gray-700 mb-2"><strong>Address:</strong> Ruwi, Muscat, Sultanate of Oman</p>
                <p className="text-gray-700 mb-2"><strong>Email:</strong> <a href="mailto:info@snapscape.app" className="text-[#2699a6] hover:underline">info@snapscape.app</a></p>
                <p className="text-gray-700">
                  For any privacy-related questions or concerns, please contact us at the above email address.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">3. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">3.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">When you register for an account, we collect:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Name</li>
                <li>Email address</li>
                <li>Mobile phone number</li>
                <li>Country of residence</li>
                <li>Password (encrypted)</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">3.2 Photo and Content Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Photographs you upload to competitions</li>
                <li>Photo metadata (EXIF data) when required for competition purposes</li>
                <li>Titles and descriptions you provide for your submissions</li>
                <li>Ratings and votes you submit</li>
                <li>Comments and feedback you provide</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">3.3 Usage and Analytics Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on our platform</li>
                <li>Referring websites</li>
                <li>Google Analytics data (see Section 5 for details)</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">3.4 Cookies and Tracking Technologies</h3>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to enhance your experience. This includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Essential cookies for website functionality</li>
                <li>Authentication cookies to keep you logged in</li>
                <li>Google Analytics cookies for usage statistics</li>
                <li>Preference cookies to remember your settings</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">4. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the collected information for the following purposes:</p>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">4.1 Platform Operations</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Creating and managing your account</li>
                <li>Processing competition entries and votes</li>
                <li>Displaying competition results and leaderboards</li>
                <li>Sending verification emails and important notifications</li>
                <li>Providing customer support</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">4.2 Marketing and Promotional Activities</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Promoting competition results and winning photographs</li>
                <li>Showcasing platform achievements and milestones</li>
                <li>Creating marketing materials for SnapScape</li>
                <li>Social media promotion of competitions and results</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">4.3 Platform Improvement</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Analyzing usage patterns to improve user experience</li>
                <li>Developing new features and functionality</li>
                <li>Ensuring platform security and preventing fraud</li>
                <li>Monitoring and maintaining platform performance</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">5. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">We use the following third-party services:</p>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">5.1 Google Analytics</h3>
              <p className="text-gray-700 mb-4">
                We use Google Analytics to understand how users interact with our platform. Google Analytics collects 
                information such as how often users visit our site, what pages they visit, and what other sites they used prior to coming to our site.
              </p>
              <p className="text-gray-700 mb-4">
                You can opt-out of Google Analytics by installing the Google Analytics opt-out browser add-on.
              </p>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">5.2 Cloudinary</h3>
              <p className="text-gray-700 mb-4">
                We use Cloudinary for secure image storage and optimization. Your uploaded photographs are stored on Cloudinary's servers 
                with appropriate security measures.
              </p>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">5.3 MongoDB Atlas</h3>
              <p className="text-gray-700 mb-4">
                We use MongoDB Atlas for database hosting. Your personal information and platform data are stored securely 
                on MongoDB's cloud infrastructure.
              </p>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">5.4 Email Services</h3>
              <p className="text-gray-700 mb-4">
                We use hosted email services to send verification emails, notifications, and important platform communications.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">6. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                <strong>We do not sell, trade, or otherwise transfer your personal information to third parties</strong> except as described in this policy.
              </p>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">6.1 Public Information</h3>
              <p className="text-gray-700 mb-4">The following information may be publicly visible:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Your name (as photographer credit)</li>
                <li>Submitted photographs in competitions</li>
                <li>Competition rankings and results</li>
                <li>Photo titles and descriptions</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">6.2 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose your information if required by law, court order, or government regulation, or to protect 
                our rights, property, or safety, or that of our users or others.
              </p>
            </section>

            {/* Photo Usage Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">7. Photo Usage Rights and Copyright</h2>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">7.1 Usage Rights</h3>
              <p className="text-gray-700 mb-4">
                By submitting an entry, participants grant SnapScape a non-exclusive, royalty-free license to use, reproduce, 
                publish, and display the submitted photograph(s) for promotional purposes related to competitions and future 
                SnapScape initiatives, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Website display and galleries</li>
                <li>Social media promotion</li>
                <li>Marketing materials and exhibitions</li>
                <li>Platform promotional activities</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">7.2 Originality & Copyright</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>You must be the sole author and copyright holder of submitted photographs</li>
                <li>Submissions must not infringe upon any third-party rights</li>
                <li>You are responsible for obtaining necessary permissions for identifiable individuals</li>
                <li>Photographer credit will be given wherever the image is used</li>
                <li>Copyright remains with the photographer</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">8. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Data encryption in transit using HTTPS/SSL</li>
                <li>Secure password hashing and storage</li>
                <li>Access controls limiting data access to authorized administrators only</li>
                <li>Regular security monitoring and updates</li>
                <li>Secure cloud infrastructure with reputable providers</li>
              </ul>
              <p className="text-gray-700">
                While we strive to protect your personal information, no method of transmission over the internet or electronic 
                storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">9. Data Retention</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>User Account Data:</strong> Retained for up to 1 year after account deletion</li>
                <li><strong>Competition Photos:</strong> Retained for up to 1 year after competition completion</li>
                <li><strong>Backup Data:</strong> Retained for 1 month for disaster recovery purposes</li>
                <li><strong>Analytics Data:</strong> Retained according to Google Analytics retention settings</li>
              </ul>
              <p className="text-gray-700">
                You may request earlier deletion of your data by contacting us at info@snapscape.app.
              </p>
            </section>

            {/* Age Requirements */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">10. Age Requirements</h2>
              <p className="text-gray-700 mb-4">
                SnapScape is intended for users aged 12 and above. Users under 18 should have parental consent before using our platform.
              </p>
              <p className="text-gray-700">
                If we become aware that we have collected personal information from a child under 12 without parental consent, 
                we will take steps to remove that information from our servers.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">11. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">11.1 GDPR Rights (EU Users)</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">11.2 CCPA Rights (California Users)</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Know:</strong> Know what personal information is collected and how it's used</li>
                <li><strong>Delete:</strong> Request deletion of personal information</li>
                <li><strong>Opt-Out:</strong> Opt-out of the sale of personal information (we don't sell data)</li>
                <li><strong>Non-Discrimination:</strong> Not be discriminated against for exercising these rights</li>
              </ul>

              <p className="text-gray-700">
                To exercise these rights, contact us at info@snapscape.app with your request and proof of identity.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">12. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                SnapScape serves a global audience. Your information may be transferred to and processed in countries other than 
                your country of residence, including the United States and other countries where our service providers operate.
              </p>
              <p className="text-gray-700">
                We ensure appropriate safeguards are in place for international transfers in compliance with applicable data protection laws.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">13. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                Privacy Policy on this page and updating the "Last Updated" date.
              </p>
              <p className="text-gray-700">
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy 
                are effective when they are posted on this page.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">14. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-[#fffbe6] border border-[#e0c36a] rounded-lg p-4">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> <a href="mailto:info@snapscape.app" className="text-[#2699a6] hover:underline">info@snapscape.app</a></p>
                <p className="text-gray-700 mb-2"><strong>Company:</strong> Center For Development Of Advanced Technology LLC</p>
                <p className="text-gray-700"><strong>Address:</strong> Ruwi, Muscat, Sultanate of Oman</p>
              </div>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/" className="text-[#2699a6] hover:text-[#1a4d5c] font-medium">
                Home
              </Link>
              <Link href="/terms-of-service" className="text-[#2699a6] hover:text-[#1a4d5c] font-medium">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-[#2699a6] hover:text-[#1a4d5c] font-medium">
                Contact
              </Link>
              <Link href="/dashboard" className="text-[#2699a6] hover:text-[#1a4d5c] font-medium">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 