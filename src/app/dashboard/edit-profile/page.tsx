'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image: string | null;
  mobile?: string;
  country?: string;
}

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  
  // Password reset states
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Profile image state
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  useEffect(() => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      router.push('/');
    }

    // Fetch user profile to pre-fill the form
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        
        setName(data.user.name || '');
        setEmail(data.user.email || '');
        setMobile(data.user.mobile || '');
        
        // Set the country and update countryCode
        if (data.user.country) {
          setCountry(data.user.country);
          // Find the country object and set its dial code
          const countryObj = countriesWithCodes.find(c => c.name === data.user.country);
          if (countryObj) {
            setCountryCode(countryObj.dialCode);
            
            // Remove country code from mobile number if it starts with it
            if (data.user.mobile && data.user.mobile.startsWith(countryObj.dialCode)) {
              setMobile(data.user.mobile.substring(countryObj.dialCode.length));
            }
          }
        }
        
        setCurrentImage(data.user.image || null);
      } catch (err: Error | unknown) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching your profile');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  // Handle image change
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setProfileImage(file);
    } else {
      setProfileImage(null);
      setPreviewImage(null);
    }
  };

  // Handle country change
  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
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
  const handleMobileChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name && !email && !profileImage && !mobile && !country) {
      setError('At least one field must be provided');
      return;
    }
    
    try {
      setError('');
      setSuccess(false);
      setUpdating(true);
      
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (email) formData.append('email', email);
      
      // Combine country code with mobile number if both exist
      const fullMobileNumber = mobile ? `${countryCode}${mobile.startsWith(countryCode) ? mobile.substring(countryCode.length) : mobile}` : '';
      if (fullMobileNumber) formData.append('mobile', fullMobileNumber);
      
      if (country) formData.append('country', country);
      if (profileImage) formData.append('profileImage', profileImage);
      
      console.log('[EditProfile] Submitting form data with profileImage:', !!profileImage);
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      setSuccess(true);
      console.log('[EditProfile] Profile update response:', data);
      
      // Set current image to the new one if uploaded
      if (data.user.image) {
        console.log('[EditProfile] New profile image URL:', data.user.image);
        setCurrentImage(data.user.image);
        setProfileImage(null);
        setPreviewImage(null);
        
        try {
          // Update NextAuth session with new user data
          console.log('[EditProfile] Updating session with new profile data');
          
          // Force full session update
          await update({
            ...session,
            user: {
              ...session?.user,
              name: data.user.name,
              email: data.user.email,
              mobile: data.user.mobile,
              country: data.user.country,
              image: data.user.image
            }
          });
          
          console.log('[EditProfile] Session updated successfully');
          
          // Wait for session update to propagate
          setTimeout(() => {
            console.log('[EditProfile] Redirecting to profile page');
            // Perform a full page redirect to ensure the session is completely refreshed
            window.location.href = '/dashboard/profile';
          }, 1000);
        } catch (updateError) {
          console.error('[EditProfile] Error updating session:', updateError);
          // Continue with the redirect even if session update fails
          setTimeout(() => {
            window.location.href = '/dashboard/profile';
          }, 1000);
        }
      } else {
        // If no image was uploaded, just refresh the current page
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }
    } catch (err: Error | unknown) {
      console.error('Update profile error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset previous states
    setPasswordError('');
    setPasswordSuccess(false);
    
    // Validate passwords
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    try {
      setUpdating(true);
      
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      
      // Reset form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      
    } catch (err: Error | unknown) {
      console.error('Password update error:', err);
      setPasswordError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <p className="text-sm text-green-700">Profile updated successfully!</p>
            </div>
          )}
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Update Your Profile
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Change your profile information
              </p>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                {/* Profile Image Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 border border-gray-300">
                        {(previewImage || currentImage) ? (
                          <Image 
                            src={previewImage || currentImage || '/placeholder.png'} 
                            alt="Profile" 
                            fill 
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="photo-upload"
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <span>Change</span>
                        <input
                          id="photo-upload"
                          name="photo"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      {profileImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileImage(null);
                            setPreviewImage(null);
                          }}
                          className="ml-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG or GIF. Max 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Country Selection */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <div className="mt-1">
                    <select
                      id="country"
                      name="country"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={country}
                      onChange={handleCountryChange}
                    >
                      {countriesWithCodes.map((country, index) => (
                        <option key={country.code || index} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mobile Number Field */}
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      {countryCode || '+'}
                    </div>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      autoComplete="tel"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={mobile}
                      onChange={handleMobileChange}
                      placeholder="Phone number without country code"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/dashboard"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={updating}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      updating ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Password Reset Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Password Settings
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Update your password
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowPasswordReset(!showPasswordReset)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {showPasswordReset ? 'Hide' : 'Change Password'}
              </button>
            </div>
            
            {showPasswordReset && (
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                {passwordError && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <p className="text-sm text-red-700">{passwordError}</p>
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                    <p className="text-sm text-green-700">Password updated successfully!</p>
                  </div>
                )}
                
                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPasswordReset(false)}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        updating ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {updating ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 