import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { AlertCircleIcon } from "@/components/ui/icon";
import { supabase, createUserProfile } from '../utils/supabase';
import { Alert, StyleSheet, ScrollView, Pressable, Text, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    displayName: "",
    phone: "",
    password: "",
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    const newErrors = { email: "", displayName: "", phone: "", password: "" };
    let hasError = false;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      hasError = true;
    }

    if (!displayName || displayName.trim().length < 2) {
      newErrors.displayName = "Display name must be at least 2 characters";
      hasError = true;
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
      hasError = true;
    }

    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      hasError = true;
    }

    setErrors(newErrors);

    if (!hasError) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              phone_number: phone,
            }
          }
        });

        if (authError) {
          if (authError.message.includes('email')) {
            setErrors(prev => ({ ...prev, email: 'Email already registered' }));
          } else {
            throw authError;
          }
        } else if (authData.user) {
          await createUserProfile(authData.user.id, displayName);
          
          Alert.alert(
            'Registration Successful!',
            `Please check your email (${email}) for a verification link. You must verify your email before you can log in.`,
            [
              {
                text: 'Go to Login',
                onPress: () => router.push('/login')
              }
            ]
          );
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('Failed to register. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
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

        <Text style={{fontSize: 36, color: "#c49a8c", fontWeight: "bold", marginBottom: 12, alignSelf: "center"}}>Register</Text>

          <FormControl isInvalid={!!errors.email} style={styles.form}>
            <FormControlLabel>
              <FormControlLabelText>Email</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </Input>
            {!errors.email ? (
              <FormControlHelper>
                <FormControlHelperText>Enter your email address.</FormControlHelperText>
              </FormControlHelper>
            ) : (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText>{errors.email}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.displayName} style={styles.form}>
            <FormControlLabel>
              <FormControlLabelText>Display Name</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </Input>
            {!errors.displayName ? (
              <FormControlHelper>
                <FormControlHelperText>This is how others will see you.</FormControlHelperText>
              </FormControlHelper>
            ) : (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText>{errors.displayName}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.phone} style={styles.form}>
            <FormControlLabel>
              <FormControlLabelText>Phone Number</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Phone Number"
                keyboardType="number-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
            </Input>
            {!errors.phone ? (
              <FormControlHelper>
                <FormControlHelperText>10-digit number only.</FormControlHelperText>
              </FormControlHelper>
            ) : (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText>{errors.phone}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.password} style={styles.form}>
            <FormControlLabel>
              <FormControlLabelText>Password</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                type="password"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
              />
            </Input>
            {!errors.password ? (
              <FormControlHelper>
                <FormControlHelperText>
                  Must be at least 6 characters.
                </FormControlHelperText>
              </FormControlHelper>
            ) : (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText>{errors.password}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <Button size="lg" onPress={handleSubmit} isDisabled={isLoading}>
            <ButtonText>{isLoading ? 'Registering...' : 'Register Account'}</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  form: {
    marginBottom: 24,
    borderColor: "#c49a8c",
  },
});
