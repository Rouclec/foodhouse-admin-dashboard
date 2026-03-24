import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/firebase";

export async function uploadImage(params: {
  file: File;
  filename: string;
  directory?: string;
  onProgress?: (progressPct: number) => void;
}): Promise<string> {
  const directory = params.directory?.trim();
  const basePath = directory ? `images/${directory}` : "images";
  const objectPath = `${basePath}/${params.filename}`;
  const storageRef = ref(storage, objectPath);

  const uploadTask = uploadBytesResumable(storageRef, params.file, {
    contentType: params.file.type || undefined,
  });

  return await new Promise<string>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (!params.onProgress) return;
        const progress =
          snapshot.totalBytes > 0
            ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            : 0;
        params.onProgress(Math.round(progress));
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

