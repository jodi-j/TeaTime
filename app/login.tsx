import { useRouter } from "expo-router";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input"
import { VStack } from "@/components/ui/vstack"
import { AlertCircleIcon } from "@/components/ui/icon"
import { Button, ButtonText } from "@/components/ui/button"
import React from "react"

export default function Login () {
  const router = useRouter();
  const [isInvalid, setIsInvalid] = React.useState(false)
  const [username, setUsername] = React.useState<string | undefined>(undefined);
  const [password, setPassword] = React.useState<string | undefined>(undefined);

  return (
    <VStack style={{ padding: 24 }}>
      <FormControl
        size="lg"
        isRequired={true}
      >
        <FormControlLabel>
          <FormControlLabelText>Username</FormControlLabelText>
        </FormControlLabel>
        <Input style={{ marginBottom: 16 }}>
          <InputField
            type="text"
            placeholder="username"
            value={username}
            onChangeText={(text) => setUsername(text)}
          />
        </Input>

        <FormControlLabel>
          <FormControlLabelText>Password</FormControlLabelText>
        </FormControlLabel>
        <Input style={{ marginBottom: 16 }}>
          <InputField
            type="password"
            placeholder="password"
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
        </Input>
      </FormControl>
      <Button size="lg" variant="solid" action="primary" onPress={() => router.push('/(tabs)/chat')}>
        <ButtonText>Login</ButtonText>
      </Button>
    </VStack>
  );
}
