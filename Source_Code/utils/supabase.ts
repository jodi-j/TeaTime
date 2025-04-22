import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as Crypto from 'expo-crypto'
import { generateKeyPair } from './crypto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

export const migrateUserKeys = async (userId: string) => {
  try {
    // Get the user's current keys
    const { data: userProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('public_key, private_key')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Check if the keys are already in the new format
    if (userProfile?.public_key?.includes('BEGIN PUBLIC KEY') || 
        userProfile?.private_key?.includes('BEGIN PRIVATE KEY')) {
      return; // Keys are already in the new format
    }

    // Generate new RSA keys
    const { publicKey, privateKey } = await generateKeyPair();

    // Update the user's keys
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        public_key: publicKey,
        private_key: privateKey,
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log('Successfully migrated keys for user:', userId);
  } catch (error) {
    console.error('Error migrating user keys:', error);
    throw error;
  }
};

export const createUserProfile = async (userId: string, displayName: string) => {
  try {
    const qrCodeId = Crypto.randomUUID()
    const { publicKey, privateKey } = await generateKeyPair()

    const { error } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: userId,
          display_name: displayName,
          public_key: publicKey,
          private_key: privateKey,
          qr_code_id: qrCodeId,
        }
      ])

    if (error) throw error
    return { qrCodeId, publicKey, privateKey }
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

export const uploadProfilePicture = async (userId: string, uri: string) => {
  try {
    // Convert the image to a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(`${userId}/avatar.jpg`, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(`${userId}/avatar.jpg`);

    // Update the user profile with the new picture URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ profile_picture: publicUrl })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};
        