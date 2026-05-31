// hooks/useImagePicker.ts
// Hook untuk pilih gambar dari galeri + upload ke Supabase

import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { uploadAndSetAvatar } from '../services/profileService';
import { useProfileStore } from '../stores/profileStore';

interface UseImagePickerReturn {
  isUploading: boolean;
  pickAndUploadAvatar: () => Promise<string | null>;
}

export function useImagePicker(): UseImagePickerReturn {
  const [isUploading, setIsUploading] = useState(false);
  const { profile, setProfile } = useProfileStore();

  const pickAndUploadAvatar = async (): Promise<string | null> => {
    // Minta permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Izin Diperlukan',
        'Almamatcher perlu akses galeri untuk mengunggah foto profil.'
      );
      return null;
    }

    // Buka image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],         // Crop ke kotak (untuk avatar)
      quality: 0.8,           // Kompres 80% — cukup untuk foto profil
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    if (!profile?.id) return null;

    setIsUploading(true);
    try {
      const { url, error } = await uploadAndSetAvatar(profile.id, asset.uri);

      if (error || !url) {
        Alert.alert('Upload Gagal', error ?? 'Coba lagi nanti.');
        return null;
      }

      // Update local store
      if (profile) {
        setProfile({ ...profile, avatar_url: url });
      }

      return url;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, pickAndUploadAvatar };
}
