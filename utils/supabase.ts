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
        