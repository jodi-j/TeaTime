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
        // Register user with Supabase Auth
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
          // Create user profile after successful registration
          await createUserProfile(authData.user.id, displayName);
          // Registration successful
          router.push('/login');
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
    <VStack style={{ padding: 24 }}>
      <FormControl isInvalid={!!errors.email} style={{ marginBottom: 16 }}>
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

      <FormControl isInvalid={!!errors.displayName} style={{ marginBottom: 16 }}>
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

      <FormControl isInvalid={!!errors.phone} style={{ marginBottom: 16 }}>
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

      <FormControl isInvalid={!!errors.password} style={{ marginBottom: 16 }}>
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
  );
}
