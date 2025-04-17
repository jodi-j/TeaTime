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
import React, { useState } from "react"
import { supabase } from '../utils/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Login successful, navigate to chat
      router.push('/(tabs)/chat');
    } catch (err) {
      console.error('Login error:', err);
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack style={{ padding: 24 }}>
      <FormControl
        size="lg"
        isRequired={true}
        isInvalid={!!error}
      >
        <FormControlLabel>
          <FormControlLabelText>Email</FormControlLabelText>
        </FormControlLabel>
        <Input style={{ marginBottom: 16 }}>
          <InputField
            type="text"
            placeholder="email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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
            onChangeText={setPassword}
          />
        </Input>

        {error && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>{error}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      <Button 
        size="lg" 
        variant="solid" 
        action="primary" 
        onPress={handleLogin}
        isDisabled={isLoading}
      >
        <ButtonText>{isLoading ? 'Logging in...' : 'Login'}</ButtonText>
      </Button>
    </VStack>
  );
}
