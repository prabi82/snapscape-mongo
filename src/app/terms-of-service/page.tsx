'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#e6f0f3] to-[#1a4d5c]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1a4d5c] mb-4">Terms of Service</h1>
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
                Welcome to SnapScape, a photography competition platform operated by Center For Development Of Advanced Technology LLC 
                ("Company," "we," "our," or "us"). These Terms of Service ("Terms") govern your use of our website snapscape.app 
                and all related services (collectively, the "Service").
              </p>
              <p className="text-gray-700 mb-4">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, 
                then you may not access the Service.
              </p>
              <p className="text-gray-700">
                Please read these Terms carefully before using our Service.
              </p>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">2. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By creating an account, submitting photographs, participating in competitions, or otherwise using SnapScape, you acknowledge that:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>You have read, understood, and agree to be bound by these Terms</li>
                <li>You have read and understood our Privacy Policy</li>
                <li>You meet the eligibility requirements outlined in Section 3</li>
                <li>All information you provide is accurate and truthful</li>
              </ul>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">3. Eligibility</h2>
              <div className="bg-[#fffbe6] border border-[#e0c36a] rounded-lg p-4 mb-4">
                <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">Age Requirements</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>Minimum Age:</strong> You must be at least 12 years old to use SnapScape</li>
                  <li><strong>Parental Consent:</strong> Users under 18 must have parental or guardian consent</li>
                  <li><strong>Account Responsibility:</strong> Parents/guardians are responsible for minors' activities on the platform</li>
                </ul>
              </div>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">Additional Requirements</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>You must provide accurate registration information</li>
                <li>You must maintain the security of your account credentials</li>
                <li>You must not have been previously banned from SnapScape</li>
                <li>You must comply with all applicable laws and regulations</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">4. User Accounts</h2>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">4.1 Account Creation</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must verify your email address to activate your account</li>
                <li>One person may only maintain one active account</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">4.2 Account Security</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>We are not liable for any loss or damage arising from unauthorized account access</li>
                <li>You must use a secure password and keep it confidential</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">4.3 Account Termination</h3>
              <p className="text-gray-700 mb-4">
                You may delete your account at any time. We may suspend or terminate your account for violations of these Terms, 
                illegal activities, or other reasons at our discretion.
              </p>
            </section>

            {/* Photography Competitions */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">5. Photography Competitions</h2>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">5.1 Participation</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Participation in competitions is voluntary and free</li>
                <li>You must follow specific competition rules and guidelines</li>
                <li>Submission limits and deadlines must be respected</li>
                <li>You may only submit original photographs that you own</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">5.2 Submission Requirements</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>All photographs must be your original work</li>
                <li>You must own all rights to submitted photographs</li>
                <li>Photographs must not infringe on third-party rights</li>
                <li>Submissions must comply with competition themes and technical requirements</li>
                <li>Inappropriate, offensive, or illegal content is prohibited</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">5.3 Voting and Judging</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Voting is conducted fairly and transparently</li>
                <li>You may not manipulate voting through fake accounts or other means</li>
                <li>Competition results are final and binding</li>
                <li>We reserve the right to disqualify submissions that violate rules</li>
              </ul>
            </section>

            {/* Intellectual Property Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">6. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">6.1 Your Content</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>You retain full ownership and copyright of your submitted photographs</li>
                <li>You must be the sole author and copyright holder of all submissions</li>
                <li>You are responsible for obtaining necessary permissions for identifiable individuals</li>
                <li>You warrant that your submissions do not infringe on any third-party rights</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">6.2 License to SnapScape</h3>
              <p className="text-gray-700 mb-4">
                By submitting photographs to competitions, you grant SnapScape a non-exclusive, royalty-free, worldwide license to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Display your photographs on our platform and in competition galleries</li>
                <li>Use your photographs for promotional purposes related to SnapScape and competitions</li>
                <li>Share your photographs on social media platforms with proper attribution</li>
                <li>Include your photographs in marketing materials, exhibitions, and press releases</li>
                <li>Create derivative works for promotional purposes (with photographer credit)</li>
              </ul>
              <p className="text-gray-700 mb-4">
                <strong>Important:</strong> Photographer credit will always be provided when your images are used. 
                This license does not transfer ownership of your photographs to SnapScape.
              </p>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">6.3 SnapScape Platform</h3>
              <p className="text-gray-700 mb-4">
                The SnapScape platform, including its design, functionality, and content (excluding user submissions), 
                is owned by Center For Development Of Advanced Technology LLC and protected by intellectual property laws.
              </p>
            </section>

            {/* Prohibited Conduct */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">7. Prohibited Conduct</h2>
              <p className="text-gray-700 mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Submit photographs that you do not own or have rights to use</li>
                <li>Upload inappropriate, offensive, defamatory, or illegal content</li>
                <li>Manipulate voting through fake accounts or automated systems</li>
                <li>Harass, threaten, or abuse other users</li>
                <li>Attempt to hack, disrupt, or damage the platform</li>
                <li>Use the platform for commercial purposes without permission</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Create multiple accounts to circumvent rules or restrictions</li>
                <li>Share your account credentials with others</li>
                <li>Engage in spam or unsolicited communications</li>
              </ul>
            </section>

            {/* Content Moderation */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">8. Content Moderation</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to review, moderate, and remove content that violates these Terms or is otherwise inappropriate. 
                This includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Removing photographs that violate submission guidelines</li>
                <li>Disqualifying entries that don't meet competition requirements</li>
                <li>Suspending or terminating accounts for policy violations</li>
                <li>Taking action against manipulated voting or fraudulent activity</li>
              </ul>
              <p className="text-gray-700">
                Content moderation decisions are made at our discretion and are generally final.
              </p>
            </section>

            {/* Privacy and Data Protection */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">9. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our 
                <Link href="/privacy-policy" className="text-[#2699a6] hover:underline font-medium"> Privacy Policy</Link>, 
                which is incorporated into these Terms by reference.
              </p>
              <p className="text-gray-700">
                By using SnapScape, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">10. Disclaimers</h2>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">10.1 Service Availability</h3>
              <p className="text-gray-700 mb-4">
                SnapScape is provided "as is" without warranties of any kind. We do not guarantee that the service will be 
                uninterrupted, error-free, or completely secure.
              </p>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">10.2 User Content</h3>
              <p className="text-gray-700 mb-4">
                We are not responsible for user-generated content, including photographs, comments, or other submissions. 
                Users are solely responsible for their content and its compliance with applicable laws.
              </p>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">10.3 Third-Party Services</h3>
              <p className="text-gray-700 mb-4">
                Our platform may integrate with third-party services (such as Cloudinary for image storage). 
                We are not responsible for the availability, functionality, or policies of these third-party services.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, Center For Development Of Advanced Technology LLC shall not be liable for:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Any indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Damages arising from user content or third-party actions</li>
                <li>Service interruptions or technical issues</li>
                <li>Unauthorized access to or alteration of your content</li>
              </ul>
              <p className="text-gray-700">
                Our total liability for any claims related to the service shall not exceed the amount you paid to use the service 
                (which is currently zero, as SnapScape is free to use).
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">12. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold harmless Center For Development Of Advanced Technology LLC, its officers, directors, 
                employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Your use of the SnapScape platform</li>
                <li>Your submitted content or photographs</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any illegal or unauthorized activities</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">13. Governing Law and Jurisdiction</h2>
              <p className="text-gray-700 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the Sultanate of Oman. 
                Any disputes arising from these Terms or your use of SnapScape shall be subject to the exclusive jurisdiction 
                of the courts of Muscat, Sultanate of Oman.
              </p>
              <p className="text-gray-700">
                However, we also comply with applicable international data protection laws, including GDPR and CCPA, 
                where relevant to our users.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">14. Changes to These Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. When we make changes, we will:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Update the "Last Updated" date at the top of this page</li>
                <li>Notify users of significant changes via email or platform notifications</li>
                <li>Provide reasonable notice before changes take effect</li>
              </ul>
              <p className="text-gray-700">
                Your continued use of SnapScape after changes are posted constitutes acceptance of the new Terms.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">15. Termination</h2>
              
              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">15.1 Termination by You</h3>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time by contacting us at info@snapscape.app or using the account deletion 
                feature in your dashboard.
              </p>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">15.2 Termination by Us</h3>
              <p className="text-gray-700 mb-4">
                We may suspend or terminate your account immediately if you:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Violate these Terms of Service</li>
                <li>Engage in illegal activities</li>
                <li>Abuse or harass other users</li>
                <li>Attempt to manipulate competitions or voting</li>
                <li>Provide false information during registration</li>
              </ul>

              <h3 className="text-xl font-medium text-[#1a4d5c] mb-3">15.3 Effect of Termination</h3>
              <p className="text-gray-700 mb-4">
                Upon termination:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Your access to SnapScape will be immediately revoked</li>
                <li>Your account data will be handled according to our Privacy Policy</li>
                <li>Previously submitted photographs may remain in completed competitions</li>
                <li>Our license to use your content for promotional purposes may continue as specified in Section 6.2</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">16. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-[#fffbe6] border border-[#e0c36a] rounded-lg p-4">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> <a href="mailto:info@snapscape.app" className="text-[#2699a6] hover:underline">info@snapscape.app</a></p>
                <p className="text-gray-700 mb-2"><strong>Company:</strong> Center For Development Of Advanced Technology LLC</p>
                <p className="text-gray-700"><strong>Address:</strong> Ruwi, Muscat, Sultanate of Oman</p>
              </div>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-4">17. Severability</h2>
              <p className="text-gray-700">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated 
                to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
              </p>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/" className="text-[#2699a6] hover:text-[#1a4d5c] font-medium">
                Home
              </Link>
              <Link href="/privacy-policy" className="text-[#2699a6] hover:text-[#1a4d5c] font-medium">
                Privacy Policy
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