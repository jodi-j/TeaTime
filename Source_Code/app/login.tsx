import { useRouter } from "expo-router";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input"
import { VStack } from "@/components/ui/vstack"
import { AlertCircleIcon } from "@/components/ui/icon"
import { Button, ButtonText } from "@/components/ui/button"
import React, { useState } from "react"
import { supabase } from '../utils/supabase';
import { StyleSheet, ScrollView, SafeAreaView, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

      router.push('/(tabs)/chat');
    } catch (err) {
      console.error('Login error:', err);
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView>
      <ScrollView style={{height: "100%"}}>
        <VStack style={{ padding: 24 }}>
        <Pressable style={{flexDirection: "row", marginBottom: 12, alignItems: "center"}} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} style={{color: "#c49a8c"}}/>
          <Text style={{ fontSize: 16, color: "#c49a8c", fontWeight: "bold" }}>Back</Text>
        </Pressable>

        <Text style={{fontSize: 36, color: "#c49a8c", fontWeight: "bold", marginBottom: 12, alignSelf: "center"}}>Login</Text>
          
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
      </ScrollView>
    </SafeAreaView>
  );
}
