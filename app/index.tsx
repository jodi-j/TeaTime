import { supabase } from '../utils/supabase';
import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function () {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen. souad was here</Text>
      <Link href="/login">
        Login
      </Link>
      <Link href="/register">
        Register
      </Link>
    </View>
  );
}
