'use client';

import { useState } from 'react';

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<any>(null);

  const checkCloudinary = async () => {
    try {
      const response = await fetch('/api/test-cloudinary');
      const data = await response.json();
      setCloudinaryStatus(data);
    } catch (err: any) {
      setCloudinaryStatus({ error: err.message });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('title', 'Test Photo');
      formData.append('description', 'Test Description');
      formData.append('competition', '67c2ce46c62ecb1b3b4c8f3a'); // Use a valid competition ID

      // Log the formData for debugging
      console.log('FormData created with:', {
        photo: file.name,
        size: file.size,
        type: file.type
      });

      // Send the request
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      // Try to parse the response
      try {
        const data = await response.json();
        setResult(data);
      } catch (jsonError) {
        const text = await response.text();
        setResult({ 
          nonJsonResponse: text || '(empty response)',
          status: response.status,
          ok: response.ok
        });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Test Photo Upload</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Cloudinary Connection</h2>
        <button 
          onClick={checkCloudinary}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check Cloudinary Status
        </button>
        
        {cloudinaryStatus && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h3 className="font-medium mb-2">Cloudinary Status:</h3>
            <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
              {JSON.stringify(cloudinaryStatus, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block mb-2 font-medium">Select Photo:</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="block w-full border border-gray-300 rounded p-2"
          />
        </div>
        
        <button 
          type="submit"
          disabled={!file || uploading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </form>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <h3 className="font-medium">Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="p-4 border rounded bg-gray-50">
          <h3 className="font-medium mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 