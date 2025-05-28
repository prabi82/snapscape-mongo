'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: 'general',
          message: ''
        });
      } else {
        alert(data.message || 'Error sending message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return 'General Inquiry';
      case 'support': return 'Technical Support';
      case 'partnership': return 'Partnership';
      case 'media': return 'Media Inquiry';
      case 'feedback': return 'Feedback';
      case 'other': return 'Other';
      default: return category;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#e6f0f3] to-[#1a4d5c]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-[#1a4d5c] mb-4">Message Sent Successfully!</h1>
              <p className="text-gray-700 mb-6">
                Thank you for contacting us. We've received your message and will get back to you within 24-48 hours.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-[#2699a6] hover:bg-[#1a4d5c] text-white px-6 py-3 rounded-lg font-medium transition-colors mr-4"
                >
                  Send Another Message
                </button>
                <Link
                  href="/"
                  className="inline-block bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#e6f0f3] to-[#1a4d5c]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2699a6] to-[#1a4d5c] text-white p-8 rounded-t-lg">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-[#e6f0f3] text-lg">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="p-8">
            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-6">Get in Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#2699a6] rounded-full flex items-center justify-center mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a4d5c]">Email</h3>
                      <p className="text-gray-600">
                        <a href="mailto:info@snapscape.app" className="text-[#2699a6] hover:underline">
                          info@snapscape.app
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#2699a6] rounded-full flex items-center justify-center mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a4d5c]">Address</h3>
                      <p className="text-gray-600">
                        Center For Development Of Advanced Technology LLC<br />
                        Ruwi, Muscat<br />
                        Sultanate of Oman
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#2699a6] rounded-full flex items-center justify-center mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a4d5c]">Response Time</h3>
                      <p className="text-gray-600">
                        We typically respond within 24-48 hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-semibold text-[#1a4d5c] mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2699a6] focus:border-transparent"
                      placeholder="Your full name"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2699a6] focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2699a6] focus:border-transparent"
                      placeholder="Brief summary of your inquiry"
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2699a6] focus:border-transparent"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="media">Media Inquiry</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={6}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2699a6] focus:border-transparent"
                      placeholder="Please share your detailed message, questions, or inquiries..."
                      maxLength={2000}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.message.length}/2000 characters
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#2699a6] hover:bg-[#1a4d5c] disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t border-gray-200 pt-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#2699a6] rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[#1a4d5c] mb-2">24/7 Support</h3>
                  <p className="text-gray-600 text-sm">
                    We're here to help you with any questions or issues you may have.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-[#2699a6] rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[#1a4d5c] mb-2">Quick Response</h3>
                  <p className="text-gray-600 text-sm">
                    Most inquiries are answered within 24 hours during business days.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-[#2699a6] rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[#1a4d5c] mb-2">Professional Team</h3>
                  <p className="text-gray-600 text-sm">
                    Our experienced team is dedicated to providing excellent service.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="bg-gray-50 px-8 py-6 rounded-b-lg border-t border-gray-200">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/" className="text-[#2699a6] hover:text-[#1a4d5c] font-medium">
                Home
              </Link>
              <Link href="/privacy-policy" className="text-[#2699a6] hover:text-[#1a4d5c] font-medium">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-[#2699a6] hover:text-[#1a4d5c] font-medium">
                Terms of Service
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