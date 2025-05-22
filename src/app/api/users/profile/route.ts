import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Session } from "next-auth";

// Define a type for our extended session
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check if the user is authenticated
    // @ts-ignore - Ignore type error here
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Get the user profile without the password field
    const user = await User.findById(session.user.id).select("-password");
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if the user is authenticated
    // @ts-ignore - Ignore type error here
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Handle multipart form data for file uploads
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const mobile = formData.get('mobile') as string;
    const country = formData.get('country') as string;
    const profileImage = formData.get('profileImage') as File | null;
    
    // Basic validation
    if (!name && !email && !profileImage && !mobile && !country) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // If email is being updated, check if it's already in use
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: session.user.id } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        );
      }
    }
    
    // Update user profile
    const updateData = {} as any;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (country) updateData.country = country;
    
    // Handle profile image upload if provided
    if (profileImage && profileImage.size > 0) {
      try {
        console.log('[ProfileAPI] Processing profile image upload, size:', profileImage.size);
        console.log('[ProfileAPI] Profile image type:', profileImage.type);
        
        // Validate file size (5MB max)
        if (profileImage.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Profile image size must be less than 5MB" },
            { status: 400 }
          );
        }
        
        const arrayBuffer = await profileImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uniqueFilename = `profile_${session.user.id}_${Date.now()}`;
        
        console.log('[ProfileAPI] Uploading image to Cloudinary with filename:', uniqueFilename);
        
        const uploadResult = await uploadToCloudinary(buffer, {
          folder: 'snapscape/profiles',
          public_id: uniqueFilename,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" }
          ]
        });
        
        if (uploadResult && uploadResult.secure_url) {
          updateData.image = uploadResult.secure_url;
          console.log('[ProfileAPI] Image successfully uploaded to Cloudinary, URL:', updateData.image);
        } else {
          console.error('[ProfileAPI] No secure_url in Cloudinary upload result');
          return NextResponse.json(
            { error: "Failed to upload profile image" },
            { status: 500 }
          );
        }
      } catch (uploadError: any) {
        console.error('[ProfileAPI] Error uploading profile image:', uploadError);
        return NextResponse.json(
          { error: `Error uploading profile image: ${uploadError.message}` },
          { status: 500 }
        );
      }
    }
    
    console.log('[ProfileAPI] Updating user profile with data:', {
      id: session.user.id,
      updateFields: Object.keys(updateData),
      hasImage: !!updateData.image
    });
    
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    console.log('[ProfileAPI] User profile updated successfully:', {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      country: user.country,
      hasImage: !!user.image,
      imageUrl: user.image
    });
    
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 