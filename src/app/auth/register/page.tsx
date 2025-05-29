'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, getProviders } from 'next-auth/react';
import Image from 'next/image';
import ReCaptchaV3 from '@/components/ReCaptcha';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [authProviders, setAuthProviders] = useState<any>({});
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRestrictedBrowser, setIsRestrictedBrowser] = useState(false);

  // Complete list of countries with their country codes
  const countriesWithCodes = [
    { name: "Select Country", code: "", dialCode: "" },
    { name: "Afghanistan", code: "AF", dialCode: "+93" },
    { name: "Albania", code: "AL", dialCode: "+355" },
    { name: "Algeria", code: "DZ", dialCode: "+213" },
    { name: "Andorra", code: "AD", dialCode: "+376" },
    { name: "Angola", code: "AO", dialCode: "+244" },
    { name: "Argentina", code: "AR", dialCode: "+54" },
    { name: "Armenia", code: "AM", dialCode: "+374" },
    { name: "Australia", code: "AU", dialCode: "+61" },
    { name: "Austria", code: "AT", dialCode: "+43" },
    { name: "Azerbaijan", code: "AZ", dialCode: "+994" },
    { name: "Bahamas", code: "BS", dialCode: "+1" },
    { name: "Bahrain", code: "BH", dialCode: "+973" },
    { name: "Bangladesh", code: "BD", dialCode: "+880" },
    { name: "Barbados", code: "BB", dialCode: "+1" },
    { name: "Belarus", code: "BY", dialCode: "+375" },
    { name: "Belgium", code: "BE", dialCode: "+32" },
    { name: "Belize", code: "BZ", dialCode: "+501" },
    { name: "Benin", code: "BJ", dialCode: "+229" },
    { name: "Bhutan", code: "BT", dialCode: "+975" },
    { name: "Bolivia", code: "BO", dialCode: "+591" },
    { name: "Bosnia and Herzegovina", code: "BA", dialCode: "+387" },
    { name: "Botswana", code: "BW", dialCode: "+267" },
    { name: "Brazil", code: "BR", dialCode: "+55" },
    { name: "Brunei", code: "BN", dialCode: "+673" },
    { name: "Bulgaria", code: "BG", dialCode: "+359" },
    { name: "Burkina Faso", code: "BF", dialCode: "+226" },
    { name: "Burundi", code: "BI", dialCode: "+257" },
    { name: "Cambodia", code: "KH", dialCode: "+855" },
    { name: "Cameroon", code: "CM", dialCode: "+237" },
    { name: "Canada", code: "CA", dialCode: "+1" },
    { name: "Cape Verde", code: "CV", dialCode: "+238" },
    { name: "Central African Republic", code: "CF", dialCode: "+236" },
    { name: "Chad", code: "TD", dialCode: "+235" },
    { name: "Chile", code: "CL", dialCode: "+56" },
    { name: "China", code: "CN", dialCode: "+86" },
    { name: "Colombia", code: "CO", dialCode: "+57" },
    { name: "Comoros", code: "KM", dialCode: "+269" },
    { name: "Congo", code: "CG", dialCode: "+242" },
    { name: "Costa Rica", code: "CR", dialCode: "+506" },
    { name: "Croatia", code: "HR", dialCode: "+385" },
    { name: "Cuba", code: "CU", dialCode: "+53" },
    { name: "Cyprus", code: "CY", dialCode: "+357" },
    { name: "Czech Republic", code: "CZ", dialCode: "+420" },
    { name: "Denmark", code: "DK", dialCode: "+45" },
    { name: "Djibouti", code: "DJ", dialCode: "+253" },
    { name: "Dominica", code: "DM", dialCode: "+1" },
    { name: "Dominican Republic", code: "DO", dialCode: "+1" },
    { name: "Ecuador", code: "EC", dialCode: "+593" },
    { name: "Egypt", code: "EG", dialCode: "+20" },
    { name: "El Salvador", code: "SV", dialCode: "+503" },
    { name: "Equatorial Guinea", code: "GQ", dialCode: "+240" },
    { name: "Eritrea", code: "ER", dialCode: "+291" },
    { name: "Estonia", code: "EE", dialCode: "+372" },
    { name: "Ethiopia", code: "ET", dialCode: "+251" },
    { name: "Fiji", code: "FJ", dialCode: "+679" },
    { name: "Finland", code: "FI", dialCode: "+358" },
    { name: "France", code: "FR", dialCode: "+33" },
    { name: "Gabon", code: "GA", dialCode: "+241" },
    { name: "Gambia", code: "GM", dialCode: "+220" },
    { name: "Georgia", code: "GE", dialCode: "+995" },
    { name: "Germany", code: "DE", dialCode: "+49" },
    { name: "Ghana", code: "GH", dialCode: "+233" },
    { name: "Greece", code: "GR", dialCode: "+30" },
    { name: "Grenada", code: "GD", dialCode: "+1" },
    { name: "Guatemala", code: "GT", dialCode: "+502" },
    { name: "Guinea", code: "GN", dialCode: "+224" },
    { name: "Guinea-Bissau", code: "GW", dialCode: "+245" },
    { name: "Guyana", code: "GY", dialCode: "+592" },
    { name: "Haiti", code: "HT", dialCode: "+509" },
    { name: "Honduras", code: "HN", dialCode: "+504" },
    { name: "Hungary", code: "HU", dialCode: "+36" },
    { name: "Iceland", code: "IS", dialCode: "+354" },
    { name: "India", code: "IN", dialCode: "+91" },
    { name: "Indonesia", code: "ID", dialCode: "+62" },
    { name: "Iran", code: "IR", dialCode: "+98" },
    { name: "Iraq", code: "IQ", dialCode: "+964" },
    { name: "Ireland", code: "IE", dialCode: "+353" },
    { name: "Israel", code: "IL", dialCode: "+972" },
    { name: "Italy", code: "IT", dialCode: "+39" },
    { name: "Jamaica", code: "JM", dialCode: "+1" },
    { name: "Japan", code: "JP", dialCode: "+81" },
    { name: "Jordan", code: "JO", dialCode: "+962" },
    { name: "Kazakhstan", code: "KZ", dialCode: "+7" },
    { name: "Kenya", code: "KE", dialCode: "+254" },
    { name: "Kiribati", code: "KI", dialCode: "+686" },
    { name: "Kuwait", code: "KW", dialCode: "+965" },
    { name: "Kyrgyzstan", code: "KG", dialCode: "+996" },
    { name: "Laos", code: "LA", dialCode: "+856" },
    { name: "Latvia", code: "LV", dialCode: "+371" },
    { name: "Lebanon", code: "LB", dialCode: "+961" },
    { name: "Lesotho", code: "LS", dialCode: "+266" },
    { name: "Liberia", code: "LR", dialCode: "+231" },
    { name: "Libya", code: "LY", dialCode: "+218" },
    { name: "Liechtenstein", code: "LI", dialCode: "+423" },
    { name: "Lithuania", code: "LT", dialCode: "+370" },
    { name: "Luxembourg", code: "LU", dialCode: "+352" },
    { name: "Madagascar", code: "MG", dialCode: "+261" },
    { name: "Malawi", code: "MW", dialCode: "+265" },
    { name: "Malaysia", code: "MY", dialCode: "+60" },
    { name: "Maldives", code: "MV", dialCode: "+960" },
    { name: "Mali", code: "ML", dialCode: "+223" },
    { name: "Malta", code: "MT", dialCode: "+356" },
    { name: "Marshall Islands", code: "MH", dialCode: "+692" },
    { name: "Mauritania", code: "MR", dialCode: "+222" },
    { name: "Mauritius", code: "MU", dialCode: "+230" },
    { name: "Mexico", code: "MX", dialCode: "+52" },
    { name: "Micronesia", code: "FM", dialCode: "+691" },
    { name: "Moldova", code: "MD", dialCode: "+373" },
    { name: "Monaco", code: "MC", dialCode: "+377" },
    { name: "Mongolia", code: "MN", dialCode: "+976" },
    { name: "Montenegro", code: "ME", dialCode: "+382" },
    { name: "Morocco", code: "MA", dialCode: "+212" },
    { name: "Mozambique", code: "MZ", dialCode: "+258" },
    { name: "Myanmar", code: "MM", dialCode: "+95" },
    { name: "Namibia", code: "NA", dialCode: "+264" },
    { name: "Nauru", code: "NR", dialCode: "+674" },
    { name: "Nepal", code: "NP", dialCode: "+977" },
    { name: "Netherlands", code: "NL", dialCode: "+31" },
    { name: "New Zealand", code: "NZ", dialCode: "+64" },
    { name: "Nicaragua", code: "NI", dialCode: "+505" },
    { name: "Niger", code: "NE", dialCode: "+227" },
    { name: "Nigeria", code: "NG", dialCode: "+234" },
    { name: "North Korea", code: "KP", dialCode: "+850" },
    { name: "Norway", code: "NO", dialCode: "+47" },
    { name: "Oman", code: "OM", dialCode: "+968" },
    { name: "Pakistan", code: "PK", dialCode: "+92" },
    { name: "Palau", code: "PW", dialCode: "+680" },
    { name: "Palestine", code: "PS", dialCode: "+970" },
    { name: "Panama", code: "PA", dialCode: "+507" },
    { name: "Papua New Guinea", code: "PG", dialCode: "+675" },
    { name: "Paraguay", code: "PY", dialCode: "+595" },
    { name: "Peru", code: "PE", dialCode: "+51" },
    { name: "Philippines", code: "PH", dialCode: "+63" },
    { name: "Poland", code: "PL", dialCode: "+48" },
    { name: "Portugal", code: "PT", dialCode: "+351" },
    { name: "Qatar", code: "QA", dialCode: "+974" },
    { name: "Romania", code: "RO", dialCode: "+40" },
    { name: "Russia", code: "RU", dialCode: "+7" },
    { name: "Rwanda", code: "RW", dialCode: "+250" },
    { name: "Saint Kitts and Nevis", code: "KN", dialCode: "+1" },
    { name: "Saint Lucia", code: "LC", dialCode: "+1" },
    { name: "Saint Vincent and the Grenadines", code: "VC", dialCode: "+1" },
    { name: "Samoa", code: "WS", dialCode: "+685" },
    { name: "San Marino", code: "SM", dialCode: "+378" },
    { name: "Sao Tome and Principe", code: "ST", dialCode: "+239" },
    { name: "Saudi Arabia", code: "SA", dialCode: "+966" },
    { name: "Senegal", code: "SN", dialCode: "+221" },
    { name: "Serbia", code: "RS", dialCode: "+381" },
    { name: "Seychelles", code: "SC", dialCode: "+248" },
    { name: "Sierra Leone", code: "SL", dialCode: "+232" },
    { name: "Singapore", code: "SG", dialCode: "+65" },
    { name: "Slovakia", code: "SK", dialCode: "+421" },
    { name: "Slovenia", code: "SI", dialCode: "+386" },
    { name: "Solomon Islands", code: "SB", dialCode: "+677" },
    { name: "Somalia", code: "SO", dialCode: "+252" },
    { name: "South Africa", code: "ZA", dialCode: "+27" },
    { name: "South Korea", code: "KR", dialCode: "+82" },
    { name: "South Sudan", code: "SS", dialCode: "+211" },
    { name: "Spain", code: "ES", dialCode: "+34" },
    { name: "Sri Lanka", code: "LK", dialCode: "+94" },
    { name: "Sudan", code: "SD", dialCode: "+249" },
    { name: "Suriname", code: "SR", dialCode: "+597" },
    { name: "Swaziland", code: "SZ", dialCode: "+268" },
    { name: "Sweden", code: "SE", dialCode: "+46" },
    { name: "Switzerland", code: "CH", dialCode: "+41" },
    { name: "Syria", code: "SY", dialCode: "+963" },
    { name: "Taiwan", code: "TW", dialCode: "+886" },
    { name: "Tajikistan", code: "TJ", dialCode: "+992" },
    { name: "Tanzania", code: "TZ", dialCode: "+255" },
    { name: "Thailand", code: "TH", dialCode: "+66" },
    { name: "Togo", code: "TG", dialCode: "+228" },
    { name: "Tonga", code: "TO", dialCode: "+676" },
    { name: "Trinidad and Tobago", code: "TT", dialCode: "+1" },
    { name: "Tunisia", code: "TN", dialCode: "+216" },
    { name: "Turkey", code: "TR", dialCode: "+90" },
    { name: "Turkmenistan", code: "TM", dialCode: "+993" },
    { name: "Tuvalu", code: "TV", dialCode: "+688" },
    { name: "Uganda", code: "UG", dialCode: "+256" },
    { name: "Ukraine", code: "UA", dialCode: "+380" },
    { name: "United Arab Emirates", code: "AE", dialCode: "+971" },
    { name: "United Kingdom", code: "GB", dialCode: "+44" },
    { name: "United States", code: "US", dialCode: "+1" },
    { name: "Uruguay", code: "UY", dialCode: "+598" },
    { name: "Uzbekistan", code: "UZ", dialCode: "+998" },
    { name: "Vanuatu", code: "VU", dialCode: "+678" },
    { name: "Vatican City", code: "VA", dialCode: "+39" },
    { name: "Venezuela", code: "VE", dialCode: "+58" },
    { name: "Vietnam", code: "VN", dialCode: "+84" },
    { name: "Yemen", code: "YE", dialCode: "+967" },
    { name: "Zambia", code: "ZM", dialCode: "+260" },
    { name: "Zimbabwe", code: "ZW", dialCode: "+263" }
  ];

  // Handle reCAPTCHA verification
  const handleRecaptchaVerify = (token: string) => {
    setRecaptchaToken(token);
  };

  useEffect(() => {
    // Check for restricted user agents
    const userAgent = navigator.userAgent.toLowerCase();
    const isInApp = userAgent.includes('instagram') || 
                   userAgent.includes('fban') || 
                   userAgent.includes('fbav') || 
                   userAgent.includes('twitter') || 
                   userAgent.includes('linkedin') ||
                   userAgent.includes('wechat') ||
                   userAgent.includes('line');
    
    setIsRestrictedBrowser(isInApp);
    
    // Fetch available providers
    const fetchProviders = async () => {
      const providers = await getProviders();
      setAuthProviders(providers || {});
    };
    fetchProviders();
  }, []);

  // Handle country change
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = e.target.value;
    setCountry(selectedCountry);
    
    // Find the country object and set its dial code
    const countryObj = countriesWithCodes.find(c => c.name === selectedCountry);
    if (countryObj) {
      setCountryCode(countryObj.dialCode);
    } else {
      setCountryCode('');
    }
  };

  // Handle mobile change - this keeps just the number part without the country code
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters except the last entered character
    let value = e.target.value;
    
    // If the value starts with the country code, remove it
    if (countryCode && value.startsWith(countryCode)) {
      value = value.substring(countryCode.length);
    }
    
    // Keep only numbers, spaces, and hyphens
    value = value.replace(/[^\d\s-]/g, '');
    
    setMobile(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    // Validate reCAPTCHA
    if (!recaptchaToken) {
      setError('Unable to verify security challenge. Please try again.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Verify reCAPTCHA first
      const recaptchaResponse = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: recaptchaToken,
          action: 'register'
        }),
      });
      
      const recaptchaData = await recaptchaResponse.json();
      
      if (!recaptchaData.success) {
        setError('Security verification failed. Please try again.');
        return;
      }
      
      // Combine country code with mobile number if both exist
      const fullMobileNumber = mobile ? `${countryCode}${mobile.startsWith(countryCode) ? mobile.substring(countryCode.length) : mobile}` : '';
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email: email.toLowerCase(),
          mobile: fullMobileNumber,
          country,
          password,
          recaptchaToken
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      setSuccessMessage(data.message || 'Registration successful! Please check your email to verify your account.');
      
      // Clear form after successful submission
      setName('');
      setEmail('');
      setMobile('');
      setCountry('');
      setCountryCode('');
      setPassword('');
      setConfirmPassword('');
      
      // No immediate redirect - wait for email verification
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (providerId: string) => {
    signIn(providerId, { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#e6f0f3] to-[#1a4d5c]">
      {/* Invisible reCAPTCHA v3 */}
      <ReCaptchaV3
        siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LegLkMrAAAAAOSRdKTQ33Oa6UT4EzOvqdhsSpM3"}
        action="register"
        onVerify={handleRecaptchaVerify}
      />
      
      <div className="w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl flex flex-col items-center border border-[#e0c36a]">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="SnapScape Logo" width={160} height={160} className="mb-3" />
        </div>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1a4d5c] mb-2">Sign up</h2>
          <p className="text-[#1a4d5c] mb-6">Create your account to participate in competitions, vote, and connect with fellow photographers.</p>
        </div>
        {error && (
          <div className="p-3 mb-2 bg-[#fffbe6] border border-[#e0c36a] text-[#bfa100] rounded w-full text-center text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-3 mb-2 bg-green-100 border border-green-400 text-green-700 rounded w-full text-center text-sm">
            {successMessage}
          </div>
        )}
        
        {/* Warning for restricted browsers */}
        {isRestrictedBrowser && (
          <div className="p-4 mb-4 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded w-full text-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Browser Compatibility Notice</p>
                <p className="mt-1">For the best experience with Google Sign-In, please open this page in your default browser (Chrome, Safari, Firefox) instead of this app's built-in browser.</p>
                <p className="mt-2 text-xs">
                  <strong>How to open in browser:</strong> Tap the menu (⋯) and select "Open in Browser" or copy this URL to your browser.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Google Login Button - Updated to match login page style */}
        <div className="w-full mb-6">
          {Object.values(authProviders).map((provider: any) => {
            if (provider.id === 'google') {
              return (
                <button
                  key={provider.id}
                  onClick={() => handleSocialLogin(provider.id)}
                  className="flex items-center justify-center w-full py-3 px-4 rounded-lg bg-white hover:bg-gray-50 shadow-md border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
                  aria-label={`Sign up with ${provider.name}`}
                  type="button"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-medium text-base">Sign up with Google</span>
                </button>
              );
            }
            return null;
          })}
        </div>
        
        <div className="flex items-center w-full mb-6">
          <div className="flex-grow border-t border-[#e0c36a]"></div>
          <span className="mx-4 text-[#1a4d5c] font-medium">or</span>
          <div className="flex-grow border-t border-[#e0c36a]"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="block w-full px-4 py-3 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c] text-base"
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="block w-full px-4 py-3 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c] text-base"
          />
          
          <select
            id="country"
            name="country"
            value={country}
            onChange={handleCountryChange}
            className="block w-full px-4 py-3 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c] text-base"
          >
            {countriesWithCodes.map((country) => (
              <option key={country.code || country.name} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
          
          {/* Mobile Number Field with Country Code */}
          <div className="flex rounded-lg shadow-sm">
            <div className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#1a4d5c] bg-gray-50 text-gray-500 text-base">
              {countryCode || '+'}
            </div>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              autoComplete="tel"
              value={mobile}
              onChange={handleMobileChange}
              placeholder="Mobile Number"
              className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-lg border border-[#1a4d5c] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c] text-base"
            />
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="block w-full px-4 py-3 pr-12 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c] text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#1a4d5c] hover:text-[#2699a6] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="block w-full px-4 py-3 pr-12 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c] text-base"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#1a4d5c] hover:text-[#2699a6] transition-colors"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold text-lg shadow-md hover:from-[#2699a6] hover:to-[#1a4d5c] transition disabled:opacity-60 border-2 border-[#e0c36a]"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="text-center w-full mt-4 space-y-2">
          <div>
            <span className="text-[#1a4d5c]">Already have an account? </span>
            <Link href="/" className="text-[#e0c36a] font-semibold hover:underline">Sign in</Link>
          </div>
          <div>
            <Link href="/about" className="text-[#1a4d5c] hover:text-[#2699a6] transition-colors text-sm">
              Learn more about SnapScape
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 