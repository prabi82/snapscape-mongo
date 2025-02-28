# Install Vercel CLI
npm install -g vercel

# Set environment variables for Vercel deployment
$env:MONGODB_URI = "mongodb+srv://snap:C4U2QqNfr8OlzNjt@snapscape-mongo.gli1z.mongodb.net/?retryWrites=true&w=majority&appName=snapscape-mongo"
$env:NEXTAUTH_SECRET = "C4U2QqNfr8OlzNjt"

# Deploy to Vercel
vercel --confirm 