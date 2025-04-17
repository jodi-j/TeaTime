import { supabase } from '../utils/supabase';
import { View, Image } from "react-native";
import { useRouter } from "expo-router";
import { Button, ButtonText } from "@/components/ui/button"

export default function () {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image source={require('../assets/images/logo.jpg')}></Image>

      <Button size="lg" variant="solid" action="primary" onPress={() => router.push('/register')}>
        <ButtonText>Register</ButtonText>
      </Button>

      <Button size="lg" variant="solid" action="secondary" onPress={() => router.push('/login')}>
        <ButtonText>Login</ButtonText>
      </Button>
    </View>
  );
}
