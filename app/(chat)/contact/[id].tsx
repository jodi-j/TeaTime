import { Text, View, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { supabase } from "../../../utils/supabase";
import { VStack } from "@/components/ui/vstack";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Button, ButtonText } from "@/components/ui/button";
import QRCode from 'react-native-qrcode-svg';

interface ContactProfile {
  display_name: string;
  user_id: string;
  email?: string;
  phone_number?: string;
  qr_code_id: string;
  profile_picture?: string;
}

export default function ContactProfile() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const [contactProfile, setContactProfile] = useState<ContactProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactProfile = async () => {
      try {
        const contactId = typeof id === 'string' ? id : id[0];
        
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', contactId)
          .single();

        if (error) throw error;

        setContactProfile(profile);
        navigation.setOptions({
          title: profile.display_name,
          headerBackTitle: "Contacts",
          headerTintColor: "#aa786d",
        });
      } catch (error) {
        console.error('Error fetching contact profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactProfile();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!contactProfile) {
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
              {contactProfile.profile_picture ? (
                <AvatarImage source={{ uri: contactProfile.profile_picture }} />
              ) : (
                <AvatarFallbackText>
                  {contactProfile.display_name.charAt(0).toUpperCase()}
                </AvatarFallbackText>
              )}
            </Avatar>

            <View style={styles.infoContainer}>
              <Text style={styles.label}>Display Name</Text>
              <Text style={styles.value}>{contactProfile.display_name}</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.label}>QR Code</Text>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={contactProfile.qr_code_id}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>
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
  qrCodeContainer: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
  },
}); 