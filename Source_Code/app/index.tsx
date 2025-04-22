import { View, Image, StyleSheet } from "react-native";
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
        backgroundColor: "#f5f2eb"
      }}
    >
      <Image style={{padding: 24}} source={require('../assets/images/teatime.png')}></Image>

      <Button style={styles.button} size="lg" variant="solid" action="primary" onPress={() => router.push('/register')}>
        <ButtonText>Register</ButtonText>
      </Button>

      <Button style={styles.button} size="lg" variant="solid" action="secondary" onPress={() => router.push('/login')}>
        <ButtonText>Login</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "90%",
    margin: 10,
  },
});
