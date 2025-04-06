import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Login () {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/register.tsx to edit this screen.</Text>
      <Link href="/(tabs)/chat">
        Register
      </Link>
    </View>
  );
}
