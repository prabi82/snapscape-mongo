'use client';

import { useState } from 'react';

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [methodsResult, setMethodsResult] = useState<any>(null);
  
  // Testing form inputs
  const [cloudinaryUrl, setCloudinaryUrl] = useState('');
  const [cloudName, setCloudName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  // Check Cloudinary config
  const checkCloudinary = async () => {
    try {
      setStatus('Checking Cloudinary configuration...');
      setError('');
      const response = await fetch('/api/test-cloudinary');
      const data = await response.json();
      setEnvStatus(data);
      console.log('Cloudinary test response:', data);
      setStatus('Cloudinary check complete');
    } catch (err: any) {
      console.error('Error checking Cloudinary:', err);
      setError(`Error checking Cloudinary: ${err.message}`);
    }
  };

  // Test Cloudinary methods
  const testCloudinaryMethod = async (method: string) => {
    try {
      setStatus(`Testing Cloudinary with method: ${method}...`);
      setError('');
      setMethodsResult(null);
      
      let credentials = {};
      
      switch (method) {
        case 'env':
          // No credentials needed
          break;
          
        case 'url':
          if (!cloudinaryUrl) {
            setError('Please enter a Cloudinary URL');
            return;
          }
          credentials = { url: cloudinaryUrl };
          break;
          
        case 'explicit':
          if (!cloudName || !apiKey || !apiSecret) {
            setError('Please enter all Cloudinary credentials');
            return;
          }
          credentials = { cloudName, apiKey, apiSecret };
          break;
      }
      
      const response = await fetch('/api/test-cloudinary-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          credentials
        }),
      });
      
      const data = await response.json();
      setMethodsResult(data);
      console.log(`${method} test response:`, data);
      setStatus(`${method} test complete`);
    } catch (err: any) {
      console.error(`Error testing ${method}:`, err);
      setError(`Error testing ${method}: ${err.message}`);
    }
  };

  // Test upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setStatus('Uploading...');
      setError('');

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('title', 'Test Upload');
      formData.append('description', 'Testing the upload functionality');
      formData.append('competition', '67c2ce46c62ecb1b3b4c8f3a');
      
      // Log FormData contents for debugging
      console.log('FormData contains:', {
        file: file.name,
        size: file.size,
        type: file.type
      });

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMsg = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          errorMsg = errorData.message || errorMsg;
          if (errorData.error) {
            errorMsg += ` - ${errorData.error}`;
          }
        } catch (e) {
          // If not JSON, try to get text
          const textResponse = await response.text();
          console.log('Error text response:', textResponse);
          if (textResponse) errorMsg += ` - ${textResponse}`;
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('Success result:', result);
      setStatus(`Upload successful! ID: ${result.data?.id || 'unknown'}`);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cloudinary Test Dashboard</h1>
      
      {/* Basic test */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">Standard Test</h2>
        <p className="mb-4">Test Cloudinary with environment variables</p>
        <button 
          onClick={checkCloudinary}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Check Cloudinary Configuration
        </button>
        
        {envStatus && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h2 className="font-bold">Environment Status:</h2>
            <pre className="overflow-auto max-h-60">{JSON.stringify(envStatus, null, 2)}</pre>
          </div>
        )}
      </div>
      
      {/* Advanced testing methods */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">Advanced Testing Methods</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Environment variables test */}
          <div className="p-2">
            <h3 className="font-bold">Environment Variables</h3>
            <p className="mb-2">Test using the environment variables</p>
            <button 
              onClick={() => testCloudinaryMethod('env')}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Test Environment Variables
            </button>
          </div>
          
          {/* URL method test */}
          <div className="p-2">
            <h3 className="font-bold">Cloudinary URL</h3>
            <p className="mb-2">Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME</p>
            <input
              type="text"
              value={cloudinaryUrl}
              onChange={(e) => setCloudinaryUrl(e.target.value)}
              placeholder="cloudinary://api_key:api_secret@cloud_name"
              className="w-full p-2 border rounded mb-2"
            />
            <button 
              onClick={() => testCloudinaryMethod('url')}
              className="px-3 py-1 bg-green-500 text-white rounded"
              disabled={!cloudinaryUrl}
            >
              Test URL Method
            </button>
          </div>
          
          {/* Explicit credentials test */}
          <div className="p-2 md:col-span-2">
            <h3 className="font-bold">Explicit Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <input
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="Cloud Name"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key"
                className="p-2 border rounded"
              />
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="API Secret"
                className="p-2 border rounded"
              />
            </div>
            <button 
              onClick={() => testCloudinaryMethod('explicit')}
              className="px-3 py-1 bg-green-500 text-white rounded"
              disabled={!cloudName || !apiKey || !apiSecret}
            >
              Test Explicit Credentials
            </button>
          </div>
        </div>
        
        {methodsResult && (
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-bold">Test Result:</h3>
            <pre className="overflow-auto max-h-60">{JSON.stringify(methodsResult, null, 2)}</pre>
          </div>
        )}
      </div>
      
      {/* File upload test */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">Upload Test</h2>
        <form onSubmit={handleUpload} className="mb-4">
          <div className="mb-4">
            <label className="block mb-2">Select image:</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border p-2 w-full"
            />
          </div>
          
          <button 
            type="submit"
            disabled={!file}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
          >
            Upload Test Image
          </button>
        </form>
      </div>
      
      {/* Status and error display */}
      {status && (
        <div className="p-4 bg-green-100 text-green-800 rounded mb-4">
          {status}
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Troubleshooting guide */}
      <div className="p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-bold mb-2">Troubleshooting Guide</h2>
        <ul className="list-disc pl-5">
          <li>Check if your Cloudinary credentials are correct</li>
          <li>Verify that the API key and secret are in the correct format</li>
          <li>Make sure your Cloudinary account is active</li>
          <li>Check network connectivity to Cloudinary's servers</li>
          <li>Try different initialization methods if one doesn't work</li>
          <li>Check the browser console and server logs for detailed error messages</li>
        </ul>
        <p className="mt-2 text-sm">
          Tip: The Cloudinary URL method might work even if environment variables method doesn't.
        </p>
      </div>
    </div>
  );
} 