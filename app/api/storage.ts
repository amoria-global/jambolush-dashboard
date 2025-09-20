//app/api/storage.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL! || "https://ftihjzudufdjjabnpaqv.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY! || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aWhqenVkdWZkamphYm5wYXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg4NzE1NCwiZXhwIjoyMDcxNDYzMTU0fQ.r2SJhcjDU1T2jYa1reRM0k3SG5utu3p6oxp2O1KrjfE"
);

export default async function uploadDocumentToSupabase(file: File, fileName: string, folder: string = 'uploads'): Promise<string> {
  try {
    let fullPath: string;
    
    // Special handling for profile pictures to ensure exact path format
    if (folder === 'profile_pictures') {
      // For profile pictures, use the fileName as-is (already formatted as user-phone_timestamp.ext)
      fullPath = `profile_pictures/${fileName}`;
    } else {
      // For other files, use the original logic
      const safeFileName = fileName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${safeFileName}`;
      fullPath = `${folder}/${uniqueFileName}`;
    }

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("faxon-bucket") 
      .upload(fullPath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload error: ${error.message}`);
    }

    // Get the public URL of the uploaded document
    const { data: publicUrl } = supabase.storage
      .from("faxon-bucket")
      .getPublicUrl(fullPath);

    if (!publicUrl || !publicUrl.publicUrl) {
      throw new Error('Failed to generate public URL');
    }
    return publicUrl.publicUrl;
  } catch (error: any) {
    console.error('Upload failed:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// Upload specifically for assignment submissions
export async function uploadSubmissionToSupabase(file: File, assignmentId: string, studentId: string): Promise<string> {
  try {
    const fileName = `submission-${assignmentId}-${studentId}-${file.name}`;
    return await uploadDocumentToSupabase(file, fileName, 'submissions');
  } catch (error: any) {
    throw new Error(`Submission upload failed: ${error.message}`);
  }
}

// Upload specifically for profile pictures
export async function uploadProfilePictureToSupabase(file: File, phoneNumber: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileExtension = file.type === 'image/jpeg' ? 'jpg' : 'png';
    const fileName = `user-${phoneNumber}_${timestamp}.${fileExtension}`;
    
    return await uploadDocumentToSupabase(file, fileName, 'profile_pictures');
  } catch (error: any) {
    throw new Error(`Profile picture upload failed: ${error.message}`);
  }
}

export async function deleteDocumentFromSupabase(filePath: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from("faxon-bucket")
      .remove([filePath]);

    if (error) {
      throw new Error(error.message);
    }

    console.log("File deleted successfully:", filePath);
  } catch (error: any) {
    console.error("Error deleting file:", error.message);
  }
}