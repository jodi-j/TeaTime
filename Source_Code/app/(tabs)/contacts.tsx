import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '@/components/ui/modal';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { AlertCircleIcon } from "@/components/ui/icon";
import { supabase } from '../../utils/supabase';
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";

interface Contact {
  id: string;
  status: string;
  user_id: string;
  contact_id: string;
  user_profiles: {
    display_name: string;
    user_id: string;
  };
}

interface AuthUserResponse {
  id: string;
  user_profiles: {
    user_id: string;
    display_name: string;
  };
}

interface ContactResponse {
  id: string;
  status: string;
  user_id: string;
  contact_id: string;
  user_profiles: {
    display_name: string;
    user_id: string;
  };
  contact_profiles: {
    display_name: string;
    user_id: string;
  };
}

interface ContactChangePayload {
  new: {
    id: string;
    status: string;
    user_id: string;
    contact_id: string;
  };
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export default function Contacts() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    loadContacts();
    setupRealTimeSubscriptions();
  }, []);

  const setupRealTimeSubscriptions = () => {
    const subscription = supabase
      .channel('contacts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `user_id=eq.${currentUser}`
        },
        (payload: any) => {
          const contactChange = payload as ContactChangePayload;
          loadContacts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const loadContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          status,
          user_id,
          contact_id,
          user_profiles!contacts_user_id_fkey (
            display_name,
            user_id
          ),
          contact_profiles:user_profiles!contacts_contact_id_fkey (
            display_name,
            user_id
          )
        `)
        .or(`user_id.eq.${user.id},contact_id.eq.${user.id}`);

      if (error) throw error;

      if (data) {
        const formattedContacts: Contact[] = data.map(contact => {
          const contactData = contact as unknown as ContactResponse;
          return {
            id: contactData.id,
            status: contactData.status,
            user_id: contactData.user_id,
            contact_id: contactData.contact_id,
            user_profiles: contactData.user_id === user.id ? contactData.contact_profiles : contactData.user_profiles
          };
        });
        setContacts(formattedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleAddByDisplayName = async () => {
    if (!displayName) {
      setError('Please enter a display name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: contactUser, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name')
        .eq('display_name', displayName)
        .single();

      if (userError || !contactUser) {
        setError('User not found');
        return;
      }

      if (contactUser.user_id === user.id) {
        setError('You cannot add yourself as a contact');
        return;
      }

      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id, status')
        .or(`user_id.eq.${user.id},contact_id.eq.${user.id}`)
        .or(`user_id.eq.${contactUser.user_id},contact_id.eq.${contactUser.user_id}`)
        .single();

      if (existingContact) {
        if (existingContact.status === 'blocked') {
          setError('This contact has been blocked');
        } else if (existingContact.status === 'pending') {
          setError('Contact request already sent');
        } else {
          setError('Contact already exists');
        }
        return;
      }

      const { error: insertError } = await supabase
        .from('contacts')
        .insert([
          {
            user_id: user.id,
            contact_id: contactUser.user_id,
            status: 'pending'
          }
        ]);

      if (insertError) throw insertError;

      setShowModal(false);
      setDisplayName('');
      loadContacts();
    } catch (err) {
      console.error('Error adding contact:', err);
      setError('Failed to add contact. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanQR = () => {
    setShowModal(false);
    router.push('/contacts/scan');
  };

  const handleAcceptRequest = async (contact: Contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status: 'accepted' })
        .eq('id', contact.id);

      if (error) throw error;
      
      loadContacts();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeclineRequest = async (contact: Contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;
      
      loadContacts();
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleCancelRequest = async (contact: Contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;
      
      loadContacts();
    } catch (error) {
      console.error('Error canceling request:', error);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.user_profiles.display_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            swipeableRefs.current[contact.id]?.close();
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', contact.id);

              if (error) throw error;
              
              loadContacts();
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (contact: Contact) => {
    return (
      <View style={styles.deleteAction}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteContact(contact)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const isPending = item.status === 'pending';
    const isSender = item.user_id === currentUser;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
        <TouchableOpacity 
          style={styles.contactItem}
          onPress={() => {
            router.push(`/contact/${item.user_profiles.user_id}`);
          }}
        >
          <View style={styles.contactInfo}>
            <Avatar style={styles.avatar}>
              <AvatarFallbackText>{item.user_profiles.display_name[0]}</AvatarFallbackText>
            </Avatar>
            <Text style={styles.contactName}>{item.user_profiles.display_name}</Text>
          </View>
          {isPending && (
            <View style={styles.statusContainer}>
              {isSender ? (
                <TouchableOpacity onPress={() => handleCancelRequest(item)}>
                  <Text style={styles.cancelButton}>Cancel Request</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.requestButtons}>
                  <TouchableOpacity 
                    style={[styles.requestButton, styles.acceptButton]}
                    onPress={() => handleAcceptRequest(item)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.requestButton, styles.declineButton]}
                    onPress={() => handleDeclineRequest(item)}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <Button onPress={() => setShowModal(true)}>
          <ButtonText>Add Contact</ButtonText>
        </Button>
      </View>

      {isLoadingContacts ? (
        <Text>Loading contacts...</Text>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No contacts yet</Text>
          }
        />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Text style={styles.modalTitle}>Add Contact</Text>
            <ModalCloseButton onPress={() => setShowModal(false)} />
          </ModalHeader>
          <ModalBody>
            <VStack space="md">
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Add by Display Name</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    placeholder="Enter display name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="none"
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorIcon as={AlertCircleIcon} />
                    <FormControlErrorText>{error}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  style={{ flex: 1 }}
                  onPress={handleAddByDisplayName}
                  isDisabled={isLoading}
                >
                  <ButtonText>{isLoading ? 'Sending Request...' : 'Send Request'}</ButtonText>
                </Button>
              </View>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
              </View>

              <Button
                variant="outline"
                onPress={handleScanQR}
              >
                <ButtonText>Scan QR Code</ButtonText>
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    backgroundColor: "#dca65e",
  },
  contactName: {
    fontSize: 20,
    fontWeight: '500',
  },
  pendingText: {
    color: '#64748B',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#64748B',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    marginHorizontal: 10,
    color: '#64748B',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
  },
  declineButtonText: {
    color: 'white',
    fontSize: 14,
  },
  cancelButton: {
    color: '#EF4444',
    fontSize: 14,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
