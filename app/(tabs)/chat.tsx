import React, { useState, useEffect } from "react";
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button, ButtonText } from "@/components/ui/button";
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '@/components/ui/modal';
import { useRouter } from "expo-router";
import { supabase } from "../../utils/supabase";
import { decryptMessage } from "../../utils/crypto";

type Message = {
  id: number;
  sender_id: string;
  receiver_id: string;
  encrypted_message_for_receiver: string;
  encrypted_message_for_sender: string;
  timestamp: string;
  sender: {
    display_name: string;
    user_id: string;
  };
  receiver: {
    display_name: string;
    user_id: string;
  };
};

type DatabaseMessage = {
  id: number;
  sender_id: string;
  receiver_id: string;
  encrypted_message_for_receiver: string;
  encrypted_message_for_sender: string;
  timestamp: string;
  sender: {
    display_name: string;
    user_id: string;
  };
  receiver: {
    display_name: string;
    user_id: string;
  };
};

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
};

type ContactProfile = {
  display_name: string;
  user_id: string;
};

type Contact = {
  id: string;
  status: string;
  user_id: string;
  contact_id: string;
  user_profiles: ContactProfile;
  contact_profiles: ContactProfile;
};

type FormattedContact = {
  id: string;
  display_name: string;
  user_id: string;
};

type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
};

export default function chat() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [contacts, setContacts] = useState<FormattedContact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContacts();
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: keyProfile, error: keyError } = await supabase
        .from('user_profiles')
        .select('private_key')
        .eq('user_id', user.id)
        .single();

      if (keyError) throw keyError;
      if (!keyProfile?.private_key) {
        console.error('Private key not found for user:', user.id);
        return;
      }

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          encrypted_message_for_receiver,
          encrypted_message_for_sender,
          timestamp,
          sender:user_profiles!messages_sender_id_fkey (
            display_name,
            user_id
          ),
          receiver:user_profiles!messages_receiver_id_fkey (
            display_name,
            user_id
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('timestamp', { ascending: false });

      if (messagesError) throw messagesError;

      if (messages) {
        const conversationMap = new Map<string, Conversation>();
        
        for (const msg of messages as unknown as DatabaseMessage[]) {
          try {
            const isSender = msg.sender_id === user.id;
            const partner = isSender ? msg.receiver : msg.sender;
            
            if (!partner || !partner.user_id) {
              console.warn('Skipping message with invalid partner data:', msg);
              continue;
            }
            
            const partnerId = partner.user_id;
            
            const existingConversation = conversationMap.get(partnerId);
            const messageTime = new Date(msg.timestamp).getTime();
            const existingTime = existingConversation ? new Date(existingConversation.timestamp).getTime() : 0;
            
            if (!existingConversation || messageTime > existingTime) {
              const encryptedMessage = isSender 
                ? msg.encrypted_message_for_sender 
                : msg.encrypted_message_for_receiver;
              
              let decryptedMessage = 'Unable to decrypt message';
              try {
                decryptedMessage = await decryptMessage(encryptedMessage, keyProfile.private_key);
              } catch (err) {
                console.error('Failed to decrypt message:', err);
              }

              conversationMap.set(partnerId, {
                id: partnerId,
                name: partner.display_name,
                lastMessage: decryptedMessage,
                timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                avatar: "https://randomuser.me/api/portraits/women/44.jpg"
              });
            }
          } catch (error) {
            console.error('Error processing message:', error, msg);
          }
        }

        const sortedConversations = Array.from(conversationMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setConversations(sortedConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
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
        .or(`user_id.eq.${user.id},contact_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      if (data) {
        const formattedContacts: FormattedContact[] = data.map((contact: any) => {
          const isUser = contact.user_id === user.id;
          const contactProfile = isUser ? contact.contact_profiles : contact.user_profiles;
          return {
            id: contact.id,
            display_name: contactProfile.display_name,
            user_id: contactProfile.user_id
          };
        });
        setContacts(formattedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity onPress={() => router.push({ pathname: "/[id]", params: { id: item.id } } as never)}>
      <HStack
        space="md"
        style={{ alignItems: 'center', padding: 4, borderBottomWidth: 1 }}
      >
        <Avatar size="md">
          <AvatarImage source={{ uri: item.avatar }} />
        </Avatar>
        <VStack style={{ flex: 1 }}>
          <HStack style={{justifyContent:"space-between"}}>
            <Text style={{fontWeight:"bold"}}>{item.name}</Text>
            <Text>
              {item.timestamp}
            </Text>
          </HStack>
          <Text numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </VStack>
      </HStack>
    </TouchableOpacity>
  );

  const renderContact = ({ item }: { item: FormattedContact }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => {
        router.push({ pathname: "/[id]", params: { id: item.user_id } } as never);
        setShowModal(false);
      }}
    >
      <Text style={styles.contactName}>{item.display_name}</Text>
    </TouchableOpacity>
  );

  return (
    <VStack style={{ flex:1 }} >
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Button onPress={() => setShowModal(true)}>
          <ButtonText>New Chat</ButtonText>
        </Button>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No conversations yet</Text>
        }
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Text style={styles.modalTitle}>Select Contact</Text>
            <ModalCloseButton onPress={() => setShowModal(false)} />
          </ModalHeader>
          <ModalBody>
            {isLoading ? (
              <Text>Loading contacts...</Text>
            ) : (
              <FlatList
                data={contacts}
                renderItem={renderContact}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No contacts available</Text>
                }
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

const styles = StyleSheet.create({
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  contactName: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#64748B',
  },
});
