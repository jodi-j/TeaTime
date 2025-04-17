import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as Crypto from 'expo-crypto'

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

// Function to create user profile
export const createUserProfile = async (userId: string, displayName: string) => {
  try {
    // Generate QR code ID and public key
    const qrCodeId = Crypto.randomUUID()
    const publicKeyBytes = await Crypto.getRandomBytesAsync(32)
    const publicKey = Array.from(publicKeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const { error } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: userId,
          display_name: displayName,
          public_key: publicKey,
          qr_code_id: qrCodeId,
        }
      ])

    if (error) throw error
    return { qrCodeId, publicKey }
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}
        