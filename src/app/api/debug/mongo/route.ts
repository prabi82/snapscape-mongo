import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

// Simple endpoint to test MongoDB connection and operations
export async function GET(req: NextRequest) {
  console.log("MongoDB diagnostic endpoint called");
  
  try {
    // Test database connection
    console.log("Connecting to MongoDB...");
    const startTime = Date.now();
    await connectDB();
    const connectionTime = Date.now() - startTime;
    console.log(`MongoDB connection successful (${connectionTime}ms)`);
    
    // Basic information about the connection
    const connectionInfo = {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.models),
    };
    
    // Test that we can query the database
    let collectionCounts: Record<string, number | string | unknown> = {};
    try {
      // Try to get counts for each collection
      for (const modelName of Object.keys(mongoose.models)) {
        const count = await mongoose.models[modelName].countDocuments({});
        collectionCounts[modelName] = count;
      }
    } catch (countError: any) {
      console.error("Error counting documents:", countError);
      collectionCounts = { error: countError.message };
    }
    
    return NextResponse.json({
      success: true,
      message: "MongoDB connection and operations successful",
      connectionTime: `${connectionTime}ms`,
      connection: connectionInfo,
      counts: collectionCounts
    });
  } catch (error: any) {
    console.error("MongoDB diagnostic error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "MongoDB diagnostic failed",
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 