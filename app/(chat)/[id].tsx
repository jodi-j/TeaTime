import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { View, Text } from "react-native";

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: `Chat with ${id}`,
      headerBackTitle: "Chat",
    });
  }, [id]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Chat with ID: {id}</Text>
    </View>
  );
}
