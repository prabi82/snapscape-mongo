import Link from 'next/link';
import Image from 'next/image';
import { Camera, Trophy, Users, Star, Award, Eye, Vote, ImageIcon } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6f0f3] to-[#d1e6ed]">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/logo.png" alt="SnapScape Logo" width={40} height={40} />
              <span className="text-2xl font-bold text-[#1a4d5c]">SnapScape</span>
            </Link>
            <div className="space-x-4">
              <Link 
                href="/auth/register" 
                className="bg-[#1a4d5c] text-white px-4 py-2 rounded-lg hover:bg-[#2699a6] transition-colors"
              >
                Join Now
              </Link>
              <Link 
                href="/" 
                className="text-[#1a4d5c] hover:text-[#2699a6] transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#1a4d5c] mb-6">
            Welcome to SnapScape
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The premier online photography competition platform where creativity meets community. 
            Showcase your talent, compete with photographers worldwide, and celebrate the art of photography.
          </p>
        </div>

        {/* What is SnapScape */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="flex items-center mb-6">
            <Camera className="h-8 w-8 text-[#1a4d5c] mr-3" />
            <h2 className="text-3xl font-bold text-[#1a4d5c]">What is SnapScape?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                SnapScape is a dynamic online platform designed for photography enthusiasts of all levels. 
                Whether you're a seasoned professional or an amateur with a passion for capturing moments, 
                our platform provides a space to participate in themed photography competitions, 
                showcase your work, and connect with a vibrant community of photographers.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Our mission is to celebrate the art of photography by providing fair, engaging, 
                and inspiring competitions that challenge photographers to explore new themes, 
                techniques, and perspectives.
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#1a4d5c] to-[#2699a6] rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">Platform Highlights</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-[#e0c36a]" />
                  Themed Photography Competitions
                </li>
                <li className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-[#e0c36a]" />
                  Community-Driven Peer Voting
                </li>
                <li className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-[#e0c36a]" />
                  Recognition & Achievement System
                </li>
                <li className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-[#e0c36a]" />
                  Anonymous Judging Process
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-[#1a4d5c] text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-[#e0c36a]">
              <div className="bg-[#1a4d5c] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a4d5c] mb-3">1. Submit Your Photos</h3>
              <p className="text-gray-600">
                Browse active competitions and submit your best photographs that match the theme. 
                Each competition has specific guidelines and submission limits.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-[#e0c36a]">
              <div className="bg-[#1a4d5c] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Vote className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a4d5c] mb-3">2. Peer Voting</h3>
              <p className="text-gray-600">
                After submission period ends, participate in anonymous peer voting. 
                Rate other participants' work based on composition, creativity, and technical excellence.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-[#e0c36a]">
              <div className="bg-[#1a4d5c] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a4d5c] mb-3">3. Win & Grow</h3>
              <p className="text-gray-600">
                Earn points based on votes received and participation. 
                Build your reputation, unlock achievements, and climb the leaderboards.
              </p>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-[#e0c36a]">
          <h2 className="text-3xl font-bold text-[#1a4d5c] text-center mb-10">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-[#e0c36a] rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-[#1a4d5c] mb-3">Themed Competitions</h3>
              <p className="text-gray-600">
                Regular competitions with diverse themes like architecture, nature, culture, and more.
              </p>
            </div>
            
            <div className="border border-[#e0c36a] rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-[#1a4d5c] mb-3">Fair Voting System</h3>
              <p className="text-gray-600">
                Anonymous peer voting ensures unbiased evaluation based purely on photographic merit.
              </p>
            </div>
            
            <div className="border border-[#e0c36a] rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-[#1a4d5c] mb-3">Achievement System</h3>
              <p className="text-gray-600">
                Earn badges and achievements as you participate and excel in competitions.
              </p>
            </div>
            
            <div className="border border-[#e0c36a] rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-[#1a4d5c] mb-3">Community Engagement</h3>
              <p className="text-gray-600">
                Connect with fellow photographers and build a network within the community.
              </p>
            </div>
            
            <div className="border border-[#e0c36a] rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-[#1a4d5c] mb-3">Portfolio Building</h3>
              <p className="text-gray-600">
                Showcase your best work and track your progress over time.
              </p>
            </div>
            
            <div className="border border-[#e0c36a] rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-[#1a4d5c] mb-3">Real-time Updates</h3>
              <p className="text-gray-600">
                Stay informed with notifications about competition updates and results.
              </p>
            </div>
          </div>
        </div>

        {/* Competition Types */}
        <div className="bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] rounded-2xl shadow-lg p-8 text-white mb-12 border border-[#e0c36a]">
          <h2 className="text-3xl font-bold text-center mb-10">Competition Examples</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-4 mb-3 border border-[#e0c36a]/30">
                <h3 className="font-semibold text-lg">Architecture</h3>
              </div>
              <p className="text-sm opacity-90">Capture stunning buildings, structures, and urban landscapes</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-4 mb-3 border border-[#e0c36a]/30">
                <h3 className="font-semibold text-lg">Nature</h3>
              </div>
              <p className="text-sm opacity-90">Showcase the beauty of natural landscapes and wildlife</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-4 mb-3 border border-[#e0c36a]/30">
                <h3 className="font-semibold text-lg">Culture</h3>
              </div>
              <p className="text-sm opacity-90">Document traditions, festivals, and cultural heritage</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-4 mb-3 border border-[#e0c36a]/30">
                <h3 className="font-semibold text-lg">Street</h3>
              </div>
              <p className="text-sm opacity-90">Capture candid moments of everyday life and urban scenes</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 border border-[#e0c36a]">
          <h2 className="text-3xl font-bold text-[#1a4d5c] mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of photographers who are already showcasing their talent and 
            competing in exciting photography challenges.
          </p>
          <div className="space-x-4">
            <Link 
              href="/auth/register" 
              className="bg-[#1a4d5c] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#2699a6] transition-colors inline-block border-2 border-[#e0c36a]"
            >
              Create Account
            </Link>
            <Link 
              href="/" 
              className="border-2 border-[#1a4d5c] text-[#1a4d5c] px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#1a4d5c] hover:text-white transition-colors inline-block"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a4d5c] text-white py-8 border-t-4 border-[#e0c36a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Image src="/logo.png" alt="SnapScape Logo" width={32} height={32} />
            <p className="text-lg font-semibold">SnapScape</p>
          </div>
          <p className="text-sm opacity-80">Where Photography Meets Competition</p>
        </div>
      </footer>
    </div>
  );
} 