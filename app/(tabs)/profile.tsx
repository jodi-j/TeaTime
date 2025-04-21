import { Text, View, StyleSheet, Share, SafeAreaView, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { VStack } from "@/components/ui/vstack";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Button, ButtonText } from "@/components/ui/button";
import QRCode from 'react-native-qrcode-svg';

interface UserProfile {
  display_name: string;
  user_id: string;
  email?: string;
  phone_number?: string;
  qr_code_id: string;
  profile_picture?: string;
}

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        const phoneNumber = user.user_metadata?.phone_number;
        
        setUserProfile({
          ...profile,
          email: user.email,
          phone_number: phoneNumber
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleShareQRCode = async () => {
    if (!userProfile?.qr_code_id) return;

    try {
      await Share.share({
        message: `Add me on TeaTime! My QR Code ID: ${userProfile.qr_code_id}`,
        title: 'Share QR Code ID'
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <Text>No profile data found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView style={{height: "100%"}}>
        <View style={styles.container}>
          <VStack space="md" style={styles.content}>
            <Avatar size="xl" style={styles.avatar}>
              {userProfile.profile_picture ? (
                <AvatarImage source={{ uri: userProfile.profile_picture }} />
              ) : (
                <AvatarFallbackText>
                  {userProfile.display_name.charAt(0).toUpperCase()}
                </AvatarFallbackText>
              )}
            </Avatar>

            <View style={styles.infoContainer}>
              <Text style={styles.label}>Display Name</Text>
              <Text style={styles.value}>{userProfile.display_name}</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{userProfile.email}</Text>
            </View>

            {userProfile.phone_number && (
              <View style={styles.infoContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <Text style={styles.value}>{userProfile.phone_number}</Text>
              </View>
            )}

            <View style={styles.infoContainer}>
              <Text style={styles.label}>QR Code</Text>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={userProfile.qr_code_id}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>
              <Button 
                variant="outline" 
                style={styles.shareButton}
                onPress={handleShareQRCode}
              >
                <ButtonText>Share QR Code ID</ButtonText>
              </Button>
            </View>
          </VStack>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 20,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(207, 166, 153, 0.5)',
    borderRadius: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  shareButton: {
    marginTop: 10,
  },
  qrCodeContainer: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
  },
});
