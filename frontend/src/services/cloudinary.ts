export async function uploadReceipt(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset || uploadPreset === "your_unsigned_upload_preset") {
    throw new Error("Cloudinary upload preset is not configured. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in frontend/.env.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
  if (!response.ok) {
    let detail = "Cloudinary rejected the upload.";
    try {
      const errorData: { error?: { message?: string } } = await response.json();
      detail = errorData.error?.message || detail;
    } catch {
      // Keep a useful fallback when the provider does not return JSON.
    }
    throw new Error(`${detail} (HTTP ${response.status})`);
  }

  const data: { secure_url?: string } = await response.json();
  if (!data.secure_url) throw new Error("Cloudinary did not return an image URL.");
  return data.secure_url;
}
