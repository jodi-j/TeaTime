import { Text, View, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { VStack } from "@/components/ui/vstack";
import { Avatar, AvatarImage, AvatarFallbackText } from "@/components/ui/avatar";

interface UserProfile {
  display_name: string;
  user_id: string;
  email?: string;
  phone_number?: string;
}

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user profile from user_profiles table
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        // Get phone number and email from auth metadata
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
    <View style={styles.container}>
      <VStack space="md" style={styles.content}>
        <Avatar size="xl" style={styles.avatar}>
          <AvatarFallbackText>
            {userProfile.display_name.charAt(0).toUpperCase()}
          </AvatarFallbackText>
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
      </VStack>
    </View>
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
    backgroundColor: '#f5f5f5',
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
});
