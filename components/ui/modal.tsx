import React from 'react';
import { View, Modal as RNModal, Pressable, StyleSheet, Text, KeyboardAvoidingView, Platform } from 'react-native';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {children}
      </KeyboardAvoidingView>
    </RNModal>
  );
};

export const ModalBackdrop = ({ onPress }: { onPress?: () => void }) => (
  <Pressable style={styles.backdrop} onPress={onPress} />
);

export const ModalContent = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.content}>{children}</View>
);

export const ModalHeader = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.header}>{children}</View>
);

export const ModalBody = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.body}>{children}</View>
);

export const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.footer}>{children}</View>
);

export const ModalCloseButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable onPress={onPress} style={styles.closeButton}>
    <Text>×</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  body: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  closeButton: {
    padding: 8,
  },
}); 