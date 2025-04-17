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

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    username: "",
    phone: "",
    password: "",
  });

  const handleSubmit = () => {
    const newErrors = { username: "", phone: "", password: "" };
    let hasError = false;

    if (!username || username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
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
      console.log("Submitting:", { username, phone, password });
      router.push('/login')
    }
  };

  return (
    <VStack style={{ padding: 24 }}>
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

      <FormControl isInvalid={!!errors.username} style={{ marginBottom: 16 }}>
        <FormControlLabel>
          <FormControlLabelText>Username</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
        </Input>
        {!errors.username ? (
          <FormControlHelper>
            <FormControlHelperText>Enter your username.</FormControlHelperText>
          </FormControlHelper>
        ) : (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText>{errors.username}</FormControlErrorText>
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

      <Button size="lg" onPress={handleSubmit}>
        <ButtonText>Register Account</ButtonText>
      </Button>
    </VStack>
  );
}
